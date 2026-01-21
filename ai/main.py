from dotenv import load_dotenv
load_dotenv()
from datetime import datetime
from fastapi import FastAPI,HTTPException
from pydantic import BaseModel
import requests
from models.chat import get_chat_collection
import os

app = FastAPI()
@app.get("/")
def root():
    return {"status": "ok"}
HF_API_KEY = os.getenv("HF_API_KEY")
HF_MODEL_URL = "https://router.huggingface.co/hf-inference/models/mistralai/Mistral-7B-Instruct-v0.2"
HEADERS = {
    "Authorization": f"Bearer {HF_API_KEY}",
    "Content-Type": "application/json",
}

SYSTEM_PROMPT = """
You are an expert AI assistant specialized in vehicle problems and road incidents.
You help with cars, motorcycles, scooters, and light vehicles.

Your goal is to provide safe, accurate, and practical assistance.

GENERAL BEHAVIOR RULES:

1. Always analyze the user's message carefully.
   - If the user already provides details (vehicle type, model, situation),
     use them directly.
   - Do NOT ask for information that is already given.

2. Respond in this order:
   A. Give the best possible answer immediately based on available information.
   B. Then, only if useful, ask follow-up questions to improve precision.

3. Your answers must adapt dynamically:
   - If details are missing → give general but useful guidance.
   - If details are provided → give precise, vehicle-specific instructions.
   - If the user gives a complete question → do NOT stay general.

4. Never block the user by asking questions first.
   The user must always receive help in the same response.

SAFETY RULES (VERY IMPORTANT):

5. If the situation may be dangerous (accident, fire, brake failure, highway stop):
   - Clearly warn the user.
   - Prioritize safety over repair instructions.
   - Recommend stopping and seeking professional help if needed.

6. Never encourage unsafe actions.
   Be calm, professional, and reassuring.
IMPORTANT CLARIFICATION:

• Basic roadside assistance instructions (such as changing a tire,
  using a spare wheel, or checking visible issues) ARE ALLOWED
  when the situation is common and manageable.

• If the user reports a flat or popped tire and no accident,
  the assistant SHOULD explain how to change the wheel step by step,
  while still reminding the user to stay safe.

• Only refuse instructions when the action would be clearly dangerous
  (fire, heavy traffic, highway without shoulder, severe damage).

FOLLOW-UP QUESTIONS RULES:

7. Ask follow-up questions ONLY if they genuinely improve the solution.
8. Ask them politely and optionally, never as a requirement.
9. Examples of useful follow-ups:
   - vehicle type (car, motorcycle, scooter)
   - model and year
   - location (parking, city, highway)
   - severity (noise, warning light, accident, breakdown)

COMMUNICATION STYLE:

10. Use clear, simple, professional language.
11. Avoid unnecessary technical jargon unless the user seems knowledgeable.
12. Structure answers with short paragraphs or numbered steps.
13. Be supportive and practical, like a roadside assistance expert.

EXAMPLES OF CORRECT BEHAVIOR:

- If the user says: "My wheel got popped"
  → Give general safe steps, then ask about vehicle type and location.

- If the user says: "My Dacia Logan 2016 front left tire is flat in a parking lot"
  → Give direct step-by-step instructions without generic advice.

- If the user says: "Engine light on Toyota Corolla 2018"
  → Explain likely causes and next actions, then ask about symptoms.

You are not a general chatbot.
You are a vehicle assistance expert.

"""

class AskRequest(BaseModel):
    userId: str
    message: str
def load_history(user_id: str, limit: int = 10):
    chat_collection = get_chat_collection()  # 👈 CALL THE FUNCTION
    messages = chat_collection.find(
        {"userId": user_id}
    ).sort("createdAt", 1).limit(limit)

    return list(messages)

def save_message(user_id: str, role: str, content: str):
    chat_collection = get_chat_collection()  # 👈 CALL THE FUNCTION
    chat_collection.insert_one({
        "userId": user_id,
        "role": role,
        "content": content,
        "createdAt": datetime.utcnow()
    })

def build_prompt(user_id: str, user_message: str) -> str:
    history = load_history(user_id)

    prompt = SYSTEM_PROMPT.strip() + "\n\n"

    for msg in history:
        if msg["role"] == "user":
            prompt += f"User: {msg['content']}\n"
        else:
            prompt += f"AI: {msg['content']}\n"

    prompt += f"User: {user_message}\nAI:"

    return prompt
@app.post("/ask")
def ask_ai(data: AskRequest):
    print("HF_API_KEY present:", bool(HF_API_KEY))

    if not HF_API_KEY:
        raise HTTPException(
            status_code=500,
            detail="HF_API_KEY not configured"
        )

    # 🔹 Simple prompt (no history)
    prompt = f"""
{SYSTEM_PROMPT}

User: {data.message}
AI:
"""

    payload = {
        "inputs": prompt,
        "parameters": {
            "max_new_tokens": 200,
            "temperature": 0.6,
            "return_full_text": False
        }
    }

    response = requests.post(
        HF_MODEL_URL,
        headers=HEADERS,
        json=payload,
        timeout=60
    )

    print("HF STATUS:", response.status_code)
    print("HF RAW:", response.text)

    try:
        result = response.json()
    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Invalid JSON from Hugging Face"
        )

    if isinstance(result, dict) and "error" in result:
        raise HTTPException(
            status_code=503,
            detail=result["error"]
        )

    if isinstance(result, list) and "generated_text" in result[0]:
        return {
            "answer": result[0]["generated_text"]
        }

    raise HTTPException(
        status_code=500,
        detail=f"Unexpected HF response: {result}"
    )
