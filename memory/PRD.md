# Lingo Land - Product Requirements Document

## Original Problem Statement
K-6 Educational Spelling & Vocabulary Game ("Jason's Spelling Quest", renamed to "Lingo Land"). Forest-themed UI with React frontend, FastAPI backend, MongoDB. Supports Student and Teacher roles with word mastery tracking (levels 0-3), game levels (Spelling Rain, Meaning Match, Sentence Architect), word ingestion from PDF/TXT/URL, and progress tracking.

## Architecture
- **Frontend**: React + Tailwind CSS, lucide-react icons, framer-motion animations, canvas-confetti
- **Backend**: FastAPI + MongoDB (motor async driver), JWT auth, bcrypt passwords
- **AI**: OpenAI GPT-5.2 via emergentintegrations (Emergent LLM Key) for definitions & grammar
- **TTS**: Web Speech API (browser-native)

## Implemented Features (as of 2026-03-25)
- [x] Full JWT authentication (register/login/protected routes)
- [x] Minimalist Student Dashboard: Today's Activity + Weekly Task timeline only
- [x] "Progress: X/5 Days Complete" on Weekly Task widget
- [x] "No Active Task" prompt directing to Word Bank
- [x] Oxford Syllable Engine with Suffix-Merge silent-e logic (stalactites→sta·lac·tites)
- [x] Syllable Highlighter with TTS sync, Repeat/Pass controls, dynamic font
- [x] Word Bank with compact '+' icon header, Shift+Click range selection, import
- [x] Learn section with Spelling (syllable highlighter) and Meaning modes
- [x] Test section with 3 game levels + pre-game level selection (1/2/3 combo)
- [x] My Tasks page with progress bars, rename, weekly task generation
- [x] Auto activity logging on game session save
- [x] Teacher endpoints for viewing student progress

## Prioritized Backlog
### P1
- Auto activity logging for learn sessions (not just game)
- Auto-mark task days as complete when sessions finish

### P2
- Teacher Dashboard full buildout
- Phaser.js gameplay migration

### P3
- Refactoring: break server.py into routes/models/services
