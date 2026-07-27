import React, { useState, useEffect } from 'react';
import { fetchStudents, getActiveTerm, submitReport, fetchSubjects } from '../../services/api';
import { Send, CheckCircle } from 'lucide-react';
import { useLocation } from 'react-router-dom';

const ReportForm = ({ sessionUser }) => {
  const location = useLocation();
  const prefill = location.state || {};

  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [activeTerm, setActiveTerm] = useState(null);
  
  const [selectedStudentId, setSelectedStudentId] = useState(prefill.studentId || '');
  const [selectedSubject, setSelectedSubject] = useState(prefill.subjectName || '담임');
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
  
  // 6 Fields
  const [formData, setFormData] = useState({
    academic: '',
    improvement: '',
    participation: '',
    behavior: '',
    social: '',
    teacherNote: ''
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    fetchStudents().then(setStudents);
    getActiveTerm().then(setActiveTerm);
    fetchSubjects().then(allSub => {
      // Admin sees all, teachers see their own subjects
      const mySubs = sessionUser?.role === 'admin' ? allSub : allSub.filter(s => s.teacherId === sessionUser?.id);
      setSubjects(mySubs);
    });
  }, [sessionUser]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStudentId || !activeTerm) return;

    setIsLoading(true);
    
    try {
      await submitReport({
        studentId: selectedStudentId,
        termId: activeTerm.id,
        date: reportDate,
        subject: selectedSubject,
        ...formData
      });
      
      setIsSuccess(true);
      
      // Reset form
      setFormData({
        academic: '', improvement: '', participation: '',
        behavior: '', social: '', teacherNote: ''
      });
      setSelectedStudentId('');
      
      setTimeout(() => setIsSuccess(false), 3000);
    } catch (error) {
      console.error("Failed", error);
      alert('제출 실패');
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = selectedStudentId && formData.academic && formData.teacherNote;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">위클리 리포트 작성</h1>
          <p className="page-subtitle">
            현재 학기: <span className="badge">{activeTerm ? activeTerm.name : '로딩중...'}</span>
          </p>
        </div>
      </div>

      {isSuccess && (
        <div className="alert alert-success">
          <CheckCircle size={20} />
          성공적으로 제출되었습니다. AI 태깅이 완료되었습니다.
        </div>
      )}

      <form className="card" onSubmit={handleSubmit}>
        <div className="form-grid" style={{ marginBottom: '2rem' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">작성 분야 (과목)</label>
            <select className="form-control" value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)} required>
              <option value="담임">주간 리포트 (담임)</option>
              {subjects.map(sub => <option key={sub.id} value={sub.name}>{sub.name} (과목 교과)</option>)}
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">학생 선택</label>
            <select 
              className="form-control" 
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              required
            >
              <option value="" disabled>학생을 선택하세요</option>
              {students.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.className} / {s.id})
                </option>
              ))}
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">작성 일자</label>
            <input 
              type="date" 
              className="form-control" 
              value={reportDate}
              onChange={(e) => setReportDate(e.target.value)}
              required
            />
          </div>
        </div>

        <h3 style={{ marginBottom: '1.5rem', color: 'var(--primary-color)' }}>1. 학업 상태</h3>
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">Academic Progress (학업 진척도)</label>
            <textarea name="academic" className="form-control" value={formData.academic} onChange={handleChange} placeholder="이번 주 주요 학습 내용, 이해도, 잘한 부분" required />
          </div>
          <div className="form-group">
            <label className="form-label">Areas for Improvement (보완점)</label>
            <textarea name="improvement" className="form-control" value={formData.improvement} onChange={handleChange} placeholder="보완이 필요한 부분, 어려워한 개념이나 과제" required />
          </div>
        </div>

        <h3 style={{ margin: '1.5rem 0', color: 'var(--primary-color)' }}>2. 태도 및 생활</h3>
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">Class Participation (참여도)</label>
            <textarea name="participation" className="form-control" value={formData.participation} onChange={handleChange} placeholder="수업 참여도, 집중도, 발표/질문 태도" required />
          </div>
          <div className="form-group">
            <label className="form-label">Behavior & Attitude (생활 태도)</label>
            <textarea name="behavior" className="form-control" value={formData.behavior} onChange={handleChange} placeholder="생활 태도, 규칙 준수, 책임감, 노력하는 모습" required />
          </div>
          <div className="form-group">
            <label className="form-label">Social Interaction (교우 관계)</label>
            <textarea name="social" className="form-control" value={formData.social} onChange={handleChange} placeholder="친구들과의 관계, 협동, 갈등 여부" required />
          </div>
        </div>

        <h3 style={{ margin: '1.5rem 0', color: 'var(--primary-color)' }}>3. 총평</h3>
        <div className="form-group">
          <label className="form-label">Teacher's Note / Next Step (담임 코멘트)</label>
          <textarea name="teacherNote" className="form-control" value={formData.teacherNote} onChange={handleChange} placeholder="담임교사의 짧은 코멘트 및 다음 주 지도 방향" required />
        </div>

        <button type="submit" className="btn btn-primary btn-block" style={{ marginTop: '1rem' }} disabled={isLoading || !isFormValid}>
          {isLoading ? '저장 중...' : <><Send size={18} /> 리포트 제출 (AI 자동 분석)</>}
        </button>
      </form>
    </div>
  );
};

export default ReportForm;
