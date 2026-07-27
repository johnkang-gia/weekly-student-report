const fs = require('fs');

const classes = [
  { grade: 1, className: '1A', teachers: ['Aimie', 'Crystal'] },
  { grade: 1, className: '1C', teachers: ['Carina', 'Michelle'] },
  { grade: 1, className: '1J', teachers: ['Jamie', 'Celine'] },
  { grade: 2, className: '2Y', teachers: ['Yunsang'] },
  { grade: 2, className: '2J', teachers: ['Jandy'] },
  { grade: 2, className: '2K', teachers: ['Katherine'] },
  { grade: 3, className: '3J', teachers: ['Janelle'] },
  { grade: 3, className: '3A', teachers: ['Anna'] },
  { grade: 4, className: '4A', teachers: ['Sarah'] },
  { grade: 5, className: '5E', teachers: ['Eamonn'] }
];

const rawStudents = `
1A: Benecia Kim, Danu Kim, Gyumin Shim, Hasom Park, Ian Ju, Jay Kim, Jennie Nam, Lael Lee, Rogan Kim, Seojun Lee, Sophia Won, Tay Kwon, Zoe Han
1C: Anna Kim, Ayn Lee, Bella Hwang, Doha Park, Eden Seo, Harry Lee, Joon Moon, Hayoon Yon, Jay Kim, Jenny Go, Justin Jeon, Ruby Paik, Clara Park
1J: Brooklyn Shin, Byeol Son, Celine Kwak, Eliana Lee, Ellie Lee, Eric Jeon, Ian Hwang, Isaac Lee, Jinwoo Ko, Max Lee, Noah Roh, Reina Park, Sharlene Jung, Sophia Hwang, Yeni Lee
2Y: Grace Lim, Maya Amelia Dowding, Diane Lim, Hans Kim, Sophia Min, Vivian Lee, Henry Hayule Eom, Danny Hong, Kai Yoo, Sean Hwang
2J: Seohu Kang, Jay Kim, Wynter Jeong, Elizabeth Lee, Noel Min, Ije Kang, June Hwang, E.L. Jeong, Rain Jung
2K: Jun Lee, Sarah Choi, Emma Jung, Bom Cha, Benny Lee, Soo Ji, Justin Lee, Grace Lee, Juhan Lim
3J: James Kwak, Jaden Hong, Theo Kim, Gahin Nam, Eagon Koh, Seojin Kim, Maria Paz Manoukian, Dongha Kim, Serena Jung, Terry Kim, Blaire Lim
3A: Victoria Kim, Jimin Kim, Jay Yu, Lina Lee, Sunwoo Lim, Lisa Jung, Stella Jung, Hayim Jung, Hara Kang, June Hwang, Janghoon Cho, Teddy Kwon
4A: Jihyo Yim, Seoyeon Choi, Yesung Kang, Danny Lee, Rian Kim, Skye Kang, Teji Kim, Teddy Kim, Roy Lee, Yoonseo Doh
5E: Justin Park, Clara Moon, Joy Kim, Leo Kim, Aaron Jung, Olivia Jung, Hael Kang, Jacob Dylan Ma, Ryeomyeong Kang, Juan Ignacio Manoukian, Henry Lee, Jeum Park
`;

let studentArray = [];
const lines = rawStudents.trim().split('\n');
lines.forEach((line, index) => {
  const [className, names] = line.split(': ');
  const grade = parseInt(className.charAt(0));
  const studentNames = names.split(', ');
  studentNames.forEach((name, sIdx) => {
    studentArray.push({
      id: 'STU-100' + index + sIdx,
      name: name,
      grade: grade,
      className: className,
      status: 'active'
    });
  });
});

let teacherArray = [];
let classArray = [];
let tIdCounter = 1;

classes.forEach(c => {
  // Add teachers
  c.teachers.forEach(tName => {
    const existing = teacherArray.find(t => t.name === tName);
    if (!existing) {
      teacherArray.push({
        id: 'USR-T' + tIdCounter,
        username: tName.toLowerCase(),
        password: 'password123',
        name: tName,
        role: 'teacher',
        status: 'approved'
      });
      tIdCounter++;
    }
  });

  // Main teacher is the first one
  const mainTeacher = teacherArray.find(t => t.name === c.teachers[0]);
  classArray.push({
    id: 'CLS-' + c.className,
    grade: c.grade,
    className: c.className,
    teacherId: mainTeacher.id,
    subTeacherName: c.teachers[1] || ''
  });
});

fs.writeFileSync('seed_data.json', JSON.stringify({
  teachers: teacherArray,
  classes: classArray,
  students: studentArray
}, null, 2));

console.log('Seed data generated!');
