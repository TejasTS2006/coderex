# AI Deployment Troubleshooter

> **AI-Powered Deployment Troubleshooting for DevOps Teams**  
> Analyze deployment logs · Identify probable causes · Get actionable next steps

---

## ✨ Overview

**AI Deployment Troubleshooter** is a React.js frontend application built for the TCS Hackathon. It enables DevOps and IT maintenance teams to:

1. Upload `.log`, `.txt`, or `.json` deployment log files, or paste log content directly.
2. Click **Analyze Deployment** to send the log to a backend AI service.
3. Receive and view a structured troubleshooting report:
   - 📊 **Analysis Summary** – human-readable description of the issue
   - 🔍 **Probable Causes** – list of root cause candidates
   - 🛠️ **Recommended Next Steps** – actionable troubleshooting instructions

The frontend is **fully decoupled** from any AI/RAG/LLM logic. It communicates only with `POST /api/analyze` on the backend.

---

## 🚀 Quick Start

```bash
# 1. Clone the repo
git clone <repo-url>
cd ai-deployment-troubleshooter

# 2. Copy the environment template
cp .env.example .env

# 3. Install dependencies
npm install

# 4. Start the development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

> **Note**: The app ships with `VITE_USE_MOCK_API=true` so you can explore the full UI without a live backend.

---

## ⚙️ Environment Variables

Copy `.env.example` → `.env` and configure:

| Variable | Default | Description |
|---|---|---|
| `VITE_API_BASE_URL` | `http://localhost:8000` | Base URL of the backend API server |
| `VITE_USE_MOCK_API` | `false` | Set `true` to use built-in mock responses during frontend dev |

```env
VITE_API_BASE_URL=http://localhost:8000
VITE_USE_MOCK_API=false
```

---

## 🔌 Backend API Contract

The frontend calls one endpoint:

### `POST /api/analyze`

**Request Body (JSON):**
```json
{
  "log": "<raw deployment log text>"
}
```

**Expected Response (JSON):**
```json
{
  "summary": "The deployment failed during application startup because...",
  "probable_causes": [
    "Database service may be unavailable",
    "Incorrect database host or port"
  ],
  "recommended_steps": [
    "Check database service availability",
    "Verify database host and port"
  ]
}
```

**Optional metadata fields** (displayed if present, silently ignored if absent):

| Field | Type | Example |
|---|---|---|
| `error_type` | string | `"DatabaseConnectionError"` |
| `severity` | string | `"Critical"` |
| `confidence` | string | `"High"` |
| `relevant_error` | string | `"ECONNREFUSED 5432"` |
| `processing_time` | string | `"1.24s"` |

**HTTP Error codes handled:**

| Code | Meaning | User Message |
|---|---|---|
| `400` | Bad request | Verify log format |
| `422` | Unprocessable entity | Check log is not empty |
| `5xx` | Server error | Try again later |
| Network failure | Unreachable server | Check network / backend |

---

## 🗂️ Project Structure

```
src/
├── components/
│   ├── Header.jsx           # Sticky nav with logo + About modal trigger
│   ├── AboutModal.jsx       # Informational modal
│   ├── Hero.jsx             # Hero section with animated diagram
│   ├── LogInput.jsx         # Orchestrates file upload + textarea
│   ├── FileUpload.jsx       # Drag-and-drop + browse file upload
│   ├── LogTextarea.jsx      # Large monospace paste area
│   ├── AnalyzeButton.jsx    # CTA with spinner + disabled states
│   ├── LoadingState.jsx     # Orbital animation + visual stage list
│   ├── AnalysisResult.jsx   # Result container + metadata chips
│   ├── SummaryCard.jsx      # Analysis summary section
│   ├── ProbableCauses.jsx   # Probable causes numbered list
│   ├── RecommendedSteps.jsx # Recommended steps numbered list
│   └── ErrorMessage.jsx     # Error alert with retry
│
├── services/
│   └── api.js               # analyzeDeployment() – all API logic here
│
├── utils/
│   └── validation.js        # validateFile / validateTextInput / validateSubmission
│
├── styles/
│   └── index.css            # Full design system (variables, animations, layout)
│
├── tests/
│   ├── setup.js             # @testing-library/jest-dom setup
│   ├── validation.test.js   # Pure unit tests for validation utils
│   └── App.test.jsx         # Integration tests for App component
│
├── App.jsx                  # Root component – state machine
└── main.jsx                 # React entry point
```

---

## 🧪 Running Tests

```bash
# Run all tests once
npm test

# Watch mode (re-runs on file change)
npm run test:watch
```

Tests cover:
- ✅ Empty input validation
- ✅ File type / size validation
- ✅ Text input validation
- ✅ Analyze button enabled/disabled states
- ✅ Loading state rendering
- ✅ Successful API response → renders summary, causes, steps
- ✅ API error → shows error message
- ✅ Reset functionality

---

## 🎨 Design System

Built entirely with **vanilla CSS** + CSS custom properties. No external UI libraries.

Key design tokens (defined in `src/styles/index.css`):

```css
--color-primary:    #3b82f6   /* Blue – primary actions */
--color-accent:     #06b6d4   /* Cyan – highlights */
--color-success:    #10b981   /* Green – success states */
--color-error:      #ef4444   /* Red – errors */
--color-warning:    #f59e0b   /* Amber – warnings */
--color-bg:         #0b0f1a   /* Dark navy – background */
```

Animations used:
- `fadeInUp` – page sections
- `card-in` – result cards with stagger
- `pulse-glow` – logo + orbital core
- `orbit` / `spin` – loading spinner rings
- `shimmer` – arrow flow indicators
- `float` – hero diagram icons
- `progress-bar` – loading progress track
- `slideInLeft` – result list items

---

## 🔧 Available Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm test` | Run tests once |
| `npm run test:watch` | Run tests in watch mode |

---

## 🔗 Integration Architecture

```
React Frontend
     │
     │  POST /api/analyze
     │  { "log": "..." }
     ▼
Backend API
     │
     ├─▶ Log Processor (Member 1)
     │
     ├─▶ RAG Retrieval (Member 2)
     │
     └─▶ AI Agent + LLM (Member 3)
              │
              ▼
     Backend Response
     { summary, probable_causes, recommended_steps }
              │
              ▼
     React displays results
```

The frontend has **zero knowledge** of the internal backend modules. It only calls `POST /api/analyze` and renders the response.

---

## ♿ Accessibility

- Semantic HTML (`<header>`, `<main>`, `<nav>`, `<article>`, `<section>`)
- All interactive elements keyboard-accessible
- ARIA labels on buttons, inputs, modals
- `role="alert"` for validation and error messages
- `role="status"` + `aria-live` for loading state
- Skip-to-content link in `index.html`
- Visible focus ring (`:focus-visible`)
- No color-only communication of meaning

---

## 📱 Responsive Breakpoints

| Viewport | Layout |
|---|---|
| > 768px (Desktop) | Two-column log input (file + paste side by side) |
| ≤ 768px (Tablet/Mobile) | Tabbed input (file or paste), stacked results |
| ≤ 480px (Mobile) | Compact spacing, full-width buttons |

---

*Built for TCS Hackathon — Frontend by [Your Name]. Backend AI/RAG/Log modules by separate team members.*
