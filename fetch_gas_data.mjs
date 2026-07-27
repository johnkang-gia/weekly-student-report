import fs from 'fs';

const API_URL = 'https://script.google.com/macros/s/AKfycbyN7EUAR3lyl83rqdoVOn5acbsjMyFA9LILYv2TZHyOuU07nRm1BwUvU1dl63ZjH-qx/exec';
const API_KEY = 'MY_SECRET_WEEKLY_KEY_2026';

const fetchFromGoogle = async (type) => {
  const response = await fetch(`${API_URL}?type=${type}&key=${API_KEY}`);
  return await response.json();
};

async function fetchAll() {
  const types = ['students', 'classes', 'terms', 'users', 'comments', 'subjects', 'issues', 'reports'];
  let allData = {};
  for (const t of types) {
    console.log(`Fetching ${t}...`);
    try {
      const res = await fetchFromGoogle(t);
      console.log(`${t} count:`, res.length || 0);
      allData[t] = res || [];
    } catch (e) {
      console.error(`Error fetching ${t}:`, e);
    }
  }
  fs.writeFileSync('gas_dump.json', JSON.stringify(allData, null, 2));
  console.log('Saved to gas_dump.json');
}
fetchAll();
