import React, { useState, useEffect } from 'react';
import { fetchSubjects, fetchStudents, fetchReports, fetchClasses } from '../../services/api';
import { Loader, BookOpen, CheckCircle, Clock, Edit, Folder } from 'lucide-react';
import ReportFormModal from './ReportFormModal';

const SubjectDashboard = ({ sessionUser }) => {
  const [mySubjects, setMySubjects] = useState([]);
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedSubjectName, setSelectedSubjectName] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => { 
    loadData();
    const handleSync = () => loadData(false);
    window.addEventListener('realtime-sync', handleSync);
    return () => window.removeEventListener('realtime-sync', handleSync);
  }, [sessionUser]);

  const loadData = async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    const [subData, sData, rData, cData] = await Promise.all([fetchSubjects(), fetchStudents(), fetchReports(), fetchClasses()]);
    
    // 이 선생님이 담당하는 과목 찾기
    const subjects = subData.filter(s => s.teacherId === sessionUser.id);
    
    // 테스트: 관리자면 모든 과목 표시
    if (sessionUser.role === 'admin' && subjects.length === 0) {
      setMySubjects(subData);
    } else {
      setMySubjects(subjects);
    }

    setStudents(sData);
    setClasses(cData);
    
    // 이번 주 리포트
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    setReports(rData.filter(r => new Date(r.createdAt || r.date) >= oneWeekAgo)); // Fix for createdAt/date
    
    if (showLoading) setIsLoading(false);
  };

  const handleStudentClick = (student, subjectName) => {
    setSelectedStudent(student);
    setSelectedSubjectName(subjectName);
    setIsModalOpen(true);
  };

  if (isLoading) return <div style={{ padding: '3rem', textAlign: 'center' }}><Loader className="spin" size={32} /></div>;

  if (mySubjects.length === 0) return (
    <div className="card">
      <h2><BookOpen className="icon" /> 내 담당 과목 대시보드</h2>
      <div className="empty-state">담당하시는 과목이 없습니다. '과목반 세팅' 메뉴에서 과목반을 추가하세요.</div>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div className="page-header" style={{ marginBottom: 0 }}>
        <h1 className="page-title"><BookOpen className="icon" /> 내 담당 과목 대시보드</h1>
        <p className="page-subtitle">여러 학년, 여러 반을 가르치시나요? 담당 과목별, 그리고 반별로 학생들을 관리하세요.</p>
      </div>

      {mySubjects.map(subject => {
        // 과목반에 속한 학생들
        const enrolledStudents = students.filter(s => (subject.studentIds || []).includes(s.id));
        
        // 반(Class) 별로 학생들 그룹화
        const groupedStudents = {};
        enrolledStudents.forEach(s => {
          const key = `${s.grade}학년 ${s.className}`;
          if (!groupedStudents[key]) groupedStudents[key] = [];
          groupedStudents[key].push(s);
        });

        // 렌더링 순서 정렬
        const sortedGroups = Object.keys(groupedStudents).sort();

        return (
          <div key={subject.id} className="card" style={{ borderTop: `4px solid ${subject.color}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)' }}>
              <div>
                <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ display: 'inline-block', width: '16px', height: '16px', borderRadius: '50%', backgroundColor: subject.color }}></span>
                  {subject.name}
                </h2>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>총 수강생: {enrolledStudents.length}명</div>
              </div>
            </div>

            {enrolledStudents.length === 0 ? (
              <div className="empty-state">이 과목에 수강생이 아직 없습니다. '과목반 세팅' 메뉴에서 수강생을 추가해주세요.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {sortedGroups.map(groupName => (
                  <div key={groupName}>
                    <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', color: 'var(--text-secondary)' }}>
                      <Folder size={18} /> {groupName} ({groupedStudents[groupName].length}명)
                    </h4>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' }}>
                      {groupedStudents[groupName].map(student => {
                        const studentReports = reports.filter(r => r.studentId === student.id);
                        const mySubjectReport = studentReports.find(r => r.subject === subject.name);
                        
                        return (
                          <div 
                            key={student.id}
                            className="hover-bg"
                            style={{ padding: '1rem', border: '1px solid var(--border-color)', borderRadius: '8px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                            onClick={() => handleStudentClick(student, subject.name)}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                              <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#F3F4F6', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 600, fontSize: '0.9rem' }}>
                                {student.name.charAt(0)}
                              </div>
                              <div style={{ fontWeight: 600 }}>{student.name}</div>
                            </div>
                            
                            <div>
                              {mySubjectReport ? (
                                mySubjectReport.status === 'draft' ? (
                                  <span className="badge" style={{ backgroundColor: '#FEF3C7', color: '#D97706', display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap', flexShrink: 0 }}>
                                    <Edit size={14} /> 임시저장
                                  </span>
                                ) : (
                                  <span className="badge badge-success" style={{ display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap', flexShrink: 0 }}>
                                    <CheckCircle size={14} /> 발행완료
                                  </span>
                                )
                              ) : (
                                <span className="badge" style={{ backgroundColor: '#FEF2F2', color: 'var(--danger-color)', display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap', flexShrink: 0 }}>
                                  <Clock size={14} /> 미작성
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {isModalOpen && selectedStudent && (
        <ReportFormModal 
          student={selectedStudent} 
          sessionUser={sessionUser}
          reports={reports.filter(r => r.studentId === selectedStudent.id)}
          onClose={() => setIsModalOpen(false)}
          onRefresh={loadData}
          mode="subject"
          subjectName={selectedSubjectName}
        />
      )}
    </div>
  );
};
export default SubjectDashboard;
