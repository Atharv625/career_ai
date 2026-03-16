# 🧭 CareerPath AI — One Stop Career & Education Advisor

> An AI-powered platform that helps students discover careers, analyze skill gaps, generate learning roadmaps, and find the best courses — all powered by Google Gemini and a RAG knowledge base.

---

## 📸 Features

| Feature | Description |
|---|---|
| 🤖 AI Career Chatbot | Gemini-powered advisor with RAG knowledge retrieval |
| 🎯 Career Recommendations | Score-based matching using skills + interests + education |
| 📊 Skill Gap Analyzer | Detailed breakdown of missing skills with priority levels |
| 🗺️ Learning Roadmap | Phase-by-phase personalized learning plan with timelines |
| 🎓 Course Finder | Filtered course recommendations from top platforms |
| 👤 Student Profile | Persistent profile for personalized AI responses |

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                             │
│           React.js + Tailwind CSS (Vite)                    │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐  │
│  │  Chatbot │ │Recommend │ │Skill Gap │ │   Roadmap    │  │
│  │   Page   │ │   Page   │ │   Page   │ │     Page     │  │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └──────┬───────┘  │
└───────┼────────────┼────────────┼───────────────┼───────────┘
        │            │            │               │
        └────────────┴────────────┴───────────────┘
                           │  REST API (axios)
┌──────────────────────────▼──────────────────────────────────┐
│                    BACKEND (FastAPI)                         │
│  ┌────────────┐ ┌──────────────┐ ┌───────────────────────┐  │
│  │  /api/chat │ │/api/recommend│ │  /api/skill-gap       │  │
│  │  /api/road │ │/api/students │ │  /api/careers         │  │
│  └─────┬──────┘ └──────┬───────┘ └───────────┬───────────┘  │
│        │               │                     │              │
│  ┌─────▼───────────────▼─────────────────────▼───────────┐  │
│  │              Core Services Layer                       │  │
│  │  chatbot.py │ recommendation_engine.py │ skill_gap.py  │  │
│  │  roadmap_generator.py │ database.py                    │  │
│  └──────┬─────────────────────────────────────────────────┘  │
└─────────┼───────────────────────────────────────────────────┘
          │
    ┌─────┴──────────────────────────────┐
    │                                    │
┌───▼────────────┐          ┌────────────▼────────────┐
│  Google Gemini │          │        MongoDB           │
│  (LLM + RAG)   │          │  students | careers      │
│  gemini-1.5    │          │  courses  | chat_history │
│  -flash        │          └─────────────────────────┘
└────────────────┘
         │
┌────────▼────────┐
│  TF-IDF Vector  │
│  Knowledge Base │
│  (careers.json  │
│   courses.json) │
└─────────────────┘
```

---

## 📁 Project Structure

```
career-advisor-ai/
│
├── backend/
│   ├── main.py                    # FastAPI app, middleware, router registration
│   ├── database.py                # MongoDB connection + seeding
│   ├── chatbot.py                 # Gemini AI + RAG implementation
│   ├── skill_gap_analyzer.py      # Skill gap scoring algorithm
│   ├── recommendation_engine.py   # Career + course recommendation logic
│   ├── roadmap_generator.py       # Phase-based roadmap generation
│   ├── requirements.txt
│   ├── Dockerfile
│   ├── .env.example
│   └── routers/
│       ├── chat.py                # POST /api/chat
│       ├── careers.py             # GET  /api/careers
│       ├── students.py            # POST /api/students
│       ├── recommendations.py     # POST /api/recommendations/careers|courses
│       ├── roadmap.py             # POST /api/roadmap
│       └── skill_gap.py           # POST /api/skill-gap/analyze
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx                # Router + layout
│   │   ├── main.jsx               # React entry point
│   │   ├── index.css              # Global styles + design tokens
│   │   ├── context/
│   │   │   └── AppContext.jsx     # Global state (profile, chat, userId)
│   │   ├── services/
│   │   │   └── api.js             # Axios API client
│   │   ├── components/
│   │   │   ├── Layout.jsx         # Sidebar + mobile nav
│   │   │   └── skills/
│   │   │       └── SkillInput.jsx # Tag input with autocomplete
│   │   └── pages/
│   │       ├── HomePage.jsx       # Landing + feature cards
│   │       ├── ChatPage.jsx       # AI chatbot UI
│   │       ├── RecommendationsPage.jsx
│   │       ├── SkillGapPage.jsx
│   │       ├── RoadmapPage.jsx
│   │       ├── CoursesPage.jsx
│   │       └── ProfilePage.jsx
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── package.json
│   ├── Dockerfile
│   └── nginx.conf
│
├── data/
│   ├── careers.json               # 8 careers with skills, roadmaps, salary
│   └── courses.json               # 12 top courses with metadata
│
├── docker-compose.yml
└── README.md
```

---

## 🚀 Quick Start

### Option 1: Docker (Recommended)

```bash
# 1. Clone and enter the project
git clone <repo-url>
cd career-advisor-ai

# 2. Set your Gemini API key
echo "GEMINI_API_KEY=your_key_here" > .env
echo "JWT_SECRET_KEY=your_secret_here" >> .env

# 3. Start everything
docker-compose up --build

# Frontend: http://localhost:3000
# Backend API: http://localhost:8000/api/docs
# MongoDB: localhost:27017
```

---

### Option 2: Local Development

#### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env and set GEMINI_API_KEY

# Start MongoDB (if not running)
# macOS:  brew services start mongodb-community
# Ubuntu: sudo systemctl start mongod
# Docker: docker run -d -p 27017:27017 mongo:7.0

# Run backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# API docs available at: http://localhost:8000/api/docs
```

#### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Configure API URL (optional, defaults to localhost:8000)
echo "VITE_API_URL=http://localhost:8000/api" > .env.local

# Start dev server
npm run dev

# App available at: http://localhost:3000
```

---

## 🔑 Getting a Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Click **"Create API Key"**
3. Copy the key into your `.env` file as `GEMINI_API_KEY=...`
4. The free tier supports generous usage for development

---

## 🧠 RAG Implementation Details

The chatbot uses **Retrieval-Augmented Generation (RAG)** to ground AI responses in factual data:

```
User Query → TF-IDF Vectorizer → Top-3 Relevant Docs Retrieved
                                        ↓
                         Context injected into Gemini prompt
                                        ↓
                     Gemini generates grounded, accurate response
```

**Knowledge Base**: `careers.json` + `courses.json` → indexed with TF-IDF
**Retrieval**: Cosine similarity between query and document vectors
**Augmentation**: Retrieved context prepended to Gemini system prompt
**Production upgrade**: Replace TF-IDF with FAISS + `text-embedding-004` for semantic search

---

## 📊 Recommendation Algorithm

**Career Matching Score** (0.0 – 1.0):

```
score = (skill_match × 0.50) + (interest_alignment × 0.35) + (education_boost × 0.15)
```

- **Skill match**: Jaccard similarity between user skills and required skills
- **Interest alignment**: Mapping user interests → career categories via lookup table
- **Education boost**: Small score multiplier based on education level

---

## 🔌 API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/chat/` | Send message to AI chatbot |
| GET  | `/api/chat/history/{user_id}` | Get chat history |
| POST | `/api/chat/clear-session` | Clear conversation |
| GET  | `/api/careers/` | List all careers |
| GET  | `/api/careers/{name}` | Get career details |
| POST | `/api/students/` | Create student profile |
| GET  | `/api/students/{email}` | Get student profile |
| PUT  | `/api/students/{email}` | Update student profile |
| POST | `/api/recommendations/careers` | Get career recommendations |
| POST | `/api/recommendations/courses` | Get course recommendations |
| POST | `/api/skill-gap/analyze` | Analyze skill gap for one career |
| POST | `/api/skill-gap/compare-all` | Compare skills vs all careers |
| POST | `/api/roadmap/` | Generate learning roadmap |

Full interactive docs: `http://localhost:8000/api/docs`

---

## ☁️ Deployment Guide

### Google Cloud Run

```bash
# Build and push images
gcloud auth configure-docker
docker build -t gcr.io/PROJECT_ID/career-advisor-backend ./backend
docker build -t gcr.io/PROJECT_ID/career-advisor-frontend ./frontend
docker push gcr.io/PROJECT_ID/career-advisor-backend
docker push gcr.io/PROJECT_ID/career-advisor-frontend

# Deploy backend
gcloud run deploy career-advisor-backend \
  --image gcr.io/PROJECT_ID/career-advisor-backend \
  --platform managed \
  --region us-central1 \
  --set-env-vars GEMINI_API_KEY=your_key,MONGODB_URL=your_atlas_url \
  --allow-unauthenticated

# Deploy frontend
gcloud run deploy career-advisor-frontend \
  --image gcr.io/PROJECT_ID/career-advisor-frontend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

### MongoDB Atlas (Production DB)

1. Create free cluster at [mongodb.com/atlas](https://www.mongodb.com/atlas)
2. Get connection string
3. Set `MONGODB_URL=mongodb+srv://user:pass@cluster.mongodb.net/career_advisor`

---

## 🔮 Suggested Improvements (SaaS Roadmap)

### Phase 2 — Intelligence
- **AI Personality Test**: MBTI/Holland Code assessment → career matching
- **Resume Analyzer**: Upload PDF → extract skills → auto-populate profile
- **Salary Predictor**: ML regression model on job market data
- **Job Market Analysis**: Live scraping of LinkedIn/Indeed for demand trends

### Phase 3 — Platform
- **Firebase Auth**: Google/GitHub OAuth sign-in
- **FAISS/Pinecone**: Semantic vector search for better RAG
- **Mentorship Matching**: Connect students with professionals in target roles
- **Progress Tracker**: Track completed courses and milestone achievements
- **Company Research**: AI-powered company culture and fit analysis

### Phase 4 — SaaS
- **Multi-tenant architecture**: Institutions/bootcamps get their own workspace
- **Admin dashboard**: Analytics on user career goals, popular skills, conversion
- **API monetization**: Expose career intelligence API for third parties
- **White-label**: Fully brandable for universities and career centers
- **Stripe billing**: Free/Pro/Enterprise tiers

---

## 🛠️ Tech Stack Summary

| Layer | Technology |
|---|---|
| Frontend | React 18, Tailwind CSS, Vite, React Router |
| Backend | Python 3.11, FastAPI, Uvicorn |
| AI | Google Gemini 1.5 Flash |
| RAG | TF-IDF (scikit-learn) → upgrade to FAISS |
| Database | MongoDB (Motor async driver) |
| Auth | JWT (python-jose) |
| Deployment | Docker, Docker Compose, GCP Cloud Run |

---

## 📄 License

MIT License — free to use, modify, and deploy.
