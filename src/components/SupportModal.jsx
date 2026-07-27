import React, { useState } from 'react';
import { submitIssue } from '../services/api';
import { MessageSquare, X, Loader } from 'lucide-react';

const SupportModal = ({ sessionUser, onClose }) => {
  const [issueType, setIssueType] = useState('bug');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    
    setIsSubmitting(true);
    const res = await submitIssue({
      authorId: sessionUser.id,
      authorName: sessionUser.name,
      issueType,
      content
    });
    
    setIsSubmitting(false);
    if (res.success) {
      alert("성공적으로 접수되었습니다. 감사합니다!");
      onClose();
    } else {
      alert("접수에 실패했습니다.");
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1000 }}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}><MessageSquare size={20} /> 버그 제보 / 건의사항 (Bug Report / Feedback)</h3>
          <button className="btn-close" onClick={onClose}><X size={24} /></button>
        </div>
        <div className="modal-body">
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
            시스템을 이용하시면서 겪은 불편한 점이나 오류, 추가되었으면 하는 기능이 있다면 알려주세요. 개발팀에서 확인 후 적극 반영하겠습니다.<br />
            (Please let us know if you experience any bugs or have feature requests. Our dev team will review and apply them.)
          </p>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">유형 (Issue Type)</label>
              <select className="form-control" value={issueType} onChange={e => setIssueType(e.target.value)}>
                <option value="bug">버그 / 오류 제보 (Bug Report)</option>
                <option value="feature">새로운 기능 건의 (Feature Request)</option>
                <option value="other">기타 문의 (Other Inquiries)</option>
              </select>
            </div>
            
            <div className="form-group">
              <label className="form-label">내용 (Content)</label>
              <textarea 
                className="form-control" 
                rows={5} 
                placeholder="상세히 적어주시면 문제 해결에 큰 도움이 됩니다. (Please describe in detail)"
                value={content} 
                onChange={e => setContent(e.target.value)} 
                required
              />
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
              <button type="button" className="btn btn-outline" onClick={onClose}>취소 (Cancel)</button>
              <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                {isSubmitting ? <Loader className="spin" size={18} /> : '제출하기 (Submit)'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
export default SupportModal;
