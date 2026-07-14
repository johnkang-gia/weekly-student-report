import React, { useState, useEffect } from 'react';
import { fetchStudents, saveStudent } from '../../services/api';
import { UserPlus, Save, Users, CheckCircle } from 'lucide-react';

const StudentManage = () => {
  const [students, setStudents] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  const [formData, setFormData] = useState({ id: '', name: '', grade: '', className: '' });

  const loadData = async () => {
    const data = await fetchStudents();
    setStudents(data);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    await saveStudent(formData);
    await loadData();
    
    setIsLoading(false);
    setIsSuccess(true);
    setFormData({ id: '', name: '', grade: '', className: '' });
    setIsEditing(false);
    setTimeout(() => setIsSuccess(false), 3000);
  };

  const handleEdit = (student) => {
    setFormData(student);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setFormData({ id: '', name: '', grade: '', className: '' });
    setIsEditing(false);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">학생 관리</h1>
          <p className="page-subtitle">새로운 학생을 등록하거나 정보를 수정합니다. 학생 코드는 자동 부여됩니다.</p>
        </div>
      </div>

      {isSuccess && (
        <div className="alert alert-success">
          <CheckCircle size={20} />
          성공적으로 저장되었습니다!
        </div>
      )}

      <div className="card">
        <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <UserPlus size={20} /> {isEditing ? '학생 정보 수정' : '새 학생 등록'}
        </h3>
        
        <form onSubmit={handleSubmit} className="form-grid" style={{ marginBottom: '1rem' }}>
          {isEditing && (
            <div className="form-group">
              <label className="form-label">학생 코드 (수정 불가)</label>
              <input type="text" className="form-control" value={formData.id} disabled />
            </div>
          )}
          
          <div className="form-group">
            <label className="form-label">학생 이름</label>
            <input 
              type="text" 
              className="form-control" 
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">학년</label>
            <select 
              className="form-control"
              value={formData.grade}
              onChange={(e) => setFormData({...formData, grade: e.target.value})}
              required
            >
              <option value="" disabled>학년 선택</option>
              <option value="1학년">1학년</option>
              <option value="2학년">2학년</option>
              <option value="3학년">3학년</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">반</label>
            <input 
              type="text" 
              className="form-control" 
              placeholder="예: 1반, A반"
              value={formData.className}
              onChange={(e) => setFormData({...formData, className: e.target.value})}
              required
            />
          </div>
        </form>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={isLoading || !formData.name || !formData.grade || !formData.className}>
            <Save size={18} /> 저장하기
          </button>
          {isEditing && (
            <button className="btn btn-outline" onClick={handleCancel}>취소</button>
          )}
        </div>
      </div>

      <div className="card" style={{ marginTop: '2rem' }}>
        <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Users size={20} /> 등록된 학생 목록
        </h3>
        <table className="data-table">
          <thead>
            <tr>
              <th>학생 코드</th>
              <th>이름</th>
              <th>학년</th>
              <th>반</th>
              <th>관리</th>
            </tr>
          </thead>
          <tbody>
            {students.map(s => (
              <tr key={s.id}>
                <td><span className="badge">{s.id}</span></td>
                <td style={{ fontWeight: 600 }}>{s.name}</td>
                <td>{s.grade}</td>
                <td>{s.className}</td>
                <td>
                  <button className="btn btn-sm btn-outline" onClick={() => handleEdit(s)}>수정</button>
                </td>
              </tr>
            ))}
            {students.length === 0 && (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                  등록된 학생이 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StudentManage;
