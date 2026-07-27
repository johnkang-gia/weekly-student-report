import React, { useState, useEffect } from 'react';
import { fetchStudents, fetchClasses, fetchReports } from '../../services/api';
import { Loader, Search, Users, CheckCircle, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const StaffDashboard = () => {
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  
  const navigate = useNavigate();

  useEffect(() => { 
    loadData();
    const handleSync = () => loadData(false);
    window.addEventListener('realtime-sync', handleSync);
    return () => window.removeEventListener('realtime-sync', handleSync);
  }, []);

  const loadData = async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    const [sData, cData, rData] = await Promise.all([fetchStudents(), fetchClasses(), fetchReports()]);
    setStudents(sData);
    setClasses(cData);
    
    // 이번 주 리포트만 필터링
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    setReports(rData.filter(r => new Date(r.createdAt || r.date) >= oneWeekAgo)); // Fix for createdAt/date
    
    if (showLoading) setIsLoading(false);
  };

  const handleSearch = (e) => {
    const term = e.target.value;
    setSearchTerm(term);
    if (!term.trim()) {
      setSearchResults([]);
      return;
    }
    const results = students.filter(s => s.name.toLowerCase().includes(term.toLowerCase()) || s.id.includes(term));
    setSearchResults(results);
  };

  const goToProfile = (studentId) => {
    navigate(`/staff/student/${studentId}`);
  };

  if (isLoading) return <div style={{ padding: '3rem', textAlign: 'center' }}><Loader className="spin" size={32} /></div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* 1. 학생 검색창 */}
      <div className="card">
        <h2><Search className="icon" /> 학생 통합 프로필 검색</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>학생 이름이나 코드로 검색하여 지난 모든 리포트(담임, 과목 전체)를 한 페이지에서 열람할 수 있습니다.</p>
        
        <div style={{ position: 'relative', maxWidth: '500px' }}>
          <Search size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
          <input 
            type="text" 
            className="form-control" 
            placeholder="학생 이름 검색 (예: 김철수)" 
            value={searchTerm} 
            onChange={handleSearch} 
            style={{ paddingLeft: '3rem', height: '50px', fontSize: '1.1rem' }}
          />
        </div>

        {searchTerm && (
          <div style={{ marginTop: '1rem', border: '1px solid var(--border-color)', borderRadius: '8px', overflow: 'hidden' }}>
            {searchResults.length === 0 ? (
              <div style={{ padding: '1rem', color: 'var(--text-secondary)' }}>검색 결과가 없습니다.</div>
            ) : (
              searchResults.map(s => (
                <div 
                  key={s.id} 
                  style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                  onClick={() => goToProfile(s.id)}
                  className="hover-bg"
                >
                  <div>
                    <strong style={{ fontSize: '1.1rem', marginRight: '0.5rem' }}>{s.name}</strong>
                    <span className="badge">{s.grade}학년 {s.className}</span>
                  </div>
                  <span style={{ color: 'var(--primary-color)', fontSize: '0.9rem', fontWeight: 600 }}>프로필 보기 &rarr;</span>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* 2. 전교생 제출 현황판 (반별 그룹화) */}
      <div className="card">
        <h2><Users className="icon" /> 이번 주 전교생 리포트 작성 현황판</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>각 반별로 어떤 학생의 담임 리포트가 작성되었는지 모니터링합니다.</p>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
          {classes.length === 0 ? (
            <div className="empty-state">아직 학급(반)이 구성되지 않았습니다. 관리자가 반을 세팅해야 합니다.</div>
          ) : (
            classes.sort((a,b)=>a.grade - b.grade).map(cls => {
              // 이 반에 속한 학생들
              const classStudents = students.filter(s => String(s.grade) === String(cls.grade) && String(s.className) === String(cls.className));
              const submittedCount = classStudents.filter(s => reports.some(r => r.studentId === s.id && r.subject === '담임')).length;
              
              return (
                <div key={cls.id} style={{ border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '2px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                    <h3 style={{ margin: 0 }}>{cls.grade}학년 {cls.className}</h3>
                    <span className={`badge ${submittedCount === classStudents.length && classStudents.length > 0 ? 'badge-success' : 'badge-danger'}`}>
                      {submittedCount} / {classStudents.length} 명 제출
                    </span>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {classStudents.length === 0 ? (
                      <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>배정된 학생이 없습니다.</div>
                    ) : (
                      classStudents.map(s => {
                        const hasReport = reports.some(r => r.studentId === s.id && r.subject === '담임');
                        return (
                          <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem', backgroundColor: hasReport ? '#F0FDF4' : '#FEF2F2', borderRadius: '6px' }}>
                            <span style={{ fontWeight: 500 }}>{s.name}</span>
                            {hasReport ? (
                              <span style={{ color: 'var(--success-color)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem', whiteSpace: 'nowrap', flexShrink: 0 }}><CheckCircle size={14} /> 작성완료</span>
                            ) : (
                              <span style={{ color: 'var(--danger-color)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem', whiteSpace: 'nowrap', flexShrink: 0 }}><Clock size={14} /> 미작성</span>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
      
    </div>
  );
};
export default StaffDashboard;
