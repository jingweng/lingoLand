# Lingo Land (formerly Jason's Spelling Quest) - PRD

## Problem Statement
K-6 Educational Spelling & Vocabulary Game with "Friendly Forest" theme.

## Architecture
- **Frontend**: React + Tailwind CSS + shadcn/ui + Framer Motion
- **Backend**: FastAPI + MongoDB
- **AI**: OpenAI GPT-5.2 via Emergent LLM key
- **TTS**: Browser Web Speech API
- **Auth**: JWT-based (student/teacher roles)

## What's Been Implemented (March 2026)
### Iteration 1 - Core MVP
- Full JWT auth (student/teacher), Word Bank CRUD + import (PDF/TXT/URL)
- 3-level game: Spelling Rain, Meaning Match, Sentence Architect
- Teacher dashboard, score tracking, confetti rewards

### Iteration 2 - Learn, Scheduler, Scoring Updates
- Renamed app to "Lingo Land", nav "Play" → "Test"
- Added "Learn" section: Spelling (TTS + letter-by-letter) and Meaning (3 defs + sentences)
- Word Bank: sorting (A-Z, Level, Date), multi-select checkboxes, "Generate Weekly Task"
- Level 3 new scoring: 10pts correct usage w/ complexity, 0pts incorrect, -1 per grammar error (41 rules)
- Scheduler: 3 days Learning + 2 days Testing weekly task system
- Dashboard weekly task widget with day progress

## Backlog
- P1: Allow user to select which levels to play in Test mode (was requested earlier)
- P1: Mark task days as complete when learn/test sessions finish
- P2: Phaser.js game canvas upgrade
- P2: Student leaderboard
- P2: Export progress reports as PDF
