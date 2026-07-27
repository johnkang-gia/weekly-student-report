import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchStudents, fetchReports, fetchArchivedReports } from '../../services/api';
import { Loader, ArrowLeft, User, Calendar, BookOpen, AlertCircle, Edit } from 'lucide-react';
import ReportFormModal from '../Teacher/ReportFormModal';
import { parseBadges, renderBadgeGrid } from '../../utils/badgeHelper';

const StudentProfile = ({ sessionUser }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [student, setStudent] = useState(null);
  const [reports, setReports] = useState([]);
  const [archivedReports, setArchivedReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState('');

  useEffect(() => { loadData(); }, [id]);

  const loadData = async () => {
    setIsLoading(true);
    const [sData, rData, aData] = await Promise.all([fetchStudents(), fetchReports(), fetchArchivedReports()]);
    
    const stu = sData.find(s => s.id === id);
    setStudent(stu);
    
    // 이 학생의 모든 리포트 필터링 및 시간순(최신순) 정렬
    setReports(rData.filter(r => r.studentId === id).sort((a,b) => new Date(b.date) - new Date(a.date)));
    setArchivedReports(aData.filter(r => r.studentId === id).sort((a,b) => new Date(b.date) - new Date(a.date)));
    
    setIsLoading(false);
  };

  const renderReportCard = (r, isArchived = false) => {
    let tags = [];
    try { tags = typeof r.aiTags === 'string' ? JSON.parse(r.aiTags) : r.aiTags; } catch(e) {}
    if (!Array.isArray(tags)) tags = [];

    return (
      <div key={r.id} className="card" style={{ marginBottom: '1rem', borderLeft: `4px solid ${r.subject === '담임' ? 'var(--primary-color)' : '#8B5CF6'}`, opacity: isArchived ? 0.8 : 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className={`badge ${r.subject === '담임' ? 'badge-primary' : 'badge-secondary'}`}>{r.subject}</span>
              <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>{new Date(r.date).toLocaleDateString()}</span>
              {isArchived && <span className="badge" style={{ backgroundColor: '#E5E7EB', color: '#374151' }}>보관된 과거 기록</span>}
            </div>
            <div style={{ marginTop: '0.75rem', backgroundColor: '#F8FAFC', padding: '0.5rem', borderRadius: '6px', border: '1px solid #E2E8F0', display: 'inline-block' }}>
              {renderBadgeGrid(parseBadges(r.aiTags))}
            </div>
          </div>
          
          {/* Admin과 Staff는 과목에 상관없이 현재 학기 리포트 수정 가능 */}
          {!isArchived && (sessionUser?.role === 'admin' || sessionUser?.role === 'staff') && (
            <button 
              className="btn btn-sm btn-outline" 
              onClick={() => {
                setSelectedSubject(r.subject);
                setIsModalOpen(true);
              }}
            >
              <Edit size={14} style={{ marginRight: '4px' }} /> 수정
            </button>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.9rem' }}>
          <div>
            <div style={{ color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>학업 성취 (Academic)</div>
            <div style={{ whiteSpace: 'pre-wrap' }}>{r.academic}</div>
          </div>
          <div>
            <div style={{ color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>교우 관계 (Social)</div>
            <div style={{ whiteSpace: 'pre-wrap' }}>{r.social}</div>
          </div>
          <div>
            <div style={{ color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>생활 태도 (Behavior)</div>
            <div style={{ whiteSpace: 'pre-wrap' }}>{r.behavior}</div>
          </div>
          <div style={{ gridColumn: '1 / -1', backgroundColor: '#F9FAFB', padding: '1rem', borderRadius: '8px' }}>
            <div style={{ color: 'var(--text-secondary)', marginBottom: '0.25rem', fontWeight: 600 }}>선생님 종합 코멘트</div>
            <div style={{ whiteSpace: 'pre-wrap' }}>{r.teacherNote}</div>
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) return <div style={{ padding: '3rem', textAlign: 'center' }}><Loader className="spin" size={32} /></div>;
  if (!student) return <div style={{ padding: '3rem', textAlign: 'center' }}>학생을 찾을 수 없습니다.</div>;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
        <button className="btn btn-outline" onClick={() => navigate(-1)}><ArrowLeft size={16} /> 뒤로가기</button>
        <h1 style={{ margin: 0 }}>학생 통합 프로필</h1>
      </div>

      <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '2rem', marginBottom: '2rem', backgroundColor: 'var(--primary-color)', color: 'white' }}>
        <div style={{ width: '80px', height: '80px', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <User size={40} />
        </div>
        <div>
          <h2 style={{ fontSize: '2rem', margin: 0, marginBottom: '0.5rem' }}>{student.name}</h2>
          <div style={{ display: 'flex', gap: '1rem', opacity: 0.9 }}>
            <span>학번: {student.id}</span>
            <span>소속: {student.grade}학년 {student.className}</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <h3>이번 학기 리포트 기록 ({reports.length}건)</h3>
        {reports.length === 0 ? <div className="empty-state">이번 학기 작성된 리포트가 없습니다.</div> : reports.map(r => renderReportCard(r, false))}
        
        {archivedReports.length > 0 && (
          <>
            <h3 style={{ marginTop: '2rem', color: 'var(--text-secondary)' }}>과거 보관된 리포트 기록 ({archivedReports.length}건)</h3>
            {archivedReports.map(r => renderReportCard(r, true))}
          </>
        )}
      </div>

      {isModalOpen && (
        <ReportFormModal 
          student={student} 
          sessionUser={sessionUser}
          reports={reports}
          onClose={() => setIsModalOpen(false)}
          onRefresh={loadData}
          mode={sessionUser?.role === 'admin' || sessionUser?.role === 'staff' ? 'admin' : 'subject'}
          subjectName={selectedSubject}
        />
      )}
    </div>
  );
};
export default StudentProfile;
