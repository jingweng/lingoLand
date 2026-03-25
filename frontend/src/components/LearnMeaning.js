import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import { SkipForward, ArrowLeft, Loader2, Volume2, CheckCircle2, BookOpen } from 'lucide-react';
import { speak } from '@/lib/sounds';
import { motion } from 'framer-motion';

export default function LearnMeaning({ words, onFinish }) {
  const [index, setIndex] = useState(0);
  const [meanings, setMeanings] = useState(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const word = words[index]?.word || '';

  const fetchMeanings = useCallback(async () => {
    setLoading(true);
    setMeanings(null);
    try {
      const res = await api.post('/learn/meanings', { word });
      setMeanings(res.data.meanings || []);
    } catch {
      setMeanings([
        { definition: `A common meaning of ${word}`, sentence: `I use ${word} every day.` },
        { definition: `Another way to understand ${word}`, sentence: `The teacher explained ${word} to us.` },
        { definition: `A related meaning of ${word}`, sentence: `We learned about ${word} in class.` },
      ]);
    }
    setLoading(false);
  }, [word]);

  useEffect(() => {
    if (word) fetchMeanings();
  }, [word, fetchMeanings]);

  useEffect(() => {
    if (word) setTimeout(() => speak(word, 0.7), 300);
  }, [word]);

  const handlePass = () => {
    window.speechSynthesis?.cancel();
    if (index + 1 < words.length) {
      setIndex(prev => prev + 1);
    } else {
      setDone(true);
    }
  };

  if (done) {
    return (
      <div className="text-center py-12 animate-pop-in" data-testid="learn-meaning-done">
        <CheckCircle2 className="w-16 h-16 text-[#4CAF50] mx-auto mb-4" />
        <h2 className="text-3xl font-black text-[#1B5E20] mb-2">Great Learning!</h2>
        <p className="text-lg font-bold text-[#558B2F] mb-6">You learned meanings for {words.length} word{words.length !== 1 ? 's' : ''}!</p>
        <button onClick={onFinish} data-testid="finish-learn-meaning" className="forest-btn">
          <ArrowLeft className="w-5 h-5 inline mr-2" /> Back to Learn
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6" data-testid="learn-meaning">
      {/* Progress */}
      <div className="text-center">
        <p className="text-sm font-bold text-[#558B2F]">Word {index + 1} of {words.length}</p>
        <div className="flex justify-center gap-1.5 mt-2">
          {words.map((_, i) => (
            <div key={i} className={`progress-dot ${i === index ? 'active' : i < index ? 'completed' : ''}`} />
          ))}
        </div>
      </div>

      {/* Word */}
      <div className="text-center">
        <div className="inline-flex items-center gap-3 bg-white rounded-3xl border-4 border-[#A5D6A7] shadow-[0_6px_0_#C8E6C9] px-8 py-4">
          <span className="text-4xl font-black text-[#1B5E20] uppercase tracking-wider">{word}</span>
          <button onClick={() => speak(word)} data-testid="hear-learn-word" className="p-2 rounded-full hover:bg-[#E8F5E9]">
            <Volume2 className="w-6 h-6 text-[#2E7D32]" />
          </button>
        </div>
      </div>

      {/* Definitions */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-[#2E7D32] animate-spin" />
          <span className="ml-3 font-bold text-[#558B2F]">Loading definitions...</span>
        </div>
      ) : (
        <div className="space-y-4" data-testid="meaning-definitions">
          {meanings?.map((m, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.15 }}
              className="bg-white rounded-3xl border-4 border-[#C8E6C9] p-5"
              data-testid={`definition-${i}`}
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-[#7B1FA2]/10 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="font-black text-[#7B1FA2] text-sm">{i + 1}</span>
                </div>
                <div>
                  <p className="font-bold text-lg text-[#1B5E20]">{m.definition}</p>
                  <div className="mt-2 pl-3 border-l-4 border-[#A5D6A7]">
                    <p className="text-base font-bold text-[#558B2F] italic">"{m.sentence}"</p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Pass */}
      <div className="text-center">
        <button
          onClick={handlePass}
          data-testid="pass-meaning-btn"
          className="flex items-center gap-2 px-8 py-4 rounded-full bg-[#795548] text-white font-bold text-lg shadow-[0_4px_0_#5D4037] active:shadow-none active:translate-y-1 transition-all mx-auto"
        >
          <SkipForward className="w-5 h-5" /> {index + 1 < words.length ? 'Next Word' : 'Finish'}
        </button>
      </div>
    </div>
  );
}
