import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import StudentPage from './components/StudentPage';
import TeacherPage from './components/TeacherPage';
import LoginPage from './components/LoginPage';
import { AuthProvider, useAuth } from './context/AuthContext';
import { GraduationCap, UserCog, LogOut } from 'lucide-react';

function ProtectedRoute({ children, role }: { children: React.ReactNode, role?: 'student' | 'teacher' }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div className="min-h-screen flex items-center justify-center">Yuklanmoqda...</div>;
  
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (role && user.role !== role) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function Navbar() {
  const { user, logout } = useAuth();
  if (!user) return null;

  return (
    <nav className="glass fixed top-0 left-0 right-0 z-50 px-6 py-4 flex justify-between items-center">
      <Link to="/" className="font-bold text-xl text-slate-900">ExamPortal</Link>
      <div className="flex items-center gap-4">
        <span className="text-sm text-slate-500 font-medium">
          {user.username} ({user.role === 'teacher' ? "O'qituvchi" : "Talaba"})
        </span>
        <button 
          onClick={logout}
          className="p-2 hover:bg-red-50 text-red-500 rounded-lg transition-colors"
          title="Chiqish"
        >
          <LogOut size={20} />
        </button>
      </div>
    </nav>
  );
}

function Home() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-slate-50 to-indigo-50">
      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold text-slate-900 mb-4 tracking-tight">English Speaking Exam</h1>
        <p className="text-slate-500 text-lg">Imtihon topshirish va baholash tizimi</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl w-full">
        <Link to="/student" className="group">
          <div className="glass p-10 rounded-[2.5rem] text-center hover:bg-indigo-600 hover:text-white transition-all duration-500 transform hover:-translate-y-2">
            <div className="w-20 h-20 bg-indigo-100 rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:bg-white/20 transition-colors">
              <GraduationCap size={40} className="text-indigo-600 group-hover:text-white" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Talaba</h2>
            <p className="opacity-70">Imtihon topshirish va audio yozish</p>
          </div>
        </Link>

        <Link to="/teacher" className="group">
          <div className="glass p-10 rounded-[2.5rem] text-center hover:bg-slate-900 hover:text-white transition-all duration-500 transform hover:-translate-y-2">
            <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:bg-white/20 transition-colors">
              <UserCog size={40} className="text-slate-900 group-hover:text-white" />
            </div>
            <h2 className="text-2xl font-bold mb-2">O'qituvchi</h2>
            <p className="opacity-70">Natijalarni ko'rish va baholash</p>
          </div>
        </Link>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen pt-16">
          <Navbar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<LoginPage />} />
            <Route 
              path="/student" 
              element={
                <ProtectedRoute role="student">
                  <StudentPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/teacher" 
              element={
                <ProtectedRoute role="teacher">
                  <TeacherPage />
                </ProtectedRoute>
              } 
            />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}
