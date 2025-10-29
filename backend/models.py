from sqlalchemy import Column, Integer, String, Float, Text, DateTime, LargeBinary, ForeignKey, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from datetime import datetime

Base = declarative_base()

class PokemonCard(Base):
    __tablename__ = "pokemon_cards"
    
    id = Column(Integer, primary_key=True, index=True)
    card_name = Column(String(255), nullable=False)
    estimated_price = Column(String(100), nullable=False)
    details = Column(Text, nullable=True)
    image_data = Column(LargeBinary, nullable=True)
    image_filename = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Grading conditions
    centering_score = Column(Float, nullable=True)
    centering_comment = Column(Text, nullable=True)
    corners_score = Column(Float, nullable=True)
    corners_description = Column(Text, nullable=True)
    edges_score = Column(Float, nullable=True)
    edges_description = Column(Text, nullable=True)
    surface_score = Column(Float, nullable=True)
    surface_description = Column(Text, nullable=True)
    
    # Overall grade (calculated average)
    overall_grade = Column(Float, nullable=True)
    
    # Authenticity detection
    is_authentic = Column(Boolean, nullable=True)
    authenticity_confidence = Column(Float, nullable=True)
    authenticity_notes = Column(Text, nullable=True)

    # Relationship to price history
    price_history = relationship("PriceHistory", back_populates="card", cascade="all, delete-orphan")

class PriceHistory(Base):
    __tablename__ = "price_history"
    
    id = Column(Integer, primary_key=True, index=True)
    card_id = Column(Integer, ForeignKey("pokemon_cards.id"), nullable=False)
    price = Column(Float, nullable=False)  # Store as numeric value for calculations
    price_display = Column(String(100), nullable=False)  # Store original display format
    recorded_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationship back to card
    card = relationship("PokemonCard", back_populates="price_history")
