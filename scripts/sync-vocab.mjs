import fs from 'fs';
import { execSync } from 'child_process';

// นำลิงก์ TSV มาวางแทนที่ตรงนี้
const SHEET_TSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRizeLURcXJ6H1K1iTfBgvnw3oBglHH00McCyeah7ujsNJ0RFBg4dKg0Q27CUjxsOcXtRhzxzh-Br-_/pub?output=tsv';

async function sync() {
  console.log('⏳ Fetching data from Google Sheet...');
  const res = await fetch(SHEET_TSV_URL);
  const data = await res.text();

  const rows = data.split(/\r?\n/).filter(r => r.trim() !== '');
  if (rows.length <= 1) return console.log('❌ No data found.');

  // 🛡️ กรองคอลัมน์และสร้าง Array ข้อมูลที่ถูกต้อง
  const validRows = [];
  for (let i = 1; i < rows.length; i++) {
    const cols = rows[i].split('\t');
    if (cols[0] && cols[1] && cols[0].startsWith('v-')) validRows.push(cols);
  }

  const CHUNK_SIZE = 50; // 🛡️ Enterprise Fix: ลดขนาดลงเหลือ 50 คำสั่งต่อก้อน เพื่อทะลวงข้อจำกัด File Upload Limit ของ Cloudflare
  console.log(`✅ Found ${validRows.length} valid vocabularies. Processing in chunks of ${CHUNK_SIZE}...`);
  const escape = (str) => str ? `'${str.replace(/'/g, "''")}'` : 'NULL';

  try {
    for (let i = 0; i < validRows.length; i += CHUNK_SIZE) {
      const chunk = validRows.slice(i, i + CHUNK_SIZE);
      console.log(`📦 Executing chunk ${Math.floor(i / CHUNK_SIZE) + 1} of ${Math.ceil(validRows.length / CHUNK_SIZE)}...`);
      
      let sql = 'PRAGMA defer_foreign_keys = TRUE;\n';
      
      chunk.forEach(cols => {
        const [id, eng, thai, pos, category, example, synonyms, antonyms] = cols;
        sql += `INSERT INTO vocab_repository (id, eng, thai, pos, category, example, synonyms, antonyms) VALUES (${escape(id)}, ${escape(eng)}, ${escape(thai || '')}, ${escape(pos || '')}, ${escape(category || '')}, ${escape(example || '')}, ${escape(synonyms || '')}, ${escape(antonyms || '')}) ON CONFLICT(id) DO UPDATE SET eng=excluded.eng, thai=excluded.thai, pos=excluded.pos, category=excluded.category, example=excluded.example, synonyms=excluded.synonyms, antonyms=excluded.antonyms, updated_at=CURRENT_TIMESTAMP WHERE vocab_repository.eng != excluded.eng OR IFNULL(vocab_repository.thai, '') != IFNULL(excluded.thai, '') OR IFNULL(vocab_repository.pos, '') != IFNULL(excluded.pos, '') OR IFNULL(vocab_repository.category, '') != IFNULL(excluded.category, '') OR IFNULL(vocab_repository.example, '') != IFNULL(excluded.example, '') OR IFNULL(vocab_repository.synonyms, '') != IFNULL(excluded.synonyms, '') OR IFNULL(vocab_repository.antonyms, '') != IFNULL(excluded.antonyms, '');\n`;
      });
      
      fs.writeFileSync('temp-sync.sql', sql);
      
      // 🛡️ Enterprise Fix: กลไก Auto-Retry ป้องกัน Cloudflare เตะออกเนื่องจาก Auth Limit
      let retries = 3;
      let success = false;
      while (retries > 0 && !success) {
        try {
          // เพิ่ม -y เพื่อข้ามการถามยืนยัน (Ok to proceed? ... yes)
          execSync('npx wrangler d1 execute admission-sim-db --remote --file=temp-sync.sql -y', { stdio: 'inherit' });
          success = true;
        } catch (err) {
          retries--;
          if (retries === 0) throw new Error("❌ API failed continuously. Stopping process.");
          console.log(`⚠️ Cloudflare API timeout or limit reached. Retrying in 5 seconds... (${retries} attempts left)`);
          await new Promise(r => setTimeout(r, 5000));
        }
      }

      // 🛡️ Enterprise Fix: พักหายใจ 2 วินาทีระหว่างก้อน เพื่อป้องกัน Rate Limit
      if (i + CHUNK_SIZE < validRows.length) {
        await new Promise(r => setTimeout(r, 2000));
      }
    }

    console.log("🔄 Triggering KV Cache update...");
    const kvRes = await fetch("https://admission-sim.sixteenonine99.workers.dev/api/vocab/sync-to-kv");
    
    if (kvRes.ok) {
      console.log("🎉 Database and KV Sync completed! Frontend is 100% up to date.");
    } else {
      console.log("⚠️ DB synced, but KV update failed.");
    }
  } catch (err) {
    console.error('❌ Sync failed during batch execution:', err.message);
  } finally {
    if (fs.existsSync('temp-sync.sql')) fs.unlinkSync('temp-sync.sql');
  }
}

sync();