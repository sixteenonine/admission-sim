import fs from 'fs';
import Papa from 'papaparse';

// 1. อ่านไฟล์ CSV ของคุณ
const csvFile = fs.readFileSync('vocab.csv', 'utf8');

// 2. แปลงข้อมูลอย่างฉลาด (ข้าม Header อัตโนมัติและจัดการลูกน้ำในประโยคให้)
const parsed = Papa.parse(csvFile, {
    header: true, 
    skipEmptyLines: true
});

// 3. เตรียมชุดคำสั่ง SQL
let sql = '';
parsed.data.forEach(row => {
    // ป้องกัน Error จากเครื่องหมาย ' (เช่น คำว่า don't) ให้เปลี่ยนเป็น ''
    const eng = (row.eng || '').replace(/'/g, "''");
    const thai = (row.thai || '').replace(/'/g, "''");
    const type = (row.type || '').replace(/'/g, "''");
    const example = (row.example || '').replace(/'/g, "''");
    const category = (row.category || '').replace(/'/g, "''");
    const level = (row.level || '').replace(/'/g, "''");

    sql += `INSERT INTO vocab_repository (eng, thai, type, example, category, level) VALUES ('${eng}', '${thai}', '${type}', '${example}', '${category}', '${level}');\n`;
});

// 4. บันทึกเป็นไฟล์ .sql
fs.writeFileSync('vocab.sql', sql);
console.log('✅ แปลงไฟล์เสร็จสมบูรณ์! ได้ไฟล์ vocab.sql แล้ว');