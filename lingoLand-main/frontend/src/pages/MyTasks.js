import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import api from '@/lib/api';
import { ClipboardList, Pencil, Check, X, CheckSquare, Square, ChevronDown, ChevronUp, CalendarDays } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

export default function MyTasks() {
  const [tasks, setTasks] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  const fetchTasks = () => api.get('/tasks').then(r => setTasks(r.data)).catch(() => {});
  useEffect(() => { fetchTasks(); }, []);

  const startRename = (task) => { setEditingId(task.id); setEditName(task.name || ''); };
  const saveRename = async (taskId) => {
    if (!editName.trim()) return;
    await api.put(`/tasks/${taskId}/rename`, { name: editName.trim() });
    setEditingId(null);
    fetchTasks();
  };

  const toggleWord = async (taskId, wordId, type) => {
    await api.put(`/tasks/${taskId}/word/${wordId}/toggle?type=${type}`);
    fetchTasks();
  };

  const toggleDay = async (taskId, dayNum) => {
    await api.put(`/tasks/${taskId}/day/${dayNum}/complete`);
    fetchTasks();
  };

  return (
    <Layout>
      <div className="space-y-6" data-testid="my-tasks-page">
        <h1 className="text-3xl font-black text-[#1B5E20] flex items-center gap-2">
          <ClipboardList className="w-8 h-8" /> My Tasks
        </h1>

        {tasks.length === 0 ? (
          <div className="bg-white rounded-3xl border-4 border-[#A5D6A7] p-12 text-center">
            <ClipboardList className="w-12 h-12 text-[#A5D6A7] mx-auto mb-3" />
            <p className="text-lg font-bold text-[#558B2F]">No tasks yet. Select words in your Word Bank and click "Generate Weekly Task".</p>
          </div>
        ) : (
          <div className="space-y-4" data-testid="tasks-list">
            {tasks.map(task => {
              const learnDone = task.words?.filter(w => w.learn_complete).length || 0;
              const testDone = task.words?.filter(w => w.test_complete).length || 0;
              const total = task.words?.length || 0;
              const learnPct = total > 0 ? (learnDone / total) * 100 : 0;
              const testPct = total > 0 ? (testDone / total) * 100 : 0;
              const isExpanded = expandedId === task.id;

              return (
                <div key={task.id} className={`bg-white rounded-3xl border-4 ${task.status === 'active' ? 'border-[#FBC02D]' : 'border-[#C8E6C9]'} shadow-[4px_4px_0_${task.status === 'active' ? '#F9A825' : '#C8E6C9'}] overflow-hidden`}
                  data-testid={`task-card-${task.id}`}>
                  {/* Header */}
                  <div className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        {editingId === task.id ? (
                          <div className="flex items-center gap-2 flex-1">
                            <input
                              value={editName}
                              onChange={e => setEditName(e.target.value)}
                              onKeyDown={e => e.key === 'Enter' && saveRename(task.id)}
                              data-testid={`rename-input-${task.id}`}
                              className="flex-1 bg-white border-4 border-[#A5D6A7] rounded-xl px-3 py-1.5 text-lg font-bold text-[#1B5E20] focus:outline-none focus:border-[#2E7D32]"
                              autoFocus
                            />
                            <button onClick={() => saveRename(task.id)} data-testid={`save-rename-${task.id}`} className="p-1.5 rounded-lg bg-[#2E7D32] text-white hover:bg-[#1B5E20]">
                              <Check className="w-4 h-4" />
                            </button>
                            <button onClick={() => setEditingId(null)} className="p-1.5 rounded-lg bg-[#ECEFF1] text-[#546E7A] hover:bg-[#CFD8DC]">
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <>
                            <h3 className="font-black text-lg text-[#1B5E20] truncate">{task.name || 'Unnamed Task'}</h3>
                            <button onClick={() => startRename(task)} data-testid={`rename-btn-${task.id}`} className="p-1 rounded-lg text-[#A5D6A7] hover:text-[#2E7D32] hover:bg-[#E8F5E9] shrink-0">
                              <Pencil className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                      <div className="flex items-center gap-2 ml-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-black uppercase ${task.status === 'active' ? 'bg-[#FFF9C4] text-[#F57F17]' : 'bg-[#E8F5E9] text-[#558B2F]'}`}>
                          {task.status}
                        </span>
                      </div>
                    </div>

                    {/* Progress Bars */}
                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div>
                        <div className="flex justify-between text-xs font-bold text-[#0288D1] mb-1">
                          <span>Learning</span>
                          <span>{learnDone}/{total}</span>
                        </div>
                        <Progress value={learnPct} className="h-3 rounded-full" />
                      </div>
                      <div>
                        <div className="flex justify-between text-xs font-bold text-[#E65100] mb-1">
                          <span>Testing</span>
                          <span>{testDone}/{total}</span>
                        </div>
                        <Progress value={testPct} className="h-3 rounded-full" />
                      </div>
                    </div>

                    {/* Schedule */}
                    <div className="flex gap-1.5 mb-3">
                      {task.schedule?.map(day => (
                        <button
                          key={day.day}
                          onClick={() => toggleDay(task.id, day.day)}
                          data-testid={`toggle-day-${task.id}-${day.day}`}
                          className={`flex-1 p-2 rounded-xl text-center border-2 transition-all cursor-pointer hover:opacity-80 ${
                            day.completed ? 'bg-[#C8E6C9] border-[#4CAF50]' : 'bg-white border-[#E0E0E0]'
                          }`}
                        >
                          <div className="text-[10px] font-bold text-[#558B2F]">D{day.day}</div>
                          <div className={`text-[10px] font-black ${day.type === 'learn' ? 'text-[#0288D1]' : 'text-[#E65100]'}`}>
                            {day.type === 'learn' ? 'L' : 'T'}
                          </div>
                          {day.completed && <Check className="w-3 h-3 text-[#4CAF50] mx-auto" />}
                        </button>
                      ))}
                    </div>

                    {/* Expand Toggle */}
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : task.id)}
                      data-testid={`expand-task-${task.id}`}
                      className="w-full flex items-center justify-center gap-1 text-sm font-bold text-[#558B2F] hover:text-[#2E7D32] py-1"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      {isExpanded ? 'Hide Words' : `Show ${total} Words`}
                    </button>
                  </div>

                  {/* Word List */}
                  {isExpanded && (
                    <div className="border-t-4 border-[#E8F5E9] p-5 bg-[#F9FBE7]/30">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2" data-testid={`task-words-${task.id}`}>
                        {task.words?.map(w => (
                          <div key={w.id} className="flex items-center justify-between p-3 rounded-xl bg-white border-2 border-[#C8E6C9]">
                            <span className="font-bold text-[#1B5E20] capitalize">{w.word}</span>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => toggleWord(task.id, w.id, 'learn')}
                                data-testid={`toggle-learn-${w.id}`}
                                className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold transition-all ${
                                  w.learn_complete ? 'bg-[#0288D1] text-white' : 'bg-[#E1F5FE] text-[#0288D1]'
                                }`}
                              >
                                {w.learn_complete ? <CheckSquare className="w-3 h-3" /> : <Square className="w-3 h-3" />}
                                Learn
                              </button>
                              <button
                                onClick={() => toggleWord(task.id, w.id, 'test')}
                                data-testid={`toggle-test-${w.id}`}
                                className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold transition-all ${
                                  w.test_complete ? 'bg-[#E65100] text-white' : 'bg-[#FFF3E0] text-[#E65100]'
                                }`}
                              >
                                {w.test_complete ? <CheckSquare className="w-3 h-3" /> : <Square className="w-3 h-3" />}
                                Test
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
