// src/utils/parseBiodata.js

const calculateAge = (dobString) => {
  if (!dobString) return '';
  const cleanStr = dobString
    .replace(/(\d+)(st|nd|rd|th)/i, '$1')
    .replace(/['"]/g, '')
    .replace(/[-.]/g, '/');

  let birthDate = new Date(cleanStr);
  if (isNaN(birthDate.getTime())) {
    const parts = cleanStr.split('/');
    if (parts.length === 3) {
      birthDate = new Date(parts[2], parts[1] - 1, parts[0]);
    }
  }

  if (isNaN(birthDate.getTime())) return '';

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();

  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;

  return age.toString();
};

export const parseBiodataHybrid = (text) => {
  const data = {
    name: '', gender: '', age: '', height: '', dob: '', tob: '', pob: '', address: '',
    caste: '', gotra: '', complexion: '', diet: '', education: '', profession: '', income: '', company: '',
    father: '', fatherOcc: '', mother: '', motherOcc: '', siblings: '', contact: '', manglik: ''
  };

  let cleanText = text
    .replace(/([a-z])(Name[:\-])/gi, '$1\n$2')
    .replace(/([a-z])(DOB[:\-])/gi, '$1\n$2')
    .replace(/([a-z])(Contact[:\-])/gi, '$1\n$2');

  const lines = cleanText
    .split(/\n/)
    .map(l => l.trim())
    .filter(Boolean);

  const getValue = (patterns, excludeKeywords = []) => {
    for (let line of lines) {
      if (excludeKeywords.some(k => line.toLowerCase().includes(k.toLowerCase()))) continue;
      for (let pattern of patterns) {
        const regex = new RegExp(`${pattern}\\s*[:\\-]+\\s*(.*)`, 'i');
        const match = line.match(regex);
        if (match && match[1]) {
          return match[1].split(/,|\n/)[0].trim();
        }
      }
    }
    return '';
  };

  data.name = getValue(['Name', 'Full Name'], ['Father', 'Mother']);
  data.gender = getValue(['Gender', 'Sex']);
  data.height = getValue(['Height', 'Ht']);
  data.complexion = getValue(['Color', 'Complexion', 'Skin Tone']);
  data.diet = getValue(['Diet', 'Food']);
  data.dob = getValue(['Date of Birth', 'DOB']);
  data.tob = getValue(['Birth Time', 'Time of Birth', 'TOB', 'Time']);
  data.pob = getValue(['Birth Place', 'Place of Birth', 'POB']);
  data.caste = getValue(['Caste']);
  data.gotra = getValue(['Gotra']);
  data.education = getValue(['Qualification', 'Education', 'Degree']);
  data.profession = getValue(['Profession', 'Occupation', 'Job'], ['Father', 'Mother']);
  data.company = getValue(['Company', 'Working at', 'Working in']);
  data.income = getValue(['Package', 'Income', 'Salary', 'CTC', 'LPA']);
  data.address = getValue(['Present Address', 'Address', 'Residence', 'Residing']);
  data.contact = getValue(['Mob', 'Mobile', 'Contact', 'Phone']);

  lines.forEach(line => {
    const l = line.toLowerCase();
    if (l.includes('father') && (l.includes('name') || !l.includes('occupation'))) {
      if (!data.father) data.father = line.split(/[:\-]/)[1]?.trim();
    }
    if (l.includes('mother') && (l.includes('name') || !l.includes('occupation'))) {
      if (!data.mother) data.mother = line.split(/[:\-]/)[1]?.trim();
    }
    if (l.includes("father") && (l.includes("occupation") || l.includes("job") || l.includes("working"))) {
      data.fatherOcc = line.split(/[:\-]/)[1]?.trim();
    }
    if (l.includes("mother") && (l.includes("occupation") || l.includes("job") || l.includes("housewife"))) {
      data.motherOcc = line.split(/[:\-]/)[1]?.trim();
    }
    if (l.includes('sibling') || l.includes('brother') || l.includes('sister')) {
      data.siblings = line.split(/[:\-]/)[1]?.trim();
    }
  });

  if (!data.gender) {
    if (/\b(boy|male|groom|he)\b/i.test(text)) data.gender = 'Male';
    else if (/\b(girl|female|bride|she)\b/i.test(text)) data.gender = 'Female';
  }

  if (/non[\s-]?manglik/i.test(text)) data.manglik = 'Non-Manglik';
  else if (/anshik/i.test(text)) data.manglik = 'Anshik';
  else if (/manglik/i.test(text)) data.manglik = 'Manglik';

  if (!data.height) {
    const htMatch = text.match(/(\d{1})['’\.\s-]*(\d{1,2})(?:['"”])/);
    if (htMatch && ['4', '5', '6'].includes(htMatch[1])) {
      data.height = `${htMatch[1]}'${htMatch[2]}`;
    }
  }

  if (!data.income) {
    const incMatch = text.match(/(\d+\.?\d*)\s*(LPA|Lac|Lakhs|CTC)/i);
    if (incMatch) data.income = incMatch[0];
  }

  if (!data.contact) {
    const phoneMatch = text.match(/(\+91|0)?\s?(\d{5}\s?\d{5}|\d{10})/);
    if (phoneMatch) data.contact = phoneMatch[0];
  }

  if (data.name) {
    let cleanName = data.name.replace(/^(CA|Er|Dr|Mr|Ms|Mrs)\.?\s+/i, '');
    cleanName = cleanName.replace(/\(.*\)/, '').trim();
    data.name = cleanName;
  } else if (lines[0] && lines[0].length < 30) {
    data.name = lines[0].replace(/biodata/i, '').trim();
  }

  if (data.dob) {
    const calcAge = calculateAge(data.dob);
    if (calcAge) data.age = calcAge;
  }

  return data;
};
