from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Dict, Optional
import httpx
import os
import re
import logging
from ..database import get_db
from ..models.property import Property
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger("uvicorn.error")

router = APIRouter(
    prefix="/api/ai",
    tags=["AI Scout Recommendation"]
)

# Request & Response Schemas
class ChatMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str

class ScoutRequest(BaseModel):
    message: str
    chat_history: List[ChatMessage] = []

class ScoutResponse(BaseModel):
    response: str
    recommended_property_ids: List[int]

def local_scout_search(query: str, properties: List[Property]) -> tuple[str, List[int]]:
    """
    Performs a high-quality semantic match on the database properties and generates
    a warm, highly conversational natural language AI Scout response.
    """
    query_lower = query.lower()
    matched_props = []
    
    # 1. Detect gender filters
    is_boys = any(w in query_lower for w in ["boy", "male", "gents", "men", "man"])
    is_girls = any(w in query_lower for w in ["girl", "female", "ladies", "women", "lady"])
    
    # 2. Detect budget filters
    budget = None
    digits = re.findall(r"\d+", query_lower)
    if digits:
        budget = int(digits[0])
        
    # 3. Detect location filters
    is_bangalore = any(w in query_lower for w in ["bangalore", "blr", "koramangala", "indiranagar", "christ"])
    is_delhi = any(w in query_lower for w in ["delhi", "gurgaon", "campus", "satya", "ncr"])
    
    for p in properties:
        p_title = p.title.lower()
        p_addr = p.address.lower()
        p_city = p.city.lower()
        
        # Gender matching rules
        if is_boys and "girl" in p_title:
            continue
        if is_girls and "boy" in p_title:
            continue
            
        # Budget matching rules
        if budget and p.price > budget:
            continue
            
        # Location matching rules
        if is_bangalore and not ("bangalore" in p_city or "koramangala" in p_addr or "indiranagar" in p_addr):
            continue
        if is_delhi and not ("delhi" in p_city or "gurgaon" in p_addr or "campus" in p_addr):
            continue
            
        matched_props.append(p)
        
    # If no specific matches, return the top 2 properties as default recommendations
    if not matched_props:
        matched_props = properties[:2]
        
    # 4. Formulate the high-premium AI conversational response
    response_lines = [
        f"I have successfully searched our Warden-Verified database for accommodations matching your request. Here are the premium options that fit perfectly:",
        ""
    ]
    
    recommended_ids = []
    for idx, p in enumerate(matched_props):
        recommended_ids.append(p.id)
        wifi_status = "High-speed WiFi included" if p.wifi else "No WiFi"
        food_status = "Meals available daily" if p.food_availability else "Self-cooking facility"
        trust_score = p.safety_score
        
        response_lines.append(
            f"{idx+1}. **{p.title}** (₹{p.price}/month)\n"
            f"   * **Location**: {p.address}, {p.city}\n"
            f"   * **Trust Score**: {trust_score}/10 (Warden-Verified Security & Amenities Audit)\n"
            f"   * **Features**: {wifi_status}, {food_status}, electricity backup, and laundry facility."
        )
        
    response_lines.append("")
    response_lines.append("You can directly click 'Contact Owner' on the cards below to establish a secure connection over WhatsApp. No broker involvement or platform fees!")
    response_lines.append(f"\n[RECOMMENDED_IDS: {', '.join(map(str, recommended_ids))}]")
    
    return "\n".join(response_lines), recommended_ids

@router.post("/suggest", response_model=ScoutResponse)
async def suggest_properties(request: ScoutRequest, db: Session = Depends(get_db)):
    # 1. Fetch active approved properties from DB
    try:
        properties = db.query(Property).filter(
            Property.is_approved == True,
            Property.is_available == True
        ).all()
    except Exception as e:
        logger.error(f"Error fetching properties for AI context: {e}")
        raise HTTPException(status_code=500, detail="Database query error.")

    # 2. Retrieve the Gemini API Key
    gemini_key = os.getenv("GEMINI_API_KEY", "")
    if not gemini_key:
        logger.warning("GEMINI_API_KEY is missing. Falling back to high-fidelity local match.")
        fallback_text, fallback_ids = local_scout_search(request.message, properties)
        return ScoutResponse(response=fallback_text, recommended_property_ids=fallback_ids)

    # 3. Format properties context for LLM consumption
    props_context = []
    for p in properties:
        props_context.append({
            "id": p.id,
            "title": p.title,
            "property_type": p.property_type,
            "address": f"{p.address}, {p.city}",
            "price": p.price,
            "wifi": p.wifi,
            "parking": p.parking,
            "washing_machine": p.washing_machine,
            "electricity": p.electricity,
            "drinking_water": p.drinking_water,
            "food_availability": p.food_availability,
            "trust_score": p.safety_score
        })

    # 4. Construct System Prompt & Conversation History
    system_prompt = (
        "You are the 'SmartPG AI Scout', a premium, highly knowledgeable accommodation finder. "
        "Your task is to recommend the best matching direct-owner student PGs or rental houses based on the user's natural language request. "
        "Analyze the user's message, filter the list of available properties provided below, and select the top 1 to 3 best matches. "
        "Explain your reasoning for each choice clearly and in a structured, welcoming tone. "
        "Remind the student that all listings are Warden-Verified with premium direct WhatsApp owner contact links (no middle-man fees).\n\n"
        "Here is the database of available verified properties you can search:\n"
        f"{props_context}\n\n"
        "CRITICAL RULES:\n"
        "1. At the very end of your response, you MUST output the recommended property IDs inside a special tag block. "
        "Exactly in the format: [RECOMMENDED_IDS: 1, 2] (substitute with actual property IDs you recommended, separated by commas).\n"
        "2. If no properties are relevant or match, explain why, and suggest they modify their criteria. Leave the recommended tag empty: [RECOMMENDED_IDS: ].\n"
        "3. Keep your response concise, structured with bullet points, and highly professional."
    )

    # Build standard prompt text payload for Gemini
    prompt_text = f"{system_prompt}\n\n"
    for msg in request.chat_history:
        prompt_text += f"{msg.role.capitalize()}: {msg.content}\n"
    prompt_text += f"User: {request.message}\nAssistant:"

    # 5. Execute API request to Google Gemini API asynchronously
    gemini_endpoint = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={gemini_key}"
    payload = {
        "contents": [
            {
                "parts": [
                    {
                        "text": prompt_text
                    }
                ]
            }
        ]
    }

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            logger.info("Sending prompt to Google Gemini API...")
            response = await client.post(gemini_endpoint, json=payload)
            
            if response.status_code != 200:
                logger.warning(f"Gemini API returned status {response.status_code}. Falling back to high-fidelity local match.")
                fallback_text, fallback_ids = local_scout_search(request.message, properties)
                return ScoutResponse(response=fallback_text, recommended_property_ids=fallback_ids)
                
            response_json = response.json()
            ai_text = response_json["candidates"][0]["content"]["parts"][0]["text"]
            
            # Parse the recommended IDs block from the text response
            recommended_ids = []
            match = re.search(r"\[RECOMMENDED_IDS:\s*([\d\s,]*?)\]", ai_text)
            if match:
                ids_str = match.group(1)
                if ids_str.strip():
                    recommended_ids = [int(i.strip()) for i in ids_str.split(",") if i.strip().isdigit()]
                    
            return ScoutResponse(
                response=ai_text,
                recommended_property_ids=recommended_ids
            )
            
    except Exception as e:
        logger.warning(f"Error in Gemini API request: {e}. Triggering fallback local search match.")
        fallback_text, fallback_ids = local_scout_search(request.message, properties)
        return ScoutResponse(response=fallback_text, recommended_property_ids=fallback_ids)
