"""
Pokemon Price Tracker API Integration
"""
import httpx
import os
from typing import Optional, Dict, Any, List
from dotenv import load_dotenv

load_dotenv()

POKEMON_API_KEY = os.getenv("POKEMON_API_KEY")
BASE_URL = "https://www.pokemonpricetracker.com/api/v2"


class PokemonPriceAPI:
    """Client for Pokemon Price Tracker API"""
    
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or POKEMON_API_KEY
        self.base_url = BASE_URL
        self.headers = {
            "Authorization": f"Bearer {self.api_key}" if self.api_key else "",
            "Content-Type": "application/json"
        }
    
    async def search_card(self, card_name: str, set_name: Optional[str] = None, limit: int = 5) -> List[Dict[str, Any]]:
        """
        Search for Pokemon cards by name and optional set
        
        Args:
            card_name: Name of the card (e.g., "Charizard")
            set_name: Optional set name to filter by
            limit: Maximum number of results
            
        Returns:
            List of card data dictionaries
        """
        if not self.api_key:
            raise ValueError("Pokemon API key not configured")
        
        params = {
            "search": card_name,
            "limit": limit,
            "sortBy": "price",
            "sortOrder": "desc"
        }
        
        if set_name:
            params["set"] = set_name
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            try:
                response = await client.get(
                    f"{self.base_url}/cards",
                    headers=self.headers,
                    params=params
                )
                response.raise_for_status()
                data = response.json()
                return data.get("data", [])
            except httpx.HTTPError as e:
                print(f"Error fetching card data: {e}")
                return []
    
    async def get_card_with_history(self, card_name: str, set_name: Optional[str] = None, days: int = 30) -> Optional[Dict[str, Any]]:
        """
        Get card data with price history
        
        Args:
            card_name: Name of the card
            set_name: Optional set name
            days: Number of days of price history (default 30)
            
        Returns:
            Card data with history, or None if not found
        """
        if not self.api_key:
            raise ValueError("Pokemon API key not configured")
        
        params = {
            "search": card_name,
            "limit": 1,
            "includeHistory": "true",
            "days": days
        }
        
        if set_name:
            params["set"] = set_name
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            try:
                response = await client.get(
                    f"{self.base_url}/cards",
                    headers=self.headers,
                    params=params
                )
                response.raise_for_status()
                data = response.json()
                cards = data.get("data", [])
                return cards[0] if cards else None
            except httpx.HTTPError as e:
                print(f"Error fetching card with history: {e}")
                return None
    
    async def get_card_with_psa_data(self, card_name: str, set_name: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """
        Get card data with PSA grading information
        
        Args:
            card_name: Name of the card
            set_name: Optional set name
            
        Returns:
            Card data with PSA info, or None if not found
        """
        if not self.api_key:
            raise ValueError("Pokemon API key not configured")
        
        params = {
            "search": card_name,
            "limit": 1,
            "includeEbay": "true",
            "includeBoth": "true"  # Include both history and PSA data
        }
        
        if set_name:
            params["set"] = set_name
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            try:
                response = await client.get(
                    f"{self.base_url}/cards",
                    headers=self.headers,
                    params=params
                )
                response.raise_for_status()
                data = response.json()
                cards = data.get("data", [])
                return cards[0] if cards else None
            except httpx.HTTPError as e:
                print(f"Error fetching card with PSA data: {e}")
                return None
    
    async def get_all_sets(self, search: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Get all Pokemon TCG sets
        
        Args:
            search: Optional search term to filter sets
            
        Returns:
            List of set data dictionaries
        """
        if not self.api_key:
            raise ValueError("Pokemon API key not configured")
        
        params = {}
        if search:
            params["search"] = search
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            try:
                response = await client.get(
                    f"{self.base_url}/sets",
                    headers=self.headers,
                    params=params
                )
                response.raise_for_status()
                data = response.json()
                return data.get("data", [])
            except httpx.HTTPError as e:
                print(f"Error fetching sets: {e}")
                return []
    
    def format_price_data(self, card_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Format card price data from API response
        
        Args:
            card_data: Raw card data from API
            
        Returns:
            Formatted price information
        """
        prices = card_data.get("prices", {})
        
        result = {
            "market_price": None,
            "price_range": None,
            "low_price": None,
            "mid_price": None,
            "high_price": None,
            "normal_market": None,
            "holofoil_market": None,
            "reverse_holofoil_market": None,
            "first_edition_market": None,
        }
        
        # Get market price (most common)
        if "market" in prices:
            result["market_price"] = prices["market"]
            result["price_range"] = f"${prices['market']:.2f}"
        
        # Get price by finish type
        if "normal" in prices and prices["normal"].get("market"):
            result["normal_market"] = prices["normal"]["market"]
        
        if "holofoil" in prices and prices["holofoil"].get("market"):
            result["holofoil_market"] = prices["holofoil"]["market"]
            
        if "reverseHolofoil" in prices and prices["reverseHolofoil"].get("market"):
            result["reverse_holofoil_market"] = prices["reverseHolofoil"]["market"]
            
        if "1stEditionHolofoil" in prices and prices["1stEditionHolofoil"].get("market"):
            result["first_edition_market"] = prices["1stEditionHolofoil"]["market"]
        
        # Calculate price range if we have low/mid/high
        if "low" in prices and "mid" in prices and "high" in prices:
            result["low_price"] = prices["low"]
            result["mid_price"] = prices["mid"]
            result["high_price"] = prices["high"]
            result["price_range"] = f"${prices['low']:.2f} - ${prices['high']:.2f}"
        
        return result
    
    def extract_psa_prices(self, card_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Extract PSA grading prices from card data
        
        Args:
            card_data: Card data with PSA information
            
        Returns:
            Dictionary of PSA prices
        """
        ebay = card_data.get("ebay", {})
        
        psa_prices = {
            "psa_10": None,
            "psa_9": None,
            "psa_8": None,
        }
        
        if "psa10" in ebay and ebay["psa10"].get("avg"):
            psa_prices["psa_10"] = ebay["psa10"]["avg"]
        
        if "psa9" in ebay and ebay["psa9"].get("avg"):
            psa_prices["psa_9"] = ebay["psa9"]["avg"]
            
        if "psa8" in ebay and ebay["psa8"].get("avg"):
            psa_prices["psa_8"] = ebay["psa8"]["avg"]
        
        return psa_prices


# Singleton instance
pokemon_api = PokemonPriceAPI()

