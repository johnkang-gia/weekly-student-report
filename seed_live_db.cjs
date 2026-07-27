const fs = require('fs');

const API_URL = 'https://script.google.com/macros/s/AKfycbyN7EUAR3lyl83rqdoVOn5acbsjMyFA9LILYv2TZHyOuU07nRm1BwUvU1dl63ZjH-qx/exec';
const API_KEY = 'MY_SECRET_WEEKLY_KEY_2026';

const seedData = JSON.parse(fs.readFileSync('seed_data_v2.json', 'utf8'));

const postToGoogle = async (data) => {
  const response = await fetch(API_URL, {
    method: 'POST',
    body: JSON.stringify({ ...data, key: API_KEY }),
    headers: { 'Content-Type': 'text/plain;charset=utf-8' }
  });
  return await response.json();
};

async function runSeeder() {
  console.log("Seeding Students...");
  await postToGoogle({ type: 'bulk_students', students: seedData.students });
  
  console.log("Seeding Classes...");
  for (const c of seedData.classes) {
    await postToGoogle({ type: 'class', ...c, isUpdate: false });
  }
  
  console.log("Seeding Terms...");
  await postToGoogle({ type: 'term', id: 'TERM-1', name: '기본 학기', isActive: true, isArchived: false });
  
  console.log("Seeding Teachers...");
  const initUsers = [{"id":"USR-T1","username":"aimie","password":"password123","name":"Aimie","role":"teacher","status":"approved"},{"id":"USR-T2","username":"crystal","password":"password123","name":"Crystal","role":"teacher","status":"approved"},{"id":"USR-T3","username":"carina","password":"password123","name":"Carina","role":"teacher","status":"approved"},{"id":"USR-T4","username":"michelle","password":"password123","name":"Michelle","role":"teacher","status":"approved"},{"id":"USR-T5","username":"jamie","password":"password123","name":"Jamie","role":"teacher","status":"approved"},{"id":"USR-T6","username":"celine","password":"password123","name":"Celine","role":"teacher","status":"approved"},{"id":"USR-T7","username":"yunsang","password":"password123","name":"Yunsang","role":"teacher","status":"approved"},{"id":"USR-T8","username":"jandy","password":"password123","name":"Jandy","role":"teacher","status":"approved"},{"id":"USR-T9","username":"katherine","password":"password123","name":"Katherine","role":"teacher","status":"approved"},{"id":"USR-T10","username":"janelle","password":"password123","name":"Janelle","role":"teacher","status":"approved"},{"id":"USR-T11","username":"anna","password":"password123","name":"Anna","role":"teacher","status":"approved"},{"id":"USR-T12","username":"sarah","password":"password123","name":"Sarah","role":"teacher","status":"approved"},{"id":"USR-T13","username":"eamonn","password":"password123","name":"Eamonn","role":"teacher","status":"approved"}];
  
  // Teachers need their passwords hashed before sending. But we can just use the hash for 'password123' to bypass crypto overhead here.
  const hash123 = 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f'; // SHA256 of 'password123'
  for (const u of initUsers) {
    u.password = hash123;
    await postToGoogle({ type: 'user', ...u });
  }

  console.log("Done seeding live DB!");
}

runSeeder();
