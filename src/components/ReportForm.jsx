import React, { useState, useEffect } from 'react';
import { fetchClasses, fetchStudents, submitReport } from '../services/api';
import { Send, CheckCircle } from 'lucide-react';

const ReportForm = () => {
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedStudent, setSelectedStudent] = useState('');
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
  const [content, setContent] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    // Load initial classes
    fetchClasses().then(setClasses);
  }, []);

  useEffect(() => {
    // Load students when class changes
    if (selectedClass) {
      fetchStudents(selectedClass).then(data => {
        setStudents(data);
        setSelectedStudent(''); // Reset student selection
      });
    } else {
      setStudents([]);
    }
  }, [selectedClass]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedClass || !selectedStudent || !content || !reportDate) return;

    setIsLoading(true);
    
    try {
      await submitReport({
        className: selectedClass,
        studentName: selectedStudent,
        date: reportDate,
        content: content
      });
      
      setIsSuccess(true);
      // Form reset
      setSelectedClass('');
      setSelectedStudent('');
      setContent('');
      
      // Hide success message after 3 seconds
      setTimeout(() => setIsSuccess(false), 3000);
    } catch (error) {
      console.error("Failed to submit report", error);
      alert('리포트 제출에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="report-form-container">
      <div className="page-header">
        <h1 className="page-title">위클리 리포트 작성</h1>
        <p className="page-subtitle">선택한 학생의 주간 리포트를 작성하여 제출합니다.</p>
      </div>

      {isSuccess && (
        <div className="alert alert-success">
          <CheckCircle size={20} />
          리포트가 성공적으로 제출되었습니다!
        </div>
      )}

      <div className="card">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">작성 일자</label>
            <input 
              type="date" 
              className="form-control" 
              value={reportDate}
              onChange={(e) => setReportDate(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1.5rem' }}>
            <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
              <label className="form-label">반 선택</label>
              <select 
                className="form-control" 
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                required
              >
                <option value="" disabled>반을 선택하세요</option>
                {classes.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
              <label className="form-label">학생 선택</label>
              <select 
                className="form-control" 
                value={selectedStudent}
                onChange={(e) => setSelectedStudent(e.target.value)}
                required
                disabled={!selectedClass}
              >
                <option value="" disabled>학생을 선택하세요</option>
                {students.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">리포트 내용</label>
            <textarea 
              className="form-control" 
              placeholder="학생의 학습 태도, 진도, 특이사항 등을 상세히 적어주세요."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
            ></textarea>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', marginTop: '1rem' }}
            disabled={isLoading || !selectedClass || !selectedStudent || !content}
          >
            {isLoading ? '제출 중...' : (
              <>
                <Send size={18} />
                리포트 제출하기
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ReportForm;
