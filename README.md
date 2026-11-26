# TripCraft AI — Smart Travel Itinerary Planner

An AI-powered full-stack web application that generates personalized day-by-day travel itineraries using Google Gemini, with a React + Tailwind CSS frontend, FastAPI backend, and Supabase for auth and data storage.

## ✨ Features

- **AI-Powered Itinerary Generation** — Get detailed day-by-day plans with attractions, dining, accommodation, and transportation
- **Smart Trip Builder** — Intuitive form to set destination, dates, budget, and travel style
- **Interactive Itinerary View** — Beautiful timeline layout with color-coded activities
- **User Authentication** — Secure sign-up/login via Supabase Auth
- **SaaS Dashboard** — Overview of all trips with stats and quick actions
- **Save, Edit & Regenerate** — Modify trips and regenerate with feedback

## 🛠️ Tech Stack

| Layer       | Technology                        |
| ----------- | --------------------------------- |
| Frontend    | React 18, Tailwind CSS, Vite      |
| Backend     | FastAPI (Python 3.10+)            |
| Database    | Supabase (PostgreSQL + Auth)      |
| AI          | Google Gemini 2.0 Flash           |
| Animations  | Framer Motion                     |
| Icons       | Lucide React                      |

## 📋 Prerequisites

- Node.js 18+ and npm
- Python 3.10+
- Supabase account ([supabase.com](https://supabase.com))
- Google Gemini API key ([ai.google.dev](https://ai.google.dev))

## 🚀 Setup

### 1. Database (Supabase)

1. Create a new Supabase project
2. Go to the SQL Editor and run `supabase/migrations/001_initial_schema.sql`
3. Copy your project URL, anon key, service role key, and JWT secret

### 2. Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your Supabase and Gemini credentials
uvicorn app.main:app --reload --port 8000
```

### 3. Frontend

```bash
cd frontend
npm install
cp .env.example .env
# Edit .env with your Supabase URL and anon key
npm run dev
```

The app will be available at `http://localhost:5173`.

## 📁 Project Structure

```
travel-planner/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI entry point
│   │   ├── config.py            # Environment config
│   │   ├── dependencies.py      # Auth & DB dependencies
│   │   ├── models/schemas.py    # Pydantic models
│   │   ├── routers/
│   │   │   ├── auth.py          # Auth endpoints
│   │   │   ├── trips.py         # Trip CRUD endpoints
│   │   │   └── itinerary.py     # AI generation endpoints
│   │   └── services/
│   │       └── ai_service.py    # Gemini AI integration
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/          # Shared components
│   │   ├── contexts/            # Auth context
│   │   ├── lib/                 # API & Supabase clients
│   │   ├── pages/               # All page components
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── .env.example
└── supabase/
    └── migrations/              # SQL schema
```

## 📄 License

MIT
