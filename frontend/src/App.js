import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import AuthPage from "@/pages/AuthPage";
import StudentDashboard from "@/pages/StudentDashboard";
import WordBank from "@/pages/WordBank";
import PreGame from "@/pages/PreGame";
import GamePlay from "@/pages/GamePlay";
import LearnPage from "@/pages/LearnPage";
import MyTasks from "@/pages/MyTasks";
import TeacherDashboard from "@/pages/TeacherDashboard";

function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center forest-bg">
      <div className="text-center animate-float">
        <div className="w-16 h-16 rounded-full bg-[#2E7D32] mx-auto mb-4 flex items-center justify-center">
          <span className="text-white font-black text-2xl">S</span>
        </div>
        <p className="font-bold text-[#2E7D32]">Loading...</p>
      </div>
    </div>
  );
  if (!user) return <Navigate to="/" />;
  if (role && user.role !== role) return <Navigate to={user.role === 'teacher' ? '/teacher' : '/dashboard'} />;
  return children;
}

function AppRoutes() {
  const { user, loading } = useAuth();
  if (loading) return null;
  return (
    <Routes>
      <Route path="/" element={user ? <Navigate to={user.role === 'teacher' ? '/teacher' : '/dashboard'} /> : <AuthPage />} />
      <Route path="/dashboard" element={<ProtectedRoute role="student"><StudentDashboard /></ProtectedRoute>} />
      <Route path="/words" element={<ProtectedRoute role="student"><WordBank /></ProtectedRoute>} />
      <Route path="/play" element={<ProtectedRoute role="student"><PreGame /></ProtectedRoute>} />
      <Route path="/game" element={<ProtectedRoute role="student"><GamePlay /></ProtectedRoute>} />
      <Route path="/learn" element={<ProtectedRoute role="student"><LearnPage /></ProtectedRoute>} />
      <Route path="/tasks" element={<ProtectedRoute role="student"><MyTasks /></ProtectedRoute>} />
      <Route path="/teacher" element={<ProtectedRoute role="teacher"><TeacherDashboard /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
