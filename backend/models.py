from sqlalchemy import (
    Column, Integer, String, Float, Text,
    DateTime, LargeBinary, ForeignKey
)
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

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

    # Real market data from Pokemon API
    market_price = Column(Float, nullable=True)
    price_source = Column(String(50), nullable=True)  # "api" or "ai"
    tcg_player_id = Column(String(100), nullable=True)
    set_name = Column(String(255), nullable=True)
    card_number = Column(String(50), nullable=True)
    rarity = Column(String(100), nullable=True)

    # PSA grading prices
    psa_10_price = Column(Float, nullable=True)
    psa_9_price = Column(Float, nullable=True)
    psa_8_price = Column(Float, nullable=True)

    # Relationship to price history
    price_history = relationship(
        "PriceHistory",
        back_populates="card",
        cascade="all, delete-orphan"
    )


class PriceHistory(Base):
    __tablename__ = "price_history"

    id = Column(Integer, primary_key=True, index=True)
    card_id = Column(
        Integer,
        ForeignKey("pokemon_cards.id"),
        nullable=False
    )
    # Store as numeric value for calculations
    price = Column(Float, nullable=False)
    # Store original display format
    price_display = Column(String(100), nullable=False)
    recorded_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationship back to card
    card = relationship("PokemonCard", back_populates="price_history")
