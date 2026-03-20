from fastapi import FastAPI, APIRouter, HTTPException, Depends, UploadFile, File, Header
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import uuid
import json
import re
import io
from pathlib import Path
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timezone
import jwt
import bcrypt

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

JWT_SECRET = os.environ.get('JWT_SECRET', 'jasons-spelling-quest-secret-2024')
EMERGENT_KEY = os.environ.get('EMERGENT_LLM_KEY', '')

app = FastAPI()
api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# --- Models ---
class UserRegister(BaseModel):
    username: str
    email: str
    password: str
    role: str = "student"

class UserLogin(BaseModel):
    email: str
    password: str

class WordsAdd(BaseModel):
    words: List[str]

class WordLevelUpdate(BaseModel):
    level: int

class TextImport(BaseModel):
    text: str

class UrlImport(BaseModel):
    url: str

class SentenceCheck(BaseModel):
    sentence: str
    target_word: str

class DefinitionRequest(BaseModel):
    word: str

class GameSessionSave(BaseModel):
    words_played: List[dict]
    total_score: int
    levels_completed: List[int]

class ErrorLogSave(BaseModel):
    word: str
    level: int
    error_type: str
    error_detail: str
    sentence: Optional[str] = None

# --- Auth ---
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())

def create_token(user_id: str, role: str) -> str:
    return jwt.encode({"user_id": user_id, "role": role}, JWT_SECRET, algorithm="HS256")

async def auth_dependency(authorization: str = Header(None)):
    if not authorization:
        raise HTTPException(401, "Not authenticated")
    token = authorization.replace("Bearer ", "")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        user = await db.users.find_one({"id": payload["user_id"]}, {"_id": 0})
        if not user:
            raise HTTPException(401, "User not found")
        return user
    except jwt.InvalidTokenError:
        raise HTTPException(401, "Invalid token")

@api_router.get("/")
async def root():
    return {"message": "Jason's Spelling Quest API"}

@api_router.post("/auth/register")
async def register(data: UserRegister):
    existing = await db.users.find_one({"email": data.email})
    if existing:
        raise HTTPException(400, "Email already registered")
    user_id = str(uuid.uuid4())
    user_doc = {
        "id": user_id,
        "username": data.username,
        "email": data.email,
        "password": hash_password(data.password),
        "role": data.role,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(user_doc)
    token = create_token(user_id, data.role)
    return {"token": token, "user": {"id": user_id, "username": data.username, "email": data.email, "role": data.role}}

@api_router.post("/auth/login")
async def login(data: UserLogin):
    user = await db.users.find_one({"email": data.email}, {"_id": 0})
    if not user or not verify_password(data.password, user["password"]):
        raise HTTPException(401, "Invalid credentials")
    token = create_token(user["id"], user["role"])
    return {"token": token, "user": {"id": user["id"], "username": user["username"], "email": user["email"], "role": user["role"]}}

@api_router.get("/auth/me")
async def get_me(user=Depends(auth_dependency)):
    return {"id": user["id"], "username": user["username"], "email": user["email"], "role": user["role"]}

# --- Words ---
@api_router.get("/words")
async def get_words(user=Depends(auth_dependency), level: Optional[int] = None, sort: Optional[str] = None):
    query = {"user_id": user["id"]}
    if level is not None:
        query["level"] = level
    sort_key = [("created_at", -1)]
    if sort == "recent":
        sort_key = [("updated_at", -1)]
    words = await db.words.find(query, {"_id": 0}).sort(sort_key).to_list(1000)
    return words

@api_router.post("/words")
async def add_words(data: WordsAdd, user=Depends(auth_dependency)):
    added = []
    for w in data.words:
        w = w.strip().lower()
        if not w or len(w) < 2:
            continue
        existing = await db.words.find_one({"user_id": user["id"], "word": w})
        if existing:
            continue
        doc = {
            "id": str(uuid.uuid4()),
            "user_id": user["id"],
            "word": w,
            "level": 0,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        await db.words.insert_one(doc)
        added.append({"id": doc["id"], "word": w, "level": 0, "created_at": doc["created_at"], "updated_at": doc["updated_at"], "user_id": user["id"]})
    return {"added": added, "count": len(added)}

@api_router.delete("/words/{word_id}")
async def delete_word(word_id: str, user=Depends(auth_dependency)):
    result = await db.words.delete_one({"id": word_id, "user_id": user["id"]})
    if result.deleted_count == 0:
        raise HTTPException(404, "Word not found")
    return {"deleted": True}

@api_router.put("/words/{word_id}/level")
async def update_word_level(word_id: str, data: WordLevelUpdate, user=Depends(auth_dependency)):
    result = await db.words.update_one(
        {"id": word_id, "user_id": user["id"]},
        {"$set": {"level": min(data.level, 3), "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    if result.matched_count == 0:
        raise HTTPException(404, "Word not found")
    return {"updated": True}

# --- Import ---
STOP_WORDS = {'the','a','an','is','are','was','were','be','been','being','have','has','had',
    'do','does','did','will','would','could','should','may','might','shall','can','need',
    'to','of','in','for','on','with','at','by','from','as','into','through','during',
    'before','after','above','below','between','out','off','over','under','again','then',
    'once','here','there','when','where','why','how','all','each','every','both','few',
    'more','most','other','some','such','no','nor','not','only','own','same','so','than',
    'too','very','just','because','but','and','or','if','while','this','that','these',
    'those','it','its','he','she','they','we','you','me','him','her','us','them','my',
    'your','his','our','their','what','which','who','whom','about','up','also','like','get'}

def extract_words_from_text(text: str) -> List[str]:
    words = re.findall(r'\b[a-zA-Z]{3,}\b', text.lower())
    unique = list(dict.fromkeys(w for w in words if w not in STOP_WORDS))
    return unique[:100]

async def add_words_for_user(words: List[str], user_id: str) -> List[dict]:
    added = []
    for w in words:
        existing = await db.words.find_one({"user_id": user_id, "word": w})
        if existing:
            continue
        doc = {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "word": w,
            "level": 0,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        await db.words.insert_one(doc)
        added.append({"id": doc["id"], "word": w, "level": 0})
    return added

@api_router.post("/words/import/text")
async def import_text(data: TextImport, user=Depends(auth_dependency)):
    words = extract_words_from_text(data.text)
    added = await add_words_for_user(words, user["id"])
    return {"added": added, "count": len(added)}

@api_router.post("/words/import/file")
async def import_file(file: UploadFile = File(...), user=Depends(auth_dependency)):
    content = await file.read()
    if file.filename and file.filename.endswith('.pdf'):
        from PyPDF2 import PdfReader
        reader = PdfReader(io.BytesIO(content))
        text = " ".join(page.extract_text() or "" for page in reader.pages)
    else:
        text = content.decode('utf-8', errors='ignore')
    words = extract_words_from_text(text)
    added = await add_words_for_user(words, user["id"])
    return {"added": added, "count": len(added)}

@api_router.post("/words/import/url")
async def import_url(data: UrlImport, user=Depends(auth_dependency)):
    import requests
    from bs4 import BeautifulSoup
    try:
        resp = requests.get(data.url, timeout=10, headers={"User-Agent": "Mozilla/5.0"})
        soup = BeautifulSoup(resp.text, 'lxml')
        for tag in soup(["script", "style", "nav", "footer"]):
            tag.decompose()
        text = soup.get_text(separator=" ")
    except Exception as e:
        raise HTTPException(400, f"Failed to fetch URL: {str(e)}")
    words = extract_words_from_text(text)
    added = await add_words_for_user(words, user["id"])
    return {"added": added, "count": len(added)}

# --- Game ---
@api_router.post("/game/definitions")
async def get_definitions(data: DefinitionRequest, user=Depends(auth_dependency)):
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        chat = LlmChat(api_key=EMERGENT_KEY, session_id=f"def-{uuid.uuid4()}", system_message="You are a vocabulary helper for K-6 students. Return JSON only, no markdown.")
        chat.with_model("openai", "gpt-5.2")
        msg = UserMessage(text=f"""Generate vocabulary quiz data for the word "{data.word}".
Return a JSON object with exactly this structure:
{{"word": "{data.word}", "definitions": ["def1", "def2"], "distractors": ["wrong1", "wrong2"]}}
Rules:
- "definitions": 2-3 simple, correct definitions a child can understand
- "distractors": 2 plausible but wrong definitions
Return ONLY the JSON object.""")
        response = await chat.send_message(msg)
        json_match = re.search(r'\{.*\}', response, re.DOTALL)
        if json_match:
            result = json.loads(json_match.group())
            if "definitions" in result and "distractors" in result:
                return result
        return _fallback_definitions(data.word)
    except Exception as e:
        logger.error(f"Definition error: {e}")
        return _fallback_definitions(data.word)

def _fallback_definitions(word):
    return {
        "word": word,
        "definitions": [f"Something related to {word}"],
        "distractors": ["A type of musical instrument", "A very large mountain"]
    }

@api_router.post("/game/check-grammar")
async def check_grammar(data: SentenceCheck, user=Depends(auth_dependency)):
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        chat = LlmChat(api_key=EMERGENT_KEY, session_id=f"gram-{uuid.uuid4()}", system_message="You are a grammar checker for K-6 students. Return ONLY valid JSON, no markdown.")
        chat.with_model("openai", "gpt-5.2")
        msg = UserMessage(text=f"""Analyze this sentence by a K-6 student using the word "{data.target_word}":
"{data.sentence}"

Check for:
1. Capitalization (sentence start, pronoun "I", proper nouns)
2. Punctuation (must end with . ! or ?)
3. Subject-verb agreement ("He go" -> "He goes")
4. Tense consistency
5. Homophones (there/their, to/too, its/it's, your/you're)
6. Common K-6 spelling errors
7. Run-on sentences, fragments, double negatives
8. Article usage (a/an), pronoun case

Return this exact JSON structure:
{{"uses_target_word": true, "word_count": 5, "spelling_errors": [{{"word": "bad", "correction": "good", "message": "friendly tip"}}], "grammar_errors": [{{"type": "Capitalization", "detail": "what is wrong", "message": "kid-friendly explanation"}}], "score_breakdown": {{"usage_points": 10, "length_points": 5, "spelling_penalty": 0, "grammar_penalty": 0, "total": 15}}}}
Score: +10 if uses target word, +1 per word in sentence, -1 per spelling error, -1 per grammar error. Minimum total is 0.""")
        response = await chat.send_message(msg)
        json_match = re.search(r'\{.*\}', response, re.DOTALL)
        if json_match:
            result = json.loads(json_match.group())
            errors = result.get("spelling_errors", []) + result.get("grammar_errors", [])
            if errors:
                await db.error_logs.insert_one({
                    "id": str(uuid.uuid4()),
                    "user_id": user["id"],
                    "word": data.target_word,
                    "sentence": data.sentence,
                    "errors": errors,
                    "level": 3,
                    "created_at": datetime.now(timezone.utc).isoformat()
                })
            return result
        return _fallback_grammar(data.sentence, data.target_word)
    except Exception as e:
        logger.error(f"Grammar check error: {e}")
        return _fallback_grammar(data.sentence, data.target_word)

def _fallback_grammar(sentence, target_word):
    wc = len(sentence.split())
    uses = target_word.lower() in sentence.lower()
    usage_pts = 10 if uses else 0
    return {
        "uses_target_word": uses,
        "word_count": wc,
        "spelling_errors": [],
        "grammar_errors": [],
        "score_breakdown": {"usage_points": usage_pts, "length_points": wc, "spelling_penalty": 0, "grammar_penalty": 0, "total": usage_pts + wc}
    }

@api_router.post("/game/session")
async def save_game_session(data: GameSessionSave, user=Depends(auth_dependency)):
    session = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "words_played": data.words_played,
        "total_score": data.total_score,
        "levels_completed": data.levels_completed,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.game_sessions.insert_one(session)
    return {"saved": True, "session_id": session["id"]}

@api_router.get("/game/sessions")
async def get_game_sessions(user=Depends(auth_dependency)):
    sessions = await db.game_sessions.find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(50)
    return sessions

@api_router.post("/game/error-log")
async def save_error_log(data: ErrorLogSave, user=Depends(auth_dependency)):
    log_doc = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "word": data.word,
        "level": data.level,
        "error_type": data.error_type,
        "error_detail": data.error_detail,
        "sentence": data.sentence,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.error_logs.insert_one(log_doc)
    return {"saved": True}

# --- Stats ---
@api_router.get("/stats")
async def get_stats(user=Depends(auth_dependency)):
    total = await db.words.count_documents({"user_id": user["id"]})
    level_counts = {}
    for lv in range(4):
        level_counts[str(lv)] = await db.words.count_documents({"user_id": user["id"], "level": lv})
    sessions = await db.game_sessions.find({"user_id": user["id"]}, {"_id": 0, "total_score": 1}).to_list(1000)
    total_score = sum(s.get("total_score", 0) for s in sessions)
    return {"total_words": total, "level_counts": level_counts, "total_sessions": len(sessions), "total_score": total_score}

# --- Teacher ---
@api_router.get("/teacher/students")
async def get_students(user=Depends(auth_dependency)):
    if user["role"] != "teacher":
        raise HTTPException(403, "Teachers only")
    students = await db.users.find({"role": "student"}, {"_id": 0, "password": 0}).to_list(1000)
    for s in students:
        s["total_words"] = await db.words.count_documents({"user_id": s["id"]})
        s["mastered_words"] = await db.words.count_documents({"user_id": s["id"], "level": 3})
    return students

@api_router.get("/teacher/students/{student_id}/words")
async def get_student_words(student_id: str, user=Depends(auth_dependency)):
    if user["role"] != "teacher":
        raise HTTPException(403, "Teachers only")
    words = await db.words.find({"user_id": student_id}, {"_id": 0}).to_list(1000)
    return words

@api_router.get("/teacher/students/{student_id}/errors")
async def get_student_errors(student_id: str, user=Depends(auth_dependency)):
    if user["role"] != "teacher":
        raise HTTPException(403, "Teachers only")
    errors = await db.error_logs.find({"user_id": student_id}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return errors

@api_router.get("/teacher/students/{student_id}/sessions")
async def get_student_sessions(student_id: str, user=Depends(auth_dependency)):
    if user["role"] != "teacher":
        raise HTTPException(403, "Teachers only")
    sessions = await db.game_sessions.find({"user_id": student_id}, {"_id": 0}).sort("created_at", -1).to_list(50)
    return sessions

app.include_router(api_router)
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
