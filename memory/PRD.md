# Jason's Spelling Quest - PRD

## Problem Statement
K-6 Educational Spelling & Vocabulary Game with "Friendly Forest" theme. Students practice spelling, vocabulary, and grammar through 3-level gameplay. Teachers can monitor student progress.

## Architecture
- **Frontend**: React + Tailwind CSS + shadcn/ui + Framer Motion
- **Backend**: FastAPI + MongoDB
- **AI**: OpenAI GPT-5.2 via Emergent LLM key (grammar checking + definitions)
- **TTS**: Browser Web Speech API
- **Auth**: JWT-based (student/teacher roles)

## Core Requirements
- Student/Teacher account system with JWT auth
- Word bank CRUD + import from PDF/TXT/URL
- Level 1: Spelling Rain (letter clicking dictation game)
- Level 2: Meaning Match (MCQ vocabulary with multi-select)
- Level 3: Sentence Architect (grammar checking with AI)
- Mastery tracking (Level 0-3 per word)
- Teacher dashboard with mastery tables + error logs
- Sound effects + animations + confetti rewards

## What's Been Implemented (March 2026)
- Full backend API: auth, words CRUD, import, game endpoints, teacher endpoints
- Auth page with forest green theme
- Student dashboard with stats + recent games
- Word bank with search, filter, add, delete, import (text/file/URL)
- Pre-game word selection with level goals
- Spelling Rain game (Level 1) with floating letters + TTS
- Meaning Match game (Level 2) with AI-generated definitions
- Sentence Architect game (Level 3) with AI grammar checking
- Game complete screen with confetti + animal rewards
- Teacher dashboard with student mastery tables + error logs
- Score animations + sound effects

## Testing Results
- Backend: 90%+ (all CRUD, auth, game APIs working)
- Frontend: 100% (all major flows working)

## Prioritized Backlog
- P0: All core features implemented
- P1: URL import could be enhanced with better word filtering
- P1: Add more animal images for rewards variety
- P2: Phaser.js game canvas (currently using React + Framer Motion)
- P2: Student-to-student leaderboard
- P2: Word pronunciation audio recordings
- P2: Export progress reports as PDF
