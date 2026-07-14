import React, { useState, useEffect } from 'react';
import { fetchErrorLogs, clearErrorLogs } from '../../services/api';
import { AlertTriangle, Copy, Trash2 } from 'lucide-react';

const ErrorLogs = () => {
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadLogs = async () => {
    setIsLoading(true);
    const data = await fetchErrorLogs();
    setLogs(data);
    setIsLoading(false);
  };

  useEffect(() => { loadLogs(); }, []);

  const handleCopy = (log) => {
    const textToCopy = `Error Time: ${log.time}\nMessage: ${log.message}\nStack: ${log.stack}`;
    navigator.clipboard.writeText(textToCopy);
    alert('오류 내용이 복사되었습니다. AI에게 붙여넣어 문의하세요.');
  };

  const handleClear = async () => {
    if (window.confirm('모든 오류 로그를 삭제하시겠습니까?')) {
      await clearErrorLogs();
      await loadLogs();
    }
  };

  // 강제 에러 발생 테스트
  const triggerTestError = () => {
    try {
      throw new Error("테스트용 강제 에러가 발생했습니다.");
    } catch (error) {
      // API 모듈의 logError를 직접 부를 수도 있지만 App.jsx의 ErrorBoundary에서 잡히게 하는게 맞습니다.
      // 여기서는 시연을 위해 의도적인 버튼이므로 전역 핸들러에게 맡기지 않고 바로 던집니다.
      throw error; 
    }
  };

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">시스템 오류 로그</h1>
          <p className="page-subtitle">발생한 시스템 오류를 확인하고 복사하여 담당자(AI)에게 전달하세요.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="btn btn-outline" onClick={triggerTestError} style={{ borderColor: 'var(--danger-color)', color: 'var(--danger-color)' }}>
            에러 발생 테스트
          </button>
          <button className="btn btn-outline" onClick={handleClear}>
            <Trash2 size={18} /> 로그 비우기
          </button>
        </div>
      </div>

      <div className="report-list">
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}>불러오는 중...</div>
        ) : logs.length === 0 ? (
          <div className="empty-state">
            <AlertTriangle className="empty-state-icon" size={48} style={{ color: 'var(--success-color)' }} />
            <h3>기록된 오류가 없습니다.</h3>
            <p>시스템이 정상적으로 동작하고 있습니다.</p>
          </div>
        ) : (
          logs.map(log => (
            <div key={log.id} className="card" style={{ borderLeft: '4px solid var(--danger-color)', marginBottom: '1rem', padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div>
                  <h3 style={{ color: 'var(--danger-color)', fontSize: '1.1rem', marginBottom: '0.25rem' }}>{log.message}</h3>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>발생 시각: {log.time} | ID: {log.id}</span>
                </div>
                <button className="btn btn-primary btn-sm" onClick={() => handleCopy(log)}>
                  <Copy size={16} /> 에러 내용 복사하기
                </button>
              </div>
              {log.stack && (
                <pre style={{ background: '#111827', color: '#E5E7EB', padding: '1rem', borderRadius: 'var(--radius-md)', overflowX: 'auto', fontSize: '0.85rem', whiteSpace: 'pre-wrap' }}>
                  {log.stack}
                </pre>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ErrorLogs;
