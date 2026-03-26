import { useState, useEffect } from "react";
import api from "@/lib/api";
import { motion } from "framer-motion";
import { Check, X, Loader2, Volume2, HelpCircle } from "lucide-react";
import { playSuccess, playError, speak } from "@/lib/sounds";

export default function MeaningMatch({ word, onComplete }) {
  const [options, setOptions] = useState([]);
  const [correctIds, setCorrectIds] = useState(new Set());
  const [selected, setSelected] = useState(new Set());
  const [submitted, setSubmitted] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(true);
  const [revealed, setRevealed] = useState(false);
  const [points, setPoints] = useState(0);

  useEffect(() => {
    setLoading(true);
    setSelected(new Set());
    setSubmitted(false);
    setAttempt(0);
    setFeedback("");
    setRevealed(false);
    setPoints(0);

    api.get("/words")
      .then((res) => {
        const allWords = res.data || [];
        const targetWordObj = allWords.find(
          (w) => w.word.toLowerCase() === word.toLowerCase()
        );

        let correctMeanings = [];
        if (targetWordObj && targetWordObj.meanings && targetWordObj.meanings.length > 0) {
          correctMeanings = targetWordObj.meanings;
        } else {
          correctMeanings = ["Definition missing. Please delete and re-add this word."];
        }

        let trickMeanings = [];
        allWords.forEach((w) => {
          if (w.word.toLowerCase() !== word.toLowerCase() && w.meanings) {
            trickMeanings.push(...w.meanings);
          }
        });

        trickMeanings = trickMeanings.sort(() => 0.5 - Math.random()).slice(0, 3);

        if (trickMeanings.length === 0) {
          trickMeanings = [
            "A type of weather pattern producing heavy rain",
            "A mathematical formula used to find the area",
            "An instrument used for viewing distant objects"
          ];
        }

        const defs = correctMeanings.map((d, i) => ({ id: `c${i}`, text: d, correct: true }));
        const dists = trickMeanings.map((d, i) => ({ id: `d${i}`, text: d, correct: false }));

        const allOptions = [...defs, ...dists].sort(() => Math.random() - 0.5);

        setOptions(allOptions);
        setCorrectIds(new Set(defs.map((d) => d.id)));
        setLoading(false);
      })
      .catch(() => {
        setFeedback("Failed to load meanings.");
        setLoading(false);
      });

    setTimeout(() => speak(word, 0.7), 300);
  }, [word]);

  const toggleOption = (id) => {
    if (submitted || revealed) return;
    setSelected((prev) => {
      const nextSet = new Set(prev);
      if (nextSet.has(id)) {
        nextSet.delete(id);
      } else {
        nextSet.add(id);
      }
      return nextSet;
    });
  };

  const checkAnswer = () => {
    setSubmitted(true);
    const selectedArr = [...selected];
    const allCorrectSelected = [...correctIds].every((id) => selected.has(id));
    const noWrongSelected = selectedArr.every((id) => correctIds.has(id));

    if (allCorrectSelected && noWrongSelected) {
      playSuccess();
      const pts = correctIds.size * 5;
      setPoints(pts);
      setFeedback("Perfect! You identified the true meanings!");
      setTimeout(() => onComplete(pts), 1500);
    } else if (noWrongSelected && !allCorrectSelected) {
      playSuccess();
      const pts = selectedArr.length * 3;
      setPoints(pts);
      setFeedback("Good, but there are more! Find all correct meanings.");
      if (attempt >= 1) {
        setTimeout(() => onComplete(pts), 2000);
      } else {
        setAttempt((prev) => prev + 1);
        setTimeout(() => {
          setSubmitted(false);
          setFeedback("Try to find the remaining correct meanings!");
        }, 2000);
      }
    } else {
      playError();
      const newPts = Math.max(0, points - 2);
      setPoints(newPts);
      if (attempt >= 1) {
        setFeedback("Let me show you the correct dictionary answers.");
        setRevealed(true);
        speak("The correct meanings are shown. Let's move on.", 0.8);
        setTimeout(() => onComplete(newPts), 4000);
      } else {
        setFeedback("Not quite! You selected a trick answer. Try once more!");
        setAttempt((prev) => prev + 1);
        setTimeout(() => {
          setSubmitted(false);
          setSelected(new Set());
        }, 2000);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-10 h-10 text-[#2E7D32] animate-spin" />
        <span className="ml-3 font-bold text-[#558B2F] text-lg">
          Loading dictionary...
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="text-center">
        <div className="inline-flex items-center gap-3 bg-white rounded-3xl border-4 border-[#A5D6A7] shadow-[0_6px_0_#C8E6C9] px-8 py-4">
          <span className="text-4xl font-black text-[#1B5E20] uppercase tracking-wider">
            {word}
          </span>
          <button
            onClick={() => speak(word)}
            className="p-2 rounded-full hover:bg-[#E8F5E9] transition-colors"
          >
            <Volume2 className="w-6 h-6 text-[#2E7D32]" />
          </button>
        </div>
        <p className="text-base font-bold text-[#558B2F] mt-3 flex items-center justify-center gap-1">
          <HelpCircle className="w-4 h-4" /> Select ALL correct Merriam-Webster meanings
        </p>
      </div>

      <div className="space-y-3">
        {options.map((opt, i) => {
          const isSelected = selected.has(opt.id);
          const showCorrect = revealed && opt.correct;
          const showWrong = submitted && isSelected && !opt.correct;
          const showRight = submitted && isSelected && opt.correct;

          let btnClass = "mcq-option w-full text-left p-4 rounded-xl border-4 transition-all ";
          if (isSelected) {
            btnClass += "bg-[#E8F5E9] border-[#2E7D32] ";
          } else {
            btnClass += "bg-white border-[#C8E6C9] hover:border-[#A5D6A7] ";
          }
          if (showCorrect) btnClass += "bg-[#E8F5E9] border-[#4CAF50] ";
          if (showWrong) btnClass += "bg-[#FFEBEE] border-[#E57373] ";
          if (showRight) btnClass += "border-[#4CAF50] ";

          let iconBoxClass = "w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 ";
          if (isSelected) {
            iconBoxClass += "bg-[#2E7D32] border-[#2E7D32] ";
          } else {
            iconBoxClass += "border-[#A5D6A7] ";
          }
          if (showCorrect) iconBoxClass += "bg-[#4CAF50] border-[#4CAF50] ";
          if (showWrong) iconBoxClass += "bg-[#E57373] border-[#E57373] ";

          return (
            <motion.button
              key={opt.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              onClick={() => toggleOption(opt.id)}
              className={btnClass}
            >
              <div className="flex items-center gap-3">
                <div className={iconBoxClass}>
                  {(isSelected || showCorrect) && <Check className="w-4 h-4 text-white" />}
                  {showWrong && <X className="w-4 h-4 text-white" />}
                </div>
                <span className="text-[#1B5E20] font-bold first-letter:uppercase">
                  {opt.text}
                </span>
              </div>
            </motion.button>
          );
        })}
      </div>

      {feedback && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-2xl text-center font-bold text-base ${
            feedback.includes("Perfect") || feedback.includes("more")
              ? "bg-[#C8E6C9] text-[#1B5E20]"
              : feedback.includes("Not quite") || feedback.includes("trick")
              ? "bg-[#FFEBEE] text-[#D32F2F]"
              : "bg-[#FFF9C4] text-[#F57F17]"
          }`}
        >
          {feedback}
        </motion.div>
      )}

      {!revealed && (
        <div className="text-center">
          <button
            onClick={checkAnswer}
            disabled={selected.size === 0 || (submitted && !feedback.includes("Try"))}
            className="forest-btn text-lg disabled:opacity-40"
          >
            Check Answer (Attempt {attempt + 1}/2)
          </button>
        </div>
      )}

      {points > 0 && (
        <div className="text-center">
          <span className="score-display animate-bounce-score text-[#2E7D32] font-black text-xl">
            +{points} points
          </span>
        </div>
      )}
    </div>
  );
}