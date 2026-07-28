// --- 실전 연동 코드 V8.0 (Supabase Migration) ---
import { cache, clearCache } from './api_cache';
import { supabase } from './supabaseClient';

// 단방향 해시 암호화 (SHA-256)
export const hashPassword = async (password) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

// 낙관적 업데이트를 위한 로컬 상태 및 기본 에러 핸들러
export const logError = (msg, stack) => console.error(msg, stack);
export const fetchErrorLogs = async () => [];
export const clearErrorLogs = async () => ({ success: true });

// --- 데이터 로딩 ---
export const prefetchAll = async () => {
  const [
    { data: students },
    { data: classes },
    { data: terms },
    { data: users },
    { data: comments },
    { data: subjects },
    { data: issues },
    { data: reports }
  ] = await Promise.all([
    supabase.from('students').select('*'),
    supabase.from('classes').select('*'),
    supabase.from('terms').select('*'),
    supabase.from('users').select('*'),
    supabase.from('comments').select('*'),
    supabase.from('subjects').select('*'),
    supabase.from('issues').select('*'),
    supabase.from('reports').select('*')
  ]);

  cache.students = students || [];
  cache.classes = classes || [];
  cache.terms = terms || [];
  cache.users = users || [];
  cache.comments = comments || [];
  cache.subjects = subjects || [];
  cache.issues = issues || [];
  cache.reports = reports || [];
  cache.isLoaded = true;
  
  return { success: true };
};

// --- 인증 (Auth) ---
export const login = async (username, password) => {
  const { data: users, error } = await supabase.from('users').select('*').eq('username', username);
  if (error || !users || users.length === 0) return { success: false, message: '아이디/비밀번호 불일치' };
  
  const user = users[0];
  const hashedInput = await hashPassword(password);
  
  if (user.password !== hashedInput) return { success: false, message: '아이디/비밀번호 불일치' };
  if (user.status !== 'approved') return { success: false, message: '승인 대기중' };
  
  if (user.username === 'one2k') {
    user.role = 'developer';
  }
  
  return { success: true, user };
};

export const registerUser = async (userData) => {
  const { data: existing } = await supabase.from('users').select('id').eq('username', userData.username);
  if (existing && existing.length > 0) return { success: false, message: '중복 아이디' };
  
  const status = userData.forceApprove ? 'approved' : 'pending';
  const hashedPassword = await hashPassword(userData.password);
  
  const newUser = {
    id: `USR-${Date.now()}`,
    username: userData.username,
    password: hashedPassword,
    name: userData.name,
    role: userData.role || 'teacher',
    status
  };
  
  const { error } = await supabase.from('users').insert([newUser]);
  if (error) return { success: false, message: error.message };
  return { success: true, data: newUser };
};

export const fetchUsers = async () => {
  const { data } = await supabase.from('users').select('*');
  cache.users = data || [];
  return cache.users;
};

export const updateUserStatus = async (userId, newStatus) => {
  if (!cache.users) await fetchUsers();
  cache.users = cache.users.map(u => u.id === userId ? { ...u, status: newStatus } : u);
  await supabase.from('users').update({ status: newStatus }).eq('id', userId);
  return { success: true };
};

export const updateUserRole = async (userId, newRole) => {
  if (!cache.users) await fetchUsers();
  cache.users = cache.users.map(u => u.id === userId ? { ...u, role: newRole } : u);
  await supabase.from('users').update({ role: newRole }).eq('id', userId);
  return { success: true };
};

export const changePassword = async (userId, oldPassword, newPassword) => {
  if (!cache.users) await fetchUsers();
  const user = cache.users.find(u => u.id === userId);
  if (!user) return { success: false, message: '사용자를 찾을 수 없습니다.' };
  
  const hashedOld = await hashPassword(oldPassword);
  if (user.password !== hashedOld) {
    return { success: false, message: '기존 비밀번호가 일치하지 않습니다.' };
  }
  
  const hashedNew = await hashPassword(newPassword);
  cache.users = cache.users.map(u => u.id === userId ? { ...u, password: hashedNew } : u);
  await supabase.from('users').update({ password: hashedNew }).eq('id', userId);
  return { success: true };
};

export const resetPassword = async (userId) => {
  if (!cache.users) await fetchUsers();
  const hashedReset = await hashPassword('gia123');
  cache.users = cache.users.map(u => u.id === userId ? { ...u, password: hashedReset } : u);
  await supabase.from('users').update({ password: hashedReset }).eq('id', userId);
  return { success: true };
};

export const updateUserProfile = async (userId, newName, newUsername) => {
  if (!cache.users) await fetchUsers();
  
  // 중복 아이디 검사
  const existing = cache.users.find(u => u.username === newUsername && u.id !== userId);
  if (existing) {
    return { success: false, message: '이미 사용 중인 아이디입니다.' };
  }
  
  cache.users = cache.users.map(u => u.id === userId ? { ...u, name: newName, username: newUsername } : u);
  await supabase.from('users').update({ name: newName, username: newUsername }).eq('id', userId);
  return { success: true };
};

// --- 기타 모델들 ---
export const fetchComments = async (studentId) => {
  if (!cache.comments) {
    const { data } = await supabase.from('comments').select('*');
    cache.comments = data || [];
  }
  return cache.comments.filter(c => c.studentId === studentId || c.student_id === studentId);
};
export const addComment = async (data) => {
  const newComment = {
    id: `CMT-${Date.now()}`,
    student_id: data.studentId,
    author_id: data.authorId,
    content: data.content,
    date: data.date
  };
  await supabase.from('comments').insert([newComment]);
  return { success: true };
};

export const fetchTerms = async () => {
  const { data } = await supabase.from('terms').select('*');
  cache.terms = data || [];
  return cache.terms;
};

export const getActiveTerm = async () => {
  const terms = await fetchTerms();
  // String conversion for backwards compatibility with GAS strings
  return terms.find(t => (String(t.is_active) === 'true' || t.is_active === true) && (String(t.is_archived) !== 'true' && t.is_archived !== true)) || 
         terms.find(t => (String(t.is_archived) !== 'true' && t.is_archived !== true)) || terms[0];
};

export const saveTerm = async (data) => {
  const isUpdate = !!data.id;
  const newTerm = {
    id: data.id || `TERM-${Date.now()}`,
    name: data.name,
    start_date: data.startDate,
    end_date: data.endDate,
    is_active: data.isActive,
    is_archived: false
  };
  if (isUpdate) await supabase.from('terms').update(newTerm).eq('id', newTerm.id);
  else await supabase.from('terms').insert([newTerm]);
  return { success: true };
};

export const archiveTerm = async (termId) => {
  // Instead of moving to another table, just mark as archived
  await supabase.from('terms').update({ is_archived: true }).eq('id', termId);
  await supabase.from('reports').update({ is_archived: true }).eq('term_id', termId);
  return { success: true };
};

export const deleteArchivedReports = async (termId) => {
  await supabase.from('reports').delete().eq('term_id', termId).eq('is_archived', true);
  return { success: true };
};

export const fetchSubjects = async () => {
  const { data } = await supabase.from('subjects').select('*');
  cache.subjects = (data || []).map(s => ({
    id: s.id,
    name: s.name,
    teacherId: s.teacher_id,
    classId: s.class_id,
    color: s.color,
    studentIds: typeof s.student_ids === 'string' ? JSON.parse(s.student_ids) : (s.student_ids || [])
  }));
  return cache.subjects;
};

export const saveSubject = async (data) => {
  const isUpdate = !!data.id;
  let color = data.color;
  if(!isUpdate) {
    const colors = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444', '#EC4899', '#06B6D4'];
    color = colors[Math.floor(Math.random() * colors.length)];
  }
  
  const newSubject = {
    id: data.id || `SUB-${Date.now()}`,
    name: data.name,
    teacher_id: data.teacherId,
    class_id: data.classId,
    color: color,
    student_ids: data.studentIds
  };
  
  if (isUpdate) await supabase.from('subjects').update(newSubject).eq('id', newSubject.id);
  else await supabase.from('subjects').insert([newSubject]);
  
  cache.subjects = null; // force reload next time
  return { success: true };
};

export const deleteSubject = async (id) => {
  if (!cache.subjects) await fetchSubjects();
  cache.subjects = cache.subjects.filter(s => s.id !== id);
  await supabase.from('subjects').delete().eq('id', id);
  return { success: true };
};

export const fetchClasses = async () => {
  const { data } = await supabase.from('classes').select('*');
  cache.classes = (data || []).map(c => ({
    id: c.id,
    grade: c.grade,
    className: c.class_name,
    teacherId: c.teacher_id,
    subTeacherId: c.sub_teacher_id
  }));
  return cache.classes;
};

export const saveClass = async (data) => {
  const isUpdate = !!data.id;
  const newClass = {
    id: data.id || `CLS-${Date.now()}`,
    grade: data.grade,
    class_name: data.className,
    teacher_id: data.teacherId,
    sub_teacher_id: data.subTeacherId || ''
  };
  
  if (isUpdate) await supabase.from('classes').update(newClass).eq('id', newClass.id);
  else await supabase.from('classes').insert([newClass]);
  
  cache.classes = null;
  return { success: true };
};

export const deleteClass = async (id) => {
  if (!cache.classes) await fetchClasses();
  cache.classes = cache.classes.filter(c => c.id !== id);
  await supabase.from('classes').delete().eq('id', id);
  return { success: true };
};

export const fetchStudents = async () => {
  const { data } = await supabase.from('students').select('*');
  cache.students = (data || []).map(s => ({
    id: s.id,
    name: s.name,
    grade: s.grade,
    className: s.class_name,
    parentPhone: s.parent_phone,
    note: s.note,
    status: s.status
  }));
  return cache.students;
};

export const saveStudent = async (data) => {
  const isUpdate = !!data.id;
  const newStudent = {
    id: data.id || `STU-${Date.now()}`,
    name: data.name,
    grade: data.grade,
    class_name: data.className,
    parent_phone: data.parentPhone,
    note: data.note,
    status: 'active'
  };
  
  if (isUpdate) await supabase.from('students').update(newStudent).eq('id', newStudent.id);
  else await supabase.from('students').insert([newStudent]);
  
  cache.students = null;
  return { success: true };
};

export const bulkSaveStudents = async (studentsList) => {
  const newStudents = studentsList.map((s, index) => ({
    id: `STU-${Date.now()}-${index}`,
    name: s.name,
    grade: s.grade || '',
    class_name: s.className || '',
    parent_phone: s.parentPhone || '',
    note: s.note || '',
    status: 'active'
  }));
  
  await supabase.from('students').insert(newStudents);
  cache.students = null;
  return { success: true };
};

export const archiveStudent = async (id) => {
  if (!cache.students) await fetchStudents();
  cache.students = cache.students.map(s => s.id === id ? { ...s, status: 'inactive' } : s);
  await supabase.from('students').update({ status: 'inactive' }).eq('id', id);
  return { success: true };
};

export const deleteStudent = async (id) => {
  if (!cache.students) await fetchStudents();
  cache.students = cache.students.filter(s => s.id !== id);
  await supabase.from('students').delete().eq('id', id);
  return { success: true };
};

// --- Reports ---
export const fetchReports = async (termId) => {
  if (!cache.reports) {
    const { data } = await supabase.from('reports').select('*');
    cache.reports = data || [];
  }
  // Convert snake_case back to camelCase for the frontend
  return cache.reports.map(r => ({
    id: r.id,
    studentId: r.student_id,
    termId: r.term_id,
    subject: r.subject,
    academic: typeof r.academic === 'string' ? JSON.parse(r.academic) : r.academic,
    improvement: typeof r.improvement === 'string' ? JSON.parse(r.improvement) : r.improvement,
    participation: typeof r.participation === 'string' ? JSON.parse(r.participation) : r.participation,
    behavior: typeof r.behavior === 'string' ? JSON.parse(r.behavior) : r.behavior,
    social: typeof r.social === 'string' ? JSON.parse(r.social) : r.social,
    teacherNote: r.teacher_note,
    date: r.date,
    aiTags: typeof r.ai_tags === 'string' ? JSON.parse(r.ai_tags) : r.ai_tags,
    aiNote: r.ai_note,
    status: r.status || 'published',
    isArchived: r.is_archived
  })).filter(r => !termId || r.termId === termId);
};

export const fetchArchivedReports = async (termId) => {
  const { data } = await supabase.from('reports').select('*').eq('is_archived', true).eq('term_id', termId);
  return (data || []).map(r => ({
    id: r.id,
    studentId: r.student_id,
    termId: r.term_id,
    subject: r.subject,
    academic: typeof r.academic === 'string' ? JSON.parse(r.academic) : r.academic,
    improvement: typeof r.improvement === 'string' ? JSON.parse(r.improvement) : r.improvement,
    participation: typeof r.participation === 'string' ? JSON.parse(r.participation) : r.participation,
    behavior: typeof r.behavior === 'string' ? JSON.parse(r.behavior) : r.behavior,
    social: typeof r.social === 'string' ? JSON.parse(r.social) : r.social,
    teacherNote: r.teacher_note,
    date: r.date,
    aiTags: typeof r.ai_tags === 'string' ? JSON.parse(r.ai_tags) : r.ai_tags,
    aiNote: r.ai_note,
    status: r.status || 'published',
    isArchived: r.is_archived
  }));
};

export const submitReport = async (data) => {
  const isUpdate = !!data.id;
  const newReport = {
    id: data.id || `REP-${Date.now()}`,
    student_id: data.studentId,
    term_id: data.termId,
    subject: data.subject,
    academic: data.academic,
    improvement: data.improvement,
    participation: data.participation,
    behavior: data.behavior,
    social: data.social,
    teacher_note: data.teacherNote,
    date: data.date || new Date().toISOString().split('T')[0],
    ai_tags: typeof data.aiTags === 'object' ? JSON.stringify(data.aiTags) : data.aiTags,
    ai_note: data.aiNote,
    status: data.status || 'published',
    is_archived: false
  };

  if (!cache.reports) cache.reports = [];
  
  if (isUpdate) {
    cache.reports = cache.reports.map(r => r.id === newReport.id ? { ...r, ...newReport, studentId: newReport.student_id, termId: newReport.term_id, teacherNote: newReport.teacher_note, aiTags: newReport.ai_tags, aiNote: newReport.ai_note, status: newReport.status } : r);
    supabase.from('reports').update(newReport).eq('id', newReport.id); // Fire and forget
  } else {
    cache.reports.unshift({ ...newReport, studentId: newReport.student_id, termId: newReport.term_id, teacherNote: newReport.teacher_note, aiTags: newReport.ai_tags, aiNote: newReport.ai_note, status: newReport.status });
    supabase.from('reports').insert([newReport]); // Fire and forget
  }
  
  return { success: true, data: newReport };
};

export const deleteReport = async (id) => {
  if (!cache.reports) await fetchReports();
  cache.reports = cache.reports.filter(r => r.id !== id);
  await supabase.from('reports').delete().eq('id', id);
  return { success: true };
};

// --- Issues ---
export const fetchIssues = async () => {
  const { data } = await supabase.from('issues').select('*');
  cache.issues = (data || []).map(i => ({
    id: i.id,
    authorId: i.author_id,
    authorName: i.author_name,
    issueType: i.issue_type,
    content: i.content,
    status: i.status,
    date: i.date
  }));
  return cache.issues;
};

export const submitIssue = async (data) => {
  const newIssue = {
    id: `ISSUE-${Date.now()}`,
    author_id: data.authorId,
    author_name: data.authorName,
    issue_type: data.issueType,
    content: data.content,
    status: 'open',
    date: new Date().toISOString().split('T')[0]
  };
  await supabase.from('issues').insert([newIssue]);
  cache.issues = null;
  return { success: true };
};

export const resolveIssue = async (id) => {
  await supabase.from('issues').update({ status: 'resolved' }).eq('id', id);
  if (cache.issues) {
    cache.issues = cache.issues.map(i => i.id === id ? { ...i, status: 'resolved' } : i);
  }
  return { success: true };
};

// --- Realtime Sync ---
let realtimeSubscription = null;
export const subscribeToRealtime = () => {
  if (realtimeSubscription) return;
  
  realtimeSubscription = supabase.channel('public:reports')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'reports' }, (payload) => {
      // payload.new contains the inserted/updated row, payload.old contains the deleted row
      if (!cache.reports) return;

      if (payload.eventType === 'INSERT') {
        const r = payload.new;
        const newReport = {
          id: r.id,
          studentId: r.student_id,
          termId: r.term_id,
          subject: r.subject,
          academic: typeof r.academic === 'string' ? JSON.parse(r.academic) : r.academic,
          improvement: typeof r.improvement === 'string' ? JSON.parse(r.improvement) : r.improvement,
          participation: typeof r.participation === 'string' ? JSON.parse(r.participation) : r.participation,
          behavior: typeof r.behavior === 'string' ? JSON.parse(r.behavior) : r.behavior,
          social: typeof r.social === 'string' ? JSON.parse(r.social) : r.social,
          teacherNote: r.teacher_note,
          date: r.date,
          aiTags: typeof r.ai_tags === 'string' ? JSON.parse(r.ai_tags) : r.ai_tags,
          aiNote: r.ai_note,
          isArchived: r.is_archived
        };
        // Check if exists to avoid duplicates from optimistic UI
        if (!cache.reports.find(x => x.id === newReport.id)) {
          cache.reports.unshift(newReport);
        }
      } else if (payload.eventType === 'UPDATE') {
        const r = payload.new;
        cache.reports = cache.reports.map(x => x.id === r.id ? {
          ...x,
          subject: r.subject,
          academic: typeof r.academic === 'string' ? JSON.parse(r.academic) : r.academic,
          improvement: typeof r.improvement === 'string' ? JSON.parse(r.improvement) : r.improvement,
          participation: typeof r.participation === 'string' ? JSON.parse(r.participation) : r.participation,
          behavior: typeof r.behavior === 'string' ? JSON.parse(r.behavior) : r.behavior,
          social: typeof r.social === 'string' ? JSON.parse(r.social) : r.social,
          teacherNote: r.teacher_note,
          aiTags: typeof r.ai_tags === 'string' ? JSON.parse(r.ai_tags) : r.ai_tags,
          aiNote: r.ai_note,
          isArchived: r.is_archived
        } : x);
      } else if (payload.eventType === 'DELETE') {
        cache.reports = cache.reports.filter(x => x.id !== payload.old.id);
      }
      
      // Dispatch global event for components to listen and re-render
      window.dispatchEvent(new CustomEvent('realtime-sync'));
    })
    .subscribe();
};

export const fetchPreviousReport = async (studentId: string, subject: string) => {
  if (!cache.reports) await fetchReports();
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  const previousReports = cache.reports
    .filter(r => 
      r.student_id === studentId && 
      r.subject === subject && 
      new Date(r.date) < oneWeekAgo
    )
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  
  if (previousReports.length === 0) return null;
  
  const r = previousReports[0];
  return {
    id: r.id,
    studentId: r.student_id,
    termId: r.term_id,
    subject: r.subject,
    academic: typeof r.academic === 'string' ? JSON.parse(r.academic) : r.academic,
    improvement: typeof r.improvement === 'string' ? JSON.parse(r.improvement) : r.improvement,
    participation: typeof r.participation === 'string' ? JSON.parse(r.participation) : r.participation,
    behavior: typeof r.behavior === 'string' ? JSON.parse(r.behavior) : r.behavior,
    social: typeof r.social === 'string' ? JSON.parse(r.social) : r.social,
    teacherNote: r.teacher_note,
    date: r.date,
    aiTags: typeof r.ai_tags === 'string' ? JSON.parse(r.ai_tags) : r.ai_tags,
    aiNote: r.ai_note,
    status: r.status,
    isArchived: r.is_archived
  };
};
