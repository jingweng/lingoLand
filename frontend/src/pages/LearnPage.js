import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import api from '@/lib/api';
import LearnSpelling from '@/components/LearnSpelling';
import LearnMeaning from '@/components/LearnMeaning';
import { BookOpen, Brain, Check, ArrowRight, Lightbulb, Volume2 } from 'lucide-react';

const getSyllables = (word) => {
  if (!word) return [word || ""];
  const pattern = /[^aeiouy]*[aeiouy]+(?:[^aeiouy](?![aeiouy]))*/gi;
  let parts = word.match(pattern) || [word];
  if (word.toLowerCase().endsWith('e') && !/[aeiouy]e$/i.test(word) && parts.length > 1) {
    const last = parts.pop();
    parts[parts.length - 1] += last;
  }
  return parts;
};

export default function LearnPage() {
  const navigate = useNavigate();
  const [words, setWords] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [started, setStarted] = useState(false);
  const [mode, setMode] = useState('spelling');
  const [activeTask, setActiveTask] = useState(null);

  useEffect(() => {
    api.get('/words').then(r => setWords(r.data)).catch(() => {});
    api.get('/tasks/active').then(r => { if (r.data) setActiveTask(r.data); }).catch(() => {});
  }, []);

  const toggleWord = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    setSelected(prev => prev.size === words.length ? new Set() : new Set(words.map(w => w.id)));
  };

  const loadTaskWords = () => {
    if (!activeTask) return;
    const taskWordIds = new Set(activeTask.words.map(w => w.id));
    setSelected(taskWordIds);
  };

  const startLearning = () => {
    if (selected.size === 0) return;
    setStarted(true);
  };

  const selectedWords = words.filter(w => selected.has(w.id));

  if (started && selectedWords.length > 0) {
    return (
      <Layout>
        <div className="space-y-6" data-testid="learn-session">
          {/* Mode Toggle */}
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => setMode('spelling')}
              data-testid="learn-spelling-tab"
              className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-base transition-all ${
                mode === 'spelling'
                  ? 'bg-[#0288D1] text-white shadow-[0_4px_0_#01579B]'
                  : 'bg-white border-4 border-[#C8E6C9] text-[#558B2F] hover:border-[#66BB6A]'
              }`}
            >
              <Volume2 className="w-5 h-5" /> Spelling
            </button>
            <button
              onClick={() => setMode('meaning')}
              data-testid="learn-meaning-tab"
              className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-base transition-all ${
                mode === 'meaning'
                  ? 'bg-[#7B1FA2] text-white shadow-[0_4px_0_#4A148C]'
                  : 'bg-white border-4 border-[#C8E6C9] text-[#558B2F] hover:border-[#66BB6A]'
              }`}
            >
              <Brain className="w-5 h-5" /> Meaning
            </button>
          </div>

          {mode === 'spelling' && (
            <LearnSpelling words={selectedWords} onFinish={() => setStarted(false)} />
          )}
          {mode === 'meaning' && (
            <LearnMeaning words={selectedWords} onFinish={() => setStarted(false)} />
          )}
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6 sm:space-y-8" data-testid="learn-page">
        <div className="text-center">
          <h1 className="text-3xl sm:text-4xl font-black text-[#1B5E20] tracking-tight">
            <Lightbulb className="w-8 h-8 inline mr-2 text-[#FBC02D]" />
            Learn Words
          </h1>
          <p className="text-lg font-bold text-[#558B2F] mt-1">Select words to study spelling and meanings</p>
        </div>

        {/* Mode Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-3xl border-4 border-[#A5D6A7] p-5 flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-[#0288D1]/10">
              <Volume2 className="w-5 h-5 text-[#0288D1]" />
            </div>
            <div>
              <h3 className="font-black text-[#1B5E20]">Spelling</h3>
              <p className="text-sm font-bold text-[#558B2F] mt-1">Hear the word read aloud, then spelled letter by letter. Practice listening and recognition.</p>
            </div>
          </div>
          <div className="bg-white rounded-3xl border-4 border-[#A5D6A7] p-5 flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-[#7B1FA2]/10">
              <Brain className="w-5 h-5 text-[#7B1FA2]" />
            </div>
            <div>
              <h3 className="font-black text-[#1B5E20]">Meaning</h3>
              <p className="text-sm font-bold text-[#558B2F] mt-1">See 3 definitions with sample sentences for each word. Build your vocabulary.</p>
            </div>
          </div>
        </div>

        {/* Active Task Shortcut */}
        {activeTask && (
          <div className="bg-[#FFF9C4] rounded-2xl border-4 border-[#FBC02D] p-4 flex items-center justify-between">
            <div>
              <p className="font-black text-[#F57F17]">Weekly Task Available</p>
              <p className="text-sm font-bold text-[#F57F17]/70">{activeTask.words.length} words to learn</p>
            </div>
            <button onClick={loadTaskWords} data-testid="load-task-words-btn" className="px-4 py-2 rounded-xl bg-[#FBC02D] text-[#E65100] font-bold hover:bg-[#F9A825] transition-colors">
              Load Task Words
            </button>
          </div>
        )}

        {/* Word Selection */}
        <div className="bg-white rounded-3xl border-4 border-[#A5D6A7] shadow-[8px_8px_0_#C8E6C9] p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-black text-lg text-[#1B5E20]">Select Words to Learn</h2>
            <button onClick={selectAll} data-testid="learn-select-all" className="text-sm font-bold text-[#2E7D32] hover:underline">
              {selected.size === words.length && words.length > 0 ? 'Deselect All' : 'Select All'}
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 max-h-[350px] overflow-y-auto" data-testid="learn-word-grid">
            {words.map(w => (
              <button
                key={w.id}
                onClick={() => toggleWord(w.id)}
                data-testid={`learn-word-${w.word}`}
                className={`p-3 rounded-2xl border-4 text-left transition-all ${
                  selected.has(w.id)
                    ? 'border-[#2E7D32] bg-[#E8F5E9] shadow-[0_4px_0_#1B5E20]'
                    : 'border-[#C8E6C9] bg-white hover:border-[#66BB6A]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-black text-[#1B5E20] capitalize">{w.word}</span>
                  {selected.has(w.id) && <Check className="w-5 h-5 text-[#2E7D32]" />}
                </div>
                <p className="text-[10px] font-bold text-[#558B2F] uppercase tracking-widest text-center mt-1 whitespace-nowrap">
                  {getSyllables(w.word).map((syl, i, arr) => (
                    <span key={i}>{syl}{i < arr.length - 1 && <span className="text-[#A5D6A7] mx-0.5"> · </span>}</span>
                  ))}
                </p>
              </button>
            ))}
            {words.length === 0 && (
              <div className="col-span-full text-center py-8">
                <p className="font-bold text-[#558B2F]">No words yet! Add some to your Word Bank first.</p>
              </div>
            )}
          </div>
        </div>

        <div className="text-center">
          <button
            onClick={startLearning}
            disabled={selected.size === 0}
            data-testid="start-learning-btn"
            className="forest-btn text-xl px-12 py-5 disabled:opacity-40 flex items-center gap-3 mx-auto"
          >
            <Lightbulb className="w-6 h-6" />
            Start Learning ({selected.size} word{selected.size !== 1 ? 's' : ''})
            <ArrowRight className="w-6 h-6" />
          </button>
        </div>
      </div>
    </Layout>
  );
}
