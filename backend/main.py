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
from models import PokemonCard, PriceHistory
from database import get_db, create_tables
from pokemon_api import pokemon_api

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
    # Real market data from Pokemon API
    market_price: Optional[float] = None
    price_source: Optional[str] = None  # "api" or "ai"
    tcg_player_id: Optional[str] = None
    set_name: Optional[str] = None
    card_number: Optional[str] = None
    rarity: Optional[str] = None
    # PSA prices if available
    psa_10_price: Optional[float] = None
    psa_9_price: Optional[float] = None
    psa_8_price: Optional[float] = None

    is_authentic: Optional[bool] = None
    authenticity_confidence: Optional[float] = None
    authenticity_notes: Optional[str] = None


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
    # Real market data
    market_price: Optional[float] = None
    price_source: Optional[str] = None
    tcg_player_id: Optional[str] = None
    set_name: Optional[str] = None
    card_number: Optional[str] = None
    rarity: Optional[str] = None
    psa_10_price: Optional[float] = None
    psa_9_price: Optional[float] = None
    psa_8_price: Optional[float] = None
    is_authentic: Optional[bool] = None
    authenticity_confidence: Optional[float] = None
    authenticity_notes: Optional[str] = None

    class Config:
        from_attributes = True


class PriceHistoryResponse(BaseModel):
    id: int
    card_id: int
    price: float
    price_display: str
    recorded_at: str

    class Config:
        from_attributes = True


def parse_price_string(price_str: str) -> float:
    """Parse price string like '$50 - $100' or '$75' and return average or single value"""
    import re

    # Remove currency symbols and extract numbers
    numbers = re.findall(r'[\d,]+\.?\d*', price_str.replace(',', ''))

    if not numbers:
        return 0.0

    # Convert to floats
    prices = [float(num) for num in numbers]

    # Return average if range, single value if not
    return sum(prices) / len(prices)


def create_price_history_entry(card_id: int, price_display: str, db: Session):
    """Create a new price history entry for a card"""
    price_value = parse_price_string(price_display)

    price_entry = PriceHistory(
        card_id=card_id,
        price=price_value,
        price_display=price_display
    )

    db.add(price_entry)
    db.commit()
    return price_entry


@app.get("/")
async def root():
    return {"message": "PokeWealth API - Snap your card. Track your value."}


@app.post("/analyze-card", response_model=CardAnalysisResponse)
async def analyze_card(file: UploadFile = File(...)):
    """
    Upload a Pokemon card image and get AI-powered analysis with real market pricing
    """
    print("\n" + "="*80)
    print("🎴 NEW CARD ANALYSIS REQUEST")
    print("="*80)

    try:
        # Read and process image
        contents = await file.read()
        image = Image.open(BytesIO(contents))
        print(f"📸 Image received: {file.filename}")

        # Step 1: Use Gemini to identify the card and grade it
        print("\n🤖 STEP 1: Calling Gemini AI for card identification and grading...")
        prompt = """
        You are a Pokemon card expert and professional grader. Analyze this Pokemon card image and provide:
        1. The exact card name (just the Pokemon name and card variant, e.g. "Charizard ex" or "Pikachu VMAX")
        2. The set name (e.g. "Base Set", "Temporal Forces", "Crown Zenith")
        3. Card number if visible (e.g. "4/102" or "123")
        4. Brief details about the card (set, rarity, condition assessment)
        5. Professional grading assessment for each category (score 1-10):
           - Centering: Score and comment about card centering
           - Corners: Score and description of corner wear/condition
           - Edges: Score and description of edge condition
           - Surface: Score and description of surface flaws/condition
        5. Authenticity assessment:
           - is_authentic: true/false if the card appears authentic
           - authenticity_confidence: number 0-100 confidence
           - authenticity_notes: brief reasons and any counterfeit flags (e.g., wrong font, misaligned borders, holo pattern issues)
        
        Format your response as JSON:
        {
            "card_name": "Card Name Here",
            "set_name": "Set Name Here",
            "card_number": "123/456",
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
            },
            "is_authentic": true,
            "authenticity_confidence": 92.5,
            "authenticity_notes": "Holo pattern matches, font and border alignment correct"
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

        print("\n✅ Gemini AI Response:")
        print(f"   Card Name: {result.get('card_name', 'Unknown')}")
        print(f"   Set: {result.get('set_name', 'Unknown')}")
        print(f"   Card Number: {result.get('card_number', 'Unknown')}")
        if result.get('centering'):
            print(
                f"   Centering: {result['centering'].get('score', 'N/A')}/10")
        if result.get('corners'):
            print(f"   Corners: {result['corners'].get('score', 'N/A')}/10")
        if result.get('edges'):
            print(f"   Edges: {result['edges'].get('score', 'N/A')}/10")
        if result.get('surface'):
            print(f"   Surface: {result['surface'].get('score', 'N/A')}/10")

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
        if overall_grade:
            print(f"   Overall Grade: {overall_grade}/10")

        # Step 2: Fetch real market prices from Pokemon Price Tracker API
        card_name = result.get("card_name", "Unknown Card")
        set_name = result.get("set_name")

        print(f"\n💰 STEP 2: Fetching real market prices for '{card_name}'...")

        market_price = None
        price_source = "ai"
        estimated_price = "Unable to determine"
        tcg_player_id = None
        actual_set_name = set_name
        card_number = result.get("card_number")
        rarity = None
        psa_10_price = None
        psa_9_price = None
        psa_8_price = None

        # Try to fetch real market data if API key is configured
        try:
            if pokemon_api.api_key:
                print(f"   🔑 Pokemon API Key configured - searching database...")
                if set_name:
                    print(
                        f"   🔍 Searching for: '{card_name}' in set '{set_name}'")
                else:
                    print(
                        f"   🔍 Searching for: '{card_name}' (no set specified)")

                # Search for the card with PSA data
                card_data = await pokemon_api.get_card_with_psa_data(card_name, set_name)

                if card_data:
                    print(f"\n   ✅ Card found in Pokemon API database!")
                    # Extract price information
                    price_info = pokemon_api.format_price_data(card_data)
                    psa_info = pokemon_api.extract_psa_prices(card_data)

                    print(f"\n   📊 Market Data:")
                    if price_info["market_price"]:
                        market_price = price_info["market_price"]
                        estimated_price = f"${market_price:.2f}"
                        price_source = "api"
                        print(f"      💵 Market Price: ${market_price:.2f}")
                    elif price_info["price_range"]:
                        estimated_price = price_info["price_range"]
                        price_source = "api"
                        print(f"      💵 Price Range: {estimated_price}")

                    # Extract additional card details
                    tcg_player_id = card_data.get("tcgplayerId")
                    actual_set_name = card_data.get("set", set_name)
                    card_number = card_data.get("number", card_number)
                    rarity = card_data.get("rarity")

                    if actual_set_name:
                        print(f"      📦 Set: {actual_set_name}")
                    if card_number:
                        print(f"      #️⃣  Number: {card_number}")
                    if rarity:
                        print(f"      ⭐ Rarity: {rarity}")
                    if tcg_player_id:
                        print(f"      🆔 TCGPlayer ID: {tcg_player_id}")

                    # PSA prices
                    psa_10_price = psa_info.get("psa_10")
                    psa_9_price = psa_info.get("psa_9")
                    psa_8_price = psa_info.get("psa_8")

                    if psa_10_price or psa_9_price or psa_8_price:
                        print(f"\n   🏆 PSA Graded Values:")
                        if psa_10_price:
                            print(f"      PSA 10: ${psa_10_price:.2f}")
                        if psa_9_price:
                            print(f"      PSA 9: ${psa_9_price:.2f}")
                        if psa_8_price:
                            print(f"      PSA 8: ${psa_8_price:.2f}")

                    # Update details with real market info
                    if rarity:
                        result["details"] = f"{actual_set_name} - {rarity} - {result.get('details', '')}"
                else:
                    # Card not found in API, keep AI estimate
                    print(
                        f"   ⚠️  Card '{card_name}' not found in Pokemon API")
                    print(f"   ℹ️  Will use AI price estimate instead")
            else:
                print("   ⚠️  Pokemon API key not configured")
                print("   ℹ️  Using AI estimate only")
        except Exception as api_error:
            print(f"   ❌ Error fetching real prices: {api_error}")
            print(f"   ℹ️  Falling back to AI estimate")

        # If we couldn't get real pricing, generate an AI estimate
        if price_source == "ai" and estimated_price == "Unable to determine":
            print(f"\n   🤖 Generating AI price estimate...")
            # Ask Gemini for a price estimate as fallback
            price_prompt = f"What is the approximate market price for a {card_name} from {set_name or 'unknown set'} in USD? Provide just a price range like '$X - $Y' or single value '$X'."
            try:
                price_response = model.generate_content(price_prompt)
                estimated_price = price_response.text.strip()
                print(f"   💭 AI Estimate: {estimated_price}")
            except:
                estimated_price = "Price unavailable"
                print(f"   ❌ Unable to generate price estimate")

        print(f"\n" + "="*80)
        print(f"📋 FINAL ANALYSIS SUMMARY")
        print("="*80)
        print(f"   Card: {card_name}")
        print(f"   Price: {estimated_price} (Source: {price_source.upper()})")
        if overall_grade:
            print(f"   Grade: {overall_grade}/10")
        print("="*80 + "\n")

        return CardAnalysisResponse(
            card_name=card_name,
            estimated_price=estimated_price,
            details=result.get("details", "No details available"),
            centering=GradingCondition(
                **result.get("centering", {})) if result.get("centering") else None,
            corners=GradingCondition(
                **result.get("corners", {})) if result.get("corners") else None,
            edges=GradingCondition(
                **result.get("edges", {})) if result.get("edges") else None,
            surface=GradingCondition(
                **result.get("surface", {})) if result.get("surface") else None,
            overall_grade=overall_grade,
            is_authentic=result.get("is_authentic"),
            authenticity_confidence=result.get("authenticity_confidence"),
            authenticity_notes=result.get("authenticity_notes"),
            market_price=market_price,
            price_source=price_source,
            tcg_player_id=tcg_player_id,
            set_name=actual_set_name,
            card_number=card_number,
            rarity=rarity,
            psa_10_price=psa_10_price,
            psa_9_price=psa_9_price,
            psa_8_price=psa_8_price
        )

    except json.JSONDecodeError as e:
        # Fallback if JSON parsing fails
        print(f"\n❌ ERROR: Failed to parse Gemini AI response")
        print(f"   Details: {str(e)}")
        print("="*80 + "\n")
        return CardAnalysisResponse(
            card_name="Analysis Error",
            estimated_price="Unable to determine",
            details=response.text if 'response' in locals() else "Error analyzing card",
            price_source="error"
        )
    except Exception as e:
        print(f"\n❌ CRITICAL ERROR during card analysis")
        print(f"   Error: {str(e)}")
        print("="*80 + "\n")
        raise HTTPException(
            status_code=500, detail=f"Error analyzing card: {str(e)}")


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
    market_price: Optional[float] = Form(None),
    price_source: Optional[str] = Form(None),
    tcg_player_id: Optional[str] = Form(None),
    set_name: Optional[str] = Form(None),
    card_number: Optional[str] = Form(None),
    rarity: Optional[str] = Form(None),
    psa_10_price: Optional[float] = Form(None),
    psa_9_price: Optional[float] = Form(None),
    psa_8_price: Optional[float] = Form(None),
    is_authentic: Optional[bool] = Form(None),
    authenticity_confidence: Optional[float] = Form(None),
    authenticity_notes: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    """
    Save a Pokemon card with grading information and market data to the database
    """
    print(f"\n💾 Saving card: {card_name} (${estimated_price})")
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
            surface_description=surface_description,
            is_authentic=is_authentic,
            authenticity_confidence=authenticity_confidence,
            authenticity_notes=authenticity_notes,
            market_price=market_price,
            price_source=price_source,
            tcg_player_id=tcg_player_id,
            set_name=set_name,
            card_number=card_number,
            rarity=rarity,
            psa_10_price=psa_10_price,
            psa_9_price=psa_9_price,
            psa_8_price=psa_8_price,
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

        print(f"   ✅ Card saved to database with ID: {db_card.id}")

        # Create initial price history entry
        create_price_history_entry(db_card.id, estimated_price, db)
        print(f"   📊 Price history entry created\n")

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
            overall_grade=db_card.overall_grade,
            market_price=db_card.market_price,
            price_source=db_card.price_source,
            tcg_player_id=db_card.tcg_player_id,
            set_name=db_card.set_name,
            card_number=db_card.card_number,
            rarity=db_card.rarity,
            psa_10_price=db_card.psa_10_price,
            psa_9_price=db_card.psa_9_price,
            psa_8_price=db_card.psa_8_price,
            is_authentic=db_card.is_authentic,
            authenticity_confidence=db_card.authenticity_confidence,
            authenticity_notes=db_card.authenticity_notes
        )

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error saving card: {str(e)}")


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
            overall_grade=card.overall_grade,
            is_authentic=card.is_authentic,
            authenticity_confidence=card.authenticity_confidence,
            authenticity_notes=card.authenticity_notes,
            market_price=card.market_price,
            price_source=card.price_source,
            tcg_player_id=card.tcg_player_id,
            set_name=card.set_name,
            card_number=card.card_number,
            rarity=card.rarity,
            psa_10_price=card.psa_10_price,
            psa_9_price=card.psa_9_price,
            psa_8_price=card.psa_8_price
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
        overall_grade=card.overall_grade,
        market_price=card.market_price,
        price_source=card.price_source,
        tcg_player_id=card.tcg_player_id,
        set_name=card.set_name,
        card_number=card.card_number,
        rarity=card.rarity,
        psa_10_price=card.psa_10_price,
        psa_9_price=card.psa_9_price,
        psa_8_price=card.psa_8_price,
        is_authentic=card.is_authentic,
        authenticity_confidence=card.authenticity_confidence,
        authenticity_notes=card.authenticity_notes
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
        raise HTTPException(
            status_code=500, detail=f"Failed to clear cards: {str(e)}")


@app.get("/cards/{card_id}/price-history", response_model=List[PriceHistoryResponse])
async def get_card_price_history(card_id: int, db: Session = Depends(get_db)):
    """
    Get price history for a specific card
    """
    price_history = db.query(PriceHistory).filter(
        PriceHistory.card_id == card_id).order_by(PriceHistory.recorded_at.desc()).all()
    return [
        PriceHistoryResponse(
            id=entry.id,
            card_id=entry.card_id,
            price=entry.price,
            price_display=entry.price_display,
            recorded_at=entry.recorded_at.isoformat()
        )
        for entry in price_history
    ]


@app.post("/cards/{card_id}/update-price")
async def update_card_price(
    card_id: int,
    new_price: str = Form(...),
    db: Session = Depends(get_db)
):
    """
    Update the price of a card and add to price history
    """
    card = db.query(PokemonCard).filter(PokemonCard.id == card_id).first()
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")

    # Update card price
    card.estimated_price = new_price
    db.commit()

    # Add to price history
    create_price_history_entry(card_id, new_price, db)

    return {"status": "success", "message": "Price updated successfully"}


@app.get("/portfolio/analytics")
async def get_portfolio_analytics(db: Session = Depends(get_db)):
    """
    Get portfolio analytics including total value and price changes
    """
    from datetime import datetime, timedelta

    # Get all cards with their latest prices
    cards = db.query(PokemonCard).all()

    total_value = 0
    total_value_1d_ago = 0
    total_value_1m_ago = 0
    total_value_3m_ago = 0
    total_value_1y_ago = 0

    now = datetime.utcnow()
    one_day_ago = now - timedelta(days=1)
    one_month_ago = now - timedelta(days=30)
    three_months_ago = now - timedelta(days=90)
    one_year_ago = now - timedelta(days=365)

    for card in cards:
        current_price = parse_price_string(card.estimated_price)
        total_value += current_price

        # Get historical prices
        price_1d = db.query(PriceHistory).filter(
            PriceHistory.card_id == card.id,
            PriceHistory.recorded_at <= one_day_ago
        ).order_by(PriceHistory.recorded_at.desc()).first()

        price_1m = db.query(PriceHistory).filter(
            PriceHistory.card_id == card.id,
            PriceHistory.recorded_at <= one_month_ago
        ).order_by(PriceHistory.recorded_at.desc()).first()

        price_3m = db.query(PriceHistory).filter(
            PriceHistory.card_id == card.id,
            PriceHistory.recorded_at <= three_months_ago
        ).order_by(PriceHistory.recorded_at.desc()).first()

        price_1y = db.query(PriceHistory).filter(
            PriceHistory.card_id == card.id,
            PriceHistory.recorded_at <= one_year_ago
        ).order_by(PriceHistory.recorded_at.desc()).first()

        if price_1d:
            total_value_1d_ago += price_1d.price
        if price_1m:
            total_value_1m_ago += price_1m.price
        if price_3m:
            total_value_3m_ago += price_3m.price
        if price_1y:
            total_value_1y_ago += price_1y.price

    def calculate_change(current, historical):
        if historical == 0:
            return 0
        return ((current - historical) / historical) * 100

    return {
        "total_value": total_value,
        "total_cards": len(cards),
        "price_changes": {
            "1_day": {
                "value": total_value - total_value_1d_ago,
                "percentage": calculate_change(total_value, total_value_1d_ago)
            },
            "1_month": {
                "value": total_value - total_value_1m_ago,
                "percentage": calculate_change(total_value, total_value_1m_ago)
            },
            "3_months": {
                "value": total_value - total_value_3m_ago,
                "percentage": calculate_change(total_value, total_value_3m_ago)
            },
            "1_year": {
                "value": total_value - total_value_1y_ago,
                "percentage": calculate_change(total_value, total_value_1y_ago)
            }
        }
    }


class DeckGenerationRequest(BaseModel):
    cards: List[dict]


class BinderGenerationRequest(BaseModel):
    cards: List[dict]


@app.post("/generate-deck")
async def generate_deck(request: DeckGenerationRequest):
    """
    Generate a Pokemon deck using AI based on available cards
    """
    try:
        # Prepare prompt for Gemini
        cards_info = "\n".join(
            [f"- {card['name']}: {card['details']} (Value: {card['price']})" for card in request.cards])

        prompt = f"""
        You are a Pokemon TCG expert. Based on the following cards in the user's collection, create a competitive deck.
        
        Available cards:
        {cards_info}
        
        Please create a deck with the following considerations:
        1. Choose 20-60 cards for a standard deck
        2. Include a good balance of Pokemon, Trainer cards, and Energy
        3. Focus on synergy between cards
        4. Consider the total value and rarity
        5. Make it playable and competitive
        
        Return your response as JSON in this format:
        {{
            "name": "Deck Name",
            "description": "Brief description of the deck strategy",
            "cards": [list of card IDs to include],
            "totalValue": estimated_total_value,
            "strategy": "Detailed strategy explanation"
        }}
        """

        # Call Gemini API
        response = model.generate_content(
            prompt,
            generation_config={
                "temperature": 0.7,
                "response_mime_type": "application/json"
            }
        )

        # Parse response
        import json
        result = json.loads(response.text)

        return result

    except json.JSONDecodeError:
        # Fallback if JSON parsing fails
        return {
            "name": "AI Generated Deck",
            "description": "A balanced deck generated by AI",
            "cards": request.cards[:20] if len(request.cards) >= 20 else request.cards,
            "totalValue": sum(float(card['price'].replace('$', '').replace(',', '')) for card in request.cards[:20]),
            "strategy": "AI-generated deck with balanced composition"
        }
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error generating deck: {str(e)}")


@app.post("/generate-binder")
async def generate_binder(request: BinderGenerationRequest):
    """
    Generate a Pokemon card binder with AI-organized groups
    """
    try:
        # Prepare prompt for Gemini
        cards_info = "\n".join(
            [f"- {card['name']}: {card['details']} (Value: {card['price']})" for card in request.cards])

        prompt = f"""
        You are a Pokemon card collection expert. Organize the following cards into logical groups for a binder display.
        
        Available cards:
        {cards_info}
        
        Please organize these cards into groups based on:
        1. Pokemon set/series
        2. Pokemon type/theme
        3. Rarity level
        4. Card series or generation
        5. Special themes (holo, first edition, etc.)
        
        Return your response as JSON in this format:
        {{
            "name": "Binder Name",
            "groups": [
                {{
                    "id": "group_id",
                    "name": "Group Name",
                    "type": "set|theme|rarity|series",
                    "cards": [list of card IDs in this group],
                    "description": "Brief description of this group"
                }}
            ],
            "totalCards": total_number_of_cards,
            "totalValue": estimated_total_value
        }}
        """

        # Call Gemini API
        response = model.generate_content(
            prompt,
            generation_config={
                "temperature": 0.5,
                "response_mime_type": "application/json"
            }
        )

        # Parse response
        import json
        result = json.loads(response.text)

        return result

    except json.JSONDecodeError:
        # Fallback if JSON parsing fails - create simple groups
        groups = []
        card_ids = [card['id'] for card in request.cards]

        # Simple grouping by splitting cards into chunks
        chunk_size = max(1, len(card_ids) // 4)  # Create 4 groups max
        for i in range(0, len(card_ids), chunk_size):
            group_cards = card_ids[i:i + chunk_size]
            groups.append({
                "id": f"group_{i//chunk_size}",
                "name": f"Group {i//chunk_size + 1}",
                "type": "theme",
                "cards": group_cards,
                "description": f"Collection group {i//chunk_size + 1}"
            })

        return {
            "name": "AI Organized Binder",
            "groups": groups,
            "totalCards": len(card_ids),
            "totalValue": sum(float(card['price'].replace('$', '').replace(',', '')) for card in request.cards)
        }
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error generating binder: {str(e)}")


@app.get("/health")
async def health():
    return {"status": "healthy"}

# Create database tables on startup


@app.on_event("startup")
async def startup_event():
    create_tables()
