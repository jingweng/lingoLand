import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Layout from '@/components/Layout';
import api from '@/lib/api';
import { Gamepad2, BookOpen, Brain, PenTool, Check, ArrowRight, Sparkles, ArrowUpDown } from 'lucide-react';

const LEVEL_LABELS = ['New', 'Spelled', 'Meaning', 'Mastered'];
const LEVEL_COLORS = ['#90A4AE', '#FBC02D', '#66BB6A', '#FF8F00'];

const LEVEL_GOALS = [
  { level: 1, title: 'Spelling Rain', icon: BookOpen, desc: 'Listen to the word and click the correct letters in order to spell it!', color: '#0288D1' },
  { level: 2, title: 'Meaning Match', icon: Brain, desc: 'Select all the correct meanings for each word from the choices.', color: '#7B1FA2' },
  { level: 3, title: 'Sentence Architect', icon: PenTool, desc: 'Write a creative sentence using the word with proper grammar!', color: '#E65100' },
];

const SORT_OPTIONS = [
  { key: 'alpha', label: 'A-Z' },
  { key: 'alpha-desc', label: 'Z-A' },
  { key: 'level', label: 'Level' },
];

export default function PreGame() {
  const navigate = useNavigate();
  const location = useLocation();
  const [words, setWords] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [filterLevel, setFilterLevel] = useState(null);
  const [selectedLevels, setSelectedLevels] = useState(new Set([1, 2, 3]));
  const [sortBy, setSortBy] = useState('alpha');
  const [lastCheckedIdx, setLastCheckedIdx] = useState(null);

  // Check if navigated with task words (bypass mode)
  const taskState = location.state;

  useEffect(() => {
    if (taskState?.taskWords) {
      // Task-based: load task words directly and auto-start
      const tw = taskState.taskWords.map(w => ({ ...w, level: w.level || 0 }));
      setWords(tw);
      setSelected(new Set(tw.map(w => w.id)));
    } else {
      api.get('/words').then(r => setWords(r.data)).catch(() => {});
    }
  }, [taskState]);

  const filtered = filterLevel !== null ? words.filter(w => w.level === filterLevel) : words;
  const playable = filtered.filter(w => w.level < 3);

  const sorted = [...playable].sort((a, b) => {
    if (sortBy === 'alpha') return a.word.localeCompare(b.word);
    if (sortBy === 'alpha-desc') return b.word.localeCompare(a.word);
    if (sortBy === 'level') return a.level - b.level;
    return 0;
  });

  const toggleWord = (id, idx, event) => {
    if (event?.shiftKey && lastCheckedIdx !== null) {
      const start = Math.min(lastCheckedIdx, idx);
      const end = Math.max(lastCheckedIdx, idx);
      setSelected(prev => {
        const next = new Set(prev);
        for (let i = start; i <= end; i++) {
          next.add(sorted[i].id);
        }
        return next;
      });
    } else {
      setSelected(prev => {
        const next = new Set(prev);
        next.has(id) ? next.delete(id) : next.add(id);
        return next;
      });
    }
    setLastCheckedIdx(idx);
  };

  const selectAll = () => {
    const ids = sorted.map(w => w.id);
    setSelected(prev => prev.size === ids.length ? new Set() : new Set(ids));
  };

  const toggleLevel = (lvl) => {
    setSelectedLevels(prev => {
      const next = new Set(prev);
      next.has(lvl) ? next.delete(lvl) : next.add(lvl);
      return next;
    });
  };

  const startGame = () => {
    const gameWords = words.filter(w => selected.has(w.id));
    if (gameWords.length === 0 || selectedLevels.size === 0) return;
    navigate('/game', {
      state: {
        words: gameWords,
        selectedLevels: [...selectedLevels],
        taskId: taskState?.taskId || null,
        schedule: taskState?.schedule || null,
      },
    });
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

        {/* Filter + Sort + Select */}
        <div className="bg-white rounded-3xl border-4 border-[#A5D6A7] shadow-[8px_8px_0_#C8E6C9] p-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
            <div className="flex gap-2 flex-wrap items-center">
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
              <div className="w-px h-5 bg-[#C8E6C9] mx-1" />
              <ArrowUpDown className="w-4 h-4 text-[#558B2F]" />
              {SORT_OPTIONS.map(s => (
                <button
                  key={s.key}
                  onClick={() => setSortBy(s.key)}
                  data-testid={`pregame-sort-${s.key}`}
                  className={`px-3 py-1 rounded-xl text-sm font-bold transition-all ${
                    sortBy === s.key ? 'bg-[#795548] text-white' : 'bg-[#EFEBE9] text-[#795548] hover:bg-[#D7CCC8]'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
            <button
              onClick={selectAll}
              data-testid="select-all-btn"
              className="text-sm font-bold text-[#2E7D32] hover:underline"
            >
              {selected.size === sorted.length && sorted.length > 0 ? 'Deselect All' : 'Select All'}
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 max-h-[400px] overflow-y-auto" data-testid="word-selection-grid">
            {sorted.map((w, idx) => (
              <button
                key={w.id}
                onClick={(e) => toggleWord(w.id, idx, e)}
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
            {sorted.length === 0 && (
              <div className="col-span-full text-center py-8">
                <p className="font-bold text-[#558B2F]">
                  {words.length === 0 ? 'No words yet! Add some to your Word Bank first.' : 'All words at this level are mastered!'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Level Selection */}
        <div className="bg-white rounded-3xl border-4 border-[#A5D6A7] shadow-[8px_8px_0_#C8E6C9] p-5">
          <h3 className="font-black text-[#1B5E20] mb-3">Choose Levels to Play</h3>
          <div className="flex flex-wrap gap-3">
            {LEVEL_GOALS.map(g => (
              <button
                key={g.level}
                onClick={() => toggleLevel(g.level)}
                data-testid={`level-toggle-${g.level}`}
                className={`flex items-center gap-2 px-4 py-3 rounded-2xl border-4 font-bold transition-all ${
                  selectedLevels.has(g.level)
                    ? 'border-[#2E7D32] bg-[#E8F5E9] shadow-[0_4px_0_#1B5E20] text-[#1B5E20]'
                    : 'border-[#C8E6C9] bg-white text-[#90A4AE] hover:border-[#66BB6A]'
                }`}
              >
                <g.icon className="w-5 h-5" style={{ color: selectedLevels.has(g.level) ? g.color : '#90A4AE' }} />
                <span>Lvl {g.level}: {g.title}</span>
                {selectedLevels.has(g.level) && <Check className="w-5 h-5 text-[#2E7D32]" />}
              </button>
            ))}
          </div>
        </div>

        {/* Start Button */}
        <div className="text-center">
          <button
            onClick={startGame}
            disabled={selected.size === 0 || selectedLevels.size === 0}
            data-testid="start-game-btn"
            className="forest-btn text-xl px-12 py-5 disabled:opacity-40 flex items-center gap-3 mx-auto"
          >
            <Gamepad2 className="w-6 h-6" />
            Start Game ({selected.size} word{selected.size !== 1 ? 's' : ''}, {selectedLevels.size} level{selectedLevels.size !== 1 ? 's' : ''})
            <ArrowRight className="w-6 h-6" />
          </button>
        </div>
      </div>
    </Layout>
  );
}
