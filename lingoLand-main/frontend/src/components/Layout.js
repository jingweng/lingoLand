import { useAuth } from '@/context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { BookOpen, TreePine, LogOut, Gamepad2, GraduationCap, Library, Lightbulb, ClipboardList } from 'lucide-react';

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  const navItems = user?.role === 'teacher'
    ? [{ path: '/teacher', label: 'Dashboard', icon: GraduationCap }]
    : [
        { path: '/dashboard', label: 'Home', icon: TreePine },
        { path: '/words', label: 'Word Bank', icon: Library },
        { path: '/learn', label: 'Learn', icon: Lightbulb },
        { path: '/play', label: 'Test', icon: Gamepad2 },
        { path: '/tasks', label: 'My Tasks', icon: ClipboardList },
      ];

  return (
    <div className="min-h-screen forest-bg">
      <nav className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b-4 border-[#A5D6A7]" data-testid="main-nav">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={() => navigate(user?.role === 'teacher' ? '/teacher' : '/dashboard')}
              className="flex items-center gap-2 group"
              data-testid="nav-logo"
            >
              <BookOpen className="w-8 h-8 text-[#2E7D32] group-hover:animate-wiggle" />
              <span className="font-black text-xl text-[#1B5E20] hidden sm:block">Lingo Land</span>
            </button>

            <div className="flex items-center gap-1 sm:gap-2">
              {navItems.map(item => (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  data-testid={`nav-${item.label.toLowerCase().replace(' ', '-')}`}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-bold text-sm transition-all ${
                    isActive(item.path)
                      ? 'bg-[#2E7D32] text-white shadow-md'
                      : 'text-[#2E7D32] hover:bg-[#E8F5E9]'
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{item.label}</span>
                </button>
              ))}
              <div className="w-px h-8 bg-[#A5D6A7] mx-1" />
              <span className="text-sm font-bold text-[#558B2F] hidden md:block">{user?.username}</span>
              <button
                onClick={() => { logout(); navigate('/'); }}
                data-testid="nav-logout"
                className="p-2 rounded-xl text-[#795548] hover:bg-red-50 hover:text-red-500 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {children}
      </main>
    </div>
  );
}
