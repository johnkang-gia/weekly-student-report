import React, { useState, useEffect } from 'react';
import { fetchStudents, fetchClasses, fetchReports } from '../../services/api';
import { Loader, Printer, Calendar, FileText } from 'lucide-react';
import { parseBadges, renderBadgeGrid } from '../../utils/badgeHelper';

const WeeklyReportPrint = () => {
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Default date range: Last 7 days to today
  const getInitialDates = () => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 7);
    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0]
    };
  };

  const [dateRange, setDateRange] = useState(getInitialDates());

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
    setReports(rData);
    if (showLoading) setIsLoading(false);
  };

  const handlePrint = () => {
    window.print();
  };

  const filteredReports = reports.filter(r => {
    const rDate = new Date(r.createdAt || r.date);
    const startDate = new Date(dateRange.start);
    const endDate = new Date(dateRange.end);
    endDate.setHours(23, 59, 59, 999);
    
    // 발행된 리포트만 취합 (임시저장 제외)
    return (r.status === 'published' || !r.status) && rDate >= startDate && rDate <= endDate;
  });

  if (isLoading) return <div style={{ padding: '3rem', textAlign: 'center' }}><Loader className="spin" size={32} /></div>;

  // Group classes
  const sortedClasses = [...classes].sort((a, b) => {
    if (a.grade !== b.grade) return a.grade - b.grade;
    return String(a.className).localeCompare(String(b.className));
  });

  return (
    <div className="weekly-report-container" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* --- 화면 전용 컨트롤 패널 (인쇄 시 숨김) --- */}
      <div className="card no-print">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2><FileText className="icon" /> 주간보고서 종합 및 출력</h2>
            <p style={{ color: 'var(--text-secondary)', margin: 0 }}>전체 교사들이 작성한 리포트를 반별/학생별로 모아 프린트하거나 PDF로 저장합니다.</p>
          </div>
          <button className="btn btn-primary" onClick={handlePrint} style={{ fontSize: '1.1rem', padding: '0.75rem 1.5rem' }}>
            <Printer size={20} /> 프린트 및 PDF 저장
          </button>
        </div>

        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', marginTop: '1.5rem', backgroundColor: '#F9FAFB', padding: '1.25rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
          <div style={{ flex: 1 }}>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Calendar size={16} /> 검색 시작일
            </label>
            <input 
              type="date" 
              className="form-control" 
              value={dateRange.start} 
              onChange={e => setDateRange({...dateRange, start: e.target.value})} 
            />
          </div>
          <div style={{ flex: 1 }}>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Calendar size={16} /> 검색 종료일
            </label>
            <input 
              type="date" 
              className="form-control" 
              value={dateRange.end} 
              onChange={e => setDateRange({...dateRange, end: e.target.value})} 
            />
          </div>
        </div>
      </div>

      {/* --- 인쇄 전용 영역 시작 --- */}
      <div className="print-area">
        <div className="print-header only-print" style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', borderBottom: '2px solid #000', paddingBottom: '10px', display: 'inline-block' }}>
            주간 리포트 종합 보고서
          </h1>
          <p style={{ marginTop: '10px', fontSize: '14px', color: '#555' }}>
            기간: {dateRange.start} ~ {dateRange.end}
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {sortedClasses.length === 0 ? (
            <div className="empty-state">등록된 학급이 없습니다.</div>
          ) : (
            sortedClasses.map(cls => {
              // 해당 반 학생들
              const classStudents = students.filter(s => String(s.grade) === String(cls.grade) && String(s.className) === String(cls.className));
              
              // 학생 정렬 (가나다순)
              classStudents.sort((a, b) => a.name.localeCompare(b.name));

              const studentsWithReports = classStudents.filter(s => filteredReports.some(r => r.studentId === s.id));

              if (studentsWithReports.length === 0) return null;

              return (
                <div key={cls.id} className="print-section" style={{ pageBreakInside: 'avoid', marginBottom: '3rem' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: 'bold', backgroundColor: '#F3F4F6', padding: '12px 15px', borderTop: '2px solid #374151', borderBottom: '1px solid #D1D5DB', marginBottom: '0', display: 'flex', justifyContent: 'space-between' }}>
                    <span>{cls.grade}학년 {cls.className}</span>
                    <span style={{ fontSize: '14px', fontWeight: 'normal', color: '#555' }}>총 {studentsWithReports.length}명 보고서 작성됨</span>
                  </h3>
                  
                  <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#F9FAFB', borderBottom: '2px solid #E5E7EB' }}>
                        <th style={{ padding: '12px 10px', width: '12%', borderRight: '1px solid #E5E7EB', textAlign: 'center' }}>학생 이름</th>
                        <th style={{ padding: '12px 10px', width: '12%', borderRight: '1px solid #E5E7EB', textAlign: 'center' }}>작성 과목</th>
                        <th style={{ padding: '12px 10px', width: '22%', borderRight: '1px solid #E5E7EB', textAlign: 'center' }}>항목별 평가 요약</th>
                        <th style={{ padding: '12px 10px', width: '54%' }}>특이사항 (선생님 코멘트)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {studentsWithReports.map((student, sIdx) => {
                        const studentReports = filteredReports.filter(r => r.studentId === student.id);
                        // 최신순 등 원하는 정렬. 여기서는 담임 먼저, 그 다음 과목들
                        studentReports.sort((a, b) => {
                          if (a.subject === '담임') return -1;
                          if (b.subject === '담임') return 1;
                          return a.subject.localeCompare(b.subject);
                        });

                        return studentReports.map((report, rIdx) => {
                          const parsedTags = parseBadges(report.aiTags);
                          const isOnlyGood = Object.values(parsedTags).flat().every(b => b === 'good');

                          // 첫 번째 행에만 이름 표시 및 왼쪽 보더 스타일링
                          const isFirst = rIdx === 0;

                          return (
                            <tr key={report.id} style={{ borderBottom: '1px solid #E5E7EB' }}>
                              {isFirst ? (
                                <td rowSpan={studentReports.length} style={{ padding: '12px 10px', borderRight: '1px solid #E5E7EB', textAlign: 'center', fontWeight: 'bold', borderBottom: '1px solid #D1D5DB' }}>
                                  {student.name}
                                </td>
                              ) : null}
                              <td style={{ padding: '12px 10px', borderRight: '1px solid #E5E7EB', textAlign: 'center', borderBottom: isFirst && studentReports.length > 1 ? '1px solid #F3F4F6' : '1px solid #E5E7EB' }}>
                                {report.subject}
                              </td>
                              <td style={{ padding: '12px 10px', borderRight: '1px solid #E5E7EB', textAlign: 'center', verticalAlign: 'top' }}>
                                <div style={{ display: 'inline-block' }}>
                                  {renderBadgeGrid(parsedTags)}
                                </div>
                              </td>
                              <td style={{ padding: '12px 15px', whiteSpace: 'pre-wrap', color: '#374151', lineHeight: '1.5' }}>
                                {isOnlyGood ? (
                                  <span style={{ color: '#9CA3AF' }}>(특이사항 없음)</span>
                                ) : (
                                  report.teacherNote || <span style={{ color: '#9CA3AF' }}>(코멘트 누락됨)</span>
                                )}
                              </td>
                            </tr>
                          );
                        });
                      })}
                    </tbody>
                  </table>
                </div>
              );
            })
          )}
        </div>
      </div>
      {/* --- 인쇄 전용 영역 끝 --- */}

    </div>
  );
};

export default WeeklyReportPrint;
