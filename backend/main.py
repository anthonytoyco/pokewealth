from fastapi import FastAPI, UploadFile, File, HTTPException, Depends, Form
from fastapi.responses import Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session
import google.generativeai as genai
import base64
from PIL import Image
from io import BytesIO
import os
from dotenv import load_dotenv
from typing import List, Optional
from models import PokemonCard
from database import get_db, create_tables

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

class GradingCondition(BaseModel):
    score: float
    description: str

class CardAnalysisResponse(BaseModel):
    card_name: str
    estimated_price: str
    details: str
    centering: Optional[GradingCondition] = None
    corners: Optional[GradingCondition] = None
    edges: Optional[GradingCondition] = None
    surface: Optional[GradingCondition] = None
    overall_grade: Optional[float] = None

class CardCreate(BaseModel):
    card_name: str
    estimated_price: str
    details: str
    centering_score: Optional[float] = None
    centering_comment: Optional[str] = None
    corners_score: Optional[float] = None
    corners_description: Optional[str] = None
    edges_score: Optional[float] = None
    edges_description: Optional[str] = None
    surface_score: Optional[float] = None
    surface_description: Optional[str] = None

class CardResponse(BaseModel):
    id: int
    card_name: str
    estimated_price: str
    details: str
    image_filename: Optional[str] = None
    created_at: str
    centering_score: Optional[float] = None
    centering_comment: Optional[str] = None
    corners_score: Optional[float] = None
    corners_description: Optional[str] = None
    edges_score: Optional[float] = None
    edges_description: Optional[str] = None
    surface_score: Optional[float] = None
    surface_description: Optional[str] = None
    overall_grade: Optional[float] = None

    class Config:
        from_attributes = True

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
        You are a Pokemon card expert and professional grader. Analyze this Pokemon card image and provide:
        1. The exact card name
        2. The estimated market price (provide a realistic price range in USD)
        3. Brief details about the card (set, rarity, condition assessment)
        4. Professional grading assessment for each category (score 1-10):
           - Centering: Score and comment about card centering
           - Corners: Score and description of corner wear/condition
           - Edges: Score and description of edge condition
           - Surface: Score and description of surface flaws/condition
        
        Format your response as JSON:
        {
            "card_name": "Card Name Here",
            "estimated_price": "$XX - $XX USD",
            "details": "Brief description including set, rarity, and condition",
            "centering": {
                "score": 9.5,
                "description": "Slightly bottom-heavy"
            },
            "corners": {
                "score": 9.0,
                "description": "Two tiny dots of whitening on back corners"
            },
            "edges": {
                "score": 9.5,
                "description": "Near perfect"
            },
            "surface": {
                "score": 8.0,
                "description": "One visible surface scratch on holographic area"
            }
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
        
        # Calculate overall grade
        grades = []
        if result.get("centering", {}).get("score"):
            grades.append(result["centering"]["score"])
        if result.get("corners", {}).get("score"):
            grades.append(result["corners"]["score"])
        if result.get("edges", {}).get("score"):
            grades.append(result["edges"]["score"])
        if result.get("surface", {}).get("score"):
            grades.append(result["surface"]["score"])
        
        overall_grade = round(sum(grades) / len(grades), 1) if grades else None
        
        return CardAnalysisResponse(
            card_name=result.get("card_name", "Unknown Card"),
            estimated_price=result.get("estimated_price", "Unable to determine"),
            details=result.get("details", "No details available"),
            centering=GradingCondition(**result.get("centering", {})) if result.get("centering") else None,
            corners=GradingCondition(**result.get("corners", {})) if result.get("corners") else None,
            edges=GradingCondition(**result.get("edges", {})) if result.get("edges") else None,
            surface=GradingCondition(**result.get("surface", {})) if result.get("surface") else None,
            overall_grade=overall_grade
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

@app.post("/save-card", response_model=CardResponse)
async def save_card(
    card_name: str = Form(...),
    estimated_price: str = Form(...),
    details: str = Form(...),
    image_file: UploadFile = File(...),
    centering_score: Optional[float] = Form(None),
    centering_comment: Optional[str] = Form(None),
    corners_score: Optional[float] = Form(None),
    corners_description: Optional[str] = Form(None),
    edges_score: Optional[float] = Form(None),
    edges_description: Optional[str] = Form(None),
    surface_score: Optional[float] = Form(None),
    surface_description: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    """
    Save a Pokemon card with grading information to the database
    """
    try:
        # Read image data
        image_contents = await image_file.read()
        
        # Create new card record
        db_card = PokemonCard(
            card_name=card_name,
            estimated_price=estimated_price,
            details=details,
            image_data=image_contents,
            image_filename=image_file.filename,
            centering_score=centering_score,
            centering_comment=centering_comment,
            corners_score=corners_score,
            corners_description=corners_description,
            edges_score=edges_score,
            edges_description=edges_description,
            surface_score=surface_score,
            surface_description=surface_description
        )
        
        # Calculate overall grade
        grades = []
        if centering_score:
            grades.append(centering_score)
        if corners_score:
            grades.append(corners_score)
        if edges_score:
            grades.append(edges_score)
        if surface_score:
            grades.append(surface_score)
        
        if grades:
            db_card.overall_grade = round(sum(grades) / len(grades), 1)
        
        db.add(db_card)
        db.commit()
        db.refresh(db_card)
        
        return CardResponse(
            id=db_card.id,
            card_name=db_card.card_name,
            estimated_price=db_card.estimated_price,
            details=db_card.details,
            image_filename=db_card.image_filename,
            created_at=db_card.created_at.isoformat(),
            centering_score=db_card.centering_score,
            centering_comment=db_card.centering_comment,
            corners_score=db_card.corners_score,
            corners_description=db_card.corners_description,
            edges_score=db_card.edges_score,
            edges_description=db_card.edges_description,
            surface_score=db_card.surface_score,
            surface_description=db_card.surface_description,
            overall_grade=db_card.overall_grade
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error saving card: {str(e)}")

@app.get("/cards", response_model=List[CardResponse])
async def get_cards(db: Session = Depends(get_db)):
    """
    Get all saved Pokemon cards
    """
    cards = db.query(PokemonCard).order_by(PokemonCard.created_at.desc()).all()
    return [
        CardResponse(
            id=card.id,
            card_name=card.card_name,
            estimated_price=card.estimated_price,
            details=card.details,
            image_filename=card.image_filename,
            created_at=card.created_at.isoformat(),
            centering_score=card.centering_score,
            centering_comment=card.centering_comment,
            corners_score=card.corners_score,
            corners_description=card.corners_description,
            edges_score=card.edges_score,
            edges_description=card.edges_description,
            surface_score=card.surface_score,
            surface_description=card.surface_description,
            overall_grade=card.overall_grade
        )
        for card in cards
    ]

@app.get("/cards/{card_id}", response_model=CardResponse)
async def get_card(card_id: int, db: Session = Depends(get_db)):
    """
    Get a specific Pokemon card by ID
    """
    card = db.query(PokemonCard).filter(PokemonCard.id == card_id).first()
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")
    
    return CardResponse(
        id=card.id,
        card_name=card.card_name,
        estimated_price=card.estimated_price,
        details=card.details,
        image_filename=card.image_filename,
        created_at=card.created_at.isoformat(),
        centering_score=card.centering_score,
        centering_comment=card.centering_comment,
        corners_score=card.corners_score,
        corners_description=card.corners_description,
        edges_score=card.edges_score,
        edges_description=card.edges_description,
        surface_score=card.surface_score,
        surface_description=card.surface_description,
        overall_grade=card.overall_grade
    )

@app.get("/cards/{card_id}/image")
async def get_card_image(card_id: int, db: Session = Depends(get_db)):
    """
    Get the image for a specific Pokemon card
    """
    card = db.query(PokemonCard).filter(PokemonCard.id == card_id).first()
    if not card or not card.image_data:
        raise HTTPException(status_code=404, detail="Card or image not found")
    
    # Determine content type based on file extension or default to jpeg
    content_type = "image/jpeg"
    if card.image_filename:
        if card.image_filename.lower().endswith('.png'):
            content_type = "image/png"
        elif card.image_filename.lower().endswith('.gif'):
            content_type = "image/gif"
        elif card.image_filename.lower().endswith('.webp'):
            content_type = "image/webp"
    
    return Response(
        content=card.image_data, 
        media_type=content_type,
        headers={
            "Cache-Control": "public, max-age=3600",
            "Access-Control-Allow-Origin": "*"
        }
    )

@app.get("/debug/cards")
async def debug_cards(db: Session = Depends(get_db)):
    """
    Debug endpoint to check what cards are in the database
    """
    cards = db.query(PokemonCard).all()
    return {
        "total_cards": len(cards),
        "cards": [
            {
                "id": card.id,
                "card_name": card.card_name,
                "has_image": bool(card.image_data),
                "image_filename": card.image_filename,
                "image_size": len(card.image_data) if card.image_data else 0
            }
            for card in cards
        ]
    }

@app.delete("/debug/cards")
async def delete_all_cards(db: Session = Depends(get_db)):
    """
    Danger: Deletes all cards. For development/debugging only.
    """
    try:
        db.query(PokemonCard).delete()
        db.commit()
        return {"status": "ok", "deleted": True}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to clear cards: {str(e)}")

@app.get("/health")
async def health():
    return {"status": "healthy"}

# Create database tables on startup
@app.on_event("startup")
async def startup_event():
    create_tables()

