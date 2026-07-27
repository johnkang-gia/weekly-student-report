const fs = require('fs');
const seedData = JSON.parse(fs.readFileSync('seed_data_v2.json', 'utf8'));
const apiPath = 'src/services/api.js';
let apiCode = fs.readFileSync(apiPath, 'utf8');

// Replace local storage keys to force an update
apiCode = apiCode.replace(/v2_students/g, 'v3_students');
apiCode = apiCode.replace(/v6_classes/g, 'v7_classes');
apiCode = apiCode.replace(/v8_users/g, 'v9_users');

// Update the students and classes string
const studentsJson = JSON.stringify(seedData.students);
const classesJson = JSON.stringify(seedData.classes);

// we have to inject the new json array.
// the current code has `if (!localStorage.getItem('v3_students') || localStorage.getItem('v3_students') === '[]') localStorage.setItem('v3_students', JSON.stringify([...]))`
apiCode = apiCode.replace(
  /localStorage\.setItem\('v3_students', JSON\.stringify\(\[.*?\]\)\)/s,
  `localStorage.setItem('v3_students', JSON.stringify(${studentsJson}))`
);
apiCode = apiCode.replace(
  /localStorage\.setItem\('v7_classes', JSON\.stringify\(\[.*?\]\)\)/s,
  `localStorage.setItem('v7_classes', JSON.stringify(${classesJson}))`
);

fs.writeFileSync(apiPath, apiCode);
console.log('Mock DB updated with new names and keys!');
