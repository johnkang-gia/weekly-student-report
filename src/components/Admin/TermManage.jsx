import React, { useState, useEffect } from 'react';
import { fetchTerms, saveTerm, archiveTerm } from '../../services/api';
import { CalendarDays, CheckCircle, Clock, Archive } from 'lucide-react';

const TermManage = () => {
  const [terms, setTerms] = useState([]);
  const [newTermName, setNewTermName] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const loadTerms = async () => {
    setIsLoading(true);
    const data = await fetchTerms();
    setTerms(data);
    setIsLoading(false);
  };

  useEffect(() => { loadTerms(); }, []);

  const handleCreateTerm = async (e) => {
    e.preventDefault();
    if (!newTermName.trim()) return;
    await saveTerm({ name: newTermName, isActive: false });
    setNewTermName('');
    await loadTerms();
  };

  const handleActivate = async (termId) => {
    if (window.confirm('이 학기를 활성화 하시겠습니까? (다른 학기는 비활성화 됩니다)')) {
      await saveTerm({ id: termId, isActive: true });
      await loadTerms();
    }
  };

  const handleArchive = async (termId) => {
    if (window.confirm('정말 이 학기를 보관(Archive) 처리 하시겠습니까?\n모든 데이터가 보관소로 이동되며 더 이상 메인 목록에서 수정할 수 없습니다.')) {
      await archiveTerm(termId);
      await loadTerms();
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">학기 (Term) 관리</h1>
        <p className="page-subtitle">리포트를 작성할 학기를 생성하고, 현재 진행 중인 학기를 선택하거나 지난 학기를 보관합니다.</p>
      </div>

      <div className="card form-grid">
        <form className="form-group" style={{ gridColumn: '1 / -1', display: 'flex', gap: '1rem', alignItems: 'flex-end' }} onSubmit={handleCreateTerm}>
          <div style={{ flex: 1 }}>
            <label className="form-label">새로운 학기 이름 (예: 2026 썸머캠프 1차)</label>
            <input type="text" className="form-control" value={newTermName} onChange={(e) => setNewTermName(e.target.value)} required />
          </div>
          <button type="submit" className="btn btn-primary" style={{ whiteSpace: 'nowrap' }}>학기 생성</button>
        </form>
      </div>

      <div className="card">
        <table className="data-table">
          <thead>
            <tr>
              <th>학기 이름</th>
              <th>상태</th>
              <th>관리 (아카이빙)</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? <tr><td colSpan="3" style={{ textAlign: 'center' }}>로딩중...</td></tr> : 
             terms.map(t => (
              <tr key={t.id} style={{ opacity: t.isArchived ? 0.5 : 1 }}>
                <td style={{ fontWeight: t.isActive ? 700 : 400 }}>{t.name}</td>
                <td>
                  {t.isArchived ? (
                    <span className="badge" style={{ backgroundColor: '#E5E7EB', color: '#374151', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <Archive size={14}/> 보관됨
                    </span>
                  ) : t.isActive ? (
                    <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <CheckCircle size={14}/> 활성 학기
                    </span>
                  ) : (
                    <span className="badge" style={{ backgroundColor: '#E5E7EB', color: '#6B7280', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={14}/> 대기중
                    </span>
                  )}
                </td>
                <td>
                  {!t.isArchived && !t.isActive && (
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className="btn btn-sm btn-outline" style={{ borderColor: 'var(--success-color)', color: 'var(--success-color)' }} onClick={() => handleActivate(t.id)}>활성화</button>
                      <button className="btn btn-sm btn-outline" onClick={() => handleArchive(t.id)}><Archive size={14} style={{marginRight:'4px'}}/>아카이브로 이동</button>
                    </div>
                  )}
                  {t.isActive && <span style={{ fontSize: '0.85rem', color: 'var(--success-color)' }}>진행 중</span>}
                  {t.isArchived && <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>보관 처리 완료</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TermManage;
