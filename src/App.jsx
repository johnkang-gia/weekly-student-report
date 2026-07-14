import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { BookOpen, Users, ClipboardList, CalendarDays, LogOut, Shield, Bug, UserCog } from 'lucide-react';

import Login from './components/Auth/Login';
import ReportForm from './components/Teacher/ReportForm';
import StudentManage from './components/Teacher/StudentManage';
import SubjectManage from './components/Teacher/SubjectManage';
import ReportStatus from './components/Teacher/ReportStatus';
import AdminDashboard from './components/Admin/AdminDashboard';
import TermManage from './components/Admin/TermManage';
import UserManage from './components/Admin/UserManage';
import ErrorLogs from './components/Admin/ErrorLogs';
import { logError } from './services/api';

// --- Error Boundary ---
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    logError(error.toString(), errorInfo.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '3rem', textAlign: 'center' }}>
          <h2 style={{ color: 'var(--danger-color)' }}>시스템 오류가 발생했습니다.</h2>
          <p>오류가 기록되었습니다. 페이지를 새로고침 하거나 관리자에게 문의하세요.</p>
          <button className="btn btn-primary" onClick={() => window.location.href='/'} style={{marginTop: '1rem'}}>
            메인으로 돌아가기
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function App() {
  // Session: { id, username, role, name }
  const [sessionUser, setSessionUser] = useState(null); 

  // Protected Route
  const ProtectedRoute = ({ children, allowedRoles }) => {
    if (!sessionUser) return <Navigate to="/login" replace />;
    
    // 관리자(admin)는 무조건 모든 페이지(allowedRoles와 무관하게) 패스
    if (sessionUser.role === 'admin') return children;
    
    if (allowedRoles && !allowedRoles.includes(sessionUser.role)) {
      return <Navigate to="/unauthorized" replace />;
    }
    return children;
  };

  const handleLogout = () => setSessionUser(null);

  const Sidebar = () => {
    const navigate = useNavigate();
    return (
      <aside className="sidebar">
        <div className="brand" onClick={() => navigate('/admin/dashboard')} style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <img src="/logo_main.png" alt="GIA Logo" style={{ height: '50px', objectFit: 'contain', maxWidth: '100%' }} />
        </div>
      
      <div style={{ padding: '0 1rem', marginBottom: '1.5rem' }}>
        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>접속 계정</div>
        <div style={{ fontWeight: 600, color: 'var(--primary-color)' }}>{sessionUser.name} ({sessionUser.role})</div>
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '0.25rem' }}>
        
        {/* 선생님 및 공통 메뉴 */}
        {(sessionUser.role === 'teacher' || sessionUser.role === 'admin') && (
          <>
            <div style={{ padding: '1rem', color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 700 }}>TEACHER</div>
            <NavLink to="/teacher/status" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <Users size={20} /> 리포트 현황판
            </NavLink>
            <NavLink to="/teacher/report" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <ClipboardList size={20} /> 리포트 작성
            </NavLink>
            <NavLink to="/teacher/subjects" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <BookOpen size={20} /> 나의 과목반 관리
            </NavLink>
          </>
        )}

        {/* 교직원, 선생님 공통 (학생 등록) */}
        {(sessionUser.role === 'teacher' || sessionUser.role === 'staff' || sessionUser.role === 'admin') && (
          <>
            {(sessionUser.role === 'staff' || sessionUser.role === 'admin') && <div style={{ padding: '1rem', color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 700 }}>STAFF & TEACHER</div>}
            <NavLink to="/teacher/students" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <Users size={20} /> 학생 등록 및 관리
            </NavLink>
          </>
        )}

        {/* 모든 권한(교사, 교직원, 관리자)이 대시보드를 열람 가능 (교직원은 메모, 관리자는 수정) */}
        <NavLink to="/admin/dashboard" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Shield size={20} /> 통합 대시보드
        </NavLink>

        {/* 관리자 전용 메뉴 */}
        {sessionUser.role === 'admin' && (
          <>
            <div style={{ padding: '1rem', color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 700 }}>ADMIN ONLY</div>
            <NavLink to="/admin/terms" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <CalendarDays size={20} /> 학기 관리
            </NavLink>
            <NavLink to="/admin/users" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <UserCog size={20} /> 계정 관리
            </NavLink>
            <NavLink to="/admin/errors" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <Bug size={20} /> 오류 로그
            </NavLink>
          </>
        )}

        <button className="nav-item nav-logout" onClick={handleLogout} style={{ marginTop: 'auto' }}>
          <LogOut size={20} /> 로그아웃
        </button>
      </nav>
    </aside>
    );
  };

  return (
    <ErrorBoundary>
      <Router>
        <Routes>
          <Route path="/login" element={
            sessionUser ? <Navigate to="/admin/dashboard" replace /> : <Login setSession={setSessionUser} />
          } />
          
          <Route path="/*" element={
            <div className="app-container">
              {sessionUser && <Sidebar />}
              <main className="main-content" style={!sessionUser ? { margin: 0, padding: 0, maxWidth: '100%' } : {}}>
                <Routes>
                  <Route path="/" element={<Navigate to="/login" replace />} />
                  
                  <Route path="/teacher/status" element={<ProtectedRoute allowedRoles={['teacher', 'admin']}><ReportStatus sessionUser={sessionUser} /></ProtectedRoute>} />
                  <Route path="/teacher/report" element={<ProtectedRoute allowedRoles={['teacher', 'admin']}><ReportForm sessionUser={sessionUser} /></ProtectedRoute>} />
                  <Route path="/teacher/subjects" element={<ProtectedRoute allowedRoles={['teacher', 'admin']}><SubjectManage sessionUser={sessionUser} /></ProtectedRoute>} />
                  <Route path="/teacher/students" element={<ProtectedRoute allowedRoles={['teacher', 'staff', 'admin']}><StudentManage /></ProtectedRoute>} />
                  
                  <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={['teacher', 'staff', 'admin']}><AdminDashboard sessionUser={sessionUser} /></ProtectedRoute>} />
                  
                  <Route path="/admin/terms" element={<ProtectedRoute allowedRoles={['admin']}><TermManage /></ProtectedRoute>} />
                  <Route path="/admin/users" element={<ProtectedRoute allowedRoles={['admin']}><UserManage /></ProtectedRoute>} />
                  <Route path="/admin/errors" element={<ProtectedRoute allowedRoles={['admin']}><ErrorLogs /></ProtectedRoute>} />
                  
                  <Route path="/unauthorized" element={<div style={{ padding: '3rem', textAlign: 'center' }}><h2>권한이 없습니다.</h2><button onClick={handleLogout} className="btn btn-outline" style={{marginTop: '1rem'}}>돌아가기</button></div>} />
                </Routes>
              </main>
            </div>
          } />
        </Routes>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
