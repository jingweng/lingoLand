import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import api from '@/lib/api';
import { Gamepad2, BookOpen, Brain, PenTool, Check, ArrowRight, Sparkles } from 'lucide-react';

const LEVEL_LABELS = ['New', 'Spelled', 'Meaning', 'Mastered'];
const LEVEL_ICONS = [BookOpen, BookOpen, Brain, PenTool];
const LEVEL_COLORS = ['#90A4AE', '#FBC02D', '#66BB6A', '#FF8F00'];

const LEVEL_GOALS = [
  { level: 1, title: 'Spelling Rain', icon: BookOpen, desc: 'Listen to the word and click the correct letters in order to spell it!', color: '#0288D1' },
  { level: 2, title: 'Meaning Match', icon: Brain, desc: 'Select all the correct meanings for each word from the choices.', color: '#7B1FA2' },
  { level: 3, title: 'Sentence Architect', icon: PenTool, desc: 'Write a creative sentence using the word with proper grammar!', color: '#E65100' },
];

export default function PreGame() {
  const navigate = useNavigate();
  const [words, setWords] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [filterLevel, setFilterLevel] = useState(null);

  useEffect(() => {
    api.get('/words').then(r => setWords(r.data)).catch(() => {});
  }, []);

  const filtered = filterLevel !== null ? words.filter(w => w.level === filterLevel) : words;
  const playable = filtered.filter(w => w.level < 3);

  const toggleWord = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    const ids = playable.map(w => w.id);
    setSelected(prev => prev.size === ids.length ? new Set() : new Set(ids));
  };

  const startGame = () => {
    const gameWords = words.filter(w => selected.has(w.id));
    if (gameWords.length === 0) return;
    navigate('/game', { state: { words: gameWords } });
  };

  return (
    <Layout>
      <div className="space-y-6 sm:space-y-8" data-testid="pre-game-page">
        <div className="text-center">
          <h1 className="text-3xl sm:text-4xl font-black text-[#1B5E20] tracking-tight">
            <Sparkles className="w-8 h-8 inline mr-2 text-[#FBC02D]" />
            Choose Your Words
          </h1>
          <p className="text-lg font-bold text-[#558B2F] mt-1">Select words to practice and level up!</p>
        </div>

        {/* Level Goals */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {LEVEL_GOALS.map(g => (
            <div key={g.level} className="bg-white rounded-3xl border-4 border-[#A5D6A7] p-5 flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${g.color}15` }}>
                <g.icon className="w-5 h-5" style={{ color: g.color }} />
              </div>
              <div>
                <div className="text-xs font-bold uppercase tracking-wide" style={{ color: g.color }}>Level {g.level}</div>
                <h3 className="font-black text-[#1B5E20]">{g.title}</h3>
                <p className="text-sm font-bold text-[#558B2F] mt-1">{g.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Filter + Select */}
        <div className="bg-white rounded-3xl border-4 border-[#A5D6A7] shadow-[8px_8px_0_#C8E6C9] p-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
            <div className="flex gap-2 flex-wrap">
              <span className="text-sm font-bold text-[#558B2F]">Filter:</span>
              {[null, 0, 1, 2].map(lv => (
                <button
                  key={String(lv)}
                  onClick={() => { setFilterLevel(lv); setSelected(new Set()); }}
                  data-testid={`pregame-filter-${lv === null ? 'all' : lv}`}
                  className={`px-3 py-1 rounded-xl text-sm font-bold transition-all ${
                    filterLevel === lv ? 'bg-[#2E7D32] text-white' : 'bg-[#E8F5E9] text-[#558B2F] hover:bg-[#C8E6C9]'
                  }`}
                >
                  {lv === null ? 'All' : LEVEL_LABELS[lv]}
                </button>
              ))}
            </div>
            <button
              onClick={selectAll}
              data-testid="select-all-btn"
              className="text-sm font-bold text-[#2E7D32] hover:underline"
            >
              {selected.size === playable.length && playable.length > 0 ? 'Deselect All' : 'Select All'}
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 max-h-[400px] overflow-y-auto" data-testid="word-selection-grid">
            {playable.map(w => (
              <button
                key={w.id}
                onClick={() => toggleWord(w.id)}
                data-testid={`select-word-${w.word}`}
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
                <div className="flex items-center gap-1 mt-1">
                  <div className="w-2 h-2 rounded-full" style={{ background: LEVEL_COLORS[w.level] }} />
                  <span className="text-xs font-bold text-[#558B2F]">Lvl {w.level}</span>
                </div>
              </button>
            ))}
            {playable.length === 0 && (
              <div className="col-span-full text-center py-8">
                <p className="font-bold text-[#558B2F]">
                  {words.length === 0 ? 'No words yet! Add some to your Word Bank first.' : 'All words at this level are mastered!'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Start Button */}
        <div className="text-center">
          <button
            onClick={startGame}
            disabled={selected.size === 0}
            data-testid="start-game-btn"
            className="forest-btn text-xl px-12 py-5 disabled:opacity-40 flex items-center gap-3 mx-auto"
          >
            <Gamepad2 className="w-6 h-6" />
            Start Game ({selected.size} word{selected.size !== 1 ? 's' : ''})
            <ArrowRight className="w-6 h-6" />
          </button>
        </div>
      </div>
    </Layout>
  );
}
