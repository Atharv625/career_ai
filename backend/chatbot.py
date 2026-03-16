"""
Chatbot Module - Gemini AI + RAG (Retrieval Augmented Generation)
Powers the AI career advisor chatbot with knowledge-base retrieval
"""

import os
import json
import pathlib
import numpy as np
from typing import List, Dict, Any, Optional

import google.generativeai as genai
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

# ─────────────────────────────────────────────────────────
# Configuration
# ─────────────────────────────────────────────────────────
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "your-gemini-api-key-here")
genai.configure(api_key=GEMINI_API_KEY)

DATA_DIR = pathlib.Path(__file__).parent.parent / "data"


# ─────────────────────────────────────────────────────────
# Knowledge Base (RAG Vector Store using TF-IDF)
# ─────────────────────────────────────────────────────────
class CareerKnowledgeBase:
    """
    Simple RAG implementation using TF-IDF similarity.
    In production, replace with FAISS or Pinecone for semantic search.
    """

    def __init__(self):
        self.careers: List[Dict] = []
        self.courses: List[Dict] = []
        self.documents: List[str] = []       # flat text for TF-IDF
        self.doc_metadata: List[Dict] = []   # parallel metadata list
        self.vectorizer = TfidfVectorizer(stop_words='english', ngram_range=(1, 2))
        self.tfidf_matrix = None
        self._load_and_index()

    def _load_and_index(self):
        """Load JSON data and build TF-IDF index for retrieval."""
        with open(DATA_DIR / "careers.json") as f:
            self.careers = json.load(f)
        with open(DATA_DIR / "courses.json") as f:
            self.courses = json.load(f)

        # Build flat document list from careers
        for career in self.careers:
            text = (
                f"{career['career_name']} {career['description']} "
                f"skills: {' '.join(career['required_skills'])} "
                f"tags: {' '.join(career.get('tags', []))}"
            )
            self.documents.append(text)
            self.doc_metadata.append({"type": "career", "data": career})

        # Build flat document list from courses
        for course in self.courses:
            text = (
                f"{course['course_name']} {course['platform']} "
                f"teaches: {' '.join(course.get('skills_taught', []))} "
                f"for: {' '.join(course.get('career_category', []))}"
            )
            self.documents.append(text)
            self.doc_metadata.append({"type": "course", "data": course})

        # Fit TF-IDF
        self.tfidf_matrix = self.vectorizer.fit_transform(self.documents)
        print(f"✅ Knowledge base indexed: {len(self.careers)} careers, {len(self.courses)} courses")

    def retrieve(self, query: str, top_k: int = 3) -> List[Dict]:
        """Retrieve top-k most relevant documents for a given query."""
        query_vec = self.vectorizer.transform([query])
        similarities = cosine_similarity(query_vec, self.tfidf_matrix).flatten()
        top_indices = similarities.argsort()[-top_k:][::-1]
        return [self.doc_metadata[i] for i in top_indices if similarities[i] > 0.01]


# Singleton knowledge base (loaded once at startup)
knowledge_base = CareerKnowledgeBase()


# ─────────────────────────────────────────────────────────
# System Prompt for Gemini
# ─────────────────────────────────────────────────────────
SYSTEM_PROMPT = """You are CareerPath AI, a friendly and expert career advisor for students and professionals.
Your role is to:
1. Help users choose the right career path based on their interests, skills, and goals
2. Provide detailed skill gap analyses
3. Generate structured learning roadmaps
4. Recommend specific courses and certifications
5. Give placement and interview preparation guidance

RESPONSE GUIDELINES:
- Always structure your responses clearly with headers and bullet points
- Be encouraging, specific, and actionable
- Include salary ranges and job market outlook when relevant
- If asked about a career, always mention: required skills, learning roadmap, and course recommendations
- Keep responses concise but comprehensive (300-500 words max unless asked for detail)
- Use emojis sparingly to make responses friendly (🎯 📚 💡 etc.)

IMPORTANT: You are provided with retrieved context from a knowledge base. Always prioritize this context
for specific recommendations. If the context doesn't cover something, use your general knowledge.
"""


# ─────────────────────────────────────────────────────────
# Main Chatbot Class
# ─────────────────────────────────────────────────────────
class CareerAdvisorChatbot:
    """
    Main chatbot class combining Gemini LLM with RAG retrieval.
    Maintains per-user conversation history for multi-turn chat.
    """

    def __init__(self):
        self.model = genai.GenerativeModel(
            model_name="gemini-1.5-flash",
            system_instruction=SYSTEM_PROMPT,
            generation_config={
                "temperature": 0.7,
                "top_p": 0.9,
                "max_output_tokens": 1500,
            }
        )
        # In-memory chat sessions per user (for production, store in Redis)
        self._sessions: Dict[str, Any] = {}

    def _get_or_create_session(self, user_id: str):
        """Get existing chat session or create a new one."""
        if user_id not in self._sessions:
            self._sessions[user_id] = self.model.start_chat(history=[])
        return self._sessions[user_id]

    def _build_rag_context(self, query: str) -> str:
        """Retrieve relevant knowledge and format as context for the LLM."""
        retrieved = knowledge_base.retrieve(query, top_k=3)
        if not retrieved:
            return ""

        context_parts = ["--- RETRIEVED KNOWLEDGE BASE CONTEXT ---"]
        for item in retrieved:
            if item["type"] == "career":
                c = item["data"]
                context_parts.append(
                    f"\nCAREER: {c['career_name']}\n"
                    f"Description: {c['description']}\n"
                    f"Required Skills: {', '.join(c['required_skills'])}\n"
                    f"Salary Range: ${c['salary_range']['min']:,} - ${c['salary_range']['max']:,} USD\n"
                    f"Learning Roadmap: {' → '.join(c['roadmap'][:5])}\n"
                    f"Top Courses: {'; '.join(c['recommended_courses'][:3])}\n"
                    f"Growth Outlook: {c.get('growth_outlook', 'N/A')}"
                )
            elif item["type"] == "course":
                c = item["data"]
                context_parts.append(
                    f"\nCOURSE: {c['course_name']}\n"
                    f"Platform: {c['platform']} | Rating: {c['rating']}/5\n"
                    f"Duration: {c['duration']} | Price: {c['price']}\n"
                    f"Skills Taught: {', '.join(c.get('skills_taught', []))}"
                )
        context_parts.append("--- END CONTEXT ---\n")
        return "\n".join(context_parts)

    async def chat(
        self,
        user_id: str,
        message: str,
        student_profile: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """
        Process a chat message with RAG context injection.

        Args:
            user_id: Unique user identifier for session management
            message: User's message
            student_profile: Optional student profile for personalization

        Returns:
            Dict with 'response', 'retrieved_context', and 'sources'
        """
        # Build RAG context
        rag_context = self._build_rag_context(message)

        # Build personalization context if profile exists
        profile_context = ""
        if student_profile:
            profile_context = (
                f"\n--- STUDENT PROFILE ---\n"
                f"Name: {student_profile.get('name', 'Student')}\n"
                f"Education: {student_profile.get('education', 'Not specified')}\n"
                f"Current Skills: {', '.join(student_profile.get('skills', []))}\n"
                f"Interests: {', '.join(student_profile.get('interests', []))}\n"
                f"Career Goal: {student_profile.get('career_goal', 'Not specified')}\n"
                f"--- END PROFILE ---\n"
            )

        # Compose final message with context injection
        augmented_message = f"{rag_context}{profile_context}\nUser Question: {message}"

        # Send to Gemini with conversation history
        session = self._get_or_create_session(user_id)
        response = session.send_message(augmented_message)

        # Extract source names from retrieved items
        retrieved = knowledge_base.retrieve(message, top_k=3)
        sources = [
            item["data"].get("career_name") or item["data"].get("course_name", "")
            for item in retrieved
        ]

        reply = ""

        if hasattr(response, "text"):
            reply = response.text
        elif response.candidates:
            reply = response.candidates[0].content.parts[0].text

        return {
         "response": reply,
         "sources": sources,
         "has_context": bool(retrieved),
        }

    def clear_session(self, user_id: str):
        """Clear chat history for a user (new conversation)."""
        if user_id in self._sessions:
            del self._sessions[user_id]


# Singleton chatbot instance
chatbot = CareerAdvisorChatbot()
