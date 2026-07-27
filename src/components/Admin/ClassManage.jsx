import React, { useState, useEffect } from 'react';
import { fetchClasses, saveClass, deleteClass, fetchUsers } from '../../services/api';
import { Loader, Trash2, Edit, Plus, Users } from 'lucide-react';

const ClassManage = () => {
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ id: '', grade: '', className: '', teacherId: '', subTeacherId: '' });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setIsLoading(true);
    const [cData, uData] = await Promise.all([fetchClasses(), fetchUsers()]);
    setClasses(cData);
    setTeachers(uData.filter(u => u.role === 'teacher' || u.role === 'admin' || u.role === 'developer'));
    setIsLoading(false);
  };

  const handleOpenModal = (c = null) => {
    if (c) setFormData(c);
    else setFormData({ id: '', grade: '', className: '', teacherId: '', subTeacherId: '' });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    await saveClass(formData);
    await loadData();
    setIsSaving(false);
    setIsModalOpen(false);
  };

  const handleDelete = async (id) => {
    if(!window.confirm("정말 이 학급을 삭제하시겠습니까? (기존 학생 데이터는 유지됩니다)")) return;
    setIsLoading(true);
    await deleteClass(id);
    await loadData();
  };

  return (
    <div className="card">
      <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2><Users className="icon" /> 학급(반) 및 담임 배정 관리</h2>
        <button className="btn btn-primary" onClick={() => handleOpenModal()}>
          <Plus size={18} style={{marginRight: '0.25rem'}} /> 학급 추가
        </button>
      </div>

      {isLoading ? (
        <div style={{ padding: '3rem', textAlign: 'center' }}><Loader className="spin" size={32} /></div>
      ) : classes.length === 0 ? (
        <div className="empty-state">등록된 학급이 없습니다. 학급을 추가하고 담임 선생님을 배정하세요.</div>
      ) : (
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>학년</th>
                <th>반 이름</th>
                <th>주 담임</th>
                <th>부 담임</th>
                <th style={{ width: '150px', textAlign: 'right' }}>관리</th>
              </tr>
            </thead>
            <tbody>
              {classes.map(c => {
                const teacher = teachers.find(t => t.id === c.teacherId);
                return (
                  <tr key={c.id}>
                    <td><span className="badge badge-primary">{c.grade}학년</span></td>
                    <td style={{ fontWeight: 600 }}>{c.className}</td>
                    <td>{teacher ? `${teacher.name} (${teacher.username})` : <span style={{color:'var(--danger-color)'}}>미배정</span>}</td>
                    <td>{c.subTeacherId ? teachers.find(t => t.id === c.subTeacherId)?.name || '알수없음' : <span style={{color:'var(--text-secondary)'}}>-</span>}</td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        <button className="btn btn-outline" onClick={() => handleOpenModal(c)}><Edit size={16} /></button>
                        <button className="btn btn-danger" onClick={() => handleDelete(c.id)}><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{formData.id ? '학급 수정' : '새 학급 추가'}</h3>
              <button className="btn-close" onClick={() => setIsModalOpen(false)}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">학년</label>
                  <input type="number" className="form-control" value={formData.grade} onChange={e => setFormData({...formData, grade: e.target.value})} required placeholder="예: 1" />
                </div>
                <div className="form-group">
                  <label className="form-label">반 이름</label>
                  <input type="text" className="form-control" value={formData.className} onChange={e => setFormData({...formData, className: e.target.value})} required placeholder="예: 1반 (또는 송죽반)" />
                </div>
                <div className="form-group">
                  <label className="form-label">주 담임 선생님 배정</label>
                  <select className="form-control" value={formData.teacherId} onChange={e => setFormData({...formData, teacherId: e.target.value})} required>
                    <option value="">-- 담임 선택 --</option>
                    {teachers.map(t => (
                      <option key={t.id} value={t.id}>{t.name} ({t.username})</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">부 담임 선생님 배정 (선택)</label>
                  <select className="form-control" value={formData.subTeacherId} onChange={e => setFormData({...formData, subTeacherId: e.target.value})}>
                    <option value="">-- 부담임 없음 --</option>
                    {teachers.map(t => (
                      <option key={`sub-${t.id}`} value={t.id}>{t.name} ({t.username})</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)}>취소</button>
                <button type="submit" className="btn btn-primary" disabled={isSaving}>
                  {isSaving ? <Loader className="spin" size={18} /> : '저장하기'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default ClassManage;
