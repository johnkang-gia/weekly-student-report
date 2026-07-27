import React, { useState, useEffect } from 'react';
import { fetchReports, fetchClasses } from '../services/api';
import { Search, Filter, Inbox } from 'lucide-react';

const AdminDashboard = () => {
  const [reports, setReports] = useState([]);
  const [classes, setClasses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterClass, setFilterClass] = useState('all');

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      const [reportsData, classesData] = await Promise.all([
        fetchReports(),
        fetchClasses()
      ]);
      setReports(reportsData);
      setClasses(classesData);
      setIsLoading(false);
    };
    
    loadData();
  }, []);

  const filteredReports = reports.filter(report => {
    const matchName = report.studentName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchClass = filterClass === 'all' || report.className === filterClass;
    return matchName && matchClass;
  });

  return (
    <div className="admin-dashboard-container">
      <div className="page-header">
        <h1 className="page-title">위클리 리포트 관리</h1>
        <p className="page-subtitle">모든 학생들의 주간 리포트를 검색하고 열람합니다.</p>
      </div>

      <div className="filters-bar">
        <div className="search-input">
          <Search className="search-icon" size={20} />
          <input 
            type="text" 
            className="form-control" 
            placeholder="학생 이름으로 검색..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="filter-select">
          <select 
            className="form-control"
            value={filterClass}
            onChange={(e) => setFilterClass(e.target.value)}
          >
            <option value="all">모든 반 보기</option>
            {classes.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
          데이터를 불러오는 중입니다...
        </div>
      ) : filteredReports.length > 0 ? (
        <div className="report-list">
          {filteredReports.map(report => (
            <div key={report.id} className="report-item">
              <div className="report-header">
                <div>
                  <div className="report-student">
                    {report.studentName}
                    <span className="badge">{report.className}</span>
                  </div>
                  <div className="report-meta">
                    <span>작성일: {report.date}</span>
                    <span>제출시간: {new Date(report.createdAt).toLocaleString()}</span>
                  </div>
                </div>
              </div>
              <div className="report-content">
                {report.content}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <Inbox className="empty-state-icon" size={48} />
          <h3>검색 결과가 없습니다</h3>
          <p>조건에 맞는 위클리 리포트가 존재하지 않습니다.</p>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
