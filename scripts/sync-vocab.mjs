import fs from 'fs';
import { execSync } from 'child_process';

const SHEET_TSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRizeLURcXJ6H1K1iTfBgvnw3oBglHH00McCyeah7ujsNJ0RFBg4dKg0Q27CUjxsOcXtRhzxzh-Br-_/pub?output=tsv';

async function sync() {
  console.log('⏳ Fetching data from Google Sheet...');
  const res = await fetch(`${SHEET_TSV_URL}&cb=${Date.now()}`, { cache: 'no-store' });
  const data = await res.text();

  const rows = data.split(/\r?\n/).filter(r => r.trim() !== '');
  if (rows.length <= 1) return console.log('❌ No data found.');

  const validRows = [];
  for (let i = 1; i < rows.length; i++) {
    const cols = rows[i].split('\t');
    if (cols[0] && cols[1] && cols[0].startsWith('v-')) validRows.push(cols);
  }

  console.log(`✅ Found ${validRows.length} valid vocabularies in Google Sheet.`);
  console.log("🔍 Fetching current database state to calculate delta (Smart Diff)...");
  
  let rowsToSync = [];
  let idsToDelete = [];
  
  try {
    // 🛡️ Enterprise Fix: ดึง sort_order และ is_deleted มาคำนวณด้วย
    const rawOutput = execSync('npx wrangler d1 execute admission-sim-db --remote --command="SELECT id, eng, thai, pos, category, example, synonyms, antonyms, sort_order, is_deleted FROM vocab_repository" --json', { 
      encoding: 'utf8', 
      stdio: ['pipe', 'pipe', 'ignore'],
      maxBuffer: 10 * 1024 * 1024
    });
    
    const jsonStart = rawOutput.indexOf('[');
    if (jsonStart !== -1) {
      const parsed = JSON.parse(rawOutput.substring(jsonStart));
      const dbState = (Array.isArray(parsed) && parsed[0] && parsed[0].results) ? parsed[0].results : [];
      
      const currentMap = new Map();
      dbState.forEach(row => currentMap.set(row.id, row));

      const sheetIds = new Set();

      validRows.forEach((cols, index) => {
        const [id, eng, thai, pos, category, example, synonyms, antonyms] = cols;
        const sort_order = index + 1; // 🛡️ กำหนดลำดับตามตำแหน่งใน Google Sheet
        const cleanCategory = category ? category.trim() : ''; // 🛡️ กันปัญหาพิมพ์เว้นวรรคเกิน
        
        sheetIds.add(id);
        const existing = currentMap.get(id);

        if (!existing) {
          // 🟢 คำศัพท์ใหม่
          const rowData = [
            cols[0], cols[1], cols[2], cols[3], cleanCategory, 
            cols[5], cols[6], cols[7], sort_order
          ];
          rowsToSync.push(rowData); 
        } else {
          const safe = (val) => val == null ? '' : String(val).trim();
          if (
            safe(existing.eng) !== safe(eng) ||
            safe(existing.thai) !== safe(thai) ||
            safe(existing.pos) !== safe(pos) ||
            safe(existing.category) !== safe(cleanCategory) ||
            safe(existing.example) !== safe(cols[5]) ||
            safe(existing.synonyms) !== safe(cols[6]) ||
            safe(existing.antonyms) !== safe(cols[7]) ||
            existing.sort_order !== sort_order || // ลำดับเปลี่ยน
            existing.is_deleted === 1 // เคยถูกลบแต่ถูกเอากลับมาใหม่
          ) {
            // 🟡 คำศัพท์ที่ถูกแก้ไข หรือถูกกู้คืน
            const rowData = [
              cols[0], cols[1], cols[2], cols[3], cleanCategory, 
              cols[5], cols[6], cols[7], sort_order
            ];
            rowsToSync.push(rowData);
          }
        }
      });

      // 🔴 ตรวจหาคำศัพท์ที่โดนลบออกจาก Google Sheet
      currentMap.forEach((row, id) => {
        if (!sheetIds.has(id) && row.is_deleted === 0) {
          idsToDelete.push(id);
        }
      });

      console.log(`🎯 Diff Check Complete: ${rowsToSync.length} to upsert, ${idsToDelete.length} to delete.`);
    }
  } catch (e) {
    console.log("⚠️ Could not fetch DB state. Falling back to Full Sync.", e.message);
    validRows.forEach((cols, index) => {
      const cleanCategory = cols[4] ? cols[4].trim() : '';
      rowsToSync.push([cols[0], cols[1], cols[2], cols[3], cleanCategory, cols[5], cols[6], cols[7], index + 1]);
    });
  }

  if (rowsToSync.length === 0 && idsToDelete.length === 0) {
    console.log("🎉 No changes detected! Database is already up to date.");
    return;
  }

  const CHUNK_SIZE = 50; 
  const escape = (str) => str != null && str !== '' ? `'${String(str).replace(/'/g, "''")}'` : 'NULL';

  try {
    // 1. ส่งคำสั่ง Upsert (เพิ่ม/แก้ไข)
    for (let i = 0; i < rowsToSync.length; i += CHUNK_SIZE) {
      const chunk = rowsToSync.slice(i, i + CHUNK_SIZE);
      let sql = 'PRAGMA defer_foreign_keys = TRUE;\n';
      
      chunk.forEach(cols => {
        // cols ตอนนี้มี sort_order ต่อท้ายมาด้วย
        const [id, eng, thai, pos, category, example, synonyms, antonyms, sort_order] = cols;
        sql += `INSERT INTO vocab_repository (id, eng, thai, pos, category, example, synonyms, antonyms, sort_order, is_deleted) VALUES (${escape(id)}, ${escape(eng)}, ${escape(thai)}, ${escape(pos)}, ${escape(category)}, ${escape(example)}, ${escape(synonyms)}, ${escape(antonyms)}, ${sort_order}, 0) ON CONFLICT(id) DO UPDATE SET eng=excluded.eng, thai=excluded.thai, pos=excluded.pos, category=excluded.category, example=excluded.example, synonyms=excluded.synonyms, antonyms=excluded.antonyms, sort_order=excluded.sort_order, is_deleted=0, updated_at=CURRENT_TIMESTAMP;\n`;
      });
      
      fs.writeFileSync('temp-sync.sql', sql);
      execSync('npx wrangler d1 execute admission-sim-db --remote --file=temp-sync.sql -y', { stdio: 'inherit' });
    }

    // 2. ส่งคำสั่ง Soft Delete (ลบ)
    if (idsToDelete.length > 0) {
      for (let i = 0; i < idsToDelete.length; i += CHUNK_SIZE) {
        const chunk = idsToDelete.slice(i, i + CHUNK_SIZE);
        const inClause = chunk.map(id => `'${id}'`).join(',');
        const deleteSql = `UPDATE vocab_repository SET is_deleted = 1, updated_at=CURRENT_TIMESTAMP WHERE id IN (${inClause});`;
        fs.writeFileSync('temp-sync.sql', deleteSql);
        execSync('npx wrangler d1 execute admission-sim-db --remote --file=temp-sync.sql -y', { stdio: 'inherit' });
      }
    }

    console.log("⏳ Waiting 4 seconds for Cloudflare D1 to synchronize nodes...");
    await new Promise(r => setTimeout(r, 4000));

    console.log("🔄 Triggering KV Cache update...");
    const kvRes = await fetch("https://admission-sim.pages.dev/api/vocab/sync-to-kv", {
      method: "POST"
    });
    
    if (kvRes.ok) {
      console.log("🎉 Database and KV Sync completed! Frontend is 100% up to date.");
    } else {
      const errorText = await kvRes.text();
      console.log(`⚠️ DB synced, but KV update failed. HTTP Status: ${kvRes.status}`);
      console.log(`🔍 Error Details: ${errorText}`);
    }
  } catch (err) {
    console.error('❌ Sync failed during batch execution:', err.message);
  } finally {
    if (fs.existsSync('temp-sync.sql')) fs.unlinkSync('temp-sync.sql');
  }
}

sync();