import React, { useState, useEffect } from 'react';
import { fetchStudents, fetchClasses, fetchReports, fetchSubjects, submitReport } from '../../services/api';
import { Loader, User, CheckCircle, Clock, Edit } from 'lucide-react';
import ReportFormModal from './ReportFormModal'; // We will create this

const HomeroomDashboard = ({ sessionUser }) => {
  const [myClass, setMyClass] = useState(null);
  const [students, setStudents] = useState([]);
  const [reports, setReports] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => { 
    loadData(); 
    
    const handleSync = () => loadData(false); // Background sync
    window.addEventListener('realtime-sync', handleSync);
    return () => window.removeEventListener('realtime-sync', handleSync);
  }, [sessionUser]);

  const loadData = async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    const [cData, sData, rData, subData] = await Promise.all([fetchClasses(), fetchStudents(), fetchReports(), fetchSubjects()]);
    
    // 내 담임반 찾기 (관리자는 모든 반 중 첫번째 반을 임시로 보여주거나, 접근 금지 처리)
    let targetClass = cData.find(c => c.teacherId === sessionUser.id || c.subTeacherId === sessionUser.id);
    
    if (!targetClass && sessionUser.role === 'admin' && cData.length > 0) {
      targetClass = cData[0]; // 관리자 테스트용
    }

    setMyClass(targetClass);

    if (targetClass) {
      const myStudents = sData.filter(s => String(s.grade) === String(targetClass.grade) && String(s.className) === String(targetClass.className));
      setStudents(myStudents);
    }
    
    // 이번 주 리포트
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    setReports(rData.filter(r => new Date(r.createdAt || r.date) >= oneWeekAgo)); // Fix for createdAt/date
    setSubjects(subData);
    
    if (showLoading) setIsLoading(false);
  };

  const handleStudentClick = (student) => {
    setSelectedStudent(student);
    setIsModalOpen(true);
  };

  if (isLoading) return <div style={{ padding: '3rem', textAlign: 'center' }}><Loader className="spin" size={32} /></div>;

  if (!myClass) return (
    <div className="card">
      <h2><User className="icon" /> 내 담임반 대시보드</h2>
      <div className="empty-state">배정된 담임반이 없습니다. 과목 교사이시라면 '내 담당과목' 메뉴를 이용해주세요.</div>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="card" style={{ backgroundColor: 'var(--primary-color)', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ color: 'white', margin: 0, marginBottom: '0.5rem' }}>{myClass.grade}학년 {myClass.className} (담임반)</h2>
          <p style={{ opacity: 0.9, margin: 0 }}>나의 반 학생들의 모든 리포트(담임 및 타교과)를 열람할 수 있습니다.</p>
        </div>
        <div style={{ fontSize: '2rem', fontWeight: 800 }}>
          {students.length}명
        </div>
      </div>

      <div className="card">
        <h3>학생 리스트 및 제출 현황 (이번 주)</h3>
        {students.length === 0 ? (
          <div className="empty-state">반에 등록된 학생이 없습니다.</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
            {students.map(student => {
              // 학생의 이번 주 모든 리포트
              const studentReports = reports.filter(r => r.studentId === student.id);
              const homeroomReport = studentReports.find(r => r.subject === '담임');
              const otherReports = studentReports.filter(r => r.subject !== '담임');

              return (
                <div 
                  key={student.id} 
                  className="hover-bg"
                  style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', border: '1px solid var(--border-color)', borderRadius: '8px', cursor: 'pointer' }}
                  onClick={() => handleStudentClick(student)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', minWidth: '160px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#F3F4F6', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 700, flexShrink: 0 }}>
                      {student.name.charAt(0)}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <div style={{ fontWeight: 600, fontSize: '1.1rem', wordBreak: 'keep-all' }}>{student.name}</div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', wordBreak: 'break-all' }}>{student.id}</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap', flex: 1, justifyContent: 'flex-end' }}>
                    {/* 담임 리포트 뱃지 */}
                    {homeroomReport ? (
                      homeroomReport.status === 'draft' ? (
                        <span className="badge" style={{ backgroundColor: '#FEF3C7', color: '#D97706', display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap', flexShrink: 0 }}>
                          <Edit size={14} /> 담임(임시저장)
                        </span>
                      ) : (
                        <span className="badge badge-success" style={{ display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap', flexShrink: 0 }}>
                          <CheckCircle size={14} /> 담임(완료)
                        </span>
                      )
                    ) : (
                      <span className="badge badge-danger" style={{ display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap', flexShrink: 0 }}>
                        <Clock size={14} /> 담임(미작성)
                      </span>
                    )}

                    {/* 타과목 리포트 뱃지 */}
                    {otherReports.map(r => (
                      <span key={r.id} className="badge badge-primary" style={{ opacity: 0.8, whiteSpace: 'nowrap', flexShrink: 0 }}>
                        {r.subject}
                      </span>
                    ))}
                    
                    <span style={{ color: 'var(--primary-color)', marginLeft: '0.5rem', flexShrink: 0 }}><Edit size={16} /></span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {isModalOpen && selectedStudent && (
        <ReportFormModal 
          student={selectedStudent} 
          sessionUser={sessionUser}
          reports={reports.filter(r => r.studentId === selectedStudent.id)}
          onClose={() => setIsModalOpen(false)}
          onRefresh={loadData}
          mode="homeroom"
        />
      )}
    </div>
  );
};
export default HomeroomDashboard;
