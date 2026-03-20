import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { motion } from 'framer-motion';
import { Check, X, Loader2, Volume2, HelpCircle } from 'lucide-react';
import { playSuccess, playError, speak } from '@/lib/sounds';

export default function MeaningMatch({ word, onComplete }) {
  const [options, setOptions] = useState([]);
  const [correctIds, setCorrectIds] = useState(new Set());
  const [selected, setSelected] = useState(new Set());
  const [submitted, setSubmitted] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(true);
  const [revealed, setRevealed] = useState(false);
  const [points, setPoints] = useState(0);

  useEffect(() => {
    setLoading(true);
    setSelected(new Set());
    setSubmitted(false);
    setAttempt(0);
    setFeedback('');
    setRevealed(false);
    setPoints(0);

    api.post('/game/definitions', { word }).then(res => {
      const data = res.data;
      const defs = (data.definitions || []).map((d, i) => ({ id: `c${i}`, text: d, correct: true }));
      const dists = (data.distractors || []).map((d, i) => ({ id: `d${i}`, text: d, correct: false }));
      const all = [...defs, ...dists].sort(() => Math.random() - 0.5);
      setOptions(all);
      setCorrectIds(new Set(defs.map(d => d.id)));
      setLoading(false);
    }).catch(() => {
      setOptions([
        { id: 'c0', text: `A meaning of ${word}`, correct: true },
        { id: 'd0', text: 'A type of weather pattern', correct: false },
        { id: 'd1', text: 'A mathematical formula', correct: false },
        { id: 'c1', text: `Related to ${word}`, correct: true },
      ]);
      setCorrectIds(new Set(['c0', 'c1']));
      setLoading(false);
    });

    setTimeout(() => speak(word, 0.7), 300);
  }, [word]);

  const toggleOption = (id) => {
    if (submitted || revealed) return;
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const checkAnswer = () => {
    setSubmitted(true);
    const selectedArr = [...selected];
    const allCorrectSelected = [...correctIds].every(id => selected.has(id));
    const noWrongSelected = selectedArr.every(id => correctIds.has(id));

    if (allCorrectSelected && noWrongSelected) {
      playSuccess();
      const pts = correctIds.size * 5;
      setPoints(pts);
      setFeedback('Perfect! You got all the meanings!');
      setTimeout(() => onComplete(pts), 1500);
    } else if (noWrongSelected && !allCorrectSelected) {
      playSuccess();
      const pts = selectedArr.length * 3;
      setPoints(pts);
      setFeedback('You could earn more points! There are more correct meanings.');
      if (attempt >= 1) {
        setTimeout(() => onComplete(pts), 2000);
      } else {
        setAttempt(prev => prev + 1);
        setTimeout(() => { setSubmitted(false); setFeedback('Try to find all correct meanings!'); }, 2000);
      }
    } else {
      playError();
      const newPts = Math.max(0, points - 2);
      setPoints(newPts);
      if (attempt >= 1) {
        setFeedback('Let me show you the correct answers.');
        setRevealed(true);
        speak(`The correct meanings are shown. Let's move on.`, 0.8);
        setTimeout(() => onComplete(newPts), 3000);
      } else {
        setFeedback('Not quite! You lost 2 points. Try once more!');
        setAttempt(prev => prev + 1);
        setTimeout(() => { setSubmitted(false); setSelected(new Set()); }, 2000);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20" data-testid="meaning-loading">
        <Loader2 className="w-10 h-10 text-[#2E7D32] animate-spin" />
        <span className="ml-3 font-bold text-[#558B2F] text-lg">Loading definitions...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto" data-testid="meaning-match">
      {/* Word Display */}
      <div className="text-center">
        <div className="inline-flex items-center gap-3 bg-white rounded-3xl border-4 border-[#A5D6A7] shadow-[0_6px_0_#C8E6C9] px-8 py-4">
          <span className="text-4xl font-black text-[#1B5E20] uppercase tracking-wider">{word}</span>
          <button onClick={() => speak(word)} data-testid="hear-word-btn" className="p-2 rounded-full hover:bg-[#E8F5E9] transition-colors">
            <Volume2 className="w-6 h-6 text-[#2E7D32]" />
          </button>
        </div>
        <p className="text-base font-bold text-[#558B2F] mt-3 flex items-center justify-center gap-1">
          <HelpCircle className="w-4 h-4" /> Select ALL correct meanings (there may be more than one!)
        </p>
      </div>

      {/* Options */}
      <div className="space-y-3" data-testid="meaning-options">
        {options.map((opt, i) => {
          const isSelected = selected.has(opt.id);
          const showCorrect = revealed && opt.correct;
          const showWrong = submitted && isSelected && !opt.correct;
          const showRight = submitted && isSelected && opt.correct;

          return (
            <motion.button
              key={opt.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              onClick={() => toggleOption(opt.id)}
              data-testid={`option-${opt.id}`}
              className={`mcq-option w-full ${isSelected ? 'selected' : ''} ${showCorrect ? 'correct' : ''} ${showWrong ? 'wrong' : ''} ${showRight ? 'correct' : ''}`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-6 h-6 rounded-lg border-3 flex items-center justify-center transition-all ${
                  isSelected ? 'bg-[#2E7D32] border-[#2E7D32]' : 'border-[#A5D6A7]'
                } ${showCorrect ? 'bg-[#4CAF50] border-[#4CAF50]' : ''} ${showWrong ? 'bg-[#E57373] border-[#E57373]' : ''}`}>
                  {(isSelected || showCorrect) && <Check className="w-4 h-4 text-white" />}
                  {showWrong && <X className="w-4 h-4 text-white" />}
                </div>
                <span className="text-[#1B5E20]">{opt.text}</span>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Feedback */}
      {feedback && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-2xl text-center font-bold text-base ${
            feedback.includes('Perfect') || feedback.includes('more points')
              ? 'bg-[#C8E6C9] text-[#1B5E20]'
              : feedback.includes('Not quite') || feedback.includes('lost')
              ? 'bg-[#FFEBEE] text-[#D32F2F]'
              : 'bg-[#FFF9C4] text-[#F57F17]'
          }`}
          data-testid="meaning-feedback"
        >
          {feedback}
        </motion.div>
      )}

      {/* Submit */}
      {!revealed && (
        <div className="text-center">
          <button
            onClick={checkAnswer}
            disabled={selected.size === 0 || (submitted && !feedback.includes('Try'))}
            data-testid="check-meanings-btn"
            className="forest-btn text-lg disabled:opacity-40"
          >
            Check Answer (Attempt {attempt + 1}/2)
          </button>
        </div>
      )}

      {/* Points */}
      {points > 0 && (
        <div className="text-center">
          <span className="score-display animate-bounce-score">+{points} points</span>
        </div>
      )}
    </div>
  );
}
