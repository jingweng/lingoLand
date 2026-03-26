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
- [x] Minimalist Student Dashboard: Today's Activity + Weekly Task timeline
- [x] "Progress: X/5 Days Complete" on Weekly Task widget
- [x] Task-based navigation: Learn/Test buttons bypass word selection with task words
- [x] Session-end auto-marks task day complete (learn or test)
- [x] Oxford Syllable Engine with Consonant-le rule (bot·tle, pud·dle) + Suffix-Merge (sta·lac·tites)
- [x] Syllable Highlighter with TTS sync, Repeat/Pass controls, dynamic font
- [x] Word Bank with compact '+' icon, Shift+Click, Z-A sort, Camera OCR (MOCKED)
- [x] Import modal with Text, File, URL, and Camera tabs
- [x] Learn section with Spelling (syllable highlighter) and Meaning modes
- [x] Test section with 3 game levels + pre-game level selection (1/2/3 combo)
- [x] PreGame with Shift+Click range selection, Sort (A-Z, Z-A, Level)
- [x] My Tasks page with progress bars, rename, weekly task generation
- [x] Auto activity logging on game session save

## Mocked Features
- Camera OCR: Adds 'excavate', 'stalactites', 'geology' regardless of image input

## Prioritized Backlog
### P1
- Real Camera OCR integration (replace mock with actual image-to-text)
- Auto activity logging for learn sessions (not just game)

### P2
- Teacher Dashboard full buildout
- Phaser.js gameplay migration

### P3
- Refactoring: break server.py into routes/models/services
