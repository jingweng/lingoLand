import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, AlertTriangle } from 'lucide-react';
import { playSuccess, playError, playClick, speak } from '@/lib/sounds';

export default function SpellingRain({ word, onComplete, onGameOver }) {
  const [letters, setLetters] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [spelledLetters, setSpelledLetters] = useState([]);
  const [gameOver, setGameOver] = useState(false);
  const [wrongId, setWrongId] = useState(null);
  const startRef = useRef(null);
  const spokenRef = useRef(false);

  const generateLetters = useCallback((w) => {
    const wordChars = w.toLowerCase().split('');
    const pool = [...wordChars];
    const alpha = 'abcdefghijklmnopqrstuvwxyz';
    while (pool.length < 10) {
      pool.push(alpha[Math.floor(Math.random() * 26)]);
    }
    // Shuffle
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    return pool.map((letter, idx) => ({
      id: idx,
      letter,
      x: 10 + (idx % 5) * 18,
      y: 15 + Math.floor(idx / 5) * 35,
      used: false,
    }));
  }, []);

  useEffect(() => {
    setLetters(generateLetters(word));
    setCurrentIndex(0);
    setSpelledLetters([]);
    setGameOver(false);
    setWrongId(null);
    startRef.current = Date.now();
    spokenRef.current = false;
  }, [word, generateLetters]);

  useEffect(() => {
    if (!spokenRef.current) {
      spokenRef.current = true;
      const timer = setTimeout(() => speak(word, 0.6), 500);
      return () => clearTimeout(timer);
    }
  }, [word]);

  const handleLetterClick = (letterObj) => {
    if (letterObj.used || gameOver) return;
    playClick();

    const target = word.toLowerCase()[currentIndex];
    if (letterObj.letter === target) {
      playSuccess();
      setLetters(prev => prev.map(l => l.id === letterObj.id ? { ...l, used: true } : l));
      setSpelledLetters(prev => [...prev, letterObj.letter]);

      if (currentIndex + 1 === word.length) {
        const actualTime = (Date.now() - startRef.current) / 1000;
        const targetTime = word.length;
        setTimeout(() => onComplete(10, { actualTime, targetTime }), 600);
      } else {
        setCurrentIndex(prev => prev + 1);
      }
    } else {
      playError();
      setWrongId(letterObj.id);
      setGameOver(true);
      setTimeout(() => onGameOver(), 2000);
    }
  };

  const repeatWord = () => speak(word, 0.6);

  return (
    <div className="space-y-6" data-testid="spelling-rain">
      {/* Listen Button */}
      <div className="text-center">
        <button
          onClick={repeatWord}
          data-testid="listen-word-btn"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#0288D1] text-white font-bold text-lg shadow-[0_4px_0_#01579B] active:shadow-none active:translate-y-1 transition-all"
        >
          <Volume2 className="w-5 h-5" /> Listen Again
        </button>
      </div>

      {/* Spell Bar */}
      <div className="spell-bar mx-auto max-w-md" data-testid="spell-bar">
        {word.split('').map((char, i) => (
          <div key={i} className={`spell-bar-letter ${i < spelledLetters.length ? 'filled animate-pop-in' : ''}`}>
            {i < spelledLetters.length ? spelledLetters[i].toUpperCase() : ''}
          </div>
        ))}
      </div>

      {/* Letter Pool */}
      <div className="spelling-rain-area p-6 sm:p-8" data-testid="letter-pool">
        <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
          <AnimatePresence>
            {letters.map((l) => (
              <motion.button
                key={l.id}
                initial={{ scale: 0, opacity: 0 }}
                animate={{
                  scale: l.used ? 0 : 1,
                  opacity: l.used ? 0 : 1,
                  y: l.used ? -50 : [0, -6, 0],
                }}
                transition={{
                  y: { repeat: Infinity, duration: 2 + l.id * 0.3, ease: "easeInOut" },
                  scale: { duration: 0.3 },
                }}
                exit={{ scale: 0, opacity: 0 }}
                onClick={() => handleLetterClick(l)}
                disabled={l.used || gameOver}
                data-testid={`letter-${l.id}`}
                className={`letter-bubble ${l.used ? 'correct' : ''} ${wrongId === l.id ? 'wrong animate-wiggle' : ''}`}
              >
                {l.letter.toUpperCase()}
              </motion.button>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Game Over Overlay */}
      {gameOver && (
        <div className="game-overlay" data-testid="game-over-overlay">
          <div className="game-overlay-card animate-pop-in">
            <AlertTriangle className="w-16 h-16 text-[#FBC02D] mx-auto mb-4" />
            <h2 className="text-3xl font-black text-[#1B5E20] mb-2">Oops!</h2>
            <p className="text-lg font-bold text-[#558B2F] mb-2">
              The word was: <span className="text-[#2E7D32] uppercase tracking-wider">{word}</span>
            </p>
            <p className="text-base font-bold text-[#8D6E63]">Moving to the next word...</p>
          </div>
        </div>
      )}
    </div>
  );
}
