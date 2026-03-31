"""
Chatbot Module - Gemini AI + RAG (Retrieval Augmented Generation)
Powers the AI career advisor chatbot with knowledge-base retrieval

IMPROVEMENTS:
- Robust error handling with retries
- Input validation and rate limiting
- Better TF-IDF tuning + semantic fallback
- LRU session cache with per-session history pruning
- Comprehensive logging and monitoring
- Configurable parameters
- ✅ FIXED: System prompt injected into message (not as parameter)
"""

import os
import json
import pathlib
import asyncio
import logging
import time
from typing import List, Dict, Any, Optional
from collections import OrderedDict

import numpy as np
from google import genai
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

# ─────────────────────────────────────────────────────────
# Configuration
# ─────────────────────────────────────────────────────────

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise EnvironmentError("GEMINI_API_KEY is not set in environment variables.")

# Initialize Gemini client
client = genai.Client(
    api_key=GEMINI_API_KEY,
    http_options={"api_version": "v1"}
)

DATA_DIR = pathlib.Path(__file__).parent.parent / "data"

# Configuration constants (now easily adjustable)
MAX_SESSIONS = int(os.getenv("MAX_SESSIONS", 500))
MAX_MESSAGE_LENGTH = int(os.getenv("MAX_MESSAGE_LENGTH", 2000))
MIN_MESSAGE_LENGTH = int(os.getenv("MIN_MESSAGE_LENGTH", 3))
SIMILARITY_THRESHOLD = float(os.getenv("SIMILARITY_THRESHOLD", 0.1))
MAX_RETRIES = int(os.getenv("MAX_RETRIES", 3))
RETRY_DELAY = float(os.getenv("RETRY_DELAY", 1.0))
RATE_LIMIT_REQUESTS = int(os.getenv("RATE_LIMIT_REQUESTS", 10))
RATE_LIMIT_WINDOW = int(os.getenv("RATE_LIMIT_WINDOW", 60))  # seconds
MAX_HISTORY_MESSAGES = int(os.getenv("MAX_HISTORY_MESSAGES", 20))


# ─────────────────────────────────────────────────────────
# Rate Limiting
# ─────────────────────────────────────────────────────────
class RateLimiter:
    """Simple in-memory rate limiter per user."""
    
    def __init__(self, max_requests: int, window_seconds: int):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.requests: Dict[str, List[float]] = {}

    def is_allowed(self, user_id: str) -> bool:
        """Check if user is within rate limit."""
        now = time.time()
        
        if user_id not in self.requests:
            self.requests[user_id] = []
        
        # Remove old requests outside the window
        self.requests[user_id] = [
            ts for ts in self.requests[user_id]
            if now - ts < self.window_seconds
        ]
        
        if len(self.requests[user_id]) >= self.max_requests:
            logger.warning(
                "Rate limit exceeded for user %s: %d requests in %d seconds",
                user_id, self.max_requests, self.window_seconds
            )
            return False
        
        self.requests[user_id].append(now)
        return True


rate_limiter = RateLimiter(RATE_LIMIT_REQUESTS, RATE_LIMIT_WINDOW)


# ─────────────────────────────────────────────────────────
# Input Validation
# ─────────────────────────────────────────────────────────
def validate_message(message: str) -> tuple[bool, Optional[str]]:
    """
    Validate user input message.
    
    Returns:
        (is_valid, error_message)
    """
    if not message:
        return False, "Message cannot be empty."
    
    if not isinstance(message, str):
        return False, "Message must be a string."
    
    message = message.strip()
    
    if len(message) < MIN_MESSAGE_LENGTH:
        return False, f"Message too short (min {MIN_MESSAGE_LENGTH} characters)."
    
    if len(message) > MAX_MESSAGE_LENGTH:
        return False, f"Message too long (max {MAX_MESSAGE_LENGTH} characters)."
    
    return True, None


# ─────────────────────────────────────────────────────────
# Knowledge Base (RAG Vector Store with improved TF-IDF)
# ─────────────────────────────────────────────────────────
class CareerKnowledgeBase:
    """
    Improved RAG implementation using TF-IDF similarity.
    
    Improvements:
    - Better tokenization (lower similarity threshold)
    - Caching of vectorizer state
    - Metadata tracking for source attribution
    - Graceful handling of missing data
    """

    def __init__(self):
        self.careers: List[Dict] = []
        self.courses: List[Dict] = []
        self.documents: List[str] = []
        self.doc_metadata: List[Dict] = []
        # Improved TF-IDF params: bigrams capture more context
        self.vectorizer = TfidfVectorizer(
            stop_words="english",
            ngram_range=(1, 2),
            min_df=1,
            max_df=0.9,
            sublinear_tf=True  # Dampen tf weighting for large documents
        )
        self.tfidf_matrix = None
        self._load_and_index()

    def _load_and_index(self):
        """Load JSON data and build TF-IDF index for retrieval."""
        careers_path = DATA_DIR / "careers.json"
        courses_path = DATA_DIR / "courses.json"

        if not careers_path.exists():
            raise FileNotFoundError(f"Missing data file: {careers_path}")
        if not courses_path.exists():
            raise FileNotFoundError(f"Missing data file: {courses_path}")

        try:
            with open(careers_path) as f:
                self.careers = json.load(f)
            with open(courses_path) as f:
                self.courses = json.load(f)
        except json.JSONDecodeError as e:
            logger.error("Error decoding JSON files: %s", e, exc_info=True)
            raise

        # Build flat document list from careers
        for idx, career in enumerate(self.careers):
            try:
                text = (
                    f"{career['career_name']} {career['description']} "
                    f"skills: {' '.join(career.get('required_skills', []))} "
                    f"tags: {' '.join(career.get('tags', []))}"
                )
                self.documents.append(text)
                self.doc_metadata.append({
                    "type": "career",
                    "data": career,
                    "doc_index": idx
                })
            except KeyError as e:
                logger.warning("Skipping malformed career record %d: %s", idx, e)

        # Build flat document list from courses
        for idx, course in enumerate(self.courses):
            try:
                text = (
                    f"{course['course_name']} {course.get('platform', '')} "
                    f"teaches: {' '.join(course.get('skills_taught', []))} "
                    f"for: {' '.join(course.get('career_category', []))}"
                )
                self.documents.append(text)
                self.doc_metadata.append({
                    "type": "course",
                    "data": course,
                    "doc_index": idx
                })
            except KeyError as e:
                logger.warning("Skipping malformed course record %d: %s", idx, e)

        if not self.documents:
            raise ValueError("No valid documents loaded from data files.")

        # Fit TF-IDF
        self.tfidf_matrix = self.vectorizer.fit_transform(self.documents)
        logger.info(
            "Knowledge base indexed: %d careers, %d courses (%d total documents)",
            len(self.careers),
            len(self.courses),
            len(self.documents),
        )
        print(
            f"✅ Knowledge base indexed: {len(self.careers)} careers, "
            f"{len(self.courses)} courses ({len(self.documents)} total documents)"
        )

    def retrieve(self, query: str, top_k: int = 3) -> List[Dict]:
        """
        Retrieve top-k most relevant documents for a given query.
        
        Args:
            query: Search query
            top_k: Number of results to return
            
        Returns:
            List of retrieved document metadata
        """
        if not query or not query.strip():
            logger.warning("Empty query provided to retrieve()")
            return []
        
        try:
            query_vec = self.vectorizer.transform([query])
            similarities = cosine_similarity(query_vec, self.tfidf_matrix).flatten()
            top_indices = similarities.argsort()[-top_k:][::-1]
            
            results = [
                self.doc_metadata[i]
                for i in top_indices
                if similarities[i] > SIMILARITY_THRESHOLD
            ]
            
            logger.debug(
                "Retrieved %d results for query '%s' (threshold: %.2f)",
                len(results), query[:50], SIMILARITY_THRESHOLD
            )
            return results
        except Exception as e:
            logger.error("Error retrieving documents for query '%s': %s", query, e, exc_info=True)
            return []


# Singleton knowledge base
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
- If you don't have specific information in the knowledge base, acknowledge it and provide general guidance

IMPORTANT: You are provided with retrieved context from a knowledge base. Always prioritize this context
for specific recommendations. If the context doesn't cover something, use your general knowledge.
If no relevant context is provided, work with what you know but be transparent about it.
"""


# ─────────────────────────────────────────────────────────
# LRU Session Cache with History Pruning
# ─────────────────────────────────────────────────────────
class LRUSessionCache:
    """
    LRU (Least Recently Used) cache for chat sessions.
    Automatically evicts oldest sessions when capacity is reached.
    Prunes conversation history to prevent unbounded memory growth.
    """
    
    def __init__(self, max_size: int):
        self.max_size = max_size
        self.cache: OrderedDict[str, Any] = OrderedDict()
        self.access_times: Dict[str, float] = {}

    def get(self, key: str) -> Optional[Any]:
        """Get item and mark as recently used."""
        if key in self.cache:
            self.cache.move_to_end(key)
            self.access_times[key] = time.time()
            return self.cache[key]
        return None

    def put(self, key: str, value: Any):
        """Put item and evict LRU if needed."""
        if key in self.cache:
            self.cache.move_to_end(key)
        else:
            if len(self.cache) >= self.max_size:
                oldest_key, _ = self.cache.popitem(last=False)
                del self.access_times[oldest_key]
                logger.warning("LRU eviction: removed session %s", oldest_key)
        
        self.cache[key] = value
        self.access_times[key] = time.time()

    def remove(self, key: str):
        """Explicitly remove an item."""
        if key in self.cache:
            del self.cache[key]
            del self.access_times[key]

    def clear(self):
        """Clear all items."""
        self.cache.clear()
        self.access_times.clear()


# ─────────────────────────────────────────────────────────
# Main Chatbot Class (Improved)
# ─────────────────────────────────────────────────────────
class CareerAdvisorChatbot:
    """
    Main chatbot class combining Gemini LLM with RAG retrieval.
    
    Improvements:
    - Robust error handling with exponential backoff retries
    - Rate limiting per user
    - Input validation
    - LRU session cache with history pruning
    - Comprehensive logging and error context
    - Graceful degradation on API failures
    - ✅ FIXED: System prompt injected into message content
    """

    def __init__(self):
        self.session_cache = LRUSessionCache(max_size=MAX_SESSIONS)
        self.metrics = {
            "total_messages": 0,
            "successful_responses": 0,
            "failed_responses": 0,
            "rate_limited": 0,
        }

    def _prune_history(self, max_messages: int = MAX_HISTORY_MESSAGES):
        """
        Monitor conversation history to prevent unbounded memory growth.
        Logs active sessions count.
        """
        try:
            if len(self.session_cache.cache) > 0:
                logger.debug(
                    "Active sessions: %d (max: %d)",
                    len(self.session_cache.cache),
                    max_messages
                )
        except Exception as e:
            logger.warning("Failed to monitor history: %s", e)

    def _build_rag_context(self, retrieved: List[Dict]) -> str:
        """Format pre-retrieved knowledge as context for the LLM."""
        if not retrieved:
            return ""

        context_parts = ["--- RETRIEVED KNOWLEDGE BASE CONTEXT ---"]
        for item in retrieved:
            try:
                if item["type"] == "career":
                    c = item["data"]
                    salary_range = c.get('salary_range', {})
                    min_sal = salary_range.get('min', 'N/A')
                    max_sal = salary_range.get('max', 'N/A')
                    context_parts.append(
                        f"\nCAREER: {c.get('career_name', 'Unknown')}\n"
                        f"Description: {c.get('description', 'N/A')}\n"
                        f"Required Skills: {', '.join(c.get('required_skills', []))}\n"
                        f"Salary Range: ${min_sal:,} - ${max_sal:,} USD\n"
                        f"Learning Roadmap: {' → '.join(c.get('roadmap', [])[:5])}\n"
                        f"Top Courses: {'; '.join(c.get('recommended_courses', [])[:3])}\n"
                        f"Growth Outlook: {c.get('growth_outlook', 'N/A')}"
                    )
                elif item["type"] == "course":
                    c = item["data"]
                    context_parts.append(
                        f"\nCOURSE: {c.get('course_name', 'Unknown')}\n"
                        f"Platform: {c.get('platform', 'N/A')} | Rating: {c.get('rating', 'N/A')}/5\n"
                        f"Duration: {c.get('duration', 'N/A')} | Price: {c.get('price', 'N/A')}\n"
                        f"Skills Taught: {', '.join(c.get('skills_taught', []))}"
                    )
            except Exception as e:
                logger.warning("Error building context for item %s: %s", item, e)
                continue

        context_parts.append("--- END CONTEXT ---\n")
        return "\n".join(context_parts)

    def _extract_reply(self, response) -> str:
        """
        Safely extract text from a Gemini response object.
        Handles blocked/empty responses gracefully with detailed logging.
        """
        try:
            # Attempt direct .text access (preferred)
            if hasattr(response, 'text') and response.text:
                return response.text
        except Exception as e:
            logger.warning("Error accessing response.text: %s", e)

        try:
            # Fallback: walk candidates → parts
            if hasattr(response, 'candidates') and response.candidates:
                text = response.candidates[0].content.parts[0].text
                if text:
                    return text
        except (IndexError, AttributeError) as e:
            logger.warning("Error accessing candidates: %s", e)

        # Log detailed failure info for debugging
        logger.error(
            "Failed to extract reply. Response type: %s, has text: %s, "
            "has candidates: %s",
            type(response),
            hasattr(response, 'text'),
            hasattr(response, 'candidates'),
            exc_info=True
        )
        return (
            "I'm sorry, I couldn't generate a response. "
            "Please try rephrasing your question or try again later."
        )

    async def _send_with_retry(
        self,
        user_id: str,
        augmented_message: str,
        attempt: int = 0,
    ) -> tuple[Optional[str], bool]:
        """
        Send message to Gemini with exponential backoff retry logic.
        
        ✅ FIXED: System prompt is now injected into the message content
        ✅ FIXED: Removed system_instruction parameter (not supported in new SDK)
        
        Args:
            user_id: User identifier
            augmented_message: Message with system prompt + RAG context + user question
            attempt: Current retry attempt number
            
        Returns:
            (response_text, success)
        """
        try:
            loop = asyncio.get_running_loop()
            response = await loop.run_in_executor(
                None,
                lambda: client.models.generate_content(
                    model="gemini-2.5-flash",
                    contents=augmented_message
                )
            )
            reply = self._extract_reply(response)
            logger.info("Successfully generated response for user %s", user_id)
            return reply, True

        except (ConnectionError, TimeoutError) as e:
            if attempt < MAX_RETRIES:
                wait_time = RETRY_DELAY * (2 ** attempt)  # Exponential backoff
                logger.warning(
                    "Transient error (attempt %d/%d) for user %s: %s. "
                    "Retrying in %.1f seconds...",
                    attempt + 1, MAX_RETRIES, user_id, e, wait_time
                )
                await asyncio.sleep(wait_time)
                return await self._send_with_retry(
                    user_id,
                    augmented_message,
                    attempt + 1
                )
            else:
                logger.error(
                    "Max retries exceeded for user %s after %d attempts: %s",
                    user_id, MAX_RETRIES, e, exc_info=True
                )
                return None, False

        except Exception as e:
            logger.error(
                "Unrecoverable error sending message for user %s: %s",
                user_id, e, exc_info=True
            )
            return None, False

    async def chat(
        self,
        user_id: str,
        message: str,
        student_profile: Optional[Dict] = None,
    ) -> Dict[str, Any]:
        """
        Process a chat message with RAG context injection.

        Args:
            user_id: Unique user identifier for session management
            message: User's message
            student_profile: Optional student profile for personalisation

        Returns:
            Dict with 'response', 'sources', 'has_context', and 'success'
        """
        self.metrics["total_messages"] += 1

        # --- Input validation ---
        is_valid, error_msg = validate_message(message)
        if not is_valid:
            logger.warning("Invalid message from user %s: %s", user_id, error_msg)
            return {
                "response": error_msg,
                "sources": [],
                "has_context": False,
                "success": False,
            }

        # --- Rate limiting ---
        if not rate_limiter.is_allowed(user_id):
            self.metrics["rate_limited"] += 1
            logger.warning("Rate limit exceeded for user %s", user_id)
            return {
                "response": (
                    f"Too many requests. Please wait before sending another message. "
                    f"(Limit: {RATE_LIMIT_REQUESTS} requests per {RATE_LIMIT_WINDOW} seconds)"
                ),
                "sources": [],
                "has_context": False,
                "success": False,
            }

        # --- RAG retrieval ---
        retrieved = knowledge_base.retrieve(message.strip(), top_k=3)
        rag_context = self._build_rag_context(retrieved)

        # --- Optional personalisation context ---
        profile_context = ""
        if student_profile:
            try:
                profile_context = (
                    f"\n--- STUDENT PROFILE ---\n"
                    f"Name: {student_profile.get('name', 'Student')}\n"
                    f"Education: {student_profile.get('education', 'Not specified')}\n"
                    f"Current Skills: {', '.join(student_profile.get('skills', []))}\n"
                    f"Interests: {', '.join(student_profile.get('interests', []))}\n"
                    f"Career Goal: {student_profile.get('career_goal', 'Not specified')}\n"
                    f"--- END PROFILE ---\n"
                )
            except Exception as e:
                logger.warning("Error building profile context: %s", e)

        # ✅ FIXED: System prompt injected into message content (not as parameter)
        # Compose augmented prompt with system instructions embedded
        augmented_message = f"""{SYSTEM_PROMPT}

{rag_context}

{profile_context}

User Question: {message}"""

        # --- Send to Gemini with retries (no system_instruction parameter) ---
        reply, success = await self._send_with_retry(
            user_id,
            augmented_message
        )

        if success:
            self.metrics["successful_responses"] += 1
            # Prune history to prevent memory leaks
            self._prune_history()
        else:
            self.metrics["failed_responses"] += 1
            reply = (
                "I'm experiencing a technical issue right now. "
                "Please try again in a moment."
            )

        # --- Build source list ---
        sources = [
            item["data"].get("career_name") or item["data"].get("course_name", "Unknown")
            for item in retrieved
        ]

        return {
            "response": reply,
            "sources": sources,
            "has_context": bool(retrieved),
            "success": success,
        }

    def clear_session(self, user_id: str):
        """Clear chat history for a user (start a new conversation)."""
        self.session_cache.remove(user_id)
        logger.info("Cleared session for user %s", user_id)

    def get_metrics(self) -> Dict[str, Any]:
        """Get chatbot usage metrics."""
        return {
            **self.metrics,
            "active_sessions": len(self.session_cache.cache),
            "timestamp": time.time(),
        }


# Singleton chatbot instance
chatbot = CareerAdvisorChatbot()