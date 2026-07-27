import React, { useState, useEffect } from 'react';
import { fetchIssues, resolveIssue, fetchErrorLogs, clearErrorLogs } from '../../services/api';
import { Terminal, Bug, CheckCircle, Trash2, Loader, Database, AlertTriangle } from 'lucide-react';

const DeveloperDashboard = ({ sessionUser }) => {
  const [issues, setIssues] = useState([]);
  const [errorLogs, setErrorLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setIsLoading(true);
    const [iData, eData] = await Promise.all([fetchIssues(), fetchErrorLogs()]);
    // 내림차순 정렬
    setIssues(iData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
    setErrorLogs(eData);
    setIsLoading(false);
  };

  const handleResolveIssue = async (id) => {
    if (window.confirm("이 문의/오류를 해결 처리하시겠습니까?")) {
      const res = await resolveIssue(id);
      if (res.success) {
        alert("해결 처리되었습니다.");
        loadData();
      }
    }
  };

  const handleClearErrors = async () => {
    if (window.confirm("모든 오류 로그를 삭제하시겠습니까?")) {
      await clearErrorLogs();
      loadData();
    }
  };

  if (isLoading) return <div style={{ padding: '3rem', textAlign: 'center' }}><Loader className="spin" size={32} /></div>;

  const openIssues = issues.filter(i => i.status === 'open');
  const resolvedIssues = issues.filter(i => i.status === 'resolved');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div className="page-header" style={{ marginBottom: 0 }}>
        <h1 className="page-title"><Terminal className="icon" /> 개발자 대시보드</h1>
        <p className="page-subtitle">시스템 상태 모니터링 및 사용자 문의(버그/기능) 사항을 관리합니다.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
        
        {/* Issue Tracker */}
        <div className="card" style={{ gridColumn: '1 / -1' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}><Bug size={20} /> 사용자 제보 이슈 (Issue Tracker)</h3>
          
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
            <div style={{ padding: '1rem', backgroundColor: '#FEF2F2', borderRadius: '8px', flex: 1 }}>
              <div style={{ color: 'var(--danger-color)', fontWeight: 600 }}>미해결 (Open)</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{openIssues.length}건</div>
            </div>
            <div style={{ padding: '1rem', backgroundColor: '#F0FDF4', borderRadius: '8px', flex: 1 }}>
              <div style={{ color: 'var(--success-color)', fontWeight: 600 }}>해결됨 (Resolved)</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{resolvedIssues.length}건</div>
            </div>
          </div>

          {issues.length === 0 ? (
            <div className="empty-state">등록된 이슈가 없습니다.</div>
          ) : (
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>상태</th>
                    <th>유형</th>
                    <th>제보자</th>
                    <th>내용</th>
                    <th>접수일시</th>
                    <th>액션</th>
                  </tr>
                </thead>
                <tbody>
                  {issues.map(issue => (
                    <tr key={issue.id}>
                      <td>
                        {issue.status === 'open' 
                          ? <span className="badge badge-danger">미해결</span> 
                          : <span className="badge badge-success">해결됨</span>
                        }
                      </td>
                      <td>
                        {issue.issueType === 'bug' && '🐛 버그'}
                        {issue.issueType === 'feature' && '💡 기능건의'}
                        {issue.issueType === 'other' && '💬 기타'}
                      </td>
                      <td>{issue.authorName}</td>
                      <td style={{ maxWidth: '300px', whiteSpace: 'normal' }}>{issue.content}</td>
                      <td>{new Date(issue.createdAt).toLocaleString()}</td>
                      <td>
                        {issue.status === 'open' && (
                          <button className="btn btn-sm btn-outline" onClick={() => handleResolveIssue(issue.id)}>
                            <CheckCircle size={14} /> 해결 처리
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* System Error Logs */}
        <div className="card">
          <div className="card-header">
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><AlertTriangle size={20} color="var(--danger-color)" /> 시스템 오류 로그 (React ErrorBoundary)</h3>
            {errorLogs.length > 0 && (
              <button className="btn btn-sm btn-outline" onClick={handleClearErrors}><Trash2 size={14} /> 기록 삭제</button>
            )}
          </div>
          
          {errorLogs.length === 0 ? (
            <div className="empty-state">기록된 시스템 오류가 없습니다.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {errorLogs.map(log => (
                <div key={log.id} style={{ padding: '1rem', border: '1px solid #FCA5A5', backgroundColor: '#FEF2F2', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>{log.time}</div>
                  <div style={{ fontWeight: 600, color: 'var(--danger-color)', marginBottom: '0.5rem' }}>{log.message}</div>
                  <pre style={{ fontSize: '0.75rem', backgroundColor: '#fff', padding: '0.5rem', borderRadius: '4px', overflowX: 'auto' }}>
                    {log.stack}
                  </pre>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
export default DeveloperDashboard;
