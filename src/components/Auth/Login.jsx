import React, { useState } from 'react';
import { login, registerUser } from '../../services/api';
import { Shield, UserPlus, KeyRound, Loader, LogIn } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Login = ({ setSession }) => {
  const [isLoginMode, setIsLoginMode] = useState(true); // true: Login, false: Signup
  
  // Form State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('teacher'); // 'teacher' | 'staff'
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccessMsg('');

    const res = await login(username, password);
    setIsLoading(false);

    if (res.success) {
      setSession(res.user);
      
      // 권한별 첫 진입 페이지 라우팅
      if (res.user.role === 'admin') navigate('/admin/dashboard');
      else if (res.user.role === 'staff') navigate('/teacher/students');
      else navigate('/teacher/report');
    } else {
      setError(res.message);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    const res = await registerUser({ username, password, name, role });
    setIsLoading(false);
    
    if (res.success) {
      setSuccessMsg('회원가입이 요청되었습니다. 관리자의 승인을 기다려주세요.');
      setIsLoginMode(true);
      setUsername('');
      setPassword('');
    } else {
      setError(res.message);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h2>Weekly Report System V3</h2>
          <p>{isLoginMode ? '아이디와 비밀번호를 입력해 로그인하세요.' : '새로운 계정 생성을 요청합니다.'}</p>
        </div>

        {error && <div className="alert alert-danger">{error}</div>}
        {successMsg && <div className="alert alert-success">{successMsg}</div>}

        {isLoginMode ? (
          <form onSubmit={handleLogin} className="login-form">
            <div className="form-group">
              <label className="form-label">아이디</label>
              <div className="password-input-wrap">
                <LogIn className="input-icon" size={18} />
                <input type="text" className="form-control with-icon" value={username} onChange={(e) => setUsername(e.target.value)} required />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">비밀번호</label>
              <div className="password-input-wrap">
                <KeyRound className="input-icon" size={18} />
                <input type="password" className="form-control with-icon" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
              <small style={{ color: 'var(--text-secondary)', display: 'block', marginTop: '0.5rem' }}>
                초기 마스터 관리자: one2k / ruddnjs87!
              </small>
            </div>

            <button type="submit" className="btn btn-primary btn-block" disabled={isLoading || !username || !password}>
              {isLoading ? <Loader className="spin" size={18} /> : '로그인'}
            </button>
            
            <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>계정이 없으신가요? </span>
              <button type="button" onClick={() => { setIsLoginMode(false); setError(''); setSuccessMsg(''); }} style={{ background: 'none', border: 'none', color: 'var(--primary-color)', cursor: 'pointer', fontWeight: 600 }}>
                회원가입 요청
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleSignup} className="login-form">
            <div className="role-selector" style={{ marginBottom: '1.5rem' }}>
              <button type="button" className={`role-btn ${role === 'teacher' ? 'active' : ''}`} onClick={() => setRole('teacher')} style={{ padding: '1rem' }}>선생님</button>
              <button type="button" className={`role-btn ${role === 'staff' ? 'active' : ''}`} onClick={() => setRole('staff')} style={{ padding: '1rem' }}>교직원</button>
            </div>

            <div className="form-group">
              <label className="form-label">이름</label>
              <input type="text" className="form-control" value={name} onChange={(e) => setName(e.target.value)} required placeholder="실명을 입력하세요" />
            </div>

            <div className="form-group">
              <label className="form-label">아이디</label>
              <input type="text" className="form-control" value={username} onChange={(e) => setUsername(e.target.value)} required />
            </div>

            <div className="form-group">
              <label className="form-label">비밀번호</label>
              <input type="password" className="form-control" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>

            <button type="submit" className="btn btn-primary btn-block" disabled={isLoading || !username || !password || !name}>
              {isLoading ? <Loader className="spin" size={18} /> : '가입 요청하기'}
            </button>
            
            <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
              <button type="button" onClick={() => { setIsLoginMode(true); setError(''); }} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontWeight: 600 }}>
                &larr; 로그인으로 돌아가기
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default Login;
