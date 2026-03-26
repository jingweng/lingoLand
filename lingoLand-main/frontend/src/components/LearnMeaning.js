import { useState, useEffect } from "react";
import { SkipForward, ArrowLeft, Volume2, CheckCircle2 } from "lucide-react";
import { speak } from "@/lib/sounds";
import { motion } from "framer-motion";

const syllabify = (w) => {
  const parts = w.match(/[^aeiouy]*[aeiouy]+(?:[^aeiouy](?![aeiouy]))*/gi);
  return parts ? parts.join(" · ") : w;
};

export default function LearnMeaning({ words, onFinish }) {
  const [index, setIndex] = useState(0);
  const [done, setDone] = useState(false);

  const wordObj = words[index] || {};
  const word = wordObj.word || "";

  const meanings = wordObj.meanings && wordObj.meanings.length > 0
    ? wordObj.meanings
    : ["No definition found. Try deleting and re-adding this word!"];

  useEffect(() => {
    if (word) {
      setTimeout(() => speak(word, 0.7), 300);
    }
  }, [word]);

  const handlePass = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    if (index + 1 < words.length) {
      setIndex((prev) => prev + 1);
    } else {
      setDone(true);
    }
  };

  if (done) {
    return (
      <div className="text-center py-12 animate-pop-in">
        <CheckCircle2 className="w-16 h-16 text-[#4CAF50] mx-auto mb-4" />
        <h2 className="text-3xl font-black text-[#1B5E20] mb-2">
          Great Learning!
        </h2>
        <p className="text-lg font-bold text-[#558B2F] mb-6">
          You learned meanings for {words.length} words!
        </p>
        <button onClick={onFinish} className="forest-btn">
          <ArrowLeft className="w-5 h-5 inline mr-2" /> Back to Learn
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center">
        <p className="text-sm font-bold text-[#558B2F]">
          Word {index + 1} of {words.length}
        </p>
        <div className="flex justify-center gap-1.5 mt-2">
          {words.map((_, i) => (
            <div
              key={i}
              className={`progress-dot ${i === index ? "active" : i < index ? "completed" : ""}`}
            />
          ))}
        </div>
      </div>

      <div className="text-center">
        <div className="inline-flex items-center gap-3 bg-white rounded-3xl border-4 border-[#A5D6A7] shadow-[0_6px_0_#C8E6C9] px-8 py-4">
          <span className="text-4xl font-black text-[#1B5E20] uppercase tracking-wider">
            {word}
          </span>
          <button
            onClick={() => speak(word)}
            className="p-2 rounded-full hover:bg-[#E8F5E9]"
          >
            <Volume2 className="w-6 h-6 text-[#2E7D32]" />
          </button>
        </div>
        <p className="text-xs font-bold text-[#558B2F] uppercase tracking-widest text-center mt-2">
          {syllabify(word)}
        </p>
      </div>

      <div className="space-y-4">
        {meanings.map((definitionText, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.15 }}
            className="bg-white rounded-3xl border-4 border-[#C8E6C9] p-5"
          >
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-[#7B1FA2]/10 flex items-center justify-center shrink-0 mt-0.5">
                <span className="font-black text-[#7B1FA2] text-sm">
                  {i + 1}
                </span>
              </div>
              <div>
                <p className="font-bold text-lg text-[#1B5E20] first-letter:uppercase">
                  {definitionText}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="text-center">
        <button
          onClick={handlePass}
          className="flex items-center gap-2 px-8 py-4 rounded-full bg-[#795548] text-white font-bold text-lg shadow-[0_4px_0_#5D4037] active:shadow-none active:translate-y-1 transition-all mx-auto"
        >
          <SkipForward className="w-5 h-5" />{" "}
          {index + 1 < words.length ? "Next Word" : "Finish"}
        </button>
      </div>
    </div>
  );
}