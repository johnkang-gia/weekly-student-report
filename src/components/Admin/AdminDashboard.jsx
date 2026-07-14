import React, { useState, useEffect } from 'react';
import { fetchReports, fetchStudents, fetchTerms, fetchComments, addComment, submitReport } from '../../services/api';
import { Search, BrainCircuit, Inbox, MessageSquare, Edit3, X, Save } from 'lucide-react';

const AdminDashboard = ({ sessionUser }) => {
  const [reports, setReports] = useState([]);
  const [students, setStudents] = useState([]);
  const [terms, setTerms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTerm, setFilterTerm] = useState('all');
  const [filterClass, setFilterClass] = useState('all');

  // Modal State
  const [selectedReport, setSelectedReport] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState(null);

  const loadData = async () => {
    setIsLoading(true);
    const [rData, sData, tData] = await Promise.all([
      fetchReports(), fetchStudents(), fetchTerms()
    ]);
    setReports(rData);
    setStudents(sData);
    setTerms(tData);
    setIsLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const openReportDetail = async (report) => {
    setSelectedReport(report);
    const cmts = await fetchComments(report.studentId);
    setComments(cmts);
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    
    const res = await addComment({
      studentId: selectedReport.studentId,
      author: `${sessionUser.name} (${sessionUser.role === 'staff' ? '교직원' : sessionUser.role === 'admin' ? '관리자' : '선생님'})`,
      content: newComment
    });
    
    if (res.success) {
      setComments([...comments, res.data]);
      setNewComment('');
    }
  };

  const handleSaveEdit = async () => {
    await submitReport(editForm);
    setIsEditing(false);
    setSelectedReport(null);
    await loadData();
  };

  const enrichedReports = reports.map(r => {
    const student = students.find(s => s.id === r.studentId) || {};
    const term = terms.find(t => t.id === r.termId) || {};
    return { ...r, studentName: student.name, className: student.className, grade: student.grade, termName: term.name };
  });

  const uniqueClasses = [...new Set(students.map(s => s.className).filter(Boolean))];

  const filteredReports = enrichedReports.filter(r => {
    const matchName = (r.studentName || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchTerm = filterTerm === 'all' || r.termId === filterTerm;
    const matchClass = filterClass === 'all' || r.className === filterClass;
    return matchName && matchTerm && matchClass;
  });

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">통합 대시보드</h1>
          <p className="page-subtitle">학생들의 주간 리포트를 열람하고 교직원 메모를 관리합니다.</p>
        </div>
      </div>

      <div className="filters-bar">
        <div className="search-input">
          <Search className="search-icon" size={20} />
          <input type="text" className="form-control" placeholder="학생 이름 검색..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        <select className="form-control filter-select" value={filterTerm} onChange={(e) => setFilterTerm(e.target.value)}>
          <option value="all">모든 학기 보기</option>
          {terms.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <select className="form-control filter-select" value={filterClass} onChange={(e) => setFilterClass(e.target.value)}>
          <option value="all">모든 반 보기</option>
          {uniqueClasses.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}>데이터를 불러오는 중입니다...</div>
      ) : filteredReports.length > 0 ? (
        <div className="report-list">
          {filteredReports.map(report => (
            <div key={report.id} className="report-item" style={{ cursor: 'pointer' }} onClick={() => openReportDetail(report)}>
              <div className="report-header" style={{ marginBottom: '0.5rem' }}>
                <div>
                  <div className="report-student">
                    {report.studentName} <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>({report.studentId})</span>
                    <span className="badge">{report.grade} {report.className}</span>
                  </div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                    {report.date} | {report.termName}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {report.aiTags && report.aiTags.map((tag, idx) => (
                    <span key={idx} className={`badge badge-${tag.type}`}>{tag.label}</span>
                  ))}
                </div>
              </div>
              <div style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {report.teacherNote}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <Inbox className="empty-state-icon" size={48} />
          <h3>결과가 없습니다</h3>
        </div>
      )}

      {/* Detail & Comment Modal */}
      {selectedReport && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100, padding: '2rem' }}>
          <div className="card" style={{ width: '100%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto', position: 'relative', margin: 0 }}>
            
            <button onClick={() => { setSelectedReport(null); setIsEditing(false); }} style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
              <X size={24} />
            </button>

            <h2 style={{ marginBottom: '0.5rem' }}>{selectedReport.studentName} 리포트 상세</h2>
            <div style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>{selectedReport.date} | {selectedReport.termName}</div>

            {sessionUser.role === 'admin' && !isEditing && (
              <button className="btn btn-outline btn-sm" onClick={() => { setIsEditing(true); setEditForm(selectedReport); }} style={{ marginBottom: '1.5rem' }}>
                <Edit3 size={16} /> 리포트 내용 수정 (관리자 전용)
              </button>
            )}

            {isEditing ? (
              <div className="form-grid" style={{ marginBottom: '2rem' }}>
                <div className="form-group"><label>Academic</label><textarea className="form-control" value={editForm.academic} onChange={(e)=>setEditForm({...editForm, academic: e.target.value})} /></div>
                <div className="form-group"><label>Improvement</label><textarea className="form-control" value={editForm.improvement} onChange={(e)=>setEditForm({...editForm, improvement: e.target.value})} /></div>
                <div className="form-group"><label>Participation</label><textarea className="form-control" value={editForm.participation} onChange={(e)=>setEditForm({...editForm, participation: e.target.value})} /></div>
                <div className="form-group"><label>Behavior</label><textarea className="form-control" value={editForm.behavior} onChange={(e)=>setEditForm({...editForm, behavior: e.target.value})} /></div>
                <div className="form-group"><label>Social</label><textarea className="form-control" value={editForm.social} onChange={(e)=>setEditForm({...editForm, social: e.target.value})} /></div>
                <div className="form-group"><label>Teacher Note</label><textarea className="form-control" value={editForm.teacherNote} onChange={(e)=>setEditForm({...editForm, teacherNote: e.target.value})} /></div>
                <div style={{ gridColumn: '1/-1', display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                  <button className="btn btn-outline" onClick={()=>setIsEditing(false)}>취소</button>
                  <button className="btn btn-primary" onClick={handleSaveEdit}><Save size={16}/> 수정 내용 저장</button>
                </div>
              </div>
            ) : (
              <div className="report-fields-grid" style={{ marginBottom: '2rem' }}>
                <div className="report-field-box"><h4>Academic Progress</h4><p>{selectedReport.academic}</p></div>
                <div className="report-field-box"><h4>Areas for Improvement</h4><p>{selectedReport.improvement}</p></div>
                <div className="report-field-box"><h4>Class Participation</h4><p>{selectedReport.participation}</p></div>
                <div className="report-field-box"><h4>Behavior & Attitude</h4><p>{selectedReport.behavior}</p></div>
                <div className="report-field-box" style={{ gridColumn: '1 / -1' }}><h4>Social Interaction</h4><p>{selectedReport.social}</p></div>
                <div className="report-field-box" style={{ gridColumn: '1 / -1', borderLeft: '4px solid var(--primary-color)' }}><h4 style={{ color: 'var(--primary-color)' }}>Teacher's Note</h4><p style={{ fontWeight: 500 }}>{selectedReport.teacherNote}</p></div>
              </div>
            )}

            <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '2rem 0' }} />

            {/* Comments Section */}
            <div>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}><MessageSquare size={20} /> 학생 히스토리 메모 (교직원/관리자/선생님)</h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
                {comments.length === 0 ? (
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontStyle: 'italic' }}>작성된 메모가 없습니다.</div>
                ) : (
                  comments.map(c => (
                    <div key={c.id} style={{ background: '#F9FAFB', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        <strong style={{ color: 'var(--text-primary)' }}>{c.author}</strong>
                        <span>{new Date(c.createdAt).toLocaleString()}</span>
                      </div>
                      <p style={{ fontSize: '0.95rem' }}>{c.content}</p>
                    </div>
                  ))
                )}
              </div>

              {/* Add Comment */}
              <form onSubmit={handleAddComment} style={{ display: 'flex', gap: '1rem' }}>
                <input type="text" className="form-control" placeholder="이 학생에 대한 추가 메모나 특이사항을 남겨주세요." value={newComment} onChange={(e)=>setNewComment(e.target.value)} required />
                <button type="submit" className="btn btn-primary" style={{ whiteSpace: 'nowrap' }}>메모 등록</button>
              </form>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
