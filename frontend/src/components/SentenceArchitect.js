import { useState } from 'react';
import api from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Loader2, Volume2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { playSuccess, playError, speak } from '@/lib/sounds';

export default function SentenceArchitect({ word, onComplete }) {
  const [sentence, setSentence] = useState('');
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState(null);

  const handleSubmit = async () => {
    if (!sentence.trim() || checking) return;
    setChecking(true);
    try {
      const res = await api.post('/game/check-grammar', { sentence: sentence.trim(), target_word: word });
      setResult(res.data);
      const total = res.data.score_breakdown?.total || 0;
      if (res.data.grammar_errors?.length === 0 && res.data.spelling_errors?.length === 0) {
        playSuccess();
      } else {
        playError();
      }
      setTimeout(() => onComplete(Math.max(0, total)), 4000);
    } catch {
      playError();
      const uses = sentence.toLowerCase().includes(word.toLowerCase());
      const pts = uses ? 10 : 0;
      setResult({ uses_target_word: uses, correct_usage: uses, word_count: sentence.split(' ').length, spelling_errors: [], grammar_errors: [], score_breakdown: { usage_points: pts, grammar_penalty: 0, total: pts } });
      setTimeout(() => onComplete(pts), 3000);
    }
    setChecking(false);
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto" data-testid="sentence-architect">
      {/* Word */}
      <div className="text-center">
        <div className="inline-flex items-center gap-3 bg-white rounded-3xl border-4 border-[#A5D6A7] shadow-[0_6px_0_#C8E6C9] px-8 py-4">
          <span className="text-4xl font-black text-[#1B5E20] uppercase tracking-wider">{word}</span>
          <button onClick={() => speak(word)} data-testid="hear-word-btn-sa" className="p-2 rounded-full hover:bg-[#E8F5E9]">
            <Volume2 className="w-6 h-6 text-[#2E7D32]" />
          </button>
        </div>
        <p className="text-base font-bold text-[#558B2F] mt-3">Write a sentence using this word with correct grammar!</p>
        <p className="text-sm font-bold text-[#8D6E63] mt-1">10pts for correct usage with complexity, -1pt per grammar error</p>
      </div>

      {/* Input */}
      {!result && (
        <div className="bg-white rounded-3xl border-4 border-[#A5D6A7] shadow-[8px_8px_0_#C8E6C9] p-6">
          <textarea
            value={sentence}
            onChange={e => setSentence(e.target.value)}
            placeholder={`Write a sentence using "${word}"...`}
            data-testid="sentence-input"
            rows={4}
            className="w-full bg-[#F1F8E9] border-4 border-[#C8E6C9] rounded-2xl px-4 py-3 text-xl font-bold text-[#1B5E20] placeholder:text-[#A5D6A7]/70 focus:outline-none focus:border-[#2E7D32] transition-all resize-none"
          />
          <div className="flex items-center justify-between mt-4">
            <span className="text-sm font-bold text-[#558B2F]">
              {sentence.trim().split(/\s+/).filter(Boolean).length} words
            </span>
            <button
              onClick={handleSubmit}
              disabled={!sentence.trim() || checking}
              data-testid="submit-sentence-btn"
              className="forest-btn flex items-center gap-2 disabled:opacity-40"
            >
              {checking ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              {checking ? 'Checking...' : 'Check My Sentence'}
            </button>
          </div>
        </div>
      )}

      {/* Results */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
            data-testid="grammar-results"
          >
            {/* Score */}
            <div className="bg-white rounded-3xl border-4 border-[#A5D6A7] p-6 text-center">
              <div className="score-display text-4xl animate-bounce-score mb-2" data-testid="sentence-score">
                {result.score_breakdown?.total || 0} points
              </div>
              <div className="flex flex-wrap justify-center gap-3 text-sm font-bold">
                {result.correct_usage ? (
                  <span className="px-3 py-1 rounded-full bg-[#C8E6C9] text-[#2E7D32]">Correct Usage +{result.score_breakdown?.usage_points}</span>
                ) : result.uses_target_word ? (
                  <span className="px-3 py-1 rounded-full bg-[#FFF9C4] text-[#F57F17]">Word Used (needs complexity) +0</span>
                ) : (
                  <span className="px-3 py-1 rounded-full bg-[#FFEBEE] text-[#D32F2F]">Word Not Used +0</span>
                )}
                {result.score_breakdown?.grammar_penalty > 0 && (
                  <span className="px-3 py-1 rounded-full bg-[#FFEBEE] text-[#D32F2F]">Errors -{result.score_breakdown.grammar_penalty}</span>
                )}
              </div>
            </div>

            {/* Errors */}
            {result.spelling_errors?.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-black text-[#D32F2F] flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" /> Spelling Tips
                </h3>
                {result.spelling_errors.map((err, i) => (
                  <div key={i} className="grammar-error" data-testid={`spelling-error-${i}`}>
                    <p className="font-bold text-[#D32F2F]">
                      <span className="line-through">{err.word}</span> → <span className="text-[#2E7D32]">{err.correction}</span>
                    </p>
                    <p className="text-sm font-bold text-[#795548] mt-1">{err.message}</p>
                  </div>
                ))}
              </div>
            )}

            {result.grammar_errors?.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-black text-[#E65100] flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" /> Grammar Tips
                </h3>
                {result.grammar_errors.map((err, i) => (
                  <div key={i} className="grammar-error" data-testid={`grammar-error-${i}`}>
                    <p className="font-bold text-[#E65100]">{err.type}: {err.detail}</p>
                    <p className="text-sm font-bold text-[#795548] mt-1">{err.message}</p>
                  </div>
                ))}
              </div>
            )}

            {result.spelling_errors?.length === 0 && result.grammar_errors?.length === 0 && (
              <div className="grammar-success flex items-center gap-3" data-testid="no-errors">
                <CheckCircle2 className="w-6 h-6 text-[#4CAF50]" />
                <p className="font-bold text-[#2E7D32]">Excellent! No errors found. Great grammar!</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
