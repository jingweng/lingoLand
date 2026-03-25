import { useState, useEffect, useCallback } from 'react';
import Layout from '@/components/Layout';
import api from '@/lib/api';
import { Plus, Trash2, Upload, Globe, FileText, Search, Filter, X, ArrowUpDown, CalendarDays, CheckSquare, Square } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

const LEVEL_LABELS = ['New', 'Spelled', 'Meaning', 'Mastered'];
const LEVEL_STYLES = [
  'bg-[#ECEFF1] text-[#546E7A]',
  'bg-[#FFF9C4] text-[#F57F17]',
  'bg-[#C8E6C9] text-[#2E7D32]',
  'bg-[#FFD54F] text-[#E65100]',
];

export default function WordBank() {
  const [words, setWords] = useState([]);
  const [newWord, setNewWord] = useState('');
  const [search, setSearch] = useState('');
  const [filterLevel, setFilterLevel] = useState(null);
  const [sortBy, setSortBy] = useState('date');
  const [importModal, setImportModal] = useState(false);
  const [importType, setImportType] = useState('text');
  const [importText, setImportText] = useState('');
  const [importUrl, setImportUrl] = useState('');
  const [importing, setImporting] = useState(false);
  const [taskSelected, setTaskSelected] = useState(new Set());
  const [generatingTask, setGeneratingTask] = useState(false);
  const [lastCheckedIdx, setLastCheckedIdx] = useState(null);

  const fetchWords = useCallback(async () => {
    const params = {};
    if (filterLevel !== null) params.level = filterLevel;
    const res = await api.get('/words', { params });
    setWords(res.data);
  }, [filterLevel]);

  useEffect(() => { fetchWords(); }, [fetchWords]);

  const addWord = async () => {
    if (!newWord.trim()) return;
    const wordList = newWord.split(',').map(w => w.trim()).filter(Boolean);
    await api.post('/words', { words: wordList });
    setNewWord('');
    fetchWords();
  };

  const deleteWord = async (id) => {
    await api.delete(`/words/${id}`);
    fetchWords();
  };

  const handleImport = async () => {
    setImporting(true);
    try {
      if (importType === 'text') {
        await api.post('/words/import/text', { text: importText });
      } else if (importType === 'url') {
        await api.post('/words/import/url', { url: importUrl });
      } else if (importType === 'file') {
        const fileInput = document.getElementById('file-upload');
        if (fileInput?.files[0]) {
          const formData = new FormData();
          formData.append('file', fileInput.files[0]);
          await api.post('/words/import/file', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        }
      }
      setImportModal(false);
      setImportText('');
      setImportUrl('');
      fetchWords();
    } catch (err) {
      alert(err.response?.data?.detail || 'Import failed');
    }
    setImporting(false);
  };

  const toggleTaskWord = (id, idx, event) => {
    if (event?.shiftKey && lastCheckedIdx !== null) {
      const start = Math.min(lastCheckedIdx, idx);
      const end = Math.max(lastCheckedIdx, idx);
      setTaskSelected(prev => {
        const next = new Set(prev);
        for (let i = start; i <= end; i++) {
          next.add(sorted[i].id);
        }
        return next;
      });
    } else {
      setTaskSelected(prev => {
        const next = new Set(prev);
        next.has(id) ? next.delete(id) : next.add(id);
        return next;
      });
    }
    setLastCheckedIdx(idx);
  };

  const generateWeeklyTask = async () => {
    if (taskSelected.size === 0) return;
    setGeneratingTask(true);
    try {
      await api.post('/tasks/generate', { word_ids: [...taskSelected] });
      alert('Weekly Task created! 3 days Learning + 2 days Testing. Check your Dashboard!');
      setTaskSelected(new Set());
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to create task');
    }
    setGeneratingTask(false);
  };

  const filtered = words.filter(w => !search || w.word.includes(search.toLowerCase()));

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'alpha') return a.word.localeCompare(b.word);
    if (sortBy === 'level') return a.level - b.level;
    return (b.created_at || '').localeCompare(a.created_at || '');
  });

  return (
    <Layout>
      <div className="space-y-6" data-testid="word-bank-page">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h1 className="text-3xl font-black text-[#1B5E20]">Word Bank</h1>
          <button
            onClick={() => setImportModal(true)}
            data-testid="import-btn"
            className="wood-btn flex items-center gap-2"
          >
            <Upload className="w-4 h-4" /> Import Words
          </button>
        </div>

        {/* Add word */}
        <div className="bg-white rounded-3xl border-4 border-[#A5D6A7] shadow-[8px_8px_0_#C8E6C9] p-5">
          <div className="flex gap-3">
            <input
              value={newWord}
              onChange={e => setNewWord(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addWord()}
              placeholder="Type a word (or comma-separated list)"
              data-testid="add-word-input"
              className="flex-1 bg-white border-4 border-[#A5D6A7] rounded-2xl px-4 py-3 text-lg font-bold text-[#1B5E20] placeholder:text-[#A5D6A7]/70 focus:outline-none focus:border-[#2E7D32] transition-all"
            />
            <button onClick={addWord} data-testid="add-word-btn" className="forest-btn px-6 flex items-center gap-2">
              <Plus className="w-5 h-5" /> Add
            </button>
          </div>
        </div>

        {/* Search + Filter + Sort */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#A5D6A7]" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search words..."
              data-testid="search-words"
              className="w-full bg-white border-4 border-[#A5D6A7] rounded-2xl pl-12 pr-4 py-3 text-base font-bold text-[#1B5E20] placeholder:text-[#A5D6A7]/70 focus:outline-none focus:border-[#2E7D32] transition-all"
            />
          </div>
          <div className="flex gap-2 items-center flex-wrap">
            <Filter className="w-5 h-5 text-[#558B2F]" />
            {[null, 0, 1, 2, 3].map(lv => (
              <button
                key={String(lv)}
                onClick={() => setFilterLevel(lv)}
                data-testid={`filter-level-${lv === null ? 'all' : lv}`}
                className={`px-3 py-1.5 rounded-xl text-sm font-bold transition-all ${
                  filterLevel === lv
                    ? 'bg-[#2E7D32] text-white'
                    : 'bg-[#E8F5E9] text-[#558B2F] hover:bg-[#C8E6C9]'
                }`}
              >
                {lv === null ? 'All' : LEVEL_LABELS[lv]}
              </button>
            ))}
            <div className="w-px h-6 bg-[#C8E6C9] mx-1" />
            <ArrowUpDown className="w-4 h-4 text-[#558B2F]" />
            {[
              { key: 'alpha', label: 'A-Z' },
              { key: 'level', label: 'Level' },
              { key: 'date', label: 'Date' },
            ].map(s => (
              <button
                key={s.key}
                onClick={() => setSortBy(s.key)}
                data-testid={`sort-${s.key}`}
                className={`px-3 py-1.5 rounded-xl text-sm font-bold transition-all ${
                  sortBy === s.key
                    ? 'bg-[#795548] text-white'
                    : 'bg-[#EFEBE9] text-[#795548] hover:bg-[#D7CCC8]'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Generate Weekly Task Bar */}
        {taskSelected.size > 0 && (
          <div className="bg-[#FFF9C4] rounded-2xl border-4 border-[#FBC02D] p-4 flex items-center justify-between animate-slide-up">
            <div>
              <p className="font-black text-[#F57F17]">{taskSelected.size} word{taskSelected.size !== 1 ? 's' : ''} selected</p>
              <p className="text-xs font-bold text-[#F57F17]/70">3 days Learning + 2 days Testing</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setTaskSelected(new Set())}
                data-testid="clear-task-selection"
                className="px-4 py-2 rounded-xl bg-white text-[#795548] font-bold hover:bg-[#EFEBE9] transition-colors"
              >
                Clear
              </button>
              <button
                onClick={generateWeeklyTask}
                disabled={generatingTask}
                data-testid="generate-weekly-task-btn"
                className="px-4 py-2 rounded-xl bg-[#FBC02D] text-[#E65100] font-black hover:bg-[#F9A825] transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                <CalendarDays className="w-4 h-4" />
                {generatingTask ? 'Creating...' : 'Generate Weekly Task'}
              </button>
            </div>
          </div>
        )}

        {/* Word List */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3" data-testid="word-list">
          {sorted.map((w, idx) => (
            <div key={w.id} className="bg-white rounded-2xl border-4 border-[#C8E6C9] p-4 flex items-center justify-between hover:border-[#66BB6A] transition-all group">
              <div className="flex items-center gap-3">
                <button
                  onClick={(e) => toggleTaskWord(w.id, idx, e)}
                  data-testid={`task-check-${w.word}`}
                  className="text-[#A5D6A7] hover:text-[#2E7D32] transition-colors shrink-0"
                >
                  {taskSelected.has(w.id)
                    ? <CheckSquare className="w-5 h-5 text-[#FBC02D]" />
                    : <Square className="w-5 h-5" />
                  }
                </button>
                <span className="text-xl font-black text-[#1B5E20] capitalize">{w.word}</span>
                <span className={`mastery-badge ${LEVEL_STYLES[w.level]}`}>
                  {LEVEL_LABELS[w.level]}
                </span>
              </div>
              <button
                onClick={() => deleteWord(w.id)}
                data-testid={`delete-word-${w.word}`}
                className="p-2 rounded-xl text-[#90A4AE] hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          {sorted.length === 0 && (
            <div className="col-span-full text-center py-12">
              <p className="text-lg font-bold text-[#558B2F]">
                {words.length === 0 ? 'No words yet! Add some above.' : 'No words match your search.'}
              </p>
            </div>
          )}
        </div>

        <div className="text-sm font-bold text-[#558B2F] text-center">
          {words.length} word{words.length !== 1 ? 's' : ''} in your bank
        </div>

        {/* Import Modal */}
        <Dialog open={importModal} onOpenChange={setImportModal}>
          <DialogContent className="rounded-3xl border-4 border-[#A5D6A7] max-w-lg" data-testid="import-modal">
            <DialogHeader>
              <DialogTitle className="text-xl font-black text-[#1B5E20]">Import Words</DialogTitle>
              <DialogDescription className="text-sm font-bold text-[#558B2F]">Add words from text, files, or web pages</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="flex gap-2">
                {[
                  { key: 'text', icon: FileText, label: 'Text' },
                  { key: 'file', icon: Upload, label: 'File' },
                  { key: 'url', icon: Globe, label: 'URL' },
                ].map(t => (
                  <button
                    key={t.key}
                    onClick={() => setImportType(t.key)}
                    data-testid={`import-type-${t.key}`}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                      importType === t.key ? 'bg-[#2E7D32] text-white' : 'bg-[#E8F5E9] text-[#558B2F]'
                    }`}
                  >
                    <t.icon className="w-4 h-4" /> {t.label}
                  </button>
                ))}
              </div>

              {importType === 'text' && (
                <textarea
                  value={importText}
                  onChange={e => setImportText(e.target.value)}
                  placeholder="Paste any text here and we'll extract the words..."
                  data-testid="import-text-input"
                  rows={6}
                  className="w-full bg-white border-4 border-[#A5D6A7] rounded-2xl px-4 py-3 text-base font-bold text-[#1B5E20] placeholder:text-[#A5D6A7]/70 focus:outline-none focus:border-[#2E7D32] transition-all resize-none"
                />
              )}
              {importType === 'file' && (
                <div className="border-4 border-dashed border-[#A5D6A7] rounded-2xl p-8 text-center">
                  <Upload className="w-8 h-8 text-[#A5D6A7] mx-auto mb-2" />
                  <p className="text-sm font-bold text-[#558B2F] mb-3">Upload a .txt or .pdf file</p>
                  <input type="file" id="file-upload" accept=".txt,.pdf" data-testid="import-file-input"
                    className="text-sm font-bold text-[#2E7D32]" />
                </div>
              )}
              {importType === 'url' && (
                <input
                  value={importUrl}
                  onChange={e => setImportUrl(e.target.value)}
                  placeholder="https://example.com/article"
                  data-testid="import-url-input"
                  className="w-full bg-white border-4 border-[#A5D6A7] rounded-2xl px-4 py-3 text-base font-bold text-[#1B5E20] placeholder:text-[#A5D6A7]/70 focus:outline-none focus:border-[#2E7D32] transition-all"
                />
              )}

              <button
                onClick={handleImport}
                disabled={importing}
                data-testid="import-submit"
                className="w-full forest-btn disabled:opacity-50"
              >
                {importing ? 'Importing...' : 'Import Words'}
              </button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
