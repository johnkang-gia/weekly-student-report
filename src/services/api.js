// Mock 데이터 및 통신 로직 (v4.1)

// --- 보안: 단방향 해시 암호화 함수 ---
export const hashPassword = async (password) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

const initializeMockData = async () => {
  if (!localStorage.getItem('v2_students')) localStorage.setItem('v2_students', JSON.stringify([]));
  if (!localStorage.getItem('v2_terms')) localStorage.setItem('v2_terms', JSON.stringify([{ id: 'TERM-1', name: '기본 학기', isActive: true, isArchived: false }]));
  if (!localStorage.getItem('v2_reports')) localStorage.setItem('v2_reports', JSON.stringify([]));
  if (!localStorage.getItem('v4_archived_reports')) localStorage.setItem('v4_archived_reports', JSON.stringify([]));
  if (!localStorage.getItem('v3_comments')) localStorage.setItem('v3_comments', JSON.stringify([]));
  if (!localStorage.getItem('v3_errors')) localStorage.setItem('v3_errors', JSON.stringify([]));
  if (!localStorage.getItem('v5_subjects')) localStorage.setItem('v5_subjects', JSON.stringify([]));
  
  if (!localStorage.getItem('v4_users')) {
    const hashedMasterPw = await hashPassword('ruddnjs87!');
    const initUsers = [{ id: 'USR-MASTER', username: 'one2k', password: hashedMasterPw, role: 'admin', status: 'approved', name: '최고관리자' }];
    localStorage.setItem('v4_users', JSON.stringify(initUsers));
  }
};

initializeMockData();
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// --- System Error Logging ---
export const logError = (errorMsg, stackTrace = '') => {
  const errors = JSON.parse(localStorage.getItem('v3_errors') || '[]');
  errors.unshift({ id: `ERR-${Date.now()}`, time: new Date().toLocaleString(), message: errorMsg, stack: stackTrace });
  localStorage.setItem('v3_errors', JSON.stringify(errors));
};
export const fetchErrorLogs = async () => { await delay(200); return JSON.parse(localStorage.getItem('v3_errors') || '[]'); };
export const clearErrorLogs = async () => { await delay(200); localStorage.setItem('v3_errors', JSON.stringify([])); return { success: true }; };

// --- Users & Auth ---
export const login = async (username, password) => {
  await delay(400);
  try {
    const hashedInput = await hashPassword(password);
    const users = JSON.parse(localStorage.getItem('v4_users') || '[]');
    const user = users.find(u => u.username === username && u.password === hashedInput);
    if (!user) return { success: false, message: '아이디 또는 비밀번호가 일치하지 않습니다.' };
    if (user.status !== 'approved') return { success: false, message: '관리자의 승인을 대기 중인 계정입니다.' };
    return { success: true, user: { id: user.id, username: user.username, role: user.role, name: user.name } };
  } catch (err) {
    logError('로그인 실패', err.toString()); return { success: false, message: '시스템 오류' };
  }
};

export const registerUser = async (userData) => {
  await delay(400);
  try {
    const users = JSON.parse(localStorage.getItem('v4_users') || '[]');
    if (users.find(u => u.username === userData.username)) return { success: false, message: '이미 존재하는 아이디입니다.' };
    
    const hashedPassword = await hashPassword(userData.password);
    users.push({
      ...userData,
      password: hashedPassword,
      id: `USR-${Date.now()}`,
      status: userData.role === 'admin' ? 'approved' : (userData.forceApprove ? 'approved' : 'pending') 
    });
    localStorage.setItem('v4_users', JSON.stringify(users));
    return { success: true };
  } catch (err) {
    logError('유저생성 오류', err.toString()); return { success: false };
  }
};

export const fetchUsers = async () => { await delay(300); return JSON.parse(localStorage.getItem('v4_users') || '[]'); };
export const updateUserStatus = async (userId, newStatus) => {
  await delay(300);
  let users = JSON.parse(localStorage.getItem('v4_users') || '[]');
  users = users.map(u => u.id === userId ? { ...u, status: newStatus } : u);
  localStorage.setItem('v4_users', JSON.stringify(users));
  return { success: true };
};

// --- Comments ---
export const fetchComments = async (studentId) => {
  await delay(200); return JSON.parse(localStorage.getItem('v3_comments') || '[]').filter(c => c.studentId === studentId);
};
export const addComment = async (commentData) => {
  await delay(400);
  const comments = JSON.parse(localStorage.getItem('v3_comments') || '[]');
  const newComment = { ...commentData, id: `CMT-${Date.now()}`, createdAt: new Date().toISOString() };
  comments.push(newComment);
  localStorage.setItem('v3_comments', JSON.stringify(comments));
  return { success: true, data: newComment };
};

// --- Terms & Archiving ---
export const fetchTerms = async () => { await delay(300); return JSON.parse(localStorage.getItem('v2_terms') || '[]'); };
export const getActiveTerm = async () => {
  const terms = await fetchTerms(); return terms.find(t => t.isActive && !t.isArchived) || terms.find(t=>!t.isArchived) || terms[0];
};
export const saveTerm = async (termData) => {
  await delay(400);
  let terms = JSON.parse(localStorage.getItem('v2_terms') || '[]');
  if (termData.id) {
    if (termData.isActive) terms.forEach(t => t.isActive = false);
    terms = terms.map(t => t.id === termData.id ? termData : t);
  } else {
    if (termData.isActive) terms.forEach(t => t.isActive = false);
    terms.push({ ...termData, id: `TERM-${Date.now()}`, isArchived: false });
  }
  localStorage.setItem('v2_terms', JSON.stringify(terms));
  return { success: true };
};

export const archiveTerm = async (termId) => {
  await delay(600);
  try {
    // 1. Term 마킹
    let terms = JSON.parse(localStorage.getItem('v2_terms') || '[]');
    terms = terms.map(t => t.id === termId ? { ...t, isArchived: true, isActive: false } : t);
    localStorage.setItem('v2_terms', JSON.stringify(terms));

    // 2. Report 분리 이동 (Reports -> Archived_Reports)
    let reports = JSON.parse(localStorage.getItem('v2_reports') || '[]');
    let archives = JSON.parse(localStorage.getItem('v4_archived_reports') || '[]');
    
    const reportsToArchive = reports.filter(r => r.termId === termId);
    const reportsToKeep = reports.filter(r => r.termId !== termId);
    
    archives = [...archives, ...reportsToArchive];
    
    localStorage.setItem('v2_reports', JSON.stringify(reportsToKeep));
    localStorage.setItem('v4_archived_reports', JSON.stringify(archives));
    
    return { success: true };
  } catch (err) {
    logError('아카이브 오류', err.toString()); return { success: false };
  }
}

// --- Subjects (과목반) ---
export const fetchSubjects = async () => { await delay(300); return JSON.parse(localStorage.getItem('v5_subjects') || '[]'); };
export const saveSubject = async (subjectData) => {
  await delay(400);
  let subjects = JSON.parse(localStorage.getItem('v5_subjects') || '[]');
  if (subjectData.id) {
    subjects = subjects.map(s => s.id === subjectData.id ? subjectData : s);
  } else {
    // Generate a color based on length or random
    const colors = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444', '#EC4899', '#06B6D4'];
    const color = colors[subjects.length % colors.length];
    subjects.push({ ...subjectData, id: `SUB-${Date.now()}`, color });
  }
  localStorage.setItem('v5_subjects', JSON.stringify(subjects));
  return { success: true };
};
export const deleteSubject = async (subjectId) => {
  await delay(400);
  let subjects = JSON.parse(localStorage.getItem('v5_subjects') || '[]');
  subjects = subjects.filter(s => s.id !== subjectId);
  localStorage.setItem('v5_subjects', JSON.stringify(subjects));
  return { success: true };
};

// --- Students ---
export const fetchStudents = async () => { await delay(300); return JSON.parse(localStorage.getItem('v2_students') || '[]'); };
export const saveStudent = async (studentData) => {
  await delay(400);
  let students = JSON.parse(localStorage.getItem('v2_students') || '[]');
  if (studentData.id) { students = students.map(s => s.id === studentData.id ? studentData : s); } 
  else { students.push({ ...studentData, id: `STU-${String(students.length + 1).padStart(3, '0')}` }); }
  localStorage.setItem('v2_students', JSON.stringify(students));
  return { success: true };
};
export const bulkSaveStudents = async (studentList) => {
  await delay(800);
  let students = JSON.parse(localStorage.getItem('v2_students') || '[]');
  const newStudents = studentList.map((s, idx) => ({ ...s, id: `STU-${String(students.length + idx + 1).padStart(3, '0')}` }));
  students = [...students, ...newStudents];
  localStorage.setItem('v2_students', JSON.stringify(students));
  return { success: true, count: newStudents.length };
};

// --- Reports ---
const analyzeWithAI = (report) => {
  const allText = `${report.academic} ${report.improvement} ${report.participation} ${report.behavior} ${report.social} ${report.teacherNote}`;
  let tags = []; let aiNote = "";
  if (allText.includes('어렵') || allText.includes('힘들어')) { tags.push({ type: 'warning', label: '학습 지원 필요' }); aiNote = "학습 보완 권장"; }
  if (allText.includes('싸움') || allText.includes('갈등')) { tags.push({ type: 'danger', label: '교우관계 이슈' }); aiNote = "교우 관계 관찰 요망"; }
  if (allText.includes('뛰어남') || allText.includes('우수')) { tags.push({ type: 'success', label: '우수 학생' }); }
  if (tags.length === 0) { tags.push({ type: 'info', label: '특이사항 없음' }); aiNote = "원만한 생활 중입니다."; }
  return { tags, aiNote };
};

export const fetchReports = async () => { await delay(400); return JSON.parse(localStorage.getItem('v2_reports') || '[]'); };
export const fetchArchivedReports = async () => { await delay(400); return JSON.parse(localStorage.getItem('v4_archived_reports') || '[]'); };

export const submitReport = async (reportData) => {
  await delay(800); // LockService 모의 지연
  const reports = JSON.parse(localStorage.getItem('v2_reports') || '[]');
  if (reportData.id) {
    const updatedReports = reports.map(r => r.id === reportData.id ? { ...r, ...reportData } : r);
    localStorage.setItem('v2_reports', JSON.stringify(updatedReports));
    return { success: true };
  } else {
    const aiResult = analyzeWithAI(reportData);
    const newReport = { ...reportData, id: `RPT-${Date.now()}`, createdAt: new Date().toISOString(), aiTags: aiResult.tags, aiNote: aiResult.aiNote };
    reports.unshift(newReport);
    localStorage.setItem('v2_reports', JSON.stringify(reports));
    return { success: true, data: newReport };
  }
};
