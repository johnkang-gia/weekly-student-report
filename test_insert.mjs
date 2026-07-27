import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function run() {
  const { data, error } = await supabase.from('users').insert([{
    id: 'USR-MASTER',
    username: 'one2k',
    password: '8abce3ac361f4768c09fa31b872c59047106cd8ae34362ed83fe8d655ea8dcc7',
    name: '최고관리자',
    role: 'admin',
    status: 'approved'
  }]);
  console.log('Insert Result:', data, error);
}
run();
