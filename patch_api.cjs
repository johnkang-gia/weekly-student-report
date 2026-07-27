const fs = require('fs');
const apiPath = 'src/services/api.js';
let apiCode = fs.readFileSync(apiPath, 'utf8');

apiCode = apiCode.replace(
  `if (!localStorage.getItem('v2_students')) localStorage.setItem('v2_students',`,
  `if (!localStorage.getItem('v2_students') || localStorage.getItem('v2_students') === '[]') localStorage.setItem('v2_students',`
);

apiCode = apiCode.replace(
  `if (!localStorage.getItem('v6_classes')) localStorage.setItem('v6_classes',`,
  `if (!localStorage.getItem('v6_classes') || localStorage.getItem('v6_classes') === '[]') localStorage.setItem('v6_classes',`
);

fs.writeFileSync(apiPath, apiCode);
console.log('Patched api.js to auto-seed if empty.');
