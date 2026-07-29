import React, { useState, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, NavLink, useNavigate, Link, useLocation } from 'react-router-dom';
import { 
  Users, BookOpen, Clock, LogOut, Home, 
  Search, Terminal, BarChart2, Printer, Shield, RefreshCw, Loader, MessageSquare, UserCog
} from 'lucide-react';

import Login from './components/Auth/Login';
import SupportModal from './components/SupportModal';
import ProfileModal from './components/Teacher/ProfileModal';
import { logError, prefetchAll, subscribeToRealtime } from './services/api';

// Lazy loaded components
const AdminStatistics = lazy(() => import('./components/Admin/AdminStatistics'));
const StudentManage = lazy(() => import('./components/Admin/StudentManage'));
const TermManage = lazy(() => import('./components/Admin/TermManage'));
const SubjectManage = lazy(() => import('./components/Admin/SubjectManage'));
const ArchiveViewer = lazy(() => import('./components/Admin/ArchiveViewer'));
const ClassManage = lazy(() => import('./components/Admin/ClassManage'));
const UserManage = lazy(() => import('./components/Admin/UserManage'));
const ErrorLogs = lazy(() => import('./components/Admin/ErrorLogs'));

const DeveloperDashboard = lazy(() => import('./components/Developer/DeveloperDashboard'));

const StaffDashboard = lazy(() => import('./components/Staff/StaffDashboard'));
const StudentProfile = lazy(() => import('./components/Staff/StudentProfile'));
const WeeklyReportPrint = lazy(() => import('./components/Staff/WeeklyReportPrint'));

const HomeroomDashboard = lazy(() => import('./components/Teacher/HomeroomDashboard'));
const SubjectDashboard = lazy(() => import('./components/Teacher/SubjectDashboard'));

class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false }; }
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error, errorInfo) { logError(error.toString(), errorInfo.componentStack); }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '3rem', textAlign: 'center' }}>
          <h2 style={{ color: 'var(--danger-color)' }}>시스템 오류가 발생했습니다.</h2>
          <button className="btn btn-primary" onClick={() => window.location.href='/'}>메인으로 돌아가기</button>
        </div>
      );
    }
    return this.props.children;
  }
}

function App() {
  const [sessionUser, setSessionUser] = useState(() => {
    const saved = localStorage.getItem('sessionUser');
    return saved ? JSON.parse(saved) : null;
  }); 
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [isPrefetching, setIsPrefetching] = useState(false);

  React.useEffect(() => {
    if (sessionUser && !isDataLoaded && !isPrefetching) {
      setIsPrefetching(true);
      prefetchAll().then(() => {
        setIsDataLoaded(true);
        setIsPrefetching(false);
        subscribeToRealtime(); // Initialize Realtime WebSocket
      }).catch(err => {
        console.error("Prefetch error", err);
        setIsDataLoaded(true);
        setIsPrefetching(false);
      });
    }
  }, [sessionUser, isDataLoaded, isPrefetching]);

  React.useEffect(() => {
    if (sessionUser) {
      localStorage.setItem('sessionUser', JSON.stringify(sessionUser));
    } else {
      localStorage.removeItem('sessionUser');
    }
  }, [sessionUser]);


  const isAdminOrDeveloper = sessionUser?.role === 'admin' || sessionUser?.role === 'developer';
  const isDeveloper = sessionUser?.role === 'developer';

  const ProtectedRoute = ({ children, allowedRoles }) => {
    if (!sessionUser) return <Navigate to="/login" replace />;
    if (sessionUser.role === 'admin' || sessionUser.role === 'developer') return children;
    if (allowedRoles && !allowedRoles.includes(sessionUser.role)) return <Navigate to="/unauthorized" replace />;
    return children;
  };

  const Sidebar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [assignedInfo, setAssignedInfo] = useState('');

    React.useEffect(() => {
      const getAssignments = async () => {
        if (sessionUser.role !== 'teacher') return;
        const { fetchClasses, fetchSubjects } = await import('./services/api');
        const classes = await fetchClasses();
        const subjects = await fetchSubjects();
        
        const myClasses = classes.filter(c => c.teacherId === sessionUser.id || c.subTeacherId === sessionUser.id);
        const mySubjects = subjects.filter(s => s.teacherId === sessionUser.id);
        
        let info = [];
        if (myClasses.length > 0) {
          info.push(myClasses.map(c => `${c.grade}학년 ${c.className}반 담임`).join(', '));
        }
        if (mySubjects.length > 0) {
          info.push(mySubjects.map(s => `${s.name} 과목`).join(', '));
        }
        setAssignedInfo(info.join(' / '));
      };
      getAssignments();
    }, [sessionUser.id]);

    return (
      <aside className="sidebar">
        <div className="brand" onClick={() => navigate('/')} style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <img src="/logo_main.png" alt="GIA Logo" style={{ height: '50px', objectFit: 'contain', maxWidth: '100%' }} />
        </div>
      
        <div style={{ padding: '0 1rem', marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>접속 계정</div>
          <div style={{ fontWeight: 600, color: 'var(--primary-color)' }}>{sessionUser.name} ({sessionUser.role})</div>
          {assignedInfo && <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem', lineHeight: '1.3' }}>{assignedInfo}</div>}
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '0.25rem' }}>
          
          {(sessionUser.role === 'teacher' || isAdminOrDeveloper) && (
            <>
              <div style={{ padding: '1rem', color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 700 }}>TEACHER</div>
              <NavLink to="/teacher/homeroom" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                <Home size={20} style={{ flexShrink: 0 }} />
                <div style={{ display: 'flex', flexDirection: 'column', lineHeight: '1.2', whiteSpace: 'nowrap' }}>
                  <span>내 담임반</span>
                  <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>Homeroom</span>
                </div>
              </NavLink>
              <NavLink to="/teacher/subjects" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                <BookOpen size={20} style={{ flexShrink: 0 }} />
                <div style={{ display: 'flex', flexDirection: 'column', lineHeight: '1.2', whiteSpace: 'nowrap' }}>
                  <span>내 담당과목</span>
                  <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>My Subjects</span>
                </div>
              </NavLink>
            </>
          )}

          {(sessionUser.role === 'staff' || isAdminOrDeveloper) && (
            <>
              <div style={{ padding: '1rem', color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 700 }}>STAFF</div>
              <NavLink to="/staff" end className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                <Search size={20} style={{ flexShrink: 0 }} />
                <div style={{ display: 'flex', flexDirection: 'column', lineHeight: '1.2', whiteSpace: 'nowrap' }}>
                  <span>전교생 현황</span>
                  <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>Student Status</span>
                </div>
              </NavLink>
              <NavLink to="/staff/weekly-report" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                <Printer size={20} style={{ flexShrink: 0 }} />
                <div style={{ display: 'flex', flexDirection: 'column', lineHeight: '1.2', whiteSpace: 'nowrap' }}>
                  <span>주간보고서 프린트</span>
                  <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>Weekly Report</span>
                </div>
              </NavLink>
            </>
          )}

          {isDeveloper && (
            <div className="sidebar-group">
              <div className="sidebar-group-title">개발자 전용</div>
              <Link to="/dev/dashboard" className={`nav-item ${location.pathname.startsWith('/dev/dashboard') ? 'active' : ''}`}>
                <Terminal size={18} style={{ flexShrink: 0 }} />
                <div style={{ display: 'flex', flexDirection: 'column', lineHeight: '1.2', whiteSpace: 'nowrap' }}>
                  <span>개발자 대시보드</span>
                  <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>Dev Dashboard</span>
                </div>
              </Link>
            </div>
          )}

          {isAdminOrDeveloper && (
            <div className="sidebar-group">
              <div className="sidebar-group-title">관리자 대시보드 (Admin Dashboard)</div>
              <Link to="/admin/dashboard" className={`nav-item ${location.pathname === '/admin/dashboard' ? 'active' : ''}`}>
                <BarChart2 size={18} style={{ flexShrink: 0 }} />
                <div style={{ display: 'flex', flexDirection: 'column', lineHeight: '1.2', whiteSpace: 'nowrap' }}>
                  <span>경영 통계 대시보드</span>
                  <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>Statistics</span>
                </div>
              </Link>
              <Link to="/admin/archive" className={`nav-item ${location.pathname === '/admin/archive' ? 'active' : ''}`}>
                <Clock size={18} style={{ flexShrink: 0 }} />
                <div style={{ display: 'flex', flexDirection: 'column', lineHeight: '1.2', whiteSpace: 'nowrap' }}>
                  <span>보관함 데이터 열람</span>
                  <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>Archive</span>
                </div>
              </Link>
            </div>
          )}
          
          {isAdminOrDeveloper && (
            <div className="sidebar-group">
              <div className="sidebar-group-title">학사 관리 (Academic Mgmt)</div>
              <Link to="/admin/classes" className={`nav-item ${location.pathname.startsWith('/admin/classes') ? 'active' : ''}`}>
                <Home size={18} style={{ flexShrink: 0 }} />
                <div style={{ display: 'flex', flexDirection: 'column', lineHeight: '1.2', whiteSpace: 'nowrap' }}>
                  <span>반/담임 배정 관리</span>
                  <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>Classes</span>
                </div>
              </Link>
              <Link to="/admin/subjects" className={`nav-item ${location.pathname.startsWith('/admin/subjects') ? 'active' : ''}`}>
                <BookOpen size={18} style={{ flexShrink: 0 }} />
                <div style={{ display: 'flex', flexDirection: 'column', lineHeight: '1.2', whiteSpace: 'nowrap' }}>
                  <span>과목반 세팅</span>
                  <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>Subjects</span>
                </div>
              </Link>
              <Link to="/admin/students" className={`nav-item ${location.pathname.startsWith('/admin/students') ? 'active' : ''}`}>
                <Users size={18} style={{ flexShrink: 0 }} />
                <div style={{ display: 'flex', flexDirection: 'column', lineHeight: '1.2', whiteSpace: 'nowrap' }}>
                  <span>학생 명부 관리</span>
                  <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>Students</span>
                </div>
              </Link>
              <Link to="/admin/users" className={`nav-item ${location.pathname.startsWith('/admin/users') ? 'active' : ''}`}>
                <Shield size={18} style={{ flexShrink: 0 }} />
                <div style={{ display: 'flex', flexDirection: 'column', lineHeight: '1.2', whiteSpace: 'nowrap' }}>
                  <span>교직원 계정 승인</span>
                  <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>Accounts</span>
                </div>
              </Link>
              <Link to="/admin/terms" className={`nav-item ${location.pathname.startsWith('/admin/terms') ? 'active' : ''}`}>
                <Clock size={18} style={{ flexShrink: 0 }} />
                <div style={{ display: 'flex', flexDirection: 'column', lineHeight: '1.2', whiteSpace: 'nowrap' }}>
                  <span>학기 관리</span>
                  <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>Terms</span>
                </div>
              </Link>
            </div>
          )}

          <button className="nav-item" onClick={() => setIsSupportModalOpen(true)} style={{ marginTop: 'auto' }}>
            <MessageSquare size={20} style={{ flexShrink: 0 }} />
            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: '1.2', alignItems: 'flex-start', whiteSpace: 'nowrap' }}>
              <span>문의 및 지원</span>
              <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>Support</span>
            </div>
          </button>
          
          <button className="nav-item" onClick={() => setIsProfileModalOpen(true)}>
            <UserCog size={20} style={{ flexShrink: 0 }} />
            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: '1.2', alignItems: 'flex-start', whiteSpace: 'nowrap' }}>
              <span>프로필 설정</span>
              <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>Profile</span>
            </div>
          </button>
          <button className="nav-item nav-logout" onClick={() => setSessionUser(null)}>
            <LogOut size={20} style={{ flexShrink: 0 }} />
            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: '1.2', alignItems: 'flex-start', whiteSpace: 'nowrap' }}>
              <span>로그아웃</span>
              <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>Logout</span>
            </div>
          </button>
          {sessionUser?.originalUser && (
            <button 
              className="nav-item" 
              onClick={() => {
                setSessionUser(sessionUser.originalUser);
                alert("관리자 계정으로 복귀했습니다.");
              }}
              style={{ backgroundColor: '#FEF2F2', color: '#EF4444', borderTop: '1px solid #FCA5A5' }}
            >
              <RefreshCw size={20} style={{ flexShrink: 0 }} />
              <div style={{ display: 'flex', flexDirection: 'column', lineHeight: '1.2', alignItems: 'flex-start', whiteSpace: 'nowrap' }}>
                <span style={{ fontWeight: 'bold' }}>관리자로 복귀</span>
                <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>Return Admin</span>
              </div>
            </button>
          )}
        </nav>
      </aside>
    );
  };

  return (
    <ErrorBoundary>
      <Router>
        {isSupportModalOpen && <SupportModal sessionUser={sessionUser} onClose={() => setIsSupportModalOpen(false)} />}
        {isProfileModalOpen && <ProfileModal sessionUser={sessionUser} onClose={() => setIsProfileModalOpen(false)} />}
        <Routes>
          <Route path="/login" element={sessionUser ? <Navigate to="/" replace /> : <Login setSession={setSessionUser} />} />
          <Route path="/*" element={
            <div className="app-container">
              {sessionUser && isDataLoaded && <Sidebar />}
              {sessionUser && !isDataLoaded ? (
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', width: '100vw', height: '100vh', gap: '1rem', backgroundColor: '#f8fafc' }}>
                  <Loader className="spin" size={48} color="var(--primary-color)" />
                  <h3 style={{ color: 'var(--text-secondary)' }}>실시간 데이터를 동기화 중입니다... (최초 1회)</h3>
                </div>
              ) : (
                <main className="main-content" style={!sessionUser ? { margin: 0, padding: 0, maxWidth: '100%' } : {}}>
                <Suspense fallback={<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}><Loader className="spin" size={32} /></div>}>
                  <Routes>
                    <Route path="/" element={<Navigate to={sessionUser?.role === 'admin' ? '/admin/dashboard' : sessionUser?.role === 'developer' ? '/dev/dashboard' : sessionUser?.role === 'staff' ? '/staff' : '/teacher/homeroom'} replace />} />
                    
                    {/* Developer Routes */}
                    <Route path="/dev/dashboard" element={<ProtectedRoute allowedRoles={['developer']}><DeveloperDashboard sessionUser={sessionUser} /></ProtectedRoute>} />

                    {/* Teacher Routes */}
                    <Route path="/teacher/homeroom" element={<ProtectedRoute allowedRoles={['teacher']}><HomeroomDashboard sessionUser={sessionUser} /></ProtectedRoute>} />
                    <Route path="/teacher/subjects" element={<ProtectedRoute allowedRoles={['teacher']}><SubjectDashboard sessionUser={sessionUser} /></ProtectedRoute>} />
                    
                    {/* Staff Routes */}
                    <Route path="/staff" element={<ProtectedRoute allowedRoles={['staff']}><StaffDashboard sessionUser={sessionUser} /></ProtectedRoute>} />
                    <Route path="/staff/student/:id" element={<ProtectedRoute allowedRoles={['staff']}><StudentProfile sessionUser={sessionUser} /></ProtectedRoute>} />
                    <Route path="/staff/weekly-report" element={<ProtectedRoute allowedRoles={['staff']}><WeeklyReportPrint sessionUser={sessionUser} /></ProtectedRoute>} />
                    
                    {/* Admin Routes */}
                    <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={['admin']}><AdminStatistics sessionUser={sessionUser} /></ProtectedRoute>} />
                    <Route path="/admin/archive" element={<ProtectedRoute allowedRoles={['admin']}><ArchiveViewer sessionUser={sessionUser} /></ProtectedRoute>} />
                    <Route path="/admin/classes" element={<ProtectedRoute allowedRoles={['admin']}><ClassManage sessionUser={sessionUser} /></ProtectedRoute>} />
                    <Route path="/admin/subjects" element={<ProtectedRoute allowedRoles={['admin']}><SubjectManage sessionUser={sessionUser} /></ProtectedRoute>} />
                    <Route path="/admin/students" element={<ProtectedRoute allowedRoles={['admin']}><StudentManage sessionUser={sessionUser} /></ProtectedRoute>} />
                    <Route path="/admin/terms" element={<ProtectedRoute allowedRoles={['admin']}><TermManage sessionUser={sessionUser} /></ProtectedRoute>} />
                    <Route path="/admin/users" element={<ProtectedRoute allowedRoles={['admin', 'developer']}><UserManage sessionUser={sessionUser} setSessionUser={setSessionUser} /></ProtectedRoute>} />
                    <Route path="/admin/errors" element={<ProtectedRoute allowedRoles={['admin']}><ErrorLogs sessionUser={sessionUser} /></ProtectedRoute>} />
                    
                    <Route path="/unauthorized" element={<div style={{ padding: '3rem', textAlign: 'center' }}><h2>권한이 없습니다.</h2><button onClick={() => setSessionUser(null)} className="btn btn-outline">로그아웃</button></div>} />
                  </Routes>
                </Suspense>
                </main>
              )}
            </div>
          } />
        </Routes>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
