import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ouuphcvymiecsyihxtqr.supabase.co';
const supabaseKey = 'sb_publishable_wAzwlZYV6xuQTCVPIHUiSQ_kIDMqt2F';
const supabase = createClient(supabaseUrl, supabaseKey);

async function fixTeachers() {
  const { data: users } = await supabase.from('users').select('id, username');
  if (!users) {
    console.log('No users found');
    return;
  }
  
  const userMap = {};
  for (const u of users) userMap[u.username] = u.id;

  const mappings = [
    { classId: 'CLS-1A', teacher: 'aimie', subTeacher: 'rachel' },
    { classId: 'CLS-1C', teacher: 'crystal', subTeacher: 'elizabeth' },
    { classId: 'CLS-1J', teacher: 'carina', subTeacher: 'anna' },
    { classId: 'CLS-2Y', teacher: 'michelle', subTeacher: 'yunsang' },
    { classId: 'CLS-2J', teacher: 'jamie', subTeacher: 'jandy' },
    { classId: 'CLS-2K', teacher: 'celine', subTeacher: 'katherine' },
    { classId: 'CLS-3J', teacher: 'yunsang', subTeacher: 'janelle' }, // I am guessing here!
    { classId: 'CLS-3A', teacher: 'jandy', subTeacher: 'sarah' },
    { classId: 'CLS-4A', teacher: 'katherine', subTeacher: 'eamonn' },
    { classId: 'CLS-5E', teacher: 'janelle', subTeacher: 'carina' }
  ];

  // Let's just run the basic UPDATE first for homeroom teachers.
  for (const m of mappings) {
    if (userMap[m.teacher]) {
      await supabase.from('classes').update({ teacher_id: userMap[m.teacher] }).eq('id', m.classId);
      console.log(`Updated ${m.classId} teacher to ${m.teacher}`);
    }
  }
}
fixTeachers();
