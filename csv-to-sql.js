import fs from 'fs';
import Papa from 'papaparse';

const csvFile = fs.readFileSync('vocab.csv', 'utf8');

const parsed = Papa.parse(csvFile, {
    header: true, 
    skipEmptyLines: true,
    // เพิ่มฟังก์ชันจัดระเบียบหัวคอลัมน์ ป้องกันปัญหาตัวพิมพ์เล็กใหญ่หรือเว้นวรรคเกิน
    transformHeader: header => header.trim().toLowerCase()
});

let sql = '';
let count = 0;

parsed.data.forEach(row => {
    const eng = (row.eng || '').trim().replace(/'/g, "''");
    if (!eng) return; 

    const thai = (row.thai || '').trim().replace(/'/g, "''");
    const type = (row.type || '').trim().replace(/'/g, "''");
    const example = (row.example || '').trim().replace(/'/g, "''");
    const category = (row.category || '').trim().replace(/'/g, "''");
    const level = (row.level || '').trim().replace(/'/g, "''");

    sql += `INSERT OR IGNORE INTO vocab_repository (eng, thai, type, example, category, level) VALUES ('${eng}', '${thai}', '${type}', '${example}', '${category}', '${level}');\n`;
    count++;
});

fs.writeFileSync('vocab.sql', sql);
console.log(`✅ แปลงไฟล์เสร็จสมบูรณ์! ได้คำศัพท์ทั้งหมด ${count} คำ`);