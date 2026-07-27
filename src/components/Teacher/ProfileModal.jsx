import React, { useState } from 'react';
import { changePassword, updateUserProfile } from '../../services/api';
import { KeyRound, X, Loader, User } from 'lucide-react';

const ProfileModal = ({ sessionUser, onClose, setSessionUser }) => {
  const [formData, setFormData] = useState({ 
    name: sessionUser.name, 
    username: sessionUser.username,
    oldPassword: '', 
    newPassword: '', 
    confirmPassword: '' 
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    let message = '';
    
    // 프로필 변경 (이름, 아이디)
    if (formData.name !== sessionUser.name || formData.username !== sessionUser.username) {
      if (!formData.name.trim() || !formData.username.trim()) {
        alert("이름과 아이디는 공백일 수 없습니다.");
        setIsSaving(false);
        return;
      }
      
      const profileRes = await updateUserProfile(sessionUser.id, formData.name, formData.username);
      if (!profileRes.success) {
        alert(profileRes.message || "프로필 변경 실패");
        setIsSaving(false);
        return;
      }
      message += "프로필이 성공적으로 변경되었습니다.\n";
      
      // Update local session
      if (setSessionUser) {
        setSessionUser({ ...sessionUser, name: formData.name, username: formData.username });
      } else {
        message += "새로운 프로필 정보를 반영하려면 다시 로그인해 주세요.\n";
      }
    }

    // 비밀번호 변경
    if (formData.oldPassword || formData.newPassword) {
      if (formData.newPassword !== formData.confirmPassword) {
        alert("새 비밀번호와 확인 비밀번호가 일치하지 않습니다.");
        setIsSaving(false);
        return;
      }
      if (formData.newPassword.length < 4) {
        alert("새 비밀번호는 최소 4자리 이상이어야 합니다.");
        setIsSaving(false);
        return;
      }
      
      const passRes = await changePassword(sessionUser.id, formData.oldPassword, formData.newPassword);
      if (!passRes.success) {
        alert(passRes.message || "비밀번호 변경 실패");
        setIsSaving(false);
        return;
      }
      message += "비밀번호가 성공적으로 변경되었습니다.";
    }

    setIsSaving(false);
    
    if (message) {
      alert(message);
      onClose();
    } else {
      // 아무것도 변경 안함
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1000 }}>
      <div className="modal-content" style={{ maxWidth: '400px' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}><User size={20} /> 프로필 및 보안 설정</h3>
          <button className="btn-close" onClick={onClose}><X size={24} /></button>
        </div>
        <form onSubmit={handleSubmit} style={{ padding: '1.5rem' }}>
          
          <h4 style={{ marginBottom: '1rem', color: 'var(--primary-color)', fontSize: '0.9rem' }}>기본 정보 변경</h4>
          
          <div className="form-group">
            <label className="form-label">이름 (표시명)</label>
            <input type="text" className="form-control" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
          </div>
          
          <div className="form-group">
            <label className="form-label">아이디 (로그인용)</label>
            <input type="text" className="form-control" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} required />
            <div style={{ fontSize: '0.8rem', color: 'var(--danger-color)', marginTop: '0.25rem' }}>* 아이디 변경 시 다음번엔 새 아이디로 로그인해야 합니다.</div>
          </div>
          
          <hr style={{ margin: '1.5rem 0', borderColor: 'var(--border-color)', borderStyle: 'dashed' }} />
          
          <h4 style={{ marginBottom: '1rem', color: 'var(--primary-color)', fontSize: '0.9rem' }}>비밀번호 변경 (선택사항)</h4>
          
          <div className="form-group">
            <label className="form-label">현재 비밀번호</label>
            <input type="password" className="form-control" placeholder="변경 시에만 입력" value={formData.oldPassword} onChange={e => setFormData({...formData, oldPassword: e.target.value})} />
          </div>
          <div className="form-group">
            <label className="form-label">새 비밀번호</label>
            <input type="password" className="form-control" placeholder="변경 시에만 입력" value={formData.newPassword} onChange={e => setFormData({...formData, newPassword: e.target.value})} />
          </div>
          <div className="form-group">
            <label className="form-label">새 비밀번호 확인</label>
            <input type="password" className="form-control" placeholder="변경 시에만 입력" value={formData.confirmPassword} onChange={e => setFormData({...formData, confirmPassword: e.target.value})} />
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1.5rem' }}>
            <button type="button" className="btn btn-outline" onClick={onClose}>취소</button>
            <button type="submit" className="btn btn-primary" disabled={isSaving}>
              {isSaving ? <Loader className="spin" size={18} /> : '저장하기'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfileModal;
