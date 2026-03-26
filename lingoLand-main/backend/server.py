from fastapi import FastAPI, UploadFile, File, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uuid, re, urllib.request, urllib.parse, json, ssl
from pydantic import BaseModel
from typing import List

# ==========================================
# 🔑 DICTIONARY API KEY
# ==========================================
MW_API_KEY = "ff3c4d1f-0c45-48ff-9374-b1d96bb87524"

class FakeDB:
    def __init__(self):
        self.words = []
db = FakeDB()

def get_top_3_meanings(word: str) -> list:
    try:
        ctx = ssl.create_default_context()
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE
        safe_word = urllib.parse.quote(word.lower())
        url = f"https://www.dictionaryapi.com/api/v3/references/sd3/json/{safe_word}?key={MW_API_KEY}"
        with urllib.request.urlopen(url, context=ctx) as response:
            data = json.loads(response.read().decode())
            if len(data) > 0 and isinstance(data[0], dict) and "shortdef" in data[0]:
                return data[0]["shortdef"][:3]
            return ["No exact definition found in dictionary."]
    except Exception:
        return ["Dictionary connection failed."]

app = FastAPI()

# BULLETPROOF CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Catch-all to stop the red OPTIONS errors
@app.options("/{path:path}")
async def options_handler(request: Request, path: str):
    return JSONResponse(content="OK", headers={
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "*",
        "Access-Control-Allow-Headers": "*",
    })

class UserLogin(BaseModel):
    email: str
    password: str

class WordsAdd(BaseModel):
    words: List[str]

class TextImport(BaseModel):
    text: str

class SentenceCheck(BaseModel):
    sentence: str
    target_word: str

# --- ROUTES ---
@app.post("/activity/log")
@app.post("/api/activity/log")
async def log_activity(request: Request):
    return {"status": "logged"}

@app.post("/auth/register")
@app.post("/api/auth/register")
async def register(data: UserLogin):
    return {"token": "local-token", "user": {"id": "1", "username": "Lulu"}}

@app.post("/auth/login")
@app.post("/api/auth/login")
async def login(data: UserLogin):
    return {"token": "local-token", "user": {"id": "1", "username": "Lulu"}}

@app.get("/auth/me")
@app.get("/api/auth/me")
async def get_me():
    return {"id": "1", "username": "Lulu", "role": "student"}

@app.get("/words")
@app.get("/api/words")
async def get_words():
    return db.words

@app.post("/words")
@app.post("/api/words")
async def add_words(data: WordsAdd):
    new_entries = []
    for w in data.words:
        doc = {"id": str(uuid.uuid4()), "word": w.lower(), "level": 0, "meanings": get_top_3_meanings(w)}
        db.words.append(doc)
        new_entries.append(doc)
    return {"added": new_entries}

@app.post("/words/import/text")
@app.post("/api/words/import/text")
async def import_text(data: TextImport):
    found = re.findall(r'\b[a-zA-Z]{3,}\b', data.text.lower())
    new_words = []
    for w in list(set(found))[:50]:
        doc = {"id": str(uuid.uuid4()), "word": w.lower(), "level": 0, "meanings": get_top_3_meanings(w)}
        db.words.append(doc)
        new_words.append(doc)
    return {"added": new_words}

@app.post("/words/import/file")
@app.post("/api/words/import/file")
async def import_file(file: UploadFile = File(...)):
    content = await file.read()
    text = content.decode('utf-8', errors='ignore')
    found = re.findall(r'\b[a-zA-Z]{3,}\b', text.lower())
    new_words = []
    for w in list(set(found))[:50]:
        doc = {"id": str(uuid.uuid4()), "word": w.lower(), "level": 0, "meanings": get_top_3_meanings(w)}
        db.words.append(doc)
        new_words.append(doc)
    return {"added": new_words}

@app.post("/game/check-grammar")
@app.post("/api/game/check-grammar")
async def check_grammar(data: SentenceCheck):
    s = data.sentence.strip()
    errors = []
    if len(s) > 0 and not s[0].isupper():
        errors.append({"type": "Grammar", "message": "Start with a capital letter!"})
    if len(s) > 0 and s[-1] not in ".!?":
        errors.append({"type": "Grammar", "message": "Add a period at the end!"})
    found = data.target_word.lower() in s.lower()
    return {"uses_target_word": found, "grammar_errors": errors, "score_breakdown": {"total": 10 if (found and not errors) else 0}}

if __name__ == "__main__":
    import uvicorn