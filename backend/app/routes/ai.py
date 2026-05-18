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

# Groq API endpoint configuration
GROQ_API_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions"
GROQ_MODEL = "llama3-8b-8192"

@router.post("/suggest", response_model=ScoutResponse)
async def suggest_properties(request: ScoutRequest, db: Session = Depends(get_db)):
    # 1. Retrieve the Groq API Key
    groq_key = os.getenv("GROQ_API_KEY", "")
    if not groq_key:
        logger.error("GROQ_API_KEY environment variable is not set.")
        # Fallback response if no Groq API Key is supplied
        return ScoutResponse(
            response="I'm the SmartPG AI Scout! I'm ready to find your perfect place, but it looks like the Groq API Key is not set in the environment. Please configure it to unlock real-time suggestions!",
            recommended_property_ids=[]
        )

    # 2. Fetch active approved properties from DB to build the matching pool
    try:
        properties = db.query(Property).filter(
            Property.is_approved == True,
            Property.is_available == True
        ).all()
    except Exception as e:
        logger.error(f"Error fetching properties for AI context: {e}")
        raise HTTPException(status_code=500, detail="Database query error.")

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
            "trust_score": p.safety_score  #Safety score is presented as human trust index!
        })

    # 4. Construct System Prompt instructing Llama-3 to match and format output
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

    # 5. Build conversation history payload
    messages = [{"role": "system", "content": system_prompt}]
    for msg in request.chat_history:
        messages.append({"role": msg.role, "content": msg.content})
    messages.append({"role": "user", "content": request.message})

    # 6. Execute API request to Groq Llama-3 asynchronously
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            headers = {
                "Authorization": f"Bearer {groq_key}",
                "Content-Type": "application/json"
            }
            payload = {
                "model": GROQ_MODEL,
                "messages": messages,
                "temperature": 0.3,
                "max_tokens": 1000
            }
            
            logger.info("Sending prompt to Groq API...")
            response = await client.post(GROQ_API_ENDPOINT, headers=headers, json=payload)
            
            if response.status_code != 200:
                logger.error(f"Groq API returned status code {response.status_code}: {response.text}")
                return ScoutResponse(
                    response="I encountered a slight communication delay with my recommendation neural network. Please try asking again in a few seconds!",
                    recommended_property_ids=[]
                )
                
            response_json = response.json()
            ai_text = response_json["choices"][0]["message"]["content"]
            
            # 7. Parse the recommended IDs block from the text response
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
            
    except httpx.TimeoutException:
        logger.error("Timeout connecting to Groq API.")
        return ScoutResponse(
            response="Recommendation request timed out. Please try your request once more!",
            recommended_property_ids=[]
        )
    except Exception as e:
        logger.error(f"Unexpected error in AI Scout service: {e}")
        return ScoutResponse(
            response="Our Scout system encountered an unexpected processing error. Don't worry, our team is looking into it!",
            recommended_property_ids=[]
        )
