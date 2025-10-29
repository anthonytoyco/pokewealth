from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import google.generativeai as genai
import base64
from PIL import Image
from io import BytesIO
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="PokeWealth API")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure Gemini
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY not found in environment variables")

genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel("gemini-2.0-flash-exp")

class CardAnalysisResponse(BaseModel):
    card_name: str
    estimated_price: str
    details: str

@app.get("/")
async def root():
    return {"message": "PokeWealth API - Snap your card. Track your value."}

@app.post("/analyze-card", response_model=CardAnalysisResponse)
async def analyze_card(file: UploadFile = File(...)):
    """
    Upload a Pokemon card image and get AI-powered price analysis
    """
    try:
        # Read and process image
        contents = await file.read()
        image = Image.open(BytesIO(contents))
        
        # Prepare prompt for Gemini
        prompt = """
        You are a Pokemon card expert. Analyze this Pokemon card image and provide:
        1. The exact card name
        2. The estimated market price (provide a realistic price range in USD)
        3. Brief details about the card (set, rarity, condition assessment)
        
        Format your response as JSON:
        {
            "card_name": "Card Name Here",
            "estimated_price": "$XX - $XX USD",
            "details": "Brief description including set, rarity, and condition"
        }
        """
        
        # Call Gemini API
        response = model.generate_content(
            [prompt, image],
            generation_config={
                "temperature": 0.2,
                "response_mime_type": "application/json"
            }
        )
        
        # Parse response
        import json
        result = json.loads(response.text)
        
        return CardAnalysisResponse(
            card_name=result.get("card_name", "Unknown Card"),
            estimated_price=result.get("estimated_price", "Unable to determine"),
            details=result.get("details", "No details available")
        )
        
    except json.JSONDecodeError:
        # Fallback if JSON parsing fails
        return CardAnalysisResponse(
            card_name="Analysis Error",
            estimated_price="Unable to determine",
            details=response.text if 'response' in locals() else "Error analyzing card"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing card: {str(e)}")

@app.get("/health")
async def health():
    return {"status": "healthy"}

