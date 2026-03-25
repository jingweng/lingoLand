import { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import SpellingRain from '@/components/SpellingRain';
import MeaningMatch from '@/components/MeaningMatch';
import SentenceArchitect from '@/components/SentenceArchitect';
import { X, RotateCcw, BookOpen, Brain, PenTool, Trophy, Star, ArrowRight } from 'lucide-react';
import { playScore, playLevelUp } from '@/lib/sounds';
import confetti from 'canvas-confetti';

const LEVEL_META = {
  1: { title: 'Spelling Rain', icon: BookOpen, color: '#0288D1' },
  2: { title: 'Meaning Match', icon: Brain, color: '#7B1FA2' },
  3: { title: 'Sentence Architect', icon: PenTool, color: '#E65100' },
};

const ANIMALS = [
  { name: 'Happy Owl', url: 'https://images.pexels.com/photos/1345804/pexels-photo-1345804.jpeg?auto=compress&cs=tinysrgb&w=300' },
  { name: 'Dancing Fox', url: 'https://images.pexels.com/photos/2295744/pexels-photo-2295744.jpeg?auto=compress&cs=tinysrgb&w=300' },
  { name: 'Silly Raccoon', url: 'https://images.pexels.com/photos/3764442/pexels-photo-3764442.jpeg?auto=compress&cs=tinysrgb&w=300' },
  { name: 'Funny Panda', url: 'https://images.pexels.com/photos/3608263/pexels-photo-3608263.jpeg?auto=compress&cs=tinysrgb&w=300' },
];

export default function GamePlay() {
  const location = useLocation();
  const navigate = useNavigate();
  const gameWords = useMemo(() => location.state?.words || [], [location.state]);
  const selectedLevels = useMemo(() => new Set(location.state?.selectedLevels || [1, 2, 3]), [location.state]);

  const [wordIndex, setWordIndex] = useState(0);
  const [currentLevel, setCurrentLevel] = useState(null);
  const [totalScore, setTotalScore] = useState(0);
  const [scoreAnim, setScoreAnim] = useState(false);
  const [results, setResults] = useState([]);
  const [showReward, setShowReward] = useState(false);
  const [rewardAnimal, setRewardAnimal] = useState(null);
  const [danceTime, setDanceTime] = useState(3);
  const [gameComplete, setGameComplete] = useState(false);

  // Determine starting level for current word (respecting selectedLevels)
  const getStartLevel = useCallback((word) => {
    const natural = Math.min((word.level || 0) + 1, 3);
    // Find the first selected level >= natural level
    for (let l = natural; l <= 3; l++) {
      if (selectedLevels.has(l)) return l;
    }
    // If none found above natural, pick the lowest selected level
    const sorted = [...selectedLevels].sort((a, b) => a - b);
    return sorted[0] || 1;
  }, [selectedLevels]);

  useEffect(() => {
    if (gameWords.length === 0) { navigate('/play'); return; }
    setCurrentLevel(getStartLevel(gameWords[0]));
  }, [gameWords, navigate, getStartLevel]);

  const currentWord = gameWords[wordIndex];

  const addScore = (pts) => {
    setTotalScore(prev => prev + pts);
    setScoreAnim(true);
    playScore();
    setTimeout(() => setScoreAnim(false), 500);
  };

  const handleLevelComplete = async (points, extra) => {
    addScore(points);

    // Update word level in DB
    const newLevel = currentLevel;
    try {
      await api.put(`/words/${currentWord.id}/level`, { level: newLevel });
    } catch {}

    setResults(prev => [...prev, { word: currentWord.word, level: currentLevel, points, ...extra }]);

    // Show reward for Level 1
    if (currentLevel === 1 && extra?.actualTime) {
      const targetTime = currentWord.word.length;
      const bonusDance = Math.max(0, targetTime - extra.actualTime);
      setDanceTime(2 + bonusDance);
      setRewardAnimal(ANIMALS[Math.floor(Math.random() * ANIMALS.length)]);
      setShowReward(true);
      confetti({ particleCount: 100, spread: 80, origin: { y: 0.6 } });
      return;
    }

    advanceGame();
  };

  const advanceGame = () => {
    setShowReward(false);
    // Find next selected level above current
    let nextLevel = null;
    for (let l = currentLevel + 1; l <= 3; l++) {
      if (selectedLevels.has(l)) { nextLevel = l; break; }
    }
    if (nextLevel) {
      setCurrentLevel(nextLevel);
      playLevelUp();
    } else {
      // Move to next word
      if (wordIndex + 1 < gameWords.length) {
        const nextWord = gameWords[wordIndex + 1];
        setWordIndex(prev => prev + 1);
        setCurrentLevel(getStartLevel(nextWord));
      } else {
        finishGame();
      }
    }
  };

  const taskId = location.state?.taskId || null;
  const taskSchedule = location.state?.schedule || null;

  const finishGame = async () => {
    setGameComplete(true);
    confetti({ particleCount: 200, spread: 120, origin: { y: 0.5 } });
    try {
      await api.post('/game/session', {
        words_played: results,
        total_score: totalScore,
        levels_completed: [...new Set(results.map(r => r.level))],
      });
    } catch {}
    // Mark test day complete on task
    if (taskId && taskSchedule) {
      const nextTestDay = taskSchedule.find(d => d.type === 'test' && !d.completed);
      if (nextTestDay) {
        try { await api.post(`/tasks/${taskId}/day/${nextTestDay.day}/complete`); } catch {}
      }
    }
  };

  const handleGameOver = () => {
    // On game over in Spelling Rain, move to next word or finish
    setResults(prev => [...prev, { word: currentWord.word, level: currentLevel, points: 0, failed: true }]);
    if (wordIndex + 1 < gameWords.length) {
      const nextWord = gameWords[wordIndex + 1];
      setWordIndex(prev => prev + 1);
      setCurrentLevel(getStartLevel(nextWord));
    } else {
      finishGame();
    }
  };

  const restart = () => {
    setWordIndex(0);
    setCurrentLevel(getStartLevel(gameWords[0]));
    setTotalScore(0);
    setResults([]);
    setShowReward(false);
    setGameComplete(false);
  };

  if (!currentWord || !currentLevel) return null;

  // Game Complete Screen
  if (gameComplete) {
    const randomAnimal = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
    return (
      <div className="min-h-screen forest-bg flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl border-4 border-[#A5D6A7] shadow-[8px_8px_0_#C8E6C9] p-8 sm:p-12 max-w-lg w-full text-center animate-pop-in" data-testid="game-complete">
          <div className="w-24 h-24 rounded-full overflow-hidden mx-auto mb-4 border-4 border-[#FBC02D] shadow-lg animate-dance">
            <img src={randomAnimal.url} alt={randomAnimal.name} className="w-full h-full object-cover" />
          </div>
          <h1 className="text-4xl font-black text-[#1B5E20] mb-2">Amazing Job!</h1>
          <p className="text-lg font-bold text-[#558B2F] mb-6">You completed all the words!</p>
          <div className={`score-display text-5xl mb-6 ${scoreAnim ? 'animate-bounce-score' : ''}`} data-testid="final-score">
            <Trophy className="w-10 h-10 inline mr-2 text-[#FBC02D]" />
            {totalScore} points
          </div>
          <div className="space-y-2 mb-6 text-left">
            {results.map((r, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-[#F1F8E9]">
                <span className="font-bold text-[#1B5E20] capitalize">{r.word} (Lvl {r.level})</span>
                <span className={`font-black ${r.failed ? 'text-red-400' : 'text-[#2E7D32]'}`}>
                  {r.failed ? 'Retry' : `+${r.points}`}
                </span>
              </div>
            ))}
          </div>
          <div className="flex gap-3">
            <button onClick={restart} data-testid="play-again-btn" className="flex-1 wood-btn flex items-center justify-center gap-2">
              <RotateCcw className="w-4 h-4" /> Play Again
            </button>
            <button onClick={() => navigate('/dashboard')} data-testid="back-dashboard-btn" className="flex-1 forest-btn flex items-center justify-center gap-2">
              <ArrowRight className="w-4 h-4" /> Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  const meta = LEVEL_META[currentLevel];
  const LevelIcon = meta.icon;

  return (
    <div className="min-h-screen forest-bg" data-testid="game-play">
      {/* Top Bar */}
      <div className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b-4 border-[#A5D6A7] px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/dashboard')} data-testid="exit-game-btn" className="p-2 rounded-xl text-[#795548] hover:bg-red-50 hover:text-red-500 transition-colors">
              <X className="w-5 h-5" />
            </button>
            <button onClick={restart} data-testid="restart-game-btn" className="p-2 rounded-xl text-[#795548] hover:bg-[#E8F5E9] transition-colors">
              <RotateCcw className="w-5 h-5" />
            </button>
          </div>

          {/* Progress */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl" style={{ background: `${meta.color}15` }}>
              <LevelIcon className="w-4 h-4" style={{ color: meta.color }} />
              <span className="text-sm font-bold" style={{ color: meta.color }}>{meta.title}</span>
            </div>
            <div className="flex gap-1.5">
              {gameWords.map((_, i) => (
                <div key={i} className={`progress-dot ${i === wordIndex ? 'active' : i < wordIndex ? 'completed' : ''}`} />
              ))}
            </div>
          </div>

          <div className={`score-display ${scoreAnim ? 'animate-bounce-score' : ''}`} data-testid="game-score">
            <Star className="w-5 h-5 inline mr-1" /> {totalScore}
          </div>
        </div>
      </div>

      {/* Game Area */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="text-center mb-6">
          <p className="text-sm font-bold text-[#558B2F]">Word {wordIndex + 1} of {gameWords.length}</p>
        </div>

        {currentLevel === 1 && (
          <SpellingRain word={currentWord.word} onComplete={handleLevelComplete} onGameOver={handleGameOver} />
        )}
        {currentLevel === 2 && (
          <MeaningMatch word={currentWord.word} onComplete={handleLevelComplete} />
        )}
        {currentLevel === 3 && (
          <SentenceArchitect word={currentWord.word} onComplete={handleLevelComplete} />
        )}
      </div>

      {/* Reward Overlay */}
      {showReward && (
        <div className="game-overlay" data-testid="reward-overlay">
          <div className="game-overlay-card animate-pop-in">
            <div className="w-32 h-32 rounded-full overflow-hidden mx-auto mb-4 border-4 border-[#FBC02D] shadow-lg animate-dance" style={{ animationDuration: `${danceTime}s` }}>
              <img src={rewardAnimal?.url} alt={rewardAnimal?.name} className="w-full h-full object-cover" />
            </div>
            <h2 className="text-3xl font-black text-[#1B5E20] mb-1">Great Spelling!</h2>
            <p className="text-lg font-bold text-[#558B2F] mb-4">{rewardAnimal?.name} is doing a happy dance!</p>
            <button onClick={advanceGame} data-testid="continue-btn" className="forest-btn">
              Continue <ArrowRight className="w-5 h-5 inline ml-1" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
