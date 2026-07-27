import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ouuphcvymiecsyihxtqr.supabase.co';
const supabaseKey = 'sb_publishable_wAzwlZYV6xuQTCVPIHUiSQ_kIDMqt2F';
const supabase = createClient(supabaseUrl, supabaseKey);

async function loginAndMigrate() {
  try {
    console.log('Logging in...');
    let { data, error } = await supabase.auth.signInWithPassword({
      email: 'one2k@gia.edu', // Wait, usernames are used or emails? In this system, they login with username!
      password: 'gia123'
    });
    
    // In our system, the login might be custom or using email. Let's check how users login in App.jsx.
  } catch (err) {
    console.log(err);
  }
}
loginAndMigrate();
