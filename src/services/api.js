// Mock 데이터 및 통신 로직 (v3.1)

const initializeMockData = () => {
  // --- V2 기존 데이터 유지 ---
  if (!localStorage.getItem('v2_students')) {
    localStorage.setItem('v2_students', JSON.stringify([]));
  }
  if (!localStorage.getItem('v2_terms')) {
    localStorage.setItem('v2_terms', JSON.stringify([{ id: 'TERM-1', name: '기본 학기', isActive: true }]));
  }
  if (!localStorage.getItem('v2_reports')) {
    localStorage.setItem('v2_reports', JSON.stringify([]));
  }

  // --- V3.1 신규 데이터 셋업 ---
  if (!localStorage.getItem('v3_users')) {
    const initUsers = [
      { id: 'USR-MASTER', username: 'one2k', password: 'ruddnjs87!', role: 'admin', status: 'approved', name: '최고관리자' }
    ];
    localStorage.setItem('v3_users', JSON.stringify(initUsers));
  }
  if (!localStorage.getItem('v3_comments')) {
    localStorage.setItem('v3_comments', JSON.stringify([]));
  }
  if (!localStorage.getItem('v3_errors')) {
    localStorage.setItem('v3_errors', JSON.stringify([]));
  }
};

initializeMockData();
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// --- System Error Logging ---
export const logError = (errorMsg, stackTrace = '') => {
  const errors = JSON.parse(localStorage.getItem('v3_errors') || '[]');
  errors.unshift({
    id: `ERR-${Date.now()}`,
    time: new Date().toLocaleString(),
    message: errorMsg,
    stack: stackTrace
  });
  localStorage.setItem('v3_errors', JSON.stringify(errors));
};

export const fetchErrorLogs = async () => {
  await delay(200);
  return JSON.parse(localStorage.getItem('v3_errors') || '[]');
};

export const clearErrorLogs = async () => {
  await delay(200);
  localStorage.setItem('v3_errors', JSON.stringify([]));
  return { success: true };
};

// --- Users & Auth ---
export const login = async (username, password) => {
  await delay(500);
  try {
    const users = JSON.parse(localStorage.getItem('v3_users') || '[]');
    const user = users.find(u => u.username === username && u.password === password);
    
    if (!user) return { success: false, message: '아이디 또는 비밀번호가 일치하지 않습니다.' };
    if (user.status !== 'approved') return { success: false, message: '관리자의 승인을 대기 중인 계정입니다.' };
    
    return { success: true, user: { id: user.id, username: user.username, role: user.role, name: user.name } };
  } catch (err) {
    logError('로그인 실패', err.toString());
    return { success: false, message: '시스템 오류가 발생했습니다.' };
  }
};

export const registerUser = async (userData) => {
  await delay(500);
  try {
    const users = JSON.parse(localStorage.getItem('v3_users') || '[]');
    if (users.find(u => u.username === userData.username)) {
      return { success: false, message: '이미 존재하는 아이디입니다.' };
    }
    const newUser = {
      ...userData,
      id: `USR-${Date.now()}`,
      status: userData.role === 'admin' ? 'approved' : (userData.forceApprove ? 'approved' : 'pending') 
      // 강제 승인(forceApprove)은 관리자가 직접 생성할 때 사용
    };
    users.push(newUser);
    localStorage.setItem('v3_users', JSON.stringify(users));
    return { success: true };
  } catch (err) {
    logError('회원가입/유저생성 오류', err.toString());
    return { success: false, message: '저장 실패' };
  }
};

export const fetchUsers = async () => {
  await delay(300);
  return JSON.parse(localStorage.getItem('v3_users') || '[]');
};

export const updateUserStatus = async (userId, newStatus) => {
  await delay(300);
  try {
    let users = JSON.parse(localStorage.getItem('v3_users') || '[]');
    users = users.map(u => u.id === userId ? { ...u, status: newStatus } : u);
    localStorage.setItem('v3_users', JSON.stringify(users));
    return { success: true };
  } catch (err) {
    logError('유저 상태 업데이트 오류', err.toString());
    return { success: false };
  }
};

// --- Comments (Memos) ---
export const fetchComments = async (studentId) => {
  await delay(200);
  const allComments = JSON.parse(localStorage.getItem('v3_comments') || '[]');
  return allComments.filter(c => c.studentId === studentId);
};

export const addComment = async (commentData) => {
  await delay(400);
  try {
    const comments = JSON.parse(localStorage.getItem('v3_comments') || '[]');
    const newComment = {
      ...commentData,
      id: `CMT-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    comments.push(newComment);
    localStorage.setItem('v3_comments', JSON.stringify(comments));
    return { success: true, data: newComment };
  } catch (err) {
    logError('코멘트 추가 오류', err.toString());
    throw err;
  }
};

// --- 기존 V2 함수 (에러 로깅 추가) ---
export const fetchTerms = async () => {
  await delay(300);
  return JSON.parse(localStorage.getItem('v2_terms') || '[]');
};

export const getActiveTerm = async () => {
  const terms = await fetchTerms();
  return terms.find(t => t.isActive) || terms[0];
};

export const saveTerm = async (termData) => {
  await delay(400);
  try {
    let terms = JSON.parse(localStorage.getItem('v2_terms') || '[]');
    if (termData.id) {
      if (termData.isActive) terms.forEach(t => t.isActive = false);
      terms = terms.map(t => t.id === termData.id ? termData : t);
    } else {
      const newTerm = { ...termData, id: `TERM-${Date.now()}` };
      if (newTerm.isActive) terms.forEach(t => t.isActive = false);
      terms.push(newTerm);
    }
    localStorage.setItem('v2_terms', JSON.stringify(terms));
    return { success: true };
  } catch (err) {
    logError('학기 저장 오류', err.toString());
  }
};

export const fetchStudents = async () => {
  await delay(300);
  return JSON.parse(localStorage.getItem('v2_students') || '[]');
};

export const saveStudent = async (studentData) => {
  await delay(400);
  try {
    let students = JSON.parse(localStorage.getItem('v2_students') || '[]');
    if (studentData.id) {
      students = students.map(s => s.id === studentData.id ? studentData : s);
    } else {
      const newCode = `STU-${String(students.length + 1).padStart(3, '0')}`;
      students.push({ ...studentData, id: newCode });
    }
    localStorage.setItem('v2_students', JSON.stringify(students));
    return { success: true };
  } catch (err) {
    logError('학생 저장 오류', err.toString());
  }
};

const analyzeWithAI = (report) => {
  const allText = `${report.academic} ${report.improvement} ${report.participation} ${report.behavior} ${report.social} ${report.teacherNote}`;
  let tags = [];
  let aiNote = "";
  if (allText.includes('어렵') || allText.includes('힘들어')) { tags.push({ type: 'warning', label: '학습 지원 필요' }); aiNote = "학습 보완 권장"; }
  if (allText.includes('싸움') || allText.includes('갈등')) { tags.push({ type: 'danger', label: '교우관계 이슈' }); aiNote = "교우 관계 관찰 요망"; }
  if (allText.includes('뛰어남') || allText.includes('우수')) { tags.push({ type: 'success', label: '우수 학생' }); }
  if (tags.length === 0) { tags.push({ type: 'info', label: '특이사항 없음' }); aiNote = "원만한 생활 중입니다."; }
  return { tags, aiNote };
};

export const fetchReports = async () => {
  await delay(400);
  return JSON.parse(localStorage.getItem('v2_reports') || '[]');
};

export const submitReport = async (reportData) => {
  await delay(800);
  try {
    const reports = JSON.parse(localStorage.getItem('v2_reports') || '[]');
    let aiResult = { tags: reportData.aiTags || [], aiNote: reportData.aiNote || '' };
    
    // 신규 작성시에만 AI 태깅 수행 (수정시에는 보존)
    if (!reportData.id) {
      aiResult = analyzeWithAI(reportData);
    }

    if (reportData.id) {
      // 리포트 수정 모드 (관리자가 사용)
      const updatedReports = reports.map(r => r.id === reportData.id ? { ...r, ...reportData } : r);
      localStorage.setItem('v2_reports', JSON.stringify(updatedReports));
      return { success: true };
    } else {
      // 신규 생성
      const newReport = {
        ...reportData,
        id: `RPT-${Date.now()}`,
        createdAt: new Date().toISOString(),
        aiTags: aiResult.tags,
        aiNote: aiResult.aiNote
      };
      reports.unshift(newReport);
      localStorage.setItem('v2_reports', JSON.stringify(reports));
      return { success: true, data: newReport };
    }
  } catch (err) {
    logError('리포트 제출/수정 오류', err.toString());
    throw err;
  }
};
