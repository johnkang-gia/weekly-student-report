const fs = require('fs');

const rawText = `
김사랑 120 F Benecia Kim
김단우 130 M Danu Kim
심규민 120 F Gyumin Shim
박하솜 120 F Hasom Park
주이안 130 M Ian Ju
김재이 120 F Jay Kim
남예인 120 F Jennie Nam
이라엘 120 F Lael Lee
김도은 130 M Rogan Kim
이서준 130 M Seojun Lee
원세빈 120 F Sophia Won
권태이 130 M Tay Kwon
한우영 120 F Zoe Han

김나율 120 F Anna Kim
이아인 120 F Ayn Lee
황라윤 120 F Bella Hwang
박도하 120 M Doha Park
서민준 130 M Eden Seo
이현우 130 M Harry Lee
문준연 120 M Joon Moon
연하윤 120 F Hayoon Yon
김재이 120 F Jay Kim
고서윤 120 F Jenny Go
전준백 130 M Justin Jeon
백서아 120 F Ruby Paik
박세인 120 F Clara Park

신민하 120 F Brooklyn Shin
손별 120 F Byeol Son
곽세린 120 F Celine Kwak
이예나 120 F Eliana Lee
이은재 120 F Ellie Lee
전지완 120 M Eric Jeon
황이안 130 M Ian Hwang
이예준 130 M Isaac Lee
고진우 130 M Jinwoo Ko
이신원 130 M Max Lee
노유겸 130 M Noah Roh
박세주 120 F Reina Park
정서안 130 F Sharlene Jung
황라원 120 F Sophia Hwang
이연우 120 F Yeni Lee

임예나 130 F Grace Lim
Maya Amelia Dowding 130 F Maya Amelia Dowding
임다현 130 F Diane Lim
김현수 140 M Hans Kim
민송희 140 F Sophia Min
이서아 130 F Vivian Lee
엄하율 140 M Henry Hayule Eom
홍서형 140 M Danny Hong
유한솔 150 M Kai Yoo
황시원 140 M Sean Hwang

강서후 140 M Seohu Kang
김재이 140 F Jay Kim
정겨울 130 F Wynter Jeong
이서현 130 F Elizabeth Lee
민노엘 140 M Noel Min
강이제 150 M Ije Kang
황이준 140 M June Hwang
정이엘 130 F E.L. Jeong
정레인 150 M Rain Jung

이준원 140 M Jun Lee
최서아 130 F Sarah Choi
정세진 130 F Emma Jung
차봄 130 F Bom Cha
이주원 140 M Benny Lee
지수 150 M Soo Ji
이준서 140 M Justin Lee
이예온 130 F Grace Lee
임주한 150 M Juhan Lim

곽호율 150 M James Kwak
홍동은 150 M Jaden Hong
김태오 150 M Theo Kim
남가인 140 F Gahin Nam
고이건 150 M Eagon Koh
김서진 150 M Seojin Kim
마리아 파즈 마누키안 150 F Maria Paz Manoukian
김동하 150 M Dongha Kim
정채린 140 F Serena Jung
김태리 140 F Terry Kim
임하임 140 F Blaire Lim

김서이 140 F Victoria Kim
김지민 140 F Jimin Kim
유재이 150 M Jay Yu
이세은 150 F Lina Lee
임선우 150 M Sunwoo Lim
정리사 140 F Lisa Jung
정서우 140 F Stella Jung
정하임 150 F Hayim (Peyton) Jung
강하라 140 F Hara Kang
황준호 150 M June Hwang
조장훈 150 M Janghoon Cho
권수호 150 M Teddy Kwon

임지효 150 F Jihyo Yim
최서연 160 F Seoyeon Choi
강예성 S M Yesung Kang
이한범 S M Danny Lee
김리안 150 F Rian Kim
강하늘 150 F Skye (Haneul) Kang
김태지 150 F Teji Kim
김태윤 S M Teddy Kim
이온유 L M Roy Lee
도윤서 150 F Yoonseo Doh

박준후 L M Justin Park
문수민 150 F Clara Moon
김시아 150 F Joy Kim
김시준 S M Leo Kim
정도현 S M Aaron Jung
정채윤 S F Olivia Jung
강하엘 S M Hael Kang
제이콥 딜런 마 S M Jacob Dylan Ma
강여명 S F Ryeomyeong Kang
후안 이그나시오 마누키안 L M Juan Ignacio Manoukian
이도후 M M Henry Lee
박지음 M M Jeum Park
`;

const nameMap = {};
rawText.trim().split('\n').forEach(line => {
  if (!line.trim()) return;
  // Match: KoreanName (Size) (Gender) EnglishName
  // ex: 김사랑 120 F Benecia Kim
  // ex: 강예성 S M Yesung Kang
  const match = line.match(/^(.+?)\s+(?:120|130|140|150|160|S|M|L)\s+(?:F|M)\s+(.+)$/);
  if (match) {
    let korName = match[1].trim();
    let engName = match[2].trim();
    nameMap[engName] = `${korName}(${engName})`;
  } else {
    // some names don't have size/gender in the line if it was parsed weirdly
    console.log("No match:", line);
  }
});

// For Peyton Jung and Haneul Kang, fix parentheses
nameMap['Hayim Jung'] = '정하임(Hayim Jung)';
nameMap['Skye Kang'] = '강하늘(Skye Kang)';

const seedData = JSON.parse(fs.readFileSync('seed_data.json', 'utf8'));
seedData.students.forEach(s => {
  // Fix specific names to match map
  let queryName = s.name;
  if (queryName === 'Hayim (Peyton) Jung') queryName = 'Hayim Jung';
  if (queryName === 'Skye (Haneul) Kang') queryName = 'Skye Kang';
  if (queryName === 'Maya Amelia Dowding') nameMap[queryName] = 'Maya Amelia Dowding(Maya Amelia Dowding)';

  if (nameMap[queryName]) {
    s.name = nameMap[queryName];
  } else {
    console.log("Could not map name:", queryName);
  }
});

fs.writeFileSync('seed_data_v2.json', JSON.stringify(seedData, null, 2));
console.log('Names mapped successfully!');
