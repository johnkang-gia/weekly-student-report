import React, { useState, useEffect } from 'react';
import { fetchStudents, fetchSubjects, fetchReports, getActiveTerm } from '../../services/api';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Clock } from 'lucide-react';

const ReportStatus = ({ sessionUser }) => {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [reports, setReports] = useState([]);
  const [activeTerm, setActiveTerm] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const [filterClass, setFilterClass] = useState('all');

  const loadData = async () => {
    setIsLoading(true);
    const [stuData, subData, repData, termData] = await Promise.all([
      fetchStudents(), fetchSubjects(), fetchReports(), getActiveTerm()
    ]);
    setStudents(stuData);
    setSubjects(subData);
    setReports(repData);
    setActiveTerm(termData);
    setIsLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const uniqueClasses = [...new Set(students.map(s => s.className).filter(Boolean))];
  const filteredStudents = filterClass === 'all' ? students : students.filter(s => s.className === filterClass);

  const handleBadgeClick = (studentId, subjectName, hasReport) => {
    if (!hasReport) {
      navigate('/teacher/report', { state: { studentId, subjectName } });
    } else {
      // Could navigate to dashboard with search filter, but for now just alert or navigate
      navigate('/admin/dashboard');
    }
  };

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 className="page-title">리포트 제출 현황판</h1>
          <p className="page-subtitle">이번 주(현재 학기) 학생별 리포트 작성 현황을 한눈에 파악합니다.</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>현재 기준 학기</div>
          <div className="badge badge-success">{activeTerm ? activeTerm.name : '로딩중'}</div>
        </div>
      </div>

      <div className="filters-bar">
        <select className="form-control filter-select" value={filterClass} onChange={(e) => setFilterClass(e.target.value)}>
          <option value="all">모든 반(Class) 보기</option>
          {uniqueClasses.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#CBD5E1' }}></div> 미제출 (클릭 시 작성 이동)</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><CheckCircle size={14} color="var(--success-color)" /> 제출 완료</span>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
        <table className="data-table" style={{ margin: 0 }}>
          <thead>
            <tr>
              <th style={{ width: '100px' }}>학년/반</th>
              <th style={{ width: '120px' }}>이름</th>
              <th>리포트 현황 뱃지 (클릭 가능)</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? <tr><td colSpan="3" style={{ textAlign: 'center', padding: '2rem' }}>로딩중...</td></tr> : 
             filteredStudents.length === 0 ? <tr><td colSpan="3" style={{ textAlign: 'center', padding: '2rem' }}>학생이 없습니다.</td></tr> : 
             filteredStudents.map(student => {
              
              // 1. 담임 리포트 여부
              const homeroomReport = reports.find(r => r.studentId === student.id && r.termId === activeTerm?.id && r.subject === '담임');
              
              // 2. 이 학생이 속한 과목반 찾기
              const mySubjects = subjects.filter(sub => (sub.studentIds || []).includes(student.id));

              return (
                <tr key={student.id}>
                  <td>{student.grade} {student.className}</td>
                  <td style={{ fontWeight: 600 }}>{student.name}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      {/* 담임 뱃지 */}
                      <button 
                        className="badge-btn"
                        onClick={() => handleBadgeClick(student.id, '담임', !!homeroomReport)}
                        style={{ 
                          backgroundColor: homeroomReport ? '#E0F2FE' : '#F1F5F9',
                          color: homeroomReport ? '#0284C7' : '#94A3B8',
                          border: `1px solid ${homeroomReport ? '#BAE6FD' : '#E2E8F0'}`
                        }}
                      >
                        {homeroomReport ? <CheckCircle size={12}/> : <Clock size={12}/>} 주간리포트 (담임)
                      </button>

                      {/* 과목반 뱃지들 */}
                      {mySubjects.map(sub => {
                        const subReport = reports.find(r => r.studentId === student.id && r.termId === activeTerm?.id && r.subject === sub.name);
                        return (
                          <button 
                            key={sub.id}
                            className="badge-btn"
                            onClick={() => handleBadgeClick(student.id, sub.name, !!subReport)}
                            style={{ 
                              backgroundColor: subReport ? `${sub.color}15` : '#F1F5F9',
                              color: subReport ? sub.color : '#94A3B8',
                              border: `1px solid ${subReport ? `${sub.color}40` : '#E2E8F0'}`
                            }}
                          >
                            {subReport ? <CheckCircle size={12}/> : <Clock size={12}/>} {sub.name}
                          </button>
                        );
                      })}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ReportStatus;
