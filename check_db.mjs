import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function run() {
  const { data, error } = await supabase.from('users').select('*');
  console.log('Total users:', data ? data.length : error);
  if (data && data.length > 0) console.log(data[0]);
}
run();
