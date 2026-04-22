# Mind Forge — AI Learning Engine

> Transform any content into an interactive educational experience powered by Google Gemini AI

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (optional — app runs without it, sessions won't persist across restarts)
- Google Gemini API Key (free at https://aistudio.google.com)

### 1. Set up your API key
Edit `server/.env`:
```
GEMINI_API_KEY=your_actual_gemini_api_key_here
MONGODB_URI=mongodb://localhost:27017/mindforge   ← optional
PORT=5000
```

### 2. Start the servers

**Option A — Run the startup script (Windows PowerShell):**
```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\start.ps1
```

**Option B — Start manually:**

Terminal 1 (Backend):
```powershell
cd server
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
npm run dev
```

Terminal 2 (Frontend):
```powershell
cd client
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
npm run dev
```

### 3. Open your browser
Navigate to **http://localhost:5173**

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 📄 **Multi-format Input** | Paste text, upload PDF, images, or code files |
| 🧠 **AI Concept Extraction** | Gemini AI maps all key ideas with definitions |
| 🕸️ **Knowledge Graph** | Interactive force-directed concept web (drag, zoom, pan) |
| 🌌 **5 × 3D Visualizations** | Solar system, molecule, network, wave, particles — AI-selected |
| 📝 **Smart Quiz** | 5 AI-generated questions with explanations and scoring |
| 💬 **AI Tutor** | Context-aware chatbot with Markdown support |
| 💾 **Session Persistence** | Saved to MongoDB (with `MONGODB_URI` set) |

## 🏗️ Architecture

```
mind forge/
├── client/                # React + Vite frontend
│   └── src/
│       ├── components/
│       │   ├── Navbar.jsx          # Navigation bar
│       │   ├── UploadPage.jsx      # Landing + upload
│       │   ├── ConceptGraph.jsx    # Canvas-based knowledge graph
│       │   ├── Visualizer3D.jsx    # Three.js 3D visualizations
│       │   ├── QuizPanel.jsx       # Quiz with scoring
│       │   ├── TutorChat.jsx       # AI tutor chat
│       │   └── ParticleBackground.jsx
│       ├── context/
│       │   └── SessionContext.jsx  # Global state
│       └── lib/
│           └── api.js              # Axios API client
└── server/                # Node.js + Express backend
    ├── routes/
    │   ├── upload.js       # File/text processing
    │   ├── chat.js         # AI tutor messages
    │   └── session.js      # Session CRUD
    ├── utils/
    │   └── gemini.js       # Google Gemini API wrapper
    └── models/
        └── Session.js      # MongoDB schema
```
