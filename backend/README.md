# PokeWealth Backend

Simple FastAPI backend for Pokemon card price analysis using Gemini AI.

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Create `.env` file with your Gemini API key:
```
GEMINI_API_KEY=your_api_key_here
```

3. Run the server:
```bash
uvicorn main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`

## API Endpoints

- `POST /analyze-card` - Upload a Pokemon card image for analysis
- `GET /health` - Health check endpoint
- `GET /` - API info

