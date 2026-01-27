# 🤖 AI Resume Intelligence System

An AI-powered multi-agent system that automatically parses resumes, detects fraud, verifies data (future scope), and ranks candidates for jobs using a transparent scoring system.

This project uses **LangGraph Multi-Agent Pipeline**, **Supabase**, and **OLLAMA (local LLM)** for privacy and low cost.

---

## 🚀 Features

- 📄 Resume parsing from PDF to structured JSON
- 🕵️ Fraud detection (date overlaps, fake content, duplicates)
- ✅ Verification node (placeholder for future integrations)
- 📊 AI-based scoring and ranking
- 🧠 Explainable AI (shows reasons for every score)
- 📧 Automatic shortlist/reject emails
- 💬 Chat with candidate profiles
- 📜 Full audit trail of each resume

---

## 🛠 Tech Stack

**Frontend**
- React (Vite)

**Backend**
- Node.js
- Express
- LangGraph (Multi-Agent Orchestration)
- Supabase (DB + File Storage)
- OLLAMA (Local LLM) or Google Gemini

---

## ⚙️ Setup & Installation

### 📦 Frontend Setup


cd frontend
npm install
npm run dev
Frontend will run on:
👉 http://localhost:5173

🧩 Backend Setup
cd backend
npm install
npm run start
Backend will run on:
👉 http://localhost:8080

🔐 AI Provider Configuration (IMPORTANT)
By default, the project uses OLLAMA locally (recommended for privacy & free usage).

✅ To Use OLLAMA (Default)
Install OLLAMA

Run a model:

ollama run llama3
Backend will automatically use it.

🔁 To Use Google Gemini Instead
Open: backend/.env

Find this line:

# AI_PROVIDER="gemini"
Remove #:

AI_PROVIDER="gemini"
Add your API key:

GEMINI_API_KEY=your_api_key_here
🧠 Multi-Agent Pipeline Architecture
This system uses LangGraph to run agents in sequence:

1️⃣ Parsing Agent
Converts PDF resume into structured JSON:

Name

Skills

Education

Experience

2️⃣ Fraud Detection Agent
Detects:

Impossible job date overlaps

Fake filler text (like Lorem Ipsum)

Duplicate applications

3️⃣ Verification Agent (Future Scope)
Placeholder node for:

Background checks

Company verification APIs

4️⃣ Scoring & Ranking Agent
Uses weighted formula:

Skills      → 50%
Experience  → 35%
Education   → 15%
📊 Final Ranking Formula
finalRankScore = overallScore - (fraudScore × 0.35) + priorityBonus
🧾 Explainability (Very Important)
For every score, AI generates:

✅ 3–6 bullet point reasons

Helps recruiters trust the AI result

🌐 API Documentation
Base URL:
👉 http://localhost:8080/hr/resume

All APIs are tested using Postman.

✅ A. Intake & Job Management
➤ Create Job
POST /jobs

Used to create a job with:

Title

Description

Required skills

Preferred skills

➤ Upload Resume
POST /upload

Uploads PDF to Supabase

Generates unique candidateId

Stores application source and priority

🔄 B. Processing & Analytics
➤ Process Candidate
POST /process

Triggers all 4 AI agents

Returns full intelligence report

➤ Fetch Candidate Report
GET /candidate/{id}/report

Returns combined data from:

Profile

Score

Risk

Audit Logs

➤ Job Leaderboard
GET /process/jobs/{id}/candidates

Shows ranked candidates for a job

Sorted by AI score (high → low)

💬 C. Communication & Chat
➤ Automated Email
POST /email

Sends:

Shortlist email OR

Rejection email

Based on AI decision

➤ Profile Chat
POST /chat

Ask questions like:

"What are top skills?"

"Any fraud risks?"

"Why is this score low?"

AI replies using candidate data.

🔐 Security & Integrity Features
🛡 Fraud Protection
Detects duplicate resumes across jobs

🚨 Hard Cap Rule
If duplicate detected:

Final score is capped at 15%

🧾 Audit Trail
Every resume follows this lifecycle:

UPLOAD → PARSE → FRAUD_CHECK → SCORING_COMPLETE → EMAIL_SENT
This helps for:

Compliance

Debugging

HR accountability

✅ Final Usage Checklist
✅ Configure Supabase in backend/.env

✅ Start OLLAMA or set Gemini API

✅ Create job using /jobs API

✅ Upload resume using /upload

✅ Run AI pipeline using /process

✅ Check leaderboard & reports

✅ Send emails automatically

📌 Future Improvements
Real verification APIs (KYC, employment checks)

Admin dashboard UI

Interview scheduling agent

ATS integration

Bias detection module

👨‍💻 Author
Built as an AI internship / learning project using:

LangGraph Multi-Agent Systems

Practical HR use-cases

Real-world fraud detection logic

Perfect for:

Resume screening automation

HR tech demos

AI agent portfolios
