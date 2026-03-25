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
- [x] Student Dashboard with daily stats, weekly goal, mastery progress
- [x] Word Bank with CRUD, sorting, multi-select, Shift+Click range selection
- [x] Word import from text, file (PDF/TXT), and URL
- [x] Learn section with Spelling (syllable highlighter + TTS) and Meaning modes
- [x] Test section with 3 game levels (Spelling Rain, Meaning Match, Sentence Architect)
- [x] Pre-game level selection (choose Level 1, 2, 3 or any combo)
- [x] My Tasks page with progress bars, rename, weekly task generation
- [x] Auto activity logging on game session save
- [x] Teacher endpoints for viewing student progress

## Prioritized Backlog
### P1
- Automatic backend activity logging for learn sessions (not just game)
- Auto-mark task days as complete when sessions finish

### P2
- Teacher Dashboard full buildout
- Phaser.js gameplay migration

### P3
- Refactoring: break server.py into routes/models/services
- Refactoring: break StudentDashboard.js into smaller components
