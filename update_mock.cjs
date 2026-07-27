const fs = require('fs');

const seedData = JSON.parse(fs.readFileSync('seed_data.json', 'utf8'));

const apiPath = 'src/services/api.js';
let apiCode = fs.readFileSync(apiPath, 'utf8');

// We will inject the JSON strings into the initializeMockData function
const studentsJson = JSON.stringify(seedData.students);
const classesJson = JSON.stringify(seedData.classes);
const teachersJson = JSON.stringify(seedData.teachers); // Wait, teachers are users. 

// The users in api.js are initialized on line 25:
// const initUsers = [{ id: 'USR-MASTER', username: 'one2k', ... }];
// Let's replace `if (!localStorage.getItem('v2_students')) localStorage.setItem('v2_students', JSON.stringify([]));`
// with `if (!localStorage.getItem('v2_students')) localStorage.setItem('v2_students', JSON.stringify(${studentsJson}));`

apiCode = apiCode.replace(
  `if (!localStorage.getItem('v2_students')) localStorage.setItem('v2_students', JSON.stringify([]));`,
  `if (!localStorage.getItem('v2_students')) localStorage.setItem('v2_students', JSON.stringify(${studentsJson}));`
);

apiCode = apiCode.replace(
  `if (!localStorage.getItem('v6_classes')) localStorage.setItem('v6_classes', JSON.stringify([]));`,
  `if (!localStorage.getItem('v6_classes')) localStorage.setItem('v6_classes', JSON.stringify(${classesJson}));`
);

// We need to inject teachers into initUsers
// We can find `const initUsers = [` and append the teachers JSON to it, removing the brackets.
const teachersInner = JSON.stringify(seedData.teachers).slice(1, -1); 
apiCode = apiCode.replace(
  `const initUsers = [{ id: 'USR-MASTER', username: 'one2k', password: hashedMasterPw, role: 'developer', status: 'approved', name: '최고관리자' }];`,
  `const initUsers = [{ id: 'USR-MASTER', username: 'one2k', password: hashedMasterPw, role: 'developer', status: 'approved', name: '최고관리자' }, ${teachersInner}];`
);

fs.writeFileSync(apiPath, apiCode);
console.log('Mock DB updated with real student data!');
