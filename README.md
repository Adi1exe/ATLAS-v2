# ATLAS — Intelligent Data Analytics Platform

> Upload → Analyze → Visualize → Predict → Report

---

## Tech Stack

| Layer      | Technology                                  |
|------------|---------------------------------------------|
| Frontend   | Vite + React 18, React Router, Tailwind CSS |
| Charts     | Plotly.js, Recharts                         |
| Auth       | Google OAuth 2.0 + JWT                      |
| Backend    | Flask 3, Flask-SQLAlchemy, Flask-JWT        |
| ML         | scikit-learn, statsmodels (ARIMA)           |
| NLP        | Rule-based engine + HuggingFace TAPAS       |
| Database   | SQLite (dev) / PostgreSQL (prod)            |

---

## Project Structure

```
ATLAS/
├── frontend/                  # Vite + React app
│   └── src/
│       ├── pages/             # LoginPage, LandingPage, Dashboard, Upload, Analyze,
│       │                      # Visualize, Insights, Predict, Report, NotFound
│       ├── components/
│       │   └── layout/        # AppLayout (sidebar + outlet)
│       ├── context/           # AuthContext (Google OAuth + JWT)
│       └── services/          # api.js (all Axios calls)
│
└── backend/                   # Flask app
    ├── app.py                 # App factory + entry point
    ├── config.py              # Environment-based config
    ├── models.py              # SQLAlchemy: User, Dataset, MLModel
    ├── extensions.py          # db, jwt instances
    ├── routes/
    │   ├── auth.py            # POST /api/auth/google
    │   ├── data.py            # Upload, list, preview, delete datasets
    │   ├── viz.py             # Chart recommendations + generation
    │   ├── insights.py        # AI insights + NLP query
    │   ├── predict.py         # Train models + inference
    │   └── report.py          # Export HTML / PDF / CSV
    ├── ml/
    │   ├── graph_recommender.py  # Rule-based chart suggestions
    │   ├── chart_generator.py    # Plotly figure builder
    │   ├── insights_engine.py    # Auto-pattern detection
    │   ├── nlp_engine.py         # NLP query handler
    │   └── predictor.py          # sklearn + ARIMA training/inference
    └── services/
        ├── data_service.py       # Load / clean / profile DataFrames
        └── report_service.py     # HTML + PDF report generation
```

---

## Quick Start

### 1. Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a project → **APIs & Services** → **Credentials**
3. Create an **OAuth 2.0 Client ID** (Web Application)
4. Add `http://localhost:5173` to **Authorized JavaScript origins**
5. Copy the **Client ID**

---

### 2. Backend Setup

```bash
cd ATLAS/backend

# Create virtual environment
python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env and set GOOGLE_CLIENT_ID

# Run Flask
python app.py
# → Running on http://localhost:5000
```

> **Torch / CPU only**: If you don't need the HuggingFace NLP fallback, comment out
> `transformers` and `torch` lines in `requirements.txt`.

---

### 3. Frontend Setup

```bash
cd ATLAS/frontend

npm install

# Configure environment
cp .env.example .env
# Edit .env and set VITE_GOOGLE_CLIENT_ID (same Client ID as backend)

npm run dev
# → Running on http://localhost:5173
```

---

## Feature Guide

| Page          | What it does                                                           |
|---------------|------------------------------------------------------------------------|
| `/`           | Public landing page                                                    |
| `/login`      | Google Sign-In                                                         |
| `/app/dashboard` | Overview stats, quick actions, recent datasets                    |
| `/app/upload` | Drag-and-drop CSV/Excel upload with auto-clean pipeline               |
| `/app/analyze` | Dataset column explorer + data preview table                         |
| `/app/visualize` | AI chart recommendations + interactive Plotly charts              |
| `/app/insights` | Auto insights (correlations, anomalies) + NLP query chat           |
| `/app/predict` | Train regression/classification/ARIMA models + view metrics+plots   |
| `/app/report` | Export full report as PDF, HTML, or CSV                              |

---

## API Reference

```
POST   /api/auth/google              Verify Google credential, return JWT
GET    /api/data/list                List user's datasets
POST   /api/data/upload              Upload + process CSV/Excel
GET    /api/data/:id/info            Column info + types
GET    /api/data/:id/preview         First N rows
DELETE /api/data/:id                 Delete dataset

POST   /api/viz/recommend            Get chart recommendations for columns
POST   /api/viz/generate             Generate Plotly chart JSON

POST   /api/insights/analyze         Auto-generate insights
POST   /api/insights/nlp             NLP query on dataset

POST   /api/predict/train            Train ML model
GET    /api/predict/models           List trained models
POST   /api/predict/:id/predict      Run inference

GET    /api/report/:id/export        Export report (?format=pdf|html|csv)
```

---

## Production Notes

- Swap `DATABASE_URL` to a PostgreSQL connection string
- Set strong `SECRET_KEY` and `JWT_SECRET_KEY`
- Use `gunicorn app:create_app()` for production WSGI
- Serve frontend build (`npm run build`) via nginx or CDN
- Store uploads on S3/GCS instead of local disk
