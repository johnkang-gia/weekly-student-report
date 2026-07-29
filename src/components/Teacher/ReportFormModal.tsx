import React, { useState, useEffect, useRef } from 'react';
import { submitReport, getActiveTerm, fetchPreviousReport } from '../../services/api';
import { Loader, X, Check, FileText, Info, History, Bookmark, BookmarkPlus, Save } from 'lucide-react';
import { parseBadges } from '../../utils/badgeHelper';

const BADGE_OPTIONS = [
  { value: 'excellent', emoji: '🌟', label: '탁월', enLabel: 'Excellent', color: '#4F46E5', bg: '#EEF2FF', border: '#4F46E5' },
  { value: 'good', emoji: '🟢', label: '양호', enLabel: 'Good', color: '#10B981', bg: '#ECFDF5', border: '#10B981' },
  { value: 'warning', emoji: '⚠️', label: '지도요망', enLabel: 'Needs Attention', color: '#D97706', bg: '#FEF3C7', border: '#F59E0B' },
  { value: 'bad', emoji: '🚨', label: '집중지도', enLabel: 'Poor', color: '#B91C1C', bg: '#FEE2E2', border: '#EF4444' }
];

const INITIAL_BADGES = {
  academic: ['good'],
  improvement: ['good'],
  participation: ['good'],
  behavior: ['good'],
  social: ['good']
};

const ReportFormModal = ({ student, sessionUser, reports, onClose, onRefresh, mode = 'homeroom', subjectName = '담임' }) => {
  const [activeTab, setActiveTab] = useState(subjectName);
  
  const [formData, setFormData] = useState({
    academic: '', improvement: '', participation: '', behavior: '', social: '', teacherNote: '', evalBadges: INITIAL_BADGES
  });
  const [existingReportId, setExistingReportId] = useState(null);
  
  const [isSaving, setIsSaving] = useState(false);
  const [activeTerm, setActiveTerm] = useState<any>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [saveStatusMsg, setSaveStatusMsg] = useState('');
  const [previousReport, setPreviousReport] = useState<any>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [templates, setTemplates] = useState<{id: string, text: string}[]>([]);
  const autoSaveTimerRef = useRef<any>(null);

  const isAdminOrStaff = mode === 'admin' || mode === 'archive';
  const mySubject = mode === 'homeroom' ? '담임' : subjectName;
  
  const subjectReports = {};
  reports.forEach(r => {
    subjectReports[r.subject] = r;
  });

  const isArchiveMode = mode === 'archive';
  const isReadOnly = isArchiveMode || (mode !== 'admin' && activeTab !== mySubject);

  useEffect(() => {
    if (isAdminOrStaff && !activeTab) {
      setActiveTab(subjectName || '담임');
    }
  }, [isAdminOrStaff, subjectName, activeTab]);

  useEffect(() => {
    const init = async () => {
      const term = await getActiveTerm();
      setActiveTerm(term);
    };
    init();

    // Load templates from local storage
    const savedTemplates = localStorage.getItem('teacherNoteTemplates');
    if (savedTemplates) {
      setTemplates(JSON.parse(savedTemplates));
    }
  }, []);

  useEffect(() => {
    const targetReport = subjectReports[activeTab];
    if (targetReport) {
      const parsedTags = parseBadges(targetReport.aiTags);
      const ensureString = (val) => {
        if (!val) return '';
        if (typeof val === 'string') return val;
        try { return JSON.stringify(val); } catch (e) { return String(val); }
      };

      setFormData({
        academic: ensureString(targetReport.academic),
        improvement: ensureString(targetReport.improvement),
        participation: ensureString(targetReport.participation),
        behavior: ensureString(targetReport.behavior),
        social: ensureString(targetReport.social),
        teacherNote: ensureString(targetReport.teacherNote),
        evalBadges: parsedTags
      });
      setExistingReportId(targetReport.id);
      setIsDirty(false); // Reset dirty flag on load
    } else {
      setFormData({ academic: '', improvement: '', participation: '', behavior: '', social: '', teacherNote: '', evalBadges: INITIAL_BADGES });
      setExistingReportId(null);
      setIsDirty(false);
    }

    // Fetch history
    const loadHistory = async () => {
      const prev = await fetchPreviousReport(student.id, activeTab);
      setPreviousReport(prev);
    };
    loadHistory();
    
    // Clear auto-save timer on tab switch
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    setSaveStatusMsg('');

  }, [activeTab, reports, student.id]);

  // Auto-save effect
  useEffect(() => {
    if (!isDirty || isReadOnly || !activeTerm) return;

    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    setSaveStatusMsg('저장 중...');

    autoSaveTimerRef.current = setTimeout(async () => {
      const dataToSubmit = {
        ...formData,
        id: existingReportId,
        studentId: student.id,
        termId: activeTerm.id,
        date: new Date().toISOString().split('T')[0],
        subject: (mode === 'admin' || mode === 'archive') ? activeTab : mySubject,
        aiTags: formData.evalBadges,
        status: 'draft'
      };
      
      const res = await submitReport(dataToSubmit);
      if (res.success) {
        setSaveStatusMsg(`자동 저장됨: ${new Date().toLocaleTimeString()}`);
        if (!existingReportId && res.data) {
           setExistingReportId(res.data.id);
        }
        setIsDirty(false);
        onRefresh(); // To update dashboard badges
      } else {
        setSaveStatusMsg('자동 저장 실패');
      }
    }, 3000);

    return () => clearTimeout(autoSaveTimerRef.current);
  }, [formData, isDirty, isReadOnly, activeTerm, existingReportId, student.id, activeTab, mySubject, mode]);

  const handleSave = async (e, saveStatus = 'published') => {
    e.preventDefault();
    if (!activeTerm) {
      alert("활성화된 학기가 없습니다.");
      return;
    }

    if (saveStatus === 'published') {
      if (!formData.academic || !formData.improvement || !formData.participation || !formData.behavior || !formData.social) {
        alert("발행(Publish)하려면 모든 텍스트 항목을 작성해야 합니다. 작성 중이라면 '임시저장'을 이용해 주세요.");
        return;
      }
    }
    
    setIsSaving(true);
    const dataToSubmit = {
      ...formData,
      id: existingReportId,
      studentId: student.id,
      termId: activeTerm.id,
      date: new Date().toISOString().split('T')[0],
      subject: (mode === 'admin' || mode === 'archive') ? activeTab : mySubject,
      aiTags: formData.evalBadges,
      status: saveStatus
    };
    
    const res = await submitReport(dataToSubmit);
    if (res.success) {
      alert(saveStatus === 'draft' ? "임시저장 되었습니다." : "성공적으로 발행되었습니다.");
      await onRefresh();
      onClose();
    } else {
      alert("저장 실패");
    }
    setIsSaving(false);
  };

  const handleSaveTemplate = () => {
    if (!formData.teacherNote.trim()) {
      alert("저장할 종합 의견 내용을 먼저 작성해주세요.");
      return;
    }
    const newTemplates = [...templates, { id: Date.now().toString(), text: formData.teacherNote }];
    setTemplates(newTemplates);
    localStorage.setItem('teacherNoteTemplates', JSON.stringify(newTemplates));
    alert("현재 작성된 내용이 상용구로 저장되었습니다.");
  };

  const handleDeleteTemplate = (id) => {
    const newTemplates = templates.filter(t => t.id !== id);
    setTemplates(newTemplates);
    localStorage.setItem('teacherNoteTemplates', JSON.stringify(newTemplates));
  };


  let tabs = [];
  if (mode === 'admin' || isArchiveMode) {
    tabs = Object.keys(subjectReports);
    if (!tabs.includes(activeTab)) tabs.unshift(activeTab);
  } else {
    const otherSubjects = Object.keys(subjectReports).filter(s => s !== mySubject);
    tabs = [mySubject, ...otherSubjects];
  }

  const handleBadgeToggle = (category, value) => {
    if (isReadOnly) return;
    setFormData(prev => {
      let currentBadges = [...(prev?.evalBadges?.[category] || [])];
      if (currentBadges.includes(value)) {
        currentBadges = currentBadges.filter(b => b !== value);
      } else {
        currentBadges.push(value);
      }
      if (currentBadges.length === 0) currentBadges = ['good']; // default fallback
      return { ...prev, evalBadges: { ...prev.evalBadges, [category]: currentBadges } };
    });
    setIsDirty(true);
  };

  const renderBadgeGroup = (category) => {
    const currentBadges = formData?.evalBadges?.[category] || ['good'];
    return (
      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
        {BADGE_OPTIONS.map(badge => {
          const isChecked = currentBadges.includes(badge.value);
          return (
            <div 
              key={badge.value}
              onClick={() => handleBadgeToggle(category, badge.value)}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '6px 12px',
                border: isChecked ? `2px solid ${badge.border}` : '1px solid #CBD5E1',
                borderRadius: '20px',
                backgroundColor: isChecked ? badge.bg : 'white',
                cursor: isReadOnly ? 'not-allowed' : 'pointer',
                opacity: isReadOnly ? 0.7 : 1,
                fontSize: '0.85rem',
                fontWeight: isChecked ? 'bold' : 'normal',
                color: isChecked ? badge.color : '#475569',
                transition: 'all 0.2s',
                userSelect: 'none',
                whiteSpace: 'nowrap'
              }}
            >
              <span>{badge.emoji}</span>
              <span style={{ wordBreak: 'keep-all' }}>{badge.label} <span style={{ fontSize: '0.75rem', opacity: 0.8, fontWeight: 'normal' }}>({badge.enLabel})</span></span>
            </div>
          );
        })}
      </div>
    );
  };

  const allSelectedBadges = Object.values(formData?.evalBadges || {}).flat();
  const needsReason = allSelectedBadges.includes('excellent') || allSelectedBadges.includes('warning') || allSelectedBadges.includes('bad');

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1000 }}>
      <div className="modal-content" style={{ maxWidth: '800px', width: '90%', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header" style={{ position: 'sticky', top: 0, backgroundColor: 'white', zIndex: 10 }}>
          <div>
            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FileText size={20} /> 리포트 열람 및 작성 
              {existingReportId && <span style={{ fontSize: '0.8rem', color: '#94A3B8', fontWeight: 'normal', backgroundColor: '#F1F5F9', padding: '2px 6px', borderRadius: '4px' }}>#{existingReportId.split('-')[1]}</span>}
            </h3>
            <p style={{ margin: 0, marginTop: '0.25rem', color: 'var(--text-secondary)' }}>
              {student.grade}학년 {student.className} - <strong style={{ color: 'var(--primary-color)' }}>{student.name}</strong> 학생
            </p>
          </div>
          <button className="btn-close" onClick={onClose}><X size={24} /></button>
        </div>

        <div className="modal-body" style={{ padding: '0' }}>
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', padding: '0 1.5rem', backgroundColor: '#F9FAFB', overflowX: 'auto' }}>
            {tabs.map(tab => (
              <div 
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: '1rem',
                  cursor: 'pointer',
                  borderBottom: activeTab === tab ? '2px solid var(--primary-color)' : '2px solid transparent',
                  color: activeTab === tab ? 'var(--primary-color)' : 'var(--text-secondary)',
                  fontWeight: activeTab === tab ? 600 : 400,
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                  whiteSpace: 'nowrap'
                }}
              >
                {tab} {(!isReadOnly && tab === mySubject) && <span className="badge badge-primary">내 권한</span>}
                {(mode === 'admin' && !isArchiveMode) && <span className="badge badge-success">수정가능</span>}
                {isArchiveMode && <span className="badge" style={{ backgroundColor: '#E5E7EB', color: '#374151' }}>보관됨</span>}
              </div>
            ))}
          </div>

          <form style={{ padding: '1.5rem' }}>
            {isReadOnly && (
              <div className="alert alert-info" style={{ marginBottom: '1.5rem' }}>
                현재 다른 교과목({activeTab}) 선생님의 리포트를 열람 중입니다. 읽기 전용입니다.
              </div>
            )}

            <div className="form-grid">
              <div style={{ gridColumn: '1 / -1', backgroundColor: '#F8FAFC', padding: '0.75rem', borderRadius: '6px', border: '1px solid #E2E8F0', marginBottom: '0.5rem' }}>
                <div style={{ fontSize: '0.85rem', color: '#475569', marginBottom: '4px' }}>
                  <Info size={14} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: '4px' }} /> 
                  <strong>뱃지 평가 안내 (Evaluation Guide):</strong> 각 항목별로 해당하는 뱃지를 클릭하여 복수 선택할 수 있습니다.
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.8rem', color: '#64748B', marginTop: '8px' }}>
                  <span>🌟 <strong>탁월 (Excellent)</strong>: 매우 우수한 성취</span>
                  <span>🟢 <strong>양호 (Good)</strong>: 정상적인 성취 (기본값)</span>
                  <span>⚠️ <strong>지도요망 (Needs Attention)</strong>: 약간의 지도가 필요함</span>
                  <span>🚨 <strong>집중지도 (Poor)</strong>: 집중적인 관리가 필요함</span>
                </div>
              </div>

              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>학업 성취도 (Academic Performance)</span>
                </label>
                {renderBadgeGroup('academic')}
                <textarea className="form-control" rows={3} value={formData.academic} onChange={e => { setFormData({...formData, academic: e.target.value}); setIsDirty(true); }} disabled={isReadOnly}></textarea>
              </div>

              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">보완점 및 발전 방향 (Improvement & Goals)</label>
                {renderBadgeGroup('improvement')}
                <textarea className="form-control" rows={3} value={formData.improvement} onChange={e => { setFormData({...formData, improvement: e.target.value}); setIsDirty(true); }} disabled={isReadOnly}></textarea>
              </div>

              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">수업 참여도 (Class Participation)</label>
                {renderBadgeGroup('participation')}
                <textarea className="form-control" rows={3} value={formData.participation} onChange={e => { setFormData({...formData, participation: e.target.value}); setIsDirty(true); }} disabled={isReadOnly}></textarea>
              </div>

              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">생활 태도 및 성실성 (Behavior & Attitude)</label>
                {renderBadgeGroup('behavior')}
                <textarea className="form-control" rows={3} value={formData.behavior} onChange={e => { setFormData({...formData, behavior: e.target.value}); setIsDirty(true); }} disabled={isReadOnly}></textarea>
              </div>

              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">교우 관계 및 협동심 (Social Skills)</label>
                {renderBadgeGroup('social')}
                <textarea className="form-control" rows={3} value={formData.social} onChange={e => { setFormData({...formData, social: e.target.value}); setIsDirty(true); }} disabled={isReadOnly}></textarea>
              </div>

              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '0.5rem' }}>
                  <label className="form-label" style={{ marginBottom: 0 }}>교사 종합 의견 (Teacher's Note) - <em>학부모 리포트에 표시됨</em></label>
                  {!isReadOnly && (
                    <button 
                      type="button" 
                      onClick={handleSaveTemplate}
                      style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', padding: '4px 8px', backgroundColor: '#F1F5F9', border: '1px solid #CBD5E1', borderRadius: '4px', cursor: 'pointer', color: '#475569' }}
                    >
                      <BookmarkPlus size={14} /> 현재 내용 상용구로 저장
                    </button>
                  )}
                </div>
                
                {/* Template List */}
                {templates.length > 0 && !isReadOnly && (
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                    {templates.map(t => (
                      <div key={t.id} style={{ display: 'flex', alignItems: 'center', backgroundColor: '#EEF2FF', border: '1px solid #C7D2FE', borderRadius: '16px', padding: '2px 8px', fontSize: '0.8rem', color: '#4F46E5' }}>
                        <span 
                          style={{ cursor: 'pointer', marginRight: '4px' }} 
                          onClick={() => { setFormData({...formData, teacherNote: formData.teacherNote + (formData.teacherNote ? '\n' : '') + t.text}); setIsDirty(true); }}
                          title="클릭하여 내용 추가"
                        >
                          <Bookmark size={12} style={{ display: 'inline', marginRight: '2px' }} />
                          {t.text.length > 15 ? t.text.substring(0, 15) + '...' : t.text}
                        </span>
                        <X 
                          size={12} 
                          style={{ cursor: 'pointer', color: '#94A3B8', marginLeft: '4px' }} 
                          onClick={() => handleDeleteTemplate(t.id)} 
                          title="삭제"
                        />
                      </div>
                    ))}
                  </div>
                )}
                
                <textarea 
                  className="form-control" 
                  rows={4} 
                  placeholder="학부모님께 전달할 종합적인 코멘트를 작성해주세요."
                  value={formData.teacherNote} 
                  onChange={e => { setFormData({...formData, teacherNote: e.target.value}); setIsDirty(true); }}
                  disabled={isReadOnly}
                ></textarea>
              </div>
            </div>
            
            {/* History Panel */}
            {showHistory && previousReport && (
              <div style={{ marginTop: '1.5rem', padding: '1rem', backgroundColor: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: '#334155' }}>
                  <History size={18} /> 지난 주 리포트 ({previousReport.date})
                </h4>
                <div style={{ fontSize: '0.9rem', color: '#475569' }}>
                  <p><strong>학업 성취도:</strong> {previousReport.academic}</p>
                  <p><strong>보완점:</strong> {previousReport.improvement}</p>
                  <p><strong>참여도:</strong> {previousReport.participation}</p>
                  <p><strong>생활 태도:</strong> {previousReport.behavior}</p>
                  <p><strong>교우 관계:</strong> {previousReport.social}</p>
                  <p><strong>교사 의견:</strong> {previousReport.teacherNote}</p>
                </div>
              </div>
            )}
            {showHistory && !previousReport && (
              <div style={{ marginTop: '1.5rem', padding: '1rem', backgroundColor: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0', textAlign: 'center', color: '#64748B' }}>
                지난 주 리포트가 없습니다.
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2rem' }}>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <button type="button" className="btn btn-secondary" onClick={onClose}>취소 (Cancel)</button>
                <span style={{ fontSize: '0.85rem', color: '#64748B', fontStyle: 'italic' }}>
                  {saveStatusMsg}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setShowHistory(!showHistory)}
                  style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <History size={16} /> {showHistory ? '과거 기록 닫기' : '지난주 기록 보기'}
                </button>
                
                {!isReadOnly && (
                  <>
                    <button 
                      type="button" 
                      className="btn btn-secondary" 
                      onClick={(e) => handleSave(e, 'draft')}
                      disabled={isSaving}
                      style={{ display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: '#FEF3C7', color: '#D97706', borderColor: '#FDE68A' }}
                    >
                      {isSaving ? <Loader size={16} className="spin" /> : <Save size={16} />} 임시저장
                    </button>
                    <button 
                      type="button" 
                      className="btn btn-primary" 
                      onClick={(e) => handleSave(e, 'published')}
                      disabled={isSaving}
                      style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      {isSaving ? <Loader size={16} className="spin" /> : <Check size={16} />} 발행하기
                    </button>
                  </>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
export default ReportFormModal;
