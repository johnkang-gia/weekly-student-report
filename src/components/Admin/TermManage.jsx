import React, { useState, useEffect } from 'react';
import { fetchTerms, saveTerm } from '../../services/api';
import { CalendarDays, Save, CheckCircle } from 'lucide-react';

const TermManage = () => {
  const [terms, setTerms] = useState([]);
  const [formData, setFormData] = useState({ id: '', name: '', isActive: false });
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const loadData = async () => {
    const data = await fetchTerms();
    setTerms(data);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    await saveTerm(formData);
    await loadData();
    
    setIsLoading(false);
    setIsSuccess(true);
    handleCancel();
    setTimeout(() => setIsSuccess(false), 3000);
  };

  const handleEdit = (term) => {
    setFormData(term);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setFormData({ id: '', name: '', isActive: false });
    setIsEditing(false);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">학기 관리</h1>
          <p className="page-subtitle">새로운 학기(예: 썸머캠프1)를 생성하고 현재 진행중인 학기를 활성화합니다.</p>
        </div>
      </div>

      {isSuccess && (
        <div className="alert alert-success">
          <CheckCircle size={20} /> 학기 정보가 저장되었습니다.
        </div>
      )}

      <div className="card">
        <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CalendarDays size={20} /> {isEditing ? '학기 수정' : '새 학기 생성'}
        </h3>
        
        <form onSubmit={handleSubmit} className="form-grid" style={{ marginBottom: '1rem', gridTemplateColumns: '2fr 1fr' }}>
          <div className="form-group">
            <label className="form-label">학기 명칭</label>
            <input 
              type="text" 
              className="form-control" 
              placeholder="예: 2026 썸머캠프 2"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              required
            />
          </div>
          
          <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '1rem', paddingTop: '2rem' }}>
            <input 
              type="checkbox" 
              id="isActiveTerm"
              style={{ width: '1.25rem', height: '1.25rem' }}
              checked={formData.isActive}
              onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
            />
            <label htmlFor="isActiveTerm" style={{ fontWeight: 600, cursor: 'pointer' }}>
              현재 진행중인 학기로 설정 (활성화)
            </label>
          </div>
        </form>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={isLoading || !formData.name}>
            <Save size={18} /> 저장하기
          </button>
          {isEditing && (
            <button className="btn btn-outline" onClick={handleCancel}>취소</button>
          )}
        </div>
      </div>

      <div className="card" style={{ marginTop: '2rem' }}>
        <h3 style={{ marginBottom: '1.5rem' }}>생성된 학기 목록</h3>
        <table className="data-table">
          <thead>
            <tr>
              <th>학기 ID</th>
              <th>학기 명칭</th>
              <th>상태</th>
              <th>관리</th>
            </tr>
          </thead>
          <tbody>
            {terms.map(t => (
              <tr key={t.id}>
                <td><span className="badge">{t.id}</span></td>
                <td style={{ fontWeight: 600 }}>{t.name}</td>
                <td>
                  {t.isActive ? (
                    <span className="badge badge-success">진행중</span>
                  ) : (
                    <span className="badge" style={{ backgroundColor: '#F3F4F6', color: 'var(--text-secondary)' }}>종료됨</span>
                  )}
                </td>
                <td>
                  <button className="btn btn-sm btn-outline" onClick={() => handleEdit(t)}>수정</button>
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
