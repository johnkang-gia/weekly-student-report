import React, { useState, useEffect } from 'react';
import { fetchSubjects, saveSubject, deleteSubject, fetchStudents } from '../../services/api';
import { Plus, Users, Trash2, CheckSquare, Square } from 'lucide-react';

const SubjectManage = ({ sessionUser }) => {
  const [subjects, setSubjects] = useState([]);
  const [students, setStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [newSubjectName, setNewSubjectName] = useState('');
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [enrollSearch, setEnrollSearch] = useState('');

  const loadData = async () => {
    setIsLoading(true);
    const [subData, stuData] = await Promise.all([fetchSubjects(), fetchStudents()]);
    // Only show subjects owned by this user (or all if admin)
    const mySubjects = sessionUser.role === 'admin' ? subData : subData.filter(s => s.teacherId === sessionUser.id);
    setSubjects(mySubjects);
    setStudents(stuData);
    setIsLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const handleCreateSubject = async (e) => {
    e.preventDefault();
    if (!newSubjectName.trim()) return;
    await saveSubject({ name: newSubjectName, teacherId: sessionUser.id, studentIds: [] });
    setNewSubjectName('');
    await loadData();
  };

  const handleDeleteSubject = async (id) => {
    if (window.confirm('정말 이 과목반을 삭제하시겠습니까? (작성된 리포트는 유지됩니다)')) {
      await deleteSubject(id);
      if (selectedSubject && selectedSubject.id === id) setSelectedSubject(null);
      await loadData();
    }
  };

  const toggleEnrollment = async (studentId) => {
    if (!selectedSubject) return;
    const currentIds = selectedSubject.studentIds || [];
    let newIds;
    if (currentIds.includes(studentId)) newIds = currentIds.filter(id => id !== studentId);
    else newIds = [...currentIds, studentId];

    const updated = { ...selectedSubject, studentIds: newIds };
    setSelectedSubject(updated); // Optimistic UI
    await saveSubject(updated);
    await loadData();
  };

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(enrollSearch.toLowerCase()) || 
    (s.className && s.className.toLowerCase().includes(enrollSearch.toLowerCase()))
  );

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">나의 과목반 관리</h1>
        <p className="page-subtitle">내가 담당하는 과목반을 개설하고 전체 학생 명부에서 수강생을 배정합니다.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
        
        {/* Left: Subject List */}
        <div>
          <div className="card">
            <h3 style={{ marginBottom: '1rem' }}>과목반 목록</h3>
            <form onSubmit={handleCreateSubject} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
              <input type="text" className="form-control" placeholder="새 과목 이름 (예: 코딩반)" value={newSubjectName} onChange={(e) => setNewSubjectName(e.target.value)} required />
              <button type="submit" className="btn btn-primary"><Plus size={16} /></button>
            </form>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {isLoading ? <div>로딩중...</div> : subjects.length === 0 ? <div style={{ color: 'var(--text-secondary)' }}>개설된 과목반이 없습니다.</div> : subjects.map(sub => (
                <div 
                  key={sub.id} 
                  style={{ 
                    padding: '1rem', border: `1px solid ${selectedSubject?.id === sub.id ? sub.color : 'var(--border-color)'}`, 
                    borderRadius: 'var(--radius-md)', cursor: 'pointer', 
                    backgroundColor: selectedSubject?.id === sub.id ? `${sub.color}10` : '#fff',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                  }}
                  onClick={() => setSelectedSubject(sub)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: sub.color }}></div>
                    <strong style={{ color: selectedSubject?.id === sub.id ? sub.color : 'var(--text-primary)' }}>{sub.name}</strong>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span className="badge">수강생 {(sub.studentIds || []).length}명</span>
                    <button className="btn btn-sm btn-outline" style={{ border: 'none', padding: '0.2rem', color: 'var(--danger-color)' }} onClick={(e) => { e.stopPropagation(); handleDeleteSubject(sub.id); }}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Student Enrollment */}
        <div>
          {selectedSubject ? (
            <div className="card" style={{ borderTop: `4px solid ${selectedSubject.color}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3>{selectedSubject.name} <span style={{ fontWeight: 400, color: 'var(--text-secondary)' }}>학생 배정</span></h3>
                <span className="badge" style={{ backgroundColor: selectedSubject.color, color: '#fff' }}>현재 {(selectedSubject.studentIds || []).length}명 배정됨</span>
              </div>
              
              <div className="search-input" style={{ marginBottom: '1rem' }}>
                <input type="text" className="form-control" placeholder="학생 이름이나 반(Class)으로 검색..." value={enrollSearch} onChange={(e) => setEnrollSearch(e.target.value)} />
              </div>

              <div style={{ maxHeight: '500px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
                {filteredStudents.length === 0 ? <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>검색 결과가 없습니다.</div> : (
                  <table className="data-table" style={{ margin: 0 }}>
                    <thead style={{ position: 'sticky', top: 0, backgroundColor: '#f9fafb', zIndex: 1 }}>
                      <tr>
                        <th style={{ width: '50px', textAlign: 'center' }}>선택</th>
                        <th>학년 / 반</th>
                        <th>이름</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredStudents.map(student => {
                        const isEnrolled = (selectedSubject.studentIds || []).includes(student.id);
                        return (
                          <tr key={student.id} onClick={() => toggleEnrollment(student.id)} style={{ cursor: 'pointer', backgroundColor: isEnrolled ? `${selectedSubject.color}08` : '#fff' }}>
                            <td style={{ textAlign: 'center' }}>
                              {isEnrolled ? <CheckSquare size={20} color={selectedSubject.color} /> : <Square size={20} color="#CBD5E1" />}
                            </td>
                            <td>{student.grade} {student.className}</td>
                            <td style={{ fontWeight: isEnrolled ? 600 : 400 }}>{student.name}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          ) : (
            <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '400px', color: 'var(--text-secondary)' }}>
              <Users size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
              <h3>과목반을 선택해주세요</h3>
              <p>좌측에서 과목을 선택하면 해당 수업을 듣는 학생들을 배정할 수 있습니다.</p>
            </div>
          )}
        </div>
        
      </div>
    </div>
  );
};

export default SubjectManage;
