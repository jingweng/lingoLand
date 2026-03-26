import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import api from '@/lib/api';
import { Users, BookOpen, AlertCircle, Trophy, ChevronRight, ArrowLeft, Gamepad2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const LEVEL_LABELS = ['New', 'Spelled', 'Meaning', 'Mastered'];
const LEVEL_COLORS = ['#90A4AE', '#FBC02D', '#66BB6A', '#FF8F00'];

export default function TeacherDashboard() {
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentWords, setStudentWords] = useState([]);
  const [studentErrors, setStudentErrors] = useState([]);
  const [studentSessions, setStudentSessions] = useState([]);
  const [view, setView] = useState('list');

  useEffect(() => {
    api.get('/teacher/students').then(r => setStudents(r.data)).catch(() => {});
  }, []);

  const selectStudent = async (student) => {
    setSelectedStudent(student);
    setView('detail');
    const [words, errors, sessions] = await Promise.all([
      api.get(`/teacher/students/${student.id}/words`).then(r => r.data).catch(() => []),
      api.get(`/teacher/students/${student.id}/errors`).then(r => r.data).catch(() => []),
      api.get(`/teacher/students/${student.id}/sessions`).then(r => r.data).catch(() => []),
    ]);
    setStudentWords(words);
    setStudentErrors(errors);
    setStudentSessions(sessions);
  };

  return (
    <Layout>
      <div className="space-y-6" data-testid="teacher-dashboard">
        {view === 'list' ? (
          <>
            <h1 className="text-3xl font-black text-[#1B5E20]">
              <Users className="w-8 h-8 inline mr-2" /> Teacher Dashboard
            </h1>

            {students.length === 0 ? (
              <div className="bg-white rounded-3xl border-4 border-[#A5D6A7] p-12 text-center">
                <Users className="w-12 h-12 text-[#A5D6A7] mx-auto mb-3" />
                <p className="text-lg font-bold text-[#558B2F]">No students registered yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="student-list">
                {students.map(s => (
                  <button
                    key={s.id}
                    onClick={() => selectStudent(s)}
                    data-testid={`student-card-${s.username}`}
                    className="bg-white rounded-3xl border-4 border-[#C8E6C9] p-5 text-left hover:border-[#66BB6A] hover:shadow-[4px_4px_0_#C8E6C9] transition-all group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#E8F5E9] flex items-center justify-center">
                          <span className="font-black text-[#2E7D32]">{s.username?.[0]?.toUpperCase()}</span>
                        </div>
                        <div>
                          <h3 className="font-black text-[#1B5E20]">{s.username}</h3>
                          <p className="text-xs font-bold text-[#558B2F]">{s.email}</p>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-[#A5D6A7] group-hover:text-[#2E7D32] transition-colors" />
                    </div>
                    <div className="flex gap-3 mt-3">
                      <div className="flex items-center gap-1 text-sm font-bold text-[#558B2F]">
                        <BookOpen className="w-4 h-4" /> {s.total_words} words
                      </div>
                      <div className="flex items-center gap-1 text-sm font-bold text-[#FF8F00]">
                        <Trophy className="w-4 h-4" /> {s.mastered_words} mastered
                      </div>
                    </div>
                    {s.total_words > 0 && (
                      <Progress value={(s.mastered_words / s.total_words) * 100} className="h-2 mt-3 rounded-full" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            {/* Student Detail View */}
            <div className="flex items-center gap-3 mb-4">
              <button onClick={() => setView('list')} data-testid="back-to-list" className="p-2 rounded-xl hover:bg-[#E8F5E9] text-[#2E7D32]">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-2xl font-black text-[#1B5E20]">{selectedStudent?.username}'s Progress</h1>
            </div>

            {/* Mastery Table */}
            <div className="bg-white rounded-3xl border-4 border-[#A5D6A7] shadow-[8px_8px_0_#C8E6C9] p-6" data-testid="mastery-table">
              <h2 className="text-xl font-black text-[#1B5E20] mb-4 flex items-center gap-2">
                <BookOpen className="w-5 h-5" /> Word Mastery Table
              </h2>
              {studentWords.length === 0 ? (
                <p className="text-base font-bold text-[#558B2F]">This student hasn't added any words yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="font-black text-[#1B5E20]">Word</TableHead>
                        <TableHead className="font-black text-[#1B5E20]">Level</TableHead>
                        <TableHead className="font-black text-[#1B5E20]">Status</TableHead>
                        <TableHead className="font-black text-[#1B5E20]">Added</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {studentWords.map(w => (
                        <TableRow key={w.id}>
                          <TableCell className="font-bold text-[#1B5E20] capitalize">{w.word}</TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              {[0,1,2,3].map(lv => (
                                <div key={lv} className="w-5 h-5 rounded-full border-2" style={{
                                  borderColor: LEVEL_COLORS[lv],
                                  background: w.level >= lv ? LEVEL_COLORS[lv] : 'transparent'
                                }} />
                              ))}
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className={`mastery-badge mastery-${w.level}`}>{LEVEL_LABELS[w.level]}</span>
                          </TableCell>
                          <TableCell className="text-sm font-bold text-[#558B2F]">
                            {new Date(w.created_at).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>

            {/* Error Logs */}
            <div className="bg-white rounded-3xl border-4 border-[#A5D6A7] shadow-[8px_8px_0_#C8E6C9] p-6" data-testid="error-logs">
              <h2 className="text-xl font-black text-[#1B5E20] mb-4 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-[#E57373]" /> Error Log
              </h2>
              {studentErrors.length === 0 ? (
                <p className="text-base font-bold text-[#558B2F]">No errors recorded yet.</p>
              ) : (
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {studentErrors.map((err, i) => (
                    <div key={i} className="p-4 rounded-2xl bg-[#FFF3F0] border-l-4 border-[#E57373]">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-black text-[#1B5E20] capitalize">{err.word}</span>
                        <span className="text-xs font-bold text-[#8D6E63]">{new Date(err.created_at).toLocaleDateString()}</span>
                      </div>
                      {err.sentence && <p className="text-sm font-bold text-[#795548] mb-2 italic">"{err.sentence}"</p>}
                      {err.errors?.map((e, j) => (
                        <p key={j} className="text-sm font-bold text-[#D32F2F]">
                          {e.type || e.word}: {e.detail || e.message || e.correction}
                        </p>
                      ))}
                      {err.error_type && !err.errors && (
                        <p className="text-sm font-bold text-[#D32F2F]">{err.error_type}: {err.error_detail}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Game Sessions */}
            <div className="bg-white rounded-3xl border-4 border-[#A5D6A7] shadow-[8px_8px_0_#C8E6C9] p-6" data-testid="game-sessions">
              <h2 className="text-xl font-black text-[#1B5E20] mb-4 flex items-center gap-2">
                <Gamepad2 className="w-5 h-5" /> Game Sessions
              </h2>
              {studentSessions.length === 0 ? (
                <p className="text-base font-bold text-[#558B2F]">No games played yet.</p>
              ) : (
                <div className="space-y-2">
                  {studentSessions.map((s, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-[#F1F8E9]">
                      <div>
                        <span className="font-bold text-[#1B5E20]">{s.words_played?.length || 0} words played</span>
                        <span className="text-xs font-bold text-[#558B2F] ml-2">{new Date(s.created_at).toLocaleDateString()}</span>
                      </div>
                      <span className="score-display text-base">{s.total_score} pts</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
