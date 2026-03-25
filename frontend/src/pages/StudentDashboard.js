import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import Layout from '@/components/Layout';
import api from '@/lib/api';
import { Gamepad2, Leaf, Lightbulb, CalendarDays, Check, Clock, Brain, PenTool, BookOpen } from 'lucide-react';

function CircularProgress({ percentage, size = 100, strokeWidth = 10, color = '#2E7D32' }) {
  const r = (size - strokeWidth) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (Math.min(percentage, 100) / 100) * c;
  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#E8F5E9" strokeWidth={strokeWidth} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={strokeWidth}
          strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`} style={{ transition: 'stroke-dashoffset 0.8s ease' }} />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-lg font-black text-[#1B5E20]">{Math.round(percentage)}%</span>
      </div>
    </div>
  );
}

export default function StudentDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTask, setActiveTask] = useState(null);
  const [todayActivity, setTodayActivity] = useState(null);
  const [weeklyGoal, setWeeklyGoal] = useState(null);

  useEffect(() => {
    api.get('/tasks/active').then(r => { if (r.data) setActiveTask(r.data); }).catch(() => {});
    api.get('/activity/today').then(r => setTodayActivity(r.data)).catch(() => {});
    api.get('/activity/weekly').then(r => setWeeklyGoal(r.data)).catch(() => {});
  }, []);

  const timerRef = useRef(null);
  useEffect(() => {
    timerRef.current = setInterval(() => {
      api.post('/activity/log', { time_spent_seconds: 60 }).catch(() => {});
    }, 60000);
    return () => clearInterval(timerRef.current);
  }, []);

  const daysComplete = activeTask?.schedule?.filter(d => d.completed).length || 0;

  const goLearn = () => {
    if (activeTask) {
      navigate('/learn', { state: { taskWords: activeTask.words, taskId: activeTask.id, schedule: activeTask.schedule } });
    } else {
      navigate('/learn');
    }
  };

  const goTest = () => {
    if (activeTask) {
      navigate('/game', {
        state: { words: activeTask.words, selectedLevels: [1, 2, 3], taskId: activeTask.id, schedule: activeTask.schedule },
      });
    } else {
      navigate('/play');
    }
  };

  return (
    <Layout>
      <div className="space-y-6 sm:space-y-8" data-testid="student-dashboard">
        {/* Welcome */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black text-[#1B5E20] tracking-tight" data-testid="welcome-msg">
              Welcome back, {user?.username}!
            </h1>
            <p className="text-lg font-bold text-[#558B2F] mt-1 flex items-center gap-1">
              <Leaf className="w-5 h-5" /> Ready for an adventure?
            </p>
          </div>
          <button onClick={() => navigate('/play')} data-testid="play-now-btn" className="forest-btn flex items-center gap-2 text-lg">
            <Gamepad2 className="w-5 h-5" /> Test Now
          </button>
        </div>

        {/* Today's Activity + Weekly Goal */}
        <div className="bg-white rounded-3xl border-4 border-[#A5D6A7] shadow-[8px_8px_0_#C8E6C9] p-6" data-testid="today-activity">
          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6">
            <div className="flex-1">
              <h2 className="text-lg font-black text-[#1B5E20] mb-4">Today's Activity</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <DailyStat icon={BookOpen} label="Words Spelled" value={todayActivity?.words_spelled || 0} color="#2E7D32" />
                <DailyStat icon={Brain} label="Meanings Learned" value={todayActivity?.meanings_learned || 0} color="#7B1FA2" />
                <DailyStat icon={PenTool} label="Levels Passed" value={todayActivity?.levels_passed || 0} color="#E65100" />
                <DailyStat icon={Clock} label="Time Spent" value={`${Math.round((todayActivity?.time_spent_seconds || 0) / 60)}m`} color="#0288D1" />
              </div>
            </div>
            <div className="flex flex-col items-center gap-2 shrink-0">
              <h2 className="text-sm font-black text-[#1B5E20] uppercase tracking-wide">Weekly Goal</h2>
              <CircularProgress percentage={weeklyGoal?.percentage || 0} />
              <div className="text-xs font-bold text-[#558B2F] text-center">
                <span className="text-[#0288D1]">{weeklyGoal?.learn_done || 0}</span> learned,{' '}
                <span className="text-[#E65100]">{weeklyGoal?.test_done || 0}</span> tested
              </div>
            </div>
          </div>
        </div>

        {/* Weekly Task */}
        {activeTask && (
          <div className="bg-white rounded-3xl border-4 border-[#FBC02D] shadow-[8px_8px_0_#F9A825] p-6" data-testid="weekly-task-widget">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-black text-[#F57F17] flex items-center gap-2">
                <CalendarDays className="w-6 h-6" /> Weekly Task
              </h2>
              <span className="text-sm font-bold text-[#F57F17]" data-testid="task-progress-text">Progress: {daysComplete}/5 Days Complete</span>
            </div>
            <div className="flex gap-2 mb-4">
              {activeTask.schedule.map((day) => (
                <div
                  key={day.day}
                  className={`flex-1 p-3 rounded-2xl text-center border-2 transition-all ${
                    day.completed ? 'bg-[#C8E6C9] border-[#4CAF50]' : 'bg-white border-[#E0E0E0]'
                  }`}
                >
                  <div className="text-xs font-bold text-[#558B2F] uppercase">Day {day.day}</div>
                  <div className={`text-xs font-black mt-1 ${day.type === 'learn' ? 'text-[#0288D1]' : 'text-[#E65100]'}`}>
                    {day.type === 'learn' ? 'Learn' : 'Test'}
                  </div>
                  {day.completed && <Check className="w-4 h-4 text-[#4CAF50] mx-auto mt-1" />}
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={goLearn} data-testid="task-learn-btn"
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-[#0288D1] text-white font-bold hover:bg-[#0277BD] transition-colors">
                <Lightbulb className="w-4 h-4" /> Learn
              </button>
              <button onClick={goTest} data-testid="task-test-btn"
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-[#E65100] text-white font-bold hover:bg-[#BF360C] transition-colors">
                <Gamepad2 className="w-4 h-4" /> Test
              </button>
            </div>
          </div>
        )}

        {!activeTask && (
          <div className="bg-white rounded-3xl border-4 border-[#A5D6A7] shadow-[8px_8px_0_#C8E6C9] p-8 text-center" data-testid="no-task-prompt">
            <CalendarDays className="w-10 h-10 text-[#A5D6A7] mx-auto mb-3" />
            <p className="font-black text-lg text-[#1B5E20] mb-1">No Active Task</p>
            <p className="text-sm font-bold text-[#558B2F] mb-4">Head to the Word Bank to create a weekly task.</p>
            <button onClick={() => navigate('/words')} className="forest-btn">Go to Word Bank</button>
          </div>
        )}
      </div>
    </Layout>
  );
}

function DailyStat({ icon: Icon, label, value, color }) {
  return (
    <div className="flex items-center gap-2 p-3 rounded-xl bg-[#F1F8E9]">
      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${color}15` }}>
        <Icon className="w-4 h-4" style={{ color }} />
      </div>
      <div>
        <div className="text-[10px] font-bold text-[#558B2F] uppercase leading-tight">{label}</div>
        <div className="text-lg font-black text-[#1B5E20] leading-tight">{value}</div>
      </div>
    </div>
  );
}
