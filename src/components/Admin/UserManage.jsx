import React, { useState, useEffect } from 'react';
import { fetchUsers, updateUserStatus, registerUser } from '../../services/api';
import { Users, CheckCircle, XCircle, UserPlus } from 'lucide-react';

const UserManage = () => {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Create User Form state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({ username: '', password: '', name: '', role: 'teacher' });

  const loadUsers = async () => {
    setIsLoading(true);
    const data = await fetchUsers();
    setUsers(data);
    setIsLoading(false);
  };

  useEffect(() => { loadUsers(); }, []);

  const handleStatusChange = async (userId, newStatus) => {
    await updateUserStatus(userId, newStatus);
    await loadUsers();
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    const res = await registerUser({ ...formData, forceApprove: true });
    if (res.success) {
      setFormData({ username: '', password: '', name: '', role: 'teacher' });
      setShowCreateForm(false);
      await loadUsers();
    } else {
      alert(res.message);
    }
  };

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">계정 및 권한 관리</h1>
          <p className="page-subtitle">가입 대기중인 계정을 승인하거나 직접 생성합니다.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreateForm(!showCreateForm)}>
          <UserPlus size={18} /> 새 계정 직접 생성
        </button>
      </div>

      {showCreateForm && (
        <form className="card form-grid" onSubmit={handleCreateUser} style={{ backgroundColor: '#F8FAFC', border: '2px dashed var(--primary-color)' }}>
          <div className="form-group">
            <label className="form-label">권한</label>
            <select className="form-control" value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value})}>
              <option value="teacher">선생님</option>
              <option value="staff">교직원</option>
              <option value="admin">관리자</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">이름</label>
            <input type="text" className="form-control" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
          </div>
          <div className="form-group">
            <label className="form-label">아이디</label>
            <input type="text" className="form-control" value={formData.username} onChange={(e) => setFormData({...formData, username: e.target.value})} required />
          </div>
          <div className="form-group">
            <label className="form-label">임시 비밀번호</label>
            <input type="text" className="form-control" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} required />
          </div>
          <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-outline" onClick={() => setShowCreateForm(false)}>취소</button>
            <button type="submit" className="btn btn-primary">생성 및 즉시 승인</button>
          </div>
        </form>
      )}

      <div className="card">
        <table className="data-table">
          <thead>
            <tr>
              <th>이름</th>
              <th>아이디</th>
              <th>권한</th>
              <th>상태</th>
              <th>관리</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? <tr><td colSpan="5" style={{ textAlign: 'center' }}>로딩중...</td></tr> : 
             users.map(u => (
              <tr key={u.id}>
                <td style={{ fontWeight: 600 }}>{u.name || '-'}</td>
                <td>{u.username}</td>
                <td>
                  <span className={`badge ${u.role === 'admin' ? 'badge-danger' : u.role === 'staff' ? 'badge-warning' : 'badge-info'}`}>
                    {u.role === 'admin' ? '관리자' : u.role === 'staff' ? '교직원' : '선생님'}
                  </span>
                </td>
                <td>
                  {u.status === 'approved' ? (
                    <span style={{ color: 'var(--success-color)', display: 'flex', alignItems: 'center', gap: '4px' }}><CheckCircle size={16}/> 승인됨</span>
                  ) : u.status === 'rejected' ? (
                    <span style={{ color: 'var(--danger-color)', display: 'flex', alignItems: 'center', gap: '4px' }}><XCircle size={16}/> 거절됨</span>
                  ) : (
                    <span style={{ color: 'var(--warning-color)', fontWeight: 600 }}>가입 대기중</span>
                  )}
                </td>
                <td>
                  {u.id === 'USR-MASTER' ? (
                    <span style={{ color: 'var(--text-secondary)' }}>마스터 계정</span>
                  ) : (
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {u.status !== 'approved' && <button className="btn btn-sm btn-outline" style={{ borderColor: 'var(--success-color)', color: 'var(--success-color)' }} onClick={() => handleStatusChange(u.id, 'approved')}>승인</button>}
                      {u.status !== 'rejected' && <button className="btn btn-sm btn-outline" style={{ borderColor: 'var(--danger-color)', color: 'var(--danger-color)' }} onClick={() => handleStatusChange(u.id, 'rejected')}>거절</button>}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserManage;
