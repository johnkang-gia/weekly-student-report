import React, { useState, useEffect } from 'react';
import { submitReport, getActiveTerm } from '../../services/api';
import { Loader, X, Check, FileText, Info } from 'lucide-react';
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
  const [activeTerm, setActiveTerm] = useState(null);

  const isAdminOrStaff = mode === 'admin' || mode === 'archive';
  const mySubject = mode === 'homeroom' ? '담임' : subjectName;
  
  const subjectReports = {};
  reports.forEach(r => {
    subjectReports[r.subject] = r;
  });

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
  }, []);

  useEffect(() => {
    const targetReport = subjectReports[activeTab];
    if (targetReport) {
      const parsedTags = parseBadges(targetReport.aiTags);
      setFormData({
        academic: targetReport.academic || '',
        improvement: targetReport.improvement || '',
        participation: targetReport.participation || '',
        behavior: targetReport.behavior || '',
        social: targetReport.social || '',
        teacherNote: targetReport.teacherNote || '',
        evalBadges: parsedTags
      });
      setExistingReportId(targetReport.id);
    } else {
      setFormData({ academic: '', improvement: '', participation: '', behavior: '', social: '', teacherNote: '', evalBadges: INITIAL_BADGES });
      setExistingReportId(null);
    }
  }, [activeTab, reports]);

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

  const isArchiveMode = mode === 'archive';
  const isReadOnly = isArchiveMode || (mode !== 'admin' && activeTab !== mySubject);

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
      let currentBadges = [...(prev.evalBadges[category] || [])];
      if (currentBadges.includes(value)) {
        currentBadges = currentBadges.filter(b => b !== value);
      } else {
        currentBadges.push(value);
      }
      if (currentBadges.length === 0) currentBadges = ['good']; // default fallback
      return { ...prev, evalBadges: { ...prev.evalBadges, [category]: currentBadges } };
    });
  };

  const renderBadgeGroup = (category) => {
    const currentBadges = formData.evalBadges[category] || ['good'];
    return (
      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
        {BADGE_OPTIONS.map(badge => {
          const isChecked = currentBadges.includes(badge.value);
          return (
            <div 
              key={badge.value}
              onClick={() => handleBadgeToggle(category, badge.value)}
              style={{
                display: 'flex', alignItems: 'center', gap: '4px',
                padding: '4px 10px',
                border: isChecked ? `2px solid ${badge.border}` : '1px solid #CBD5E1',
                borderRadius: '20px',
                backgroundColor: isChecked ? badge.bg : 'white',
                cursor: isReadOnly ? 'not-allowed' : 'pointer',
                opacity: isReadOnly ? 0.7 : 1,
                fontSize: '0.85rem',
                fontWeight: isChecked ? 'bold' : 'normal',
                color: isChecked ? badge.color : '#475569',
                transition: 'all 0.2s',
                userSelect: 'none'
              }}
            >
              <span>{badge.emoji}</span>
              <span>{badge.label} <span style={{ fontSize: '0.75rem', opacity: 0.8, fontWeight: 'normal' }}>({badge.enLabel})</span></span>
            </div>
          );
        })}
      </div>
    );
  };

  const allSelectedBadges = Object.values(formData.evalBadges).flat();
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
                <textarea className="form-control" rows={3} value={formData.academic} onChange={e => setFormData({...formData, academic: e.target.value})} disabled={isReadOnly}></textarea>
              </div>

              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">보완점 및 발전 방향 (Improvement & Goals)</label>
                {renderBadgeGroup('improvement')}
                <textarea className="form-control" rows={3} value={formData.improvement} onChange={e => setFormData({...formData, improvement: e.target.value})} disabled={isReadOnly}></textarea>
              </div>

              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">수업 참여도 (Class Participation)</label>
                {renderBadgeGroup('participation')}
                <textarea className="form-control" rows={3} value={formData.participation} onChange={e => setFormData({...formData, participation: e.target.value})} disabled={isReadOnly}></textarea>
              </div>

              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">생활 태도 (Behavior)</label>
                {renderBadgeGroup('behavior')}
                <textarea className="form-control" rows={3} value={formData.behavior} onChange={e => setFormData({...formData, behavior: e.target.value})} disabled={isReadOnly}></textarea>
              </div>

              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">교우 관계 (Social Relations)</label>
                {renderBadgeGroup('social')}
                <textarea className="form-control" rows={2} value={formData.social} onChange={e => setFormData({...formData, social: e.target.value})} disabled={isReadOnly}></textarea>
              </div>

              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">
                  선생님 코멘트 (Teacher's Note) 
                  {needsReason && 
                    <span style={{ color: 'var(--danger-color)', fontSize: '0.85rem', marginLeft: '0.5rem', fontWeight: 'bold' }}>* 뱃지 사유를 적어주세요. (Please provide reason for badges)</span>
                  }
                </label>
                <textarea className="form-control" rows={3} value={formData.teacherNote} onChange={e => setFormData({...formData, teacherNote: e.target.value})} disabled={isReadOnly} placeholder="특이사항 란에 출력됩니다. (Will be shown as special notes on the report)"></textarea>
              </div>
            </div>

            {!isReadOnly && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
                <button type="button" className="btn btn-outline" onClick={onClose}>취소 (Cancel)</button>
                <button type="button" className="btn" style={{ backgroundColor: '#F1F5F9', color: '#475569', border: '1px solid #CBD5E1' }} disabled={isSaving} onClick={(e) => handleSave(e, 'draft')}>
                  {isSaving ? <Loader className="spin" size={18} /> : '임시저장 (Save Draft)'}
                </button>
                <button type="button" className="btn btn-primary" disabled={isSaving} onClick={(e) => handleSave(e, 'published')}>
                  {isSaving ? <Loader className="spin" size={18} /> : (existingReportId && subjectReports[activeTab]?.status === 'published' ? '발행 수정 (Update)' : '발행하기 (Publish)')}
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};
export default ReportFormModal;
