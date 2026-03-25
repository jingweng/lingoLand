import { useState, useEffect, useRef, useCallback } from 'react';
import { Volume2, SkipForward, RotateCcw, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { speak } from '@/lib/sounds';

const getSyllables = (word) => {
  if (!word) return [word || ""];
  const pattern = /[^aeiouy]*[aeiouy]+(?:[^aeiouy](?![aeiouy]))*/gi;
  let parts = word.match(pattern) || [word];
  if (parts.length < 2) return parts;
  const last = parts[parts.length - 1];
  if (/^[^aeiouy]+e[sd]?$/i.test(last) && !/^le$/i.test(last)) {
    const merged = parts.pop();
    parts[parts.length - 1] += merged;
  }
  return parts;
};

export default function LearnSpelling({ words, onFinish }) {
  const [index, setIndex] = useState(0);
  const [activeIdx, setActiveIdx] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [done, setDone] = useState(false);
  const timerRef = useRef(null);
  const cancelRef = useRef(false);

  const word = words[index]?.word || '';
  const syllables = getSyllables(word);
  const fontClass = word.length > 12 ? 'text-3xl' : 'text-5xl';

  const clearTimer = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    cancelRef.current = true;
    window.speechSynthesis?.cancel();
  }, []);

  const playSyllables = useCallback(() => {
    clearTimer();
    cancelRef.current = false;
    setActiveIdx(-1);
    setIsPlaying(true);

    let i = 0;
    // Speak full word first
    speak(word, 0.6);

    timerRef.current = setInterval(() => {
      if (cancelRef.current) { clearInterval(timerRef.current); timerRef.current = null; setIsPlaying(false); return; }
      if (i < syllables.length) {
        setActiveIdx(i);
        speak(syllables[i], 0.85);
        i++;
      } else {
        clearInterval(timerRef.current);
        timerRef.current = null;
        setActiveIdx(-1);
        setIsPlaying(false);
      }
    }, 1000);
  }, [word, syllables, clearTimer]);

  useEffect(() => {
    clearTimer();
    setActiveIdx(-1);
    setIsPlaying(false);
    const t = setTimeout(() => playSyllables(), 600);
    return () => { clearTimer(); clearTimeout(t); };
  }, [index]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleRepeat = () => {
    playSyllables();
  };

  const handlePass = () => {
    clearTimer();
    setActiveIdx(-1);
    setIsPlaying(false);
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

      {/* Syllable Display */}
      <div className="bg-white rounded-3xl border-4 border-[#A5D6A7] shadow-[8px_8px_0_#C8E6C9] p-8 text-center" data-testid="syllable-card">
        <div className={`flex justify-center items-baseline gap-1 flex-wrap mb-6 ${fontClass} font-black tracking-wide transition-all duration-300 whitespace-nowrap`}>
          {syllables.map((syl, i) => (
            <span
              key={i}
              data-testid={`syllable-${i}`}
              className={`transition-all duration-300 ${
                i === activeIdx
                  ? 'text-[#1B5E20] font-black scale-110 inline-block'
                  : 'text-gray-400'
              }`}
            >
              {syl}
            </span>
          )).reduce((acc, el, i) => {
            if (i > 0) acc.push(<span key={`sep-${i}`} className="text-gray-300 mx-1"> · </span>);
            acc.push(el);
            return acc;
          }, [])}
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
