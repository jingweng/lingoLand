import { useState, useEffect, useRef, useCallback } from 'react';
import { Volume2, SkipForward, RotateCcw, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { speak } from '@/lib/sounds';

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

export default function LearnSpelling({ words, onFinish }) {
  const [index, setIndex] = useState(0);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [done, setDone] = useState(false);
  const cancelRef = useRef(false);

  const word = words[index]?.word || '';

  const playSpelling = useCallback(async () => {
    if (isPlaying) return;
    cancelRef.current = false;
    setIsPlaying(true);
    setHighlightIndex(-1);

    // Read the whole word
    speak(word, 0.6);
    await sleep(1500);
    if (cancelRef.current) { setIsPlaying(false); return; }

    // Spell letter by letter
    for (let i = 0; i < word.length; i++) {
      if (cancelRef.current) break;
      setHighlightIndex(i);
      speak(word[i].toUpperCase(), 0.85);
      await sleep(700);
    }

    if (!cancelRef.current) {
      // Read the whole word again
      await sleep(500);
      speak(word, 0.7);
    }

    setIsPlaying(false);
  }, [word, isPlaying]);

  useEffect(() => {
    cancelRef.current = true;
    setHighlightIndex(-1);
    setIsPlaying(false);
    const timer = setTimeout(() => playSpelling(), 600);
    return () => { cancelRef.current = true; clearTimeout(timer); };
  }, [index]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleRepeat = () => {
    cancelRef.current = true;
    setTimeout(() => playSpelling(), 200);
  };

  const handlePass = () => {
    cancelRef.current = true;
    window.speechSynthesis?.cancel();
    if (index + 1 < words.length) {
      setIndex(prev => prev + 1);
    } else {
      setDone(true);
    }
  };

  if (done) {
    return (
      <div className="text-center py-12 animate-pop-in" data-testid="learn-spelling-done">
        <CheckCircle2 className="w-16 h-16 text-[#4CAF50] mx-auto mb-4" />
        <h2 className="text-3xl font-black text-[#1B5E20] mb-2">Great Learning!</h2>
        <p className="text-lg font-bold text-[#558B2F] mb-6">You practiced spelling {words.length} word{words.length !== 1 ? 's' : ''}!</p>
        <button onClick={onFinish} data-testid="finish-learn-spelling" className="forest-btn">
          <ArrowLeft className="w-5 h-5 inline mr-2" /> Back to Learn
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8" data-testid="learn-spelling">
      {/* Progress */}
      <div className="text-center">
        <p className="text-sm font-bold text-[#558B2F]">Word {index + 1} of {words.length}</p>
        <div className="flex justify-center gap-1.5 mt-2">
          {words.map((_, i) => (
            <div key={i} className={`progress-dot ${i === index ? 'active' : i < index ? 'completed' : ''}`} />
          ))}
        </div>
      </div>

      {/* Word Display */}
      <div className="bg-white rounded-3xl border-4 border-[#A5D6A7] shadow-[8px_8px_0_#C8E6C9] p-8 text-center">
        <div className="flex justify-center gap-2 sm:gap-3 flex-wrap mb-6">
          {word.split('').map((letter, i) => (
            <div
              key={i}
              data-testid={`spell-letter-${i}`}
              className={`w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center rounded-2xl text-2xl sm:text-3xl font-black uppercase transition-all duration-300 ${
                highlightIndex === i
                  ? 'bg-[#2E7D32] text-white border-4 border-[#1B5E20] scale-110 shadow-lg'
                  : highlightIndex > i
                  ? 'bg-[#C8E6C9] text-[#2E7D32] border-4 border-[#A5D6A7]'
                  : 'bg-[#F1F8E9] text-[#A5D6A7] border-4 border-[#C8E6C9]'
              }`}
            >
              {highlightIndex >= i ? letter : ''}
            </div>
          ))}
        </div>

        {isPlaying && (
          <div className="flex items-center justify-center gap-2 text-[#0288D1]">
            <Volume2 className="w-5 h-5 animate-pulse" />
            <span className="font-bold text-base">Listening...</span>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex justify-center gap-4">
        <button
          onClick={handleRepeat}
          data-testid="repeat-btn"
          className="flex items-center gap-2 px-8 py-4 rounded-full bg-[#0288D1] text-white font-bold text-lg shadow-[0_4px_0_#01579B] active:shadow-none active:translate-y-1 transition-all"
        >
          <RotateCcw className="w-5 h-5" /> Repeat
        </button>
        <button
          onClick={handlePass}
          data-testid="pass-btn"
          className="flex items-center gap-2 px-8 py-4 rounded-full bg-[#795548] text-white font-bold text-lg shadow-[0_4px_0_#5D4037] active:shadow-none active:translate-y-1 transition-all"
        >
          <SkipForward className="w-5 h-5" /> Pass
        </button>
      </div>
    </div>
  );
}
