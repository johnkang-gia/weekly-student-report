import React, { useState, useEffect } from 'react';
import { fetchTerms, fetchArchivedReports, fetchStudents } from '../../services/api';
import { Loader, Archive, Calendar, Users, FileText, CheckCircle, AlertCircle, Award } from 'lucide-react';
import ReportFormModal from '../Teacher/ReportFormModal';
import { parseBadges, hasWarningBadges, hasSuccessBadges } from '../../utils/badgeHelper';

const ArchiveViewer = ({ sessionUser }) => {
  const [terms, setTerms] = useState([]);
  const [archivedReports, setArchivedReports] = useState([]);
  const [students, setStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [selectedTermId, setSelectedTermId] = useState('');
  
  // 모달 상태
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setIsLoading(true);
    const [tData, rData, sData] = await Promise.all([fetchTerms(), fetchArchivedReports(), fetchStudents()]);
    
    // 보관된 학기만 필터링 (isActive=false, isArchived=true) - 또는 모든 학기를 보여줘도 됨.
    // 여기서는 isArchived가 true이거나 현재 학기가 아닌 것들
    const pastTerms = tData.filter(t => t.isArchived === true || String(t.isArchived) === 'true');
    setTerms(pastTerms);
    if (pastTerms.length > 0 && !selectedTermId) {
      setSelectedTermId(pastTerms[0].id);
    }

    setArchivedReports(rData);
    setStudents(sData);
    setIsLoading(false);
  };

  if (isLoading) return <div style={{ padding: '3rem', textAlign: 'center' }}><Loader className="spin" size={32} /></div>;

  if (terms.length === 0) {
    return (
      <div className="card">
        <h2><Archive className="icon" /> 보관함 데이터 열람</h2>
        <div className="empty-state">보관된 과거 학기 데이터가 없습니다. 학기 관리에서 학기를 보관하면 이곳에 나타납니다.</div>
      </div>
    );
  }

  // 선택된 학기의 리포트 필터링
  const termReports = archivedReports.filter(r => r.termId === selectedTermId);
  
  // 선택된 학기에 리포트가 존재하는 학생들 목록
  const studentIdsInTerm = [...new Set(termReports.map(r => r.studentId))];
  const termStudents = studentIdsInTerm.map(id => students.find(s => s.id === id) || { id, name: '알 수 없음(삭제됨)', grade: '-', className: '-' });

  // 학기 통계 계산
  let successCount = 0;
  let warningCount = 0;
  termReports.forEach(r => {
    const parsedTags = parseBadges(r.aiTags);
    if (hasSuccessBadges(parsedTags)) successCount++;
    if (hasWarningBadges(parsedTags)) warningCount++;
  });

  const handleStudentClick = (student) => {
    setSelectedStudent(student);
    setIsModalOpen(true);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div className="page-header" style={{ marginBottom: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title"><Archive className="icon" /> 보관함 데이터 열람</h1>
          <p className="page-subtitle">과거 학기의 모든 리포트 및 통계를 열람할 수 있습니다. (읽기 전용)</p>
        </div>
        <div style={{ minWidth: '250px' }}>
          <label className="form-label">열람할 과거 학기 선택</label>
          <select className="form-control" value={selectedTermId} onChange={e => setSelectedTermId(e.target.value)}>
            {terms.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '1rem', backgroundColor: 'var(--primary-color)', color: 'white', borderRadius: '50%' }}><FileText size={28} /></div>
          <div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>해당 학기 총 리포트 수</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>{termReports.length}건</div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '1rem', backgroundColor: 'var(--success-color)', color: 'white', borderRadius: '50%' }}><Award size={28} /></div>
          <div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>우수 피드백 건수</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--success-color)' }}>{successCount}건</div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '1rem', backgroundColor: 'var(--danger-color)', color: 'white', borderRadius: '50%' }}><AlertCircle size={28} /></div>
          <div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>지원필요 피드백 건수</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--danger-color)' }}>{warningCount}건</div>
          </div>
        </div>
      </div>

      <div className="card">
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
          <Users size={20} /> 해당 학기 학생 명단 ({termStudents.length}명)
        </h3>
        
        {termStudents.length === 0 ? (
          <div className="empty-state">해당 학기에 작성된 리포트가 있는 학생이 없습니다.</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
            {termStudents.map(student => {
              const sReports = termReports.filter(r => r.studentId === student.id);
              return (
                <div 
                  key={student.id} 
                  className="hover-bg"
                  style={{ padding: '1rem', border: '1px solid var(--border-color)', borderRadius: '8px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                  onClick={() => handleStudentClick(student)}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>{student.name}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>당시 {student.grade}학년 {student.className}</div>
                  </div>
                  <div>
                    <span className="badge badge-primary">{sReports.length}개의 리포트</span>
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
          reports={termReports.filter(r => r.studentId === selectedStudent.id)}
          onClose={() => setIsModalOpen(false)}
          onRefresh={loadData}
          mode="archive" // 읽기 전용 모드 적용을 위해 mode를 archive로
        />
      )}
    </div>
  );
};
export default ArchiveViewer;
