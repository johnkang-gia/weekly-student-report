import React, { useState, useEffect } from 'react';
import { fetchReports, fetchStudents } from '../../services/api';
import { Loader, BarChart3, TrendingUp, AlertCircle, Award } from 'lucide-react';
import { parseBadges, hasWarningBadges, hasSuccessBadges } from '../../utils/badgeHelper';

const AdminStatistics = () => {
  const [reports, setReports] = useState([]);
  const [students, setStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setIsLoading(true);
    const [rData, sData] = await Promise.all([fetchReports(), fetchStudents()]);
    setReports(rData);
    setStudents(sData);
    setIsLoading(false);
  };

  if (isLoading) return <div style={{ padding: '3rem', textAlign: 'center' }}><Loader className="spin" size={32} /></div>;

  // 이번 주(최근 7일) 리포트 추출
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const recentReports = reports.filter(r => new Date(r.createdAt) >= oneWeekAgo);

  // AI 태그 분석 (우수 vs 지원필요)
  let successCount = 0;
  let warningCount = 0;
  const warningMap = {}; // { studentId: count }
  const successList = []; // { student, subject }
  const warningList = []; // { student, subject }
  
  recentReports.forEach(r => {
    const parsedTags = parseBadges(r.aiTags);
    const hasSuccess = hasSuccessBadges(parsedTags);
    const hasWarning = hasWarningBadges(parsedTags);

    const stu = students.find(s => s.id === r.studentId) || { name: '알 수 없음', grade: '-', className: '-' };

    if (hasSuccess) {
      successCount++;
      successList.push({ student: stu, subject: r.subject });
    }
    if (hasWarning) {
      warningCount++;
      warningMap[r.studentId] = (warningMap[r.studentId] || 0) + 1;
      warningList.push({ student: stu, subject: r.subject });
    }
  });

  // 요주의 학생 랭킹 (지원필요 다중 누적)
  const atRiskStudents = Object.entries(warningMap)
    .sort((a, b) => b[1] - a[1])
    .filter(([_, count]) => count >= 2) // 2회 이상 경고 누적
    .map(([studentId, count]) => {
      const stu = students.find(s => s.id === studentId);
      return { ...stu, warningCount: count };
    })
    .slice(0, 5); // 상위 5명

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
        <BarChart3 className="icon" /> 경영 통계 대시보드 (최근 7일 기준)
      </h2>

      {/* 핵심 지표 (KPI) 카드 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '1rem', backgroundColor: 'var(--primary-color)', color: 'white', borderRadius: '50%' }}>
            <TrendingUp size={28} />
          </div>
          <div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>이번 주 작성된 총 리포트</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>{recentReports.length}건</div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '1rem', backgroundColor: 'var(--success-color)', color: 'white', borderRadius: '50%' }}>
            <Award size={28} />
          </div>
          <div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>우수(칭찬) 평가 건수</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--success-color)' }}>{successCount}건</div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '1rem', backgroundColor: 'var(--danger-color)', color: 'white', borderRadius: '50%' }}>
            <AlertCircle size={28} />
          </div>
          <div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>지원필요(어려움) 평가 건수</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--danger-color)' }}>{warningCount}건</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
        {/* 요주의 학생 리스트 */}
        <div className="card">
          <div className="card-header">
            <h3><AlertCircle size={20} style={{ color: 'var(--danger-color)' }} /> 집중 관리 요망 학생 (At-Risk Watchlist)</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>이번 주에 담임 및 여러 교과 선생님들로부터 다중으로 "지원필요/어려움" 피드백이 누적된 학생들입니다. (2회 이상)</p>
          </div>
          {atRiskStudents.length === 0 ? (
            <div className="empty-state">이번 주에 다중 경고를 받은 학생이 없습니다. 훌륭합니다!</div>
          ) : (
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>학생 이름</th>
                    <th>소속 반</th>
                    <th>지원필요 피드백 횟수</th>
                  </tr>
                </thead>
                <tbody>
                  {atRiskStudents.map((s, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: 600 }}>{s.name || '알 수 없음'}</td>
                      <td>{s.grade ? `${s.grade}학년 ${s.className}` : '-'}</td>
                      <td>
                        <span className="badge badge-danger">경고 {s.warningCount}회 누적</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      
      {/* 상세 피드백 학생 리스트 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginTop: '1rem' }}>
        <div className="card">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--success-color)' }}><Award size={20} /> 우수 피드백 학생 명단</h3>
          {successList.length === 0 ? (
            <div className="empty-state">이번 주 우수 피드백이 없습니다.</div>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {successList.map((item, idx) => (
                <li key={idx} style={{ padding: '0.75rem 0', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between' }}>
                  <div>
                    <span style={{ fontWeight: 600 }}>{item.student.name}</span> <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>({item.student.grade}학년 {item.student.className})</span>
                  </div>
                  <span className="badge badge-primary">{item.subject}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--danger-color)' }}><AlertCircle size={20} /> 지원필요 피드백 학생 명단</h3>
          {warningList.length === 0 ? (
            <div className="empty-state">이번 주 지원필요 피드백이 없습니다.</div>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {warningList.map((item, idx) => (
                <li key={idx} style={{ padding: '0.75rem 0', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between' }}>
                  <div>
                    <span style={{ fontWeight: 600 }}>{item.student.name}</span> <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>({item.student.grade}학년 {item.student.className})</span>
                  </div>
                  <span className="badge badge-danger">{item.subject}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};
export default AdminStatistics;
