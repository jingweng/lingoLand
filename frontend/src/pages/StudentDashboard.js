import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import Layout from '@/components/Layout';
import api from '@/lib/api';
import { Trophy, BookOpen, Gamepad2, Plus, Star, TrendingUp, Leaf, Lightbulb, CalendarDays, Check } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

const LEVEL_LABELS = ['New', 'Spelled', 'Meaning', 'Mastered'];
const LEVEL_COLORS = ['#90A4AE', '#FBC02D', '#66BB6A', '#FF8F00'];

export default function StudentDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [activeTask, setActiveTask] = useState(null);

  useEffect(() => {
    api.get('/stats').then(r => setStats(r.data)).catch(() => {});
    api.get('/game/sessions').then(r => setSessions(r.data.slice(0, 5))).catch(() => {});
    api.get('/tasks/active').then(r => { if (r.data) setActiveTask(r.data); }).catch(() => {});
  }, []);

  const masteryPct = stats ? (stats.level_counts?.['3'] || 0) / Math.max(stats.total_words, 1) * 100 : 0;

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
          <button
            onClick={() => navigate('/play')}
            data-testid="play-now-btn"
            className="forest-btn flex items-center gap-2 text-lg"
          >
            <Gamepad2 className="w-5 h-5" /> Test Now
          </button>
        </div>

        {/* Weekly Task */}
        {activeTask && (
          <div className="bg-white rounded-3xl border-4 border-[#FBC02D] shadow-[8px_8px_0_#F9A825] p-6" data-testid="weekly-task-widget">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-black text-[#F57F17] flex items-center gap-2">
                <CalendarDays className="w-6 h-6" /> Weekly Task
              </h2>
              <span className="text-sm font-bold text-[#F57F17]/70">{activeTask.words.length} words</span>
            </div>
            <div className="flex gap-2 mb-4">
              {activeTask.schedule.map((day) => (
                <div
                  key={day.day}
                  className={`flex-1 p-3 rounded-2xl text-center border-2 transition-all ${
                    day.completed
                      ? 'bg-[#C8E6C9] border-[#4CAF50]'
                      : 'bg-white border-[#E0E0E0]'
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
              <button
                onClick={() => navigate('/learn')}
                data-testid="task-learn-btn"
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-[#0288D1] text-white font-bold hover:bg-[#0277BD] transition-colors"
              >
                <Lightbulb className="w-4 h-4" /> Learn
              </button>
              <button
                onClick={() => navigate('/play')}
                data-testid="task-test-btn"
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-[#E65100] text-white font-bold hover:bg-[#BF360C] transition-colors"
              >
                <Gamepad2 className="w-4 h-4" /> Test
              </button>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <StatCard icon={BookOpen} label="Total Words" value={stats?.total_words || 0} color="#2E7D32" />
          <StatCard icon={Star} label="Words Mastered" value={stats?.level_counts?.['3'] || 0} color="#FF8F00" />
          <StatCard icon={Trophy} label="Total Score" value={stats?.total_score || 0} color="#FBC02D" />
          <StatCard icon={TrendingUp} label="Games Played" value={stats?.total_sessions || 0} color="#0288D1" />
        </div>

        {/* Mastery + Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Mastery Overview */}
          <div className="bg-white rounded-3xl border-4 border-[#A5D6A7] shadow-[8px_8px_0_#C8E6C9] p-6" data-testid="mastery-overview">
            <h2 className="text-xl font-black text-[#1B5E20] mb-4">Mastery Progress</h2>
            <div className="mb-4">
              <div className="flex justify-between text-sm font-bold text-[#558B2F] mb-2">
                <span>Overall Mastery</span>
                <span>{Math.round(masteryPct)}%</span>
              </div>
              <Progress value={masteryPct} className="h-4 rounded-full" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[0,1,2,3].map(lv => (
                <div key={lv} className="flex items-center gap-2 p-3 rounded-xl bg-[#F1F8E9]">
                  <div className="w-3 h-3 rounded-full" style={{ background: LEVEL_COLORS[lv] }} />
                  <div>
                    <div className="text-xs font-bold text-[#558B2F] uppercase">{LEVEL_LABELS[lv]}</div>
                    <div className="text-lg font-black text-[#1B5E20]">{stats?.level_counts?.[String(lv)] || 0}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="space-y-4">
            <div
              onClick={() => navigate('/words')}
              className="bg-white rounded-3xl border-4 border-[#A5D6A7] shadow-[8px_8px_0_#C8E6C9] p-6 cursor-pointer hover:shadow-[4px_4px_0_#C8E6C9] hover:translate-x-1 hover:translate-y-1 transition-all"
              data-testid="go-word-bank"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[#E8F5E9] flex items-center justify-center">
                  <Plus className="w-6 h-6 text-[#2E7D32]" />
                </div>
                <div>
                  <h3 className="font-black text-lg text-[#1B5E20]">Add Words</h3>
                  <p className="text-sm font-bold text-[#558B2F]">Build your word bank with new words</p>
                </div>
              </div>
            </div>

            {/* Recent Games */}
            <div className="bg-white rounded-3xl border-4 border-[#A5D6A7] shadow-[8px_8px_0_#C8E6C9] p-6" data-testid="recent-games">
              <h3 className="font-black text-lg text-[#1B5E20] mb-3">Recent Games</h3>
              {sessions.length === 0 ? (
                <p className="text-sm font-bold text-[#558B2F]">No games yet! Start playing to see your history.</p>
              ) : (
                <div className="space-y-2">
                  {sessions.map((s, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-[#F1F8E9]">
                      <div className="flex items-center gap-2">
                        <Gamepad2 className="w-4 h-4 text-[#2E7D32]" />
                        <span className="text-sm font-bold text-[#1B5E20]">
                          {s.words_played?.length || 0} words
                        </span>
                      </div>
                      <span className="score-display text-base">{s.total_score} pts</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="bg-white rounded-3xl border-4 border-[#A5D6A7] shadow-[4px_4px_0_#C8E6C9] p-5 flex items-center gap-4">
      <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: `${color}15` }}>
        <Icon className="w-6 h-6" style={{ color }} />
      </div>
      <div>
        <div className="text-xs font-bold text-[#558B2F] uppercase tracking-wide">{label}</div>
        <div className="text-2xl font-black text-[#1B5E20]">{value}</div>
      </div>
    </div>
  );
}
