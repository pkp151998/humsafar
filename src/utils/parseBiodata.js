// src/utils/parseBiodata.js

// --- AGE CALCULATOR ---
const calculateAge = (dobString) => {
  if (!dobString) return "";
  const cleanStr = dobString
    .replace(/(\d+)(st|nd|rd|th)/i, "$1")
    .replace(/['"]/g, "")
    .replace(/[-.]/g, "/");

  let birthDate = new Date(cleanStr);

  // also try dd/mm/yyyy
  if (isNaN(birthDate.getTime())) {
    const parts = cleanStr.split("/");
    if (parts.length === 3) {
      birthDate = new Date(parts[2], parts[1] - 1, parts[0]);
    }
  }

  if (isNaN(birthDate.getTime())) return "";

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();

  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;

  return age.toString();
};

// --- MAIN PARSER ---
export const parseBiodataHybrid = (text) => {
  const data = {
    name: "",
    gender: "",
    age: "",
    height: "",
    dob: "",
    tob: "",
    pob: "",
    city: "",
    address: "",
    caste: "",
    gotra: "",
    complexion: "",
    diet: "",
    education: "",
    profession: "",
    income: "",
    company: "",
    father: "",
    fatherOcc: "",
    mother: "",
    motherOcc: "",
    siblings: "",
    contact: "",
    manglik: "",
    groupName: ""
  };

  // normalise a bit
  let cleanText = text
    .replace(/([a-z])(Name[:\-])/gi, "$1\n$2")
    .replace(/([a-z])(DOB[:\-])/gi, "$1\n$2")
    .replace(/([a-z])(Contact[:\-])/gi, "$1\n$2");

  const lines = cleanText
    .split(/\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  // 🔑 helper: match "Pattern ... value" where ... can be *,.,-,:
  const getValue = (patterns, excludeKeywords = []) => {
    for (let line of lines) {
      const lower = line.toLowerCase();
      if (excludeKeywords.some((k) => lower.includes(k.toLowerCase()))) continue;

      for (let pattern of patterns) {
        // allow Name:  Name-  Name.*  Name*  Name .
        const regex = new RegExp(
          `${pattern}[^a-z0-9\\n]*\\s*(.+)`,
          "i"
        );
        const match = line.match(regex);
        if (match && match[1]) {
          return match[1].trim();
        }
      }
    }
    return "";
  };

  // BASIC FIELDS
  data.name = getValue(
    [
      "Name",
      "FULL\\s*NAME",
      "Candidate Name",
      "Boy Name",
      "Girl Name",
      "Bride Name",
      "Groom Name"
    ],
    ["Father", "Mother"]
  );

  data.gender = getValue(["Gender", "Sex"]);
  data.height = getValue(["Height", "Ht", "HEIGHT"]);
  data.complexion = getValue(["Color", "Complexion", "Skin Tone"]);
  data.diet = getValue(["Diet", "Food"]);
  data.dob = getValue(["Date of Birth", "DOB", "D\\.O\\.B", "D\\.O\\.B\\.", "D.O.B"]);
  data.tob = getValue(["Birth Time", "Time of Birth", "TOB", "Time"]);
  data.pob = getValue(["Birth Place", "Place of Birth", "POB", "Birth place"]);
  data.city =
    getValue(["City", "Location", "Residing at", "Living in"]) || data.pob;

  data.caste = getValue(["Caste", "Sub Caste"]);
  data.gotra = getValue(["Gotra"]);
  data.education = getValue(["Qualification", "Education", "Degree"]);
  data.profession = getValue(
    ["Profession", "Occupation", "Job", "Work", "Occuption", "Occuaption"],
    ["Father", "Mother"]
  );
  data.company = getValue(["Company", "Working at", "Working in", "Office"]);
  data.income = getValue(["Package", "Income", "Salary", "CTC", "LPA", "Income."]);
  data.address = getValue([
    "Present Address",
    "Permanent Address",
    "Address",
    "Residence",
    "Residing"
  ]);
  data.contact = getValue(["Mob", "Mobile", "Contact", "Phone", "WhatsApp"]);

  // PARENTS / SIBLINGS
  lines.forEach((line) => {
    const l = line.toLowerCase();

    // father name
    if (
      l.includes("father") &&
      (l.includes("name") || !l.includes("occupation"))
    ) {
      const parts = line.split(/[:\-]/);
      if (!data.father) {
        data.father = (parts[1] || line.replace(/[*]/g, "")).replace(/father/i, "").trim();
      }
    }

    // mother name
    if (
      l.includes("mother") &&
      (l.includes("name") || !l.includes("occupation"))
    ) {
      const parts = line.split(/[:\-]/);
      if (!data.mother) {
        data.mother = (parts[1] || line.replace(/[*]/g, "")).replace(/mother/i, "").trim();
      }
    }

    // father occupation
    if (
      l.includes("father") &&
      (l.includes("occupation") || l.includes("occ.") || l.includes("job") || l.includes("working") || l.includes("business"))
    ) {
      const parts = line.split(/[:\-]/);
      data.fatherOcc = (parts[1] || "").trim() || data.fatherOcc;
    }

    // mother occupation
    if (
      l.includes("mother") &&
      (l.includes("occupation") || l.includes("occ.") || l.includes("job") || l.includes("housewife") || l.includes("working"))
    ) {
      const parts = line.split(/[:\-]/);
      data.motherOcc = (parts[1] || "").trim() || data.motherOcc;
    }

    // siblings (no colon in your format, so take full line)
    if (
      l.includes("sibling") ||
      l.includes("brother") ||
      l.includes("sister")
    ) {
      data.siblings = (data.siblings + " " + line).trim();
    }
  });

  // GENDER FROM TEXT if missing
  if (!data.gender) {
    if (/\b(boy|male|groom|he)\b/i.test(text)) data.gender = "Male";
    else if (/\b(girl|female|bride|she)\b/i.test(text)) data.gender = "Female";
  }

  // MANGLIK
  if (/non[\s-]?manglik/i.test(text)) data.manglik = "Non-Manglik";
  else if (/anshik/i.test(text)) data.manglik = "Anshik";
  else if (/manglik/i.test(text)) data.manglik = "Manglik";

  // HEIGHT fallback like 5'7"
  if (!data.height) {
    const htMatch = text.match(/(\d{1})['’\.\s-]*(\d{1,2})(?:['"”])/);
    if (htMatch && ["4", "5", "6"].includes(htMatch[1])) {
      data.height = `${htMatch[1]}'${htMatch[2]}`;
    }
  }

  // INCOME fallback
  if (!data.income) {
    const incMatch = text.match(/(\d+\.?\d*)\s*(LPA|Lac|Lakhs|CTC|lac)/i);
    if (incMatch) data.income = incMatch[0];
  }

  // CONTACT fallback
  if (!data.contact) {
    const phoneMatch = text.match(/(\+91|0)?\s?(\d{5}\s?\d{5}|\d{10})/);
    if (phoneMatch) data.contact = phoneMatch[0];
  }

  // CLEAN NAME
  if (data.name) {
    let cleanName = data.name.replace(/^(CA|Er|Dr|Mr|Ms|Mrs)\.?\s+/i, "");
    cleanName = cleanName.replace(/\(.*\)/, "").trim();
    data.name = cleanName;
  } else if (lines[0] && lines[0].length < 40) {
    data.name = lines[0].replace(/biodata/i, "").trim();
  }

  // AGE from DOB
  if (data.dob) {
    const calcAge = calculateAge(data.dob);
    if (calcAge) data.age = calcAge;
  }

  // city fallback from address
  if (!data.city && data.address) {
    data.city = data.address.split(",")[0].trim();
  }

  // Debug log (only in browser console)
  console.log("Parsed biodata:", data);

  return data;
};

// optional default export
export default parseBiodataHybrid;
