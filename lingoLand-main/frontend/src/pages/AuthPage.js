import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { BookOpen, TreePine, Sparkles, Eye, EyeOff } from 'lucide-react';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState('student');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      let user;
      if (isLogin) {
        user = await login(email, password);
      } else {
        if (!username.trim()) { setError('Please enter a username'); setLoading(false); return; }
        user = await register(username, email, password, role);
      }
      navigate(user.role === 'teacher' ? '/teacher' : '/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || 'Something went wrong');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(180deg, #E8F5E9 0%, #C8E6C9 50%, #A5D6A7 100%)' }}>
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8 animate-slide-up">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white border-4 border-[#2E7D32] shadow-[0_6px_0_#1B5E20] mb-4">
            <BookOpen className="w-10 h-10 text-[#2E7D32]" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-[#1B5E20] tracking-tight" data-testid="app-title">
            Lingo Land
          </h1>
          <p className="text-lg font-bold text-[#558B2F] mt-1 flex items-center justify-center gap-1">
            <TreePine className="w-5 h-5" /> Jason's Word Adventure <Sparkles className="w-5 h-5" />
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl border-4 border-[#A5D6A7] shadow-[8px_8px_0_#C8E6C9] p-6 sm:p-8 animate-pop-in" data-testid="auth-card">
          <div className="flex rounded-2xl bg-[#E8F5E9] p-1 mb-6">
            <button
              onClick={() => setIsLogin(true)}
              data-testid="auth-login-tab"
              className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all ${isLogin ? 'bg-[#2E7D32] text-white shadow-md' : 'text-[#2E7D32]'}`}
            >
              Log In
            </button>
            <button
              onClick={() => setIsLogin(false)}
              data-testid="auth-register-tab"
              className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all ${!isLogin ? 'bg-[#2E7D32] text-white shadow-md' : 'text-[#2E7D32]'}`}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <>
                <div>
                  <label className="block text-sm font-bold text-[#1B5E20] mb-1">I am a...</label>
                  <div className="flex gap-2">
                    {['student', 'teacher'].map(r => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setRole(r)}
                        data-testid={`role-${r}`}
                        className={`flex-1 py-3 rounded-2xl font-bold text-base border-4 transition-all capitalize ${
                          role === r
                            ? 'border-[#2E7D32] bg-[#E8F5E9] text-[#1B5E20] shadow-[0_4px_0_#1B5E20]'
                            : 'border-[#C8E6C9] bg-white text-[#558B2F] hover:border-[#A5D6A7]'
                        }`}
                      >
                        {r === 'student' ? 'Student' : 'Teacher'}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-[#1B5E20] mb-1">Username</label>
                  <input
                    type="text"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    data-testid="auth-username"
                    placeholder="Your cool name"
                    className="w-full bg-white border-4 border-[#A5D6A7] rounded-2xl px-4 py-3 text-lg font-bold text-[#1B5E20] placeholder:text-[#A5D6A7] focus:outline-none focus:border-[#2E7D32] focus:ring-4 focus:ring-[#A5D6A7]/30 transition-all"
                  />
                </div>
              </>
            )}
            <div>
              <label className="block text-sm font-bold text-[#1B5E20] mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                data-testid="auth-email"
                placeholder="your@email.com"
                required
                className="w-full bg-white border-4 border-[#A5D6A7] rounded-2xl px-4 py-3 text-lg font-bold text-[#1B5E20] placeholder:text-[#A5D6A7] focus:outline-none focus:border-[#2E7D32] focus:ring-4 focus:ring-[#A5D6A7]/30 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-[#1B5E20] mb-1">Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  data-testid="auth-password"
                  placeholder="Secret password"
                  required
                  className="w-full bg-white border-4 border-[#A5D6A7] rounded-2xl px-4 py-3 pr-12 text-lg font-bold text-[#1B5E20] placeholder:text-[#A5D6A7] focus:outline-none focus:border-[#2E7D32] focus:ring-4 focus:ring-[#A5D6A7]/30 transition-all"
                />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#558B2F] p-1">
                  {showPw ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            {error && <p className="text-red-500 font-bold text-sm text-center" data-testid="auth-error">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              data-testid="auth-submit"
              className="w-full forest-btn text-lg disabled:opacity-50"
            >
              {loading ? 'Loading...' : isLogin ? 'Log In' : 'Create Account'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
