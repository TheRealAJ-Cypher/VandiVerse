# 🗺️ VandiVerse — Family Road Trip Companion

**VandiVerse** is a lightweight, responsive web application designed to help families plan unforgettable, safe, and stress-free road trips. It brings together weather forecasting, itinerary checklists, packing guides, and an AI-powered co-pilot into a clean and intuitive dashboard.

---

## 1. Features Overview

| Feature | Description | Requires Groq API Key? |
|---|---|:---:|
| **Trip Setup & Itinerary** | Enter origin, destination, and travel dates | ❌ No |
| **City Geocoding** | Instant location lookup powered by Open-Meteo | ❌ No |
| **7-Day Weather Forecast** | Daily temperature ranges, rain probability, wind speeds | ❌ No |
| **Packing Checklist** | Essential road-trip supplies checklist | ❌ No |
| **AI Road Trip Assistant** | Tailored packing tips, boredom-buster games & advice | ✅ **Yes** |
| **Safety & Weather Alerts** | High wind, freeze alerts, and flood warnings | ❌ No |

---

## 2. ⚠️ Safety Notice

> **IMPORTANT ROAD SAFETY NOTICE**  
> - **Never interact with this application while driving.** Safe vehicle operation is always the driver's primary responsibility. Designate a passenger as navigator.  
> - **Weather and AI advice are for pre-trip planning only.** Forecasts are not guaranteed conditions.  
> - **No real-time road conditions:** VandiVerse does not track live traffic accidents, dynamic construction closures, or flash flood road washouts. Always obey road signs and local police directives.  
> - **Remember: Turn around, don't drown!** Never attempt to drive across flooded bridges or water-covered roadways.

---

## 3. Prerequisites

Before installing, ensure you have:
- **Python 3.10 or higher**
- **pip** package manager

### How to verify on Windows
Open Windows PowerShell and check:
```powershell
python --version
pip --version
```
If Python is not recognized, install Python from [python.org](https://www.python.org/downloads/) and ensure you check **"Add Python to PATH"** during installation.

---

## 4. Installation & Quickstart (PowerShell)

Follow these step-by-step commands in Windows PowerShell:

### Step 1: Open project directory
```powershell
cd "c:\Users\Salim\OneDrive\Desktop\ABHIJAY_GOPAL_OS\02_AI_AGENTIC_AI\Agentic AI Projects\VandiVerse"
```

### Step 2: Create a virtual environment
```powershell
python -m venv .venv
```

### Step 3: Activate the virtual environment
```powershell
.venv\Scripts\Activate.ps1
```
> *Note:* If PowerShell displays a script execution policy error, run:
> ```powershell
> Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
> ```
> and then re-run `.venv\Scripts\Activate.ps1`.

### Step 4: Install dependencies
```powershell
pip install -r requirements.txt
```

### Step 5: Create configuration file
```powershell
Copy-Item .env.example .env
```

### Step 6: Start the development server
```powershell
uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000
```
Open your browser and navigate to:
**[http://127.0.0.1:8000](http://127.0.0.1:8000)**  
API documentation is available at: **[http://127.0.0.1:8000/api/docs](http://127.0.0.1:8000/api/docs)**

---

## 5. Opening on Your Phone (Same Wi-Fi Network)

To preview and use VandiVerse from a smartphone while on your home Wi-Fi:

1. Find your computer's local IP address using PowerShell:
   ```powershell
   ipconfig
   ```
   Look for the `IPv4 Address` under your active Wi-Fi adapter (for example: `192.168.1.45`).
2. Start the server bound to all interfaces:
   ```powershell
   uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
   ```
3. On your phone's browser, navigate to:
   ```text
   http://192.168.1.45:8000
   ```
   *(Replace with your actual IPv4 address)*

---

## 6. Enabling AI Features (Groq Setup)

The AI road trip assistant requires a free Groq API key:

1. Sign up for free at [console.groq.com](https://console.groq.com).
2. Go to **API Keys** -> click **Create API Key**.
3. Open your `.env` file in the project folder and paste your key:
   ```ini
   GROQ_API_KEY=gsk_your_actual_key_here
   GROQ_MODEL=llama-3.1-8b-instant
   ```
4. Verify current supported models at [console.groq.com/docs/models](https://console.groq.com/docs/models).
5. Restart your uvicorn server to apply changes.

---

## 7. Running Backend Tests

All backend tests mock external APIs (Open-Meteo and Groq) using `respx` and `unittest.mock`. **No internet connection or active API keys are required to run tests.**

Run tests from the project root:
```powershell
pytest backend/tests/ -v
```

All test cases covering weather forecasts, geocoding lookups, error propagation, and AI fallbacks will execute and validate.

---

## 8. Troubleshooting Guide

| Issue | Cause | Solution |
|---|---|---|
| `'python' is not recognized` | Python is not installed or not in PATH | Download Python from python.org and check "Add Python to PATH" |
| `Activate.ps1 cannot be loaded because running scripts is disabled` | PowerShell execution policy restricted | Run `Set-ExecutionPolicy RemoteSigned -Scope CurrentUser` |
| `[Errno 10048] error while attempting to bind on address` | Port 8000 is already in use | Run on an alternate port: `--port 8001` or terminate the existing process |
| `ModuleNotFoundError: No module named 'fastapi'` | Dependencies not installed in active environment | Ensure virtual environment is activated (`.venv\Scripts\Activate.ps1`) and run `pip install -r requirements.txt` |
| `503 AI assistant is not available` | `GROQ_API_KEY` is missing or default placeholder | Update `.env` with a valid key from console.groq.com and restart server |
| `RuntimeError: AI service error: 404` | Model decommissioned or misspelled | Check `GROQ_MODEL` in `.env` against [console.groq.com/docs/models](https://console.groq.com/docs/models) |
| `Weather service timed out or 503` | Open-Meteo temporarily unreachable or no internet | Check your internet connection; the client app gracefully falls back to cached data |

---

## 9. Project Structure

```text
VandiVerse/
├── .env.example              # Environment variables template
├── .gitignore                # Git ignore rules for Python & venv
├── pytest.ini                # Pytest configuration
├── requirements.txt          # Python dependencies
├── README.md                 # User documentation and guide
├── run.ps1                   # One-click startup script for Windows
├── backend/
│   ├── __init__.py           # Backend package marker
│   ├── main.py               # FastAPI application entrypoint & static mounting
│   ├── routes/
│   │   ├── __init__.py       # Routes package marker
│   │   ├── ai.py             # POST /api/ask endpoint
│   │   ├── geocoding.py      # GET /api/geocode endpoint
│   │   └── weather.py        # GET /api/weather endpoint
│   ├── services/
│   │   ├── __init__.py       # Services package marker
│   │   ├── groq_client.py    # Groq API client with fallback & safety prompts
│   │   └── open_meteo.py     # Open-Meteo weather & geocoding integration
│   └── tests/
│       ├── __init__.py       # Tests package marker
│       ├── conftest.py       # Async test fixtures
│       ├── test_ai.py        # AI route and configuration tests
│       ├── test_geocoding.py # Geocoding API tests
│       └── test_weather.py   # Forecast API tests
└── frontend/                 # Client UI assets (HTML, CSS, JS)
```

---

## 10. Future Hosting Options

When ready to host VandiVerse on the web for remote family access, popular deployment options include:
- **Render** (`render.com`): Web Service running `uvicorn backend.main:app --host 0.0.0.0 --port $PORT`
- **Railway** (`railway.app`): One-click Python container deployment
- **Fly.io** (`fly.io`): Global lightweight VM hosting via Dockerfile

> ℹ️ *Hosting Disclaimer:* Free tiers, quotas, and pricing plans on third-party cloud platforms frequently change and are not guaranteed. Always review current terms on respective provider websites before deploying.

---

## 11. Known Limitations

- **No Live Traffic:** Does not display real-time highway congestion, lane closures, or accidents.
- **Single Leg / Point-to-Point:** Route planning focuses on origin and destination forecasts; multi-waypoint route stitching is not currently supported.
- **Local Network Default:** By default runs locally on `127.0.0.1`.
- **AI Latency:** Groq inference latency depends on external server response times and free-tier rate limits.


## 12. Agent Demo: Safety Gate + AI Travel Planner

The AI assistant now exposes a small, explainable workflow:

1. **Context intake** — accepts the question and optional trip context.
2. **Deterministic safety pre-check** — checks the question and any supplied weather summary for flood-related and adverse-weather wording.
3. **AI travel planner** — asks the configured Groq model for general travel guidance.
4. **Execution trace** — returns the stage statuses, safety assessment, and an explicit flag that live road data was not checked.

This is a lightweight agent workflow, not a fully autonomous multi-agent system. The safety pre-check uses keyword matching and can miss hazards or produce false positives. It does not fetch official alerts or verify roads. Never use it as proof a route is safe.

The AI status indicator uses `GET /api/ai/status`, so opening the AI tab does not send a billable/rate-limited model prompt just to check whether a key is configured.

### Demo prompts

- **Normal planning:** “What should a family pack for a three-hour road trip with a toddler?”
- **Safety gate:** “There is waterlogging and floodwater on the road. Should we cross it?”
- **Context test:** Set a trip origin and destination, then ask “Help me prepare for this journey.”

For the flood-related prompt, the deterministic gate should classify the mention as `critical` and state not to drive through floodwater. The AI answer remains separate from this safety result.

### Extra tests

```powershell
.\.venv\Scripts\python.exe -m pytest backend/tests/test_safety_agent.py -v
```
