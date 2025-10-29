# PokeWealth

**Snap your card. Track your value.**

A simple web app to upload Pokémon card images and get instant AI-powered price estimates using Gemini 2.0 Flash.

## 🚀 Quick Start

### Backend Setup

1. Navigate to the backend folder:
```bash
cd backend
```

2. (Optional but recommended) Create and activate a Python virtual environment:
```bash
python -m venv venv
# On macOS/Linux:
source venv/bin/activate
# On Windows:
venv\Scripts\activate
```

3. Install Python dependencies:
```bash
pip install -r requirements.txt
```

4. Create a `.env` file in the `backend` folder with your API keys:
```
GEMINI_API_KEY=your_gemini_api_key_here
POKEMON_API_KEY=your_pokemon_api_key_here
```

**Note**: The Pokemon API key is optional but highly recommended. Without it, the app will use AI estimates instead of real market prices. Get your free Pokemon API key at: https://www.pokemonpricetracker.com/api-keys

5. Run the FastAPI server:
```bash
fastapi dev
```

Backend will be running at `http://localhost:8000`


### Frontend Setup

1. Navigate to the pokewealth folder:
```bash
cd pokewealth
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

Frontend will be running at `http://localhost:3000`

DONE (image uploading and analyzing should work now)

## 💻 Usage

1. Make sure both backend and frontend are running
2. Open `http://localhost:3000` in your browser
3. Click to upload a Pokémon card image
4. Wait for Gemini AI to analyze the card and provide grading scores
5. Review the AI analysis and edit grading details if needed
6. Save the card to your collection
7. View your collection at `/collection` to see all saved cards with their grades

## 🛠 Tech Stack

- **Frontend**: Next.js 15, React, TypeScript, Tailwind CSS
- **Backend**: FastAPI (Python)
- **AI**: Google Gemini 2.0 Flash for image analysis and pricing

## 📝 API Endpoints

- `POST /analyze-card` - Upload card image for AI analysis and grading
- `POST /save-card` - Save card with grading information to collection
- `GET /cards` - Get all saved cards in collection
- `GET /cards/{card_id}` - Get specific card details
- `GET /cards/{card_id}/image` - Get card image
- `GET /health` - Health check
- `GET /docs` - Interactive API documentation (Swagger UI)

## 🎯 Features

- **AI-Powered Analysis**: Uses Gemini 2.0 Flash to identify and analyze card images
- **Real Market Pricing**: Integrates with Pokemon Price Tracker API for actual TCGPlayer market prices
- **PSA Grading Prices**: View PSA 8/9/10 market values for graded cards
- **Professional Grading**: AI provides detailed grading scores for centering, corners, edges, and surface
- **Collection Management**: Save and track your cards with full grading details and market data
- **Interactive Grading**: Edit and customize grading scores and descriptions
- **Visual Collection**: Browse your collection with card images and detailed grading information
- **Price Tracking**: Automatic price history for all cards in your collection
- **Responsive Design**: Works on desktop and mobile devices

## 🔑 Getting API Keys

### Gemini API Key (Required)
1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the key and add it to your `.env` file

### Pokemon Price Tracker API Key (Optional but Recommended)
1. Go to [Pokemon Price Tracker API Keys](https://www.pokemonpricetracker.com/api-keys)
2. Sign up for a free account
3. Generate your API key (100 calls/day on free tier)
4. Copy the key and add it to your `.env` file

**Without the Pokemon API key**: The app will fall back to AI-generated price estimates, which may not be accurate.

## 📦 Project Structure

```
pokewealth/
├── backend/
│   ├── main.py          # FastAPI application
│   ├── requirements.txt # Python dependencies
│   └── .env            # Environment variables (create this)
└── pokewealth/
    ├── app/
    │   └── page.tsx    # Main upload UI
    └── package.json    # Node dependencies
```

## ⚠️ Note

**Price Data**: When configured with the Pokemon API key, the app fetches real-time TCGPlayer market prices updated daily. Without the API key, it falls back to AI-generated estimates which may not be accurate.

**Free Tier**: The Pokemon Price Tracker API offers 100 free calls per day, which is sufficient for hobby projects and personal collections. For larger collections or commercial use, consider upgrading to a paid tier.
