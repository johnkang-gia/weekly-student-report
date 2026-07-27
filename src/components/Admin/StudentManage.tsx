import React, { useState, useEffect } from 'react';
import { fetchStudents, saveStudent, bulkSaveStudents, archiveStudent } from '../../services/api';
import { UserPlus, Save, Users, CheckCircle, ListPlus, X, Edit2, Archive } from 'lucide-react';

const StudentManage = () => {
  const [students, setStudents] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  // Bulk Upload State
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [bulkError, setBulkError] = useState('');
  
  const [formData, setFormData] = useState({ id: '', name: '', grade: '', className: '' });

  const loadData = async () => {
    setIsLoading(true);
    const data = await fetchStudents();
    setStudents(data.filter(s => s.status !== 'archived'));
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleArchive = async (student) => {
    if (window.confirm(`${student.name} 학생을 정말 보관함으로 이동하시겠습니까? (퇴소/전학 처리)\n기존 데이터는 보존되며 활성 명단에서만 사라집니다.`)) {
      const res = await archiveStudent(student.id);
      if (res.success) {
        alert("보관함으로 이동되었습니다.");
        loadData();
      } else {
        alert("이동 실패");
      }
    }
  };

  const handleBulkUpload = async () => {
    if (!bulkText.trim()) { setBulkError('텍스트를 입력해주세요.'); return; }
    
    // Parse TSV or CSV (Name \t Grade \t Class)
    const lines = bulkText.split('\n').filter(l => l.trim().length > 0);
    const parsedStudents = [];
    
    for (const line of lines) {
      const cols = line.split(/[\t,]/).map(c => c.trim()).filter(Boolean);
      if (cols.length >= 3) {
        parsedStudents.push({ name: cols[0], grade: cols[1], className: cols[2] });
      } else if (cols.length === 2) { // Just name and class
        parsedStudents.push({ name: cols[0], grade: '', className: cols[1] });
      } else if (cols.length === 1) { // Just name
        parsedStudents.push({ name: cols[0], grade: '', className: '' });
      }
    }
    
    if (parsedStudents.length === 0) {
      setBulkError('유효한 학생 데이터를 찾을 수 없습니다.');
      return;
    }
    
    if (window.confirm(`총 ${parsedStudents.length}명의 학생을 한 번에 등록하시겠습니까?`)) {
      await bulkSaveStudents(parsedStudents);
      setShowBulkModal(false);
      setBulkText('');
      setBulkError('');
      await loadData();
    }
  };

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
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">학생 관리</h1>
          <p className="page-subtitle">리포트를 작성할 학생을 한 명씩 등록하거나 엑셀에서 복사해 대량으로 등록합니다.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowBulkModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ListPlus size={16} /> 대량 등록 (복사/붙여넣기)
        </button>
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
                <td style={{ display: 'flex', gap: '0.5rem' }}>
                  <button className="btn btn-sm btn-outline" onClick={() => handleEdit(s)}>
                    <Edit2 size={14} /> 수정
                  </button>
                  <button className="btn btn-sm" style={{ backgroundColor: '#FEF2F2', color: 'var(--danger-color)', borderColor: '#FCA5A5' }} onClick={() => handleArchive(s)}>
                    <Archive size={14} /> 보관
                  </button>
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

      {/* Bulk Upload Modal */}
      {showBulkModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100 }}>
          <div className="card" style={{ width: '100%', maxWidth: '600px', position: 'relative' }}>
            <button onClick={() => setShowBulkModal(false)} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', cursor: 'pointer' }}><X size={24} /></button>
            <h2 style={{ marginBottom: '0.5rem' }}>학생 대량 등록</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
              엑셀이나 구글 시트에서 **[이름], [학년], [반]** 열을 그대로 복사해서 아래 상자에 붙여넣으세요.
            </p>
            
            {bulkError && <div className="alert alert-danger" style={{ marginBottom: '1rem' }}>{bulkError}</div>}
            
            <textarea 
              className="form-control" 
              rows={10} 
              placeholder="홍길동	1학년	A반&#13;&#10;김철수	2학년	B반" 
              value={bulkText} 
              onChange={(e) => setBulkText(e.target.value)}
              style={{ fontFamily: 'monospace', whiteSpace: 'pre' }}
            />
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
              <button className="btn btn-outline" onClick={() => setShowBulkModal(false)}>취소</button>
              <button className="btn btn-primary" onClick={handleBulkUpload}>붙여넣은 데이터로 등록하기</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentManage;
