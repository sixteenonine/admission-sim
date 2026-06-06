import React, { useState, useEffect } from 'react';
import { Save, Loader2, AlertCircle, CheckCircle2, Trash2, Edit3, Plus, BookOpen, Zap } from 'lucide-react';
import { Database, RefreshCw } from 'lucide-react';
import { AlertTriangle } from 'lucide-react';

export default function StoryAdmin() {
  const [stories, setStories] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [activeTab, setActiveTab] = useState('story'); // 'story' | 'speedread'
  
  const [formData, setFormData] = useState({ title: '', image_url: '', content: '', translation: '', is_premium: false });
  const [vocabRows, setVocabRows] = useState(
    Array.from({ length: 10 }, (_, i) => ({ id: i + 1, I: '', thai_I: '', II: '', thai_II: '', III: '', thai_III: '' }))
  );
  const [status, setStatus] = useState({ type: '', msg: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchStories();
  }, []);

  const fetchStories = async () => {
    try {
      const res = await fetch('/api/admin/stories/list');
      const data = await res.json();
      if (data.status === 'success') {
        setStories(data.stories);
      } else {
        alert("🚨 ฐานข้อมูล D1 แจ้งเตือน:\n" + data.message);
      }
    } catch (err) {
      alert("🚨 ไม่สามารถเชื่อมต่อ API ได้:\n" + err.message);
    }
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });

  const handleEditSelect = async (storyId, itemType) => {
    setLoading(true);
    setStatus({ type: '', msg: '' });
    try {
      const res = await fetch(`/api/stories/get?id=${storyId}`);
      const data = await res.json();
      if (data.status === 'success') {
        setActiveTab(itemType || 'story');
        setEditingId(storyId);
        setFormData({
          title: data.story.title || '',
          image_url: data.story.image_url || '',
          content: data.story.content || '',
          translation: data.story.translation || '',
          is_premium: data.story.is_premium === 1 || data.story.is_premium === true
        });
        
        const newRows = Array.from({ length: 10 }, (_, i) => ({ id: i + 1, I: '', thai_I: '', II: '', thai_II: '', III: '', thai_III: '' }));
        if (data.story.vocab_levels) {
          Object.keys(data.story.vocab_levels).forEach(id => {
            const idx = parseInt(id) - 1;
            if (newRows[idx]) {
              const item = data.story.vocab_levels[id];
              newRows[idx].I = item.I || '';
              newRows[idx].thai_I = item.thai_I || item.thai || '';
              newRows[idx].II = item.II || '';
              newRows[idx].thai_II = item.thai_II || item.thai || '';
              newRows[idx].III = item.III || '';
              newRows[idx].thai_III = item.thai_III || item.thai || '';
            }
          });
        }
        setVocabRows(newRows);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (err) {
      setStatus({ type: 'error', msg: 'โหลดข้อมูลล้มเหลว' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (storyId) => {
    if (!confirm("คุณแน่ใจหรือไม่ว่าต้องการลบข้อมูลนี้อย่างถาวร?")) return;
    try {
      const res = await fetch('/api/admin/stories/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storyId })
      });
      const data = await res.json();
      if (data.status === 'success') {
        alert("ลบข้อมูลเรียบร้อยแล้ว");
        if (editingId === storyId) handleResetForm();
        fetchStories();
      }
    } catch (err) {
      alert("ไม่สามารถลบข้อมูลได้");
    }
  };

  const handleResetForm = (tab = activeTab) => {
    setEditingId(null);
    setFormData({ title: '', image_url: '', content: '', translation: '', is_premium: false });
    setVocabRows(Array.from({ length: 10 }, (_, i) => ({ id: i + 1, I: '', thai_I: '', II: '', thai_II: '', III: '', thai_III: '' })));
    setActiveTab(tab);
    setStatus({ type: '', msg: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: '', msg: '' });

    const vocab_levels = {};
    if (activeTab === 'story') {
      vocabRows.forEach(row => {
        if (row.I.trim()) {
          vocab_levels[row.id] = {
            I: row.I.trim(), thai_I: row.thai_I.trim(),
            II: row.II.trim(), thai_II: row.thai_II.trim(),
            III: row.III.trim(), thai_III: row.thai_III.trim()
          };
        }
      });
    }

    const endpoint = editingId ? '/api/admin/stories/edit' : '/api/admin/stories/add';
    const payload = editingId 
      ? { id: editingId, type: activeTab, ...formData, vocab_levels } 
      : { type: activeTab, ...formData, vocab_levels };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      
      if (data.status === 'success') {
        setStatus({ type: 'success', msg: editingId ? 'อัปเดตข้อมูลเรียบร้อย!' : 'บันทึกข้อมูลใหม่ลงระบบเรียบร้อย!' });
        handleResetForm(activeTab);
        fetchStories();
      } else {
        setStatus({ type: 'error', msg: data.message });
      }
    } catch (err) {
      setStatus({ type: 'error', msg: 'การเชื่อมต่อเซิร์ฟเวอร์ล้มเหลว' });
    } finally {
      setLoading(false);
    }
  };

  // กรองรายการข้อมูลตาม Tab ที่เลือก
  const displayList = stories.filter(s => (s.type || 'story') === activeTab);
  // โหมด VOCAB SYNC
  const [sheetUrl, setSheetUrl] = useState('');
  const [syncProgress, setSyncProgress] = useState(0);
  const [totalSync, setTotalSync] = useState(0);
  const [isHardSync, setIsHardSync] = useState(false);

  const [isSyncingKV, setIsSyncingKV] = useState(false);

  const handleForceSync = async () => {
    if (!confirm("⚠️ คำเตือน: ระบบจะกวาดข้อมูลจาก D1 ไปเขียนทับ KV ทั้งหมด\n\nใช้เฉพาะเมื่อเกิดเหตุฉุกเฉินหรือข้อมูลหน้าบ้านไม่ตรงกับฐานข้อมูลเท่านั้น ดำเนินการต่อหรือไม่?")) return;
    setIsSyncingKV(true);
    setStatus({ type: '', msg: 'กำลังบังคับซิงค์ข้อมูล D1 ลง Edge Storage...' });
    try {
      const res = await fetch('/api/admin/stories/sync', { method: 'POST' });
      const data = await res.json();
      if (data.status === 'success') {
        setStatus({ type: 'success', msg: 'Force Sync สำเร็จ ข้อมูลหน้าบ้านอัปเดตตรงกับฐานข้อมูลแล้ว' });
      } else {
        setStatus({ type: 'error', msg: data.message });
      }
    } catch (err) {
      setStatus({ type: 'error', msg: 'การเชื่อมต่อเซิร์ฟเวอร์ล้มเหลว' });
    } finally {
      setIsSyncingKV(false);
    }
  };
  const handleSyncVocab = async (e) => {
    e.preventDefault();
    if (!sheetUrl) return setStatus({ type: 'error', msg: 'กรุณาวางลิงก์ Google Sheets (.tsv)' });
    
    setLoading(true); setStatus({ type: '', msg: 'กำลังดาวน์โหลดข้อมูลจาก Google Sheets...' });
    setSyncProgress(0); setTotalSync(0);

    try {
      // 1. ให้ Backend โหลดไฟล์และแปลงเป็น JSON เพื่อทะลวง CORS และเซฟ RAM
      const fetchRes = await fetch('/api/admin/vocab/fetch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sheetUrl })
      });
      
      const fetchData = await fetchRes.json();
      if (!fetchRes.ok || fetchData.status === 'error') throw new Error(fetchData.message || 'ดึงข้อมูล Sheet ไม่สำเร็จ');
      
      const allWords = fetchData.data;

      setTotalSync(allWords.length);
      setStatus({ type: '', msg: `เตรียมบันทึกคำศัพท์จำนวน ${allWords.length} คำ...` });

      if (isHardSync) {
        setStatus({ type: '', msg: 'กำลังล้างข้อมูลเก่าทั้งหมด...' });
        await fetch('/api/admin/vocab/clear', { method: 'POST' });
      }

      // 2. หั่นข้อมูลและทยอยส่งให้เซิร์ฟเวอร์ (Chunking) พร้อมหน่วงเวลาแก้ Rate Limit
      const chunkSize = 300;
      let processed = 0;
      const batchId = Date.now().toString();

      for (let i = 0; i < allWords.length; i += chunkSize) {
        const chunk = allWords.slice(i, i + chunkSize);

        const chunkRes = await fetch('/api/admin/vocab/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chunk, batchId })
        });

        if (!chunkRes.ok) throw new Error('การเชื่อมต่อล้มเหลวระหว่างส่งข้อมูล');

        processed += chunk.length;
        setSyncProgress(processed);
        
        // หน่วงเวลา 500ms ป้องกันระบบกันสแปมของเซิร์ฟเวอร์บล็อก API (Error 429)
        if (i + chunkSize < allWords.length) await new Promise(r => setTimeout(r, 500));
      }

      // 3. ยิง API ล้างข้อมูลที่หายไปจาก Sheet ประจำรอบการอัปเดตนี้
      if (!isHardSync) {
        setStatus({ type: '', msg: 'กำลังเคลียร์คำศัพท์ที่ถูกลบ...' });
        // ส่งเฉพาะรายชื่อคำศัพท์ (eng) ทั้งหมดที่เพิ่งโหลดมา ไปเทียบเพื่อหาคำที่ต้องลบ
        const activeKeys = allWords.map(w => w.eng);
        await fetch('/api/admin/vocab/cleanup', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ activeKeys })
        });
      }

      setStatus({ type: 'success', msg: `ซิงค์สำเร็จทั้งหมด ${processed} คำ! (กระจายโหลด Client-Side)` });
    } catch (err) {
      setStatus({ type: 'error', msg: err.message || 'เกิดข้อผิดพลาดในการซิงค์' });
    } finally {
      setLoading(false);
      setTimeout(() => { setSyncProgress(0); setTotalSync(0); }, 3000);
    }
  };

  if (activeTab === 'vocab') {
    return (
      <div className="w-full max-w-5xl mx-auto p-6 flex flex-col gap-10">
        <div className="bg-white rounded-3xl shadow-xl border border-gray-200 overflow-hidden">
          <div className="bg-blue-600 flex flex-col sm:flex-row justify-between items-stretch">
            <div className="p-6 text-white flex-1">
              <h1 className="text-2xl font-black tracking-widest uppercase">Content Management</h1>
              <p className="opacity-80 text-sm font-medium mt-1">ระบบจัดการเนื้อหาและคำศัพท์</p>
            </div>
            <div className="flex bg-blue-700/50">
              <button onClick={() => handleResetForm('story')} className="flex-1 sm:px-8 py-4 flex items-center justify-center gap-2 font-bold transition-colors text-blue-100 hover:bg-blue-500/50"><BookOpen size={18} /> STORY DIARY</button>
              <button onClick={() => handleResetForm('speedread')} className="flex-1 sm:px-8 py-4 flex items-center justify-center gap-2 font-bold transition-colors text-blue-100 hover:bg-blue-500/50"><Zap size={18} /> SPEED READ</button>
              <button onClick={() => handleResetForm('vocab')} className="flex-1 sm:px-8 py-4 flex items-center justify-center gap-2 font-bold transition-colors bg-emerald-900 text-emerald-400"><Database size={18} /> VOCAB SYNC</button>
            </div>
          </div>
          
          <form onSubmit={handleSyncVocab} className="p-8 flex flex-col gap-6">
            <div className="mb-2">
              <h2 className="text-xl font-black text-gray-800">1-CLICK GOOGLE SHEETS SYNC</h2>
              <p className="text-sm text-gray-500 font-medium">ดึงข้อมูลคำศัพท์จาก Google Sheets มาอัปเดตลงฐานข้อมูลแบบอัตโนมัติ</p>
            </div>
            {status.msg && (
              <div className={`p-4 rounded-xl flex items-center gap-3 font-bold text-sm ${status.type === 'success' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>
                {status.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />} {status.msg}
              </div>
            )}
            <div className="flex flex-col gap-2">
              <label className="font-bold text-emerald-700 text-sm uppercase">วางลิงก์ Publish to web (.tsv) ที่นี่</label>
              <input value={sheetUrl} onChange={(e) => setSheetUrl(e.target.value)} className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl focus:outline-emerald-500 w-full font-medium" placeholder="https://docs.google.com/spreadsheets/d/e/2PACX.../pub?output=tsv" />
            </div>
            <div className="flex items-center gap-3 bg-red-50 p-4 rounded-xl border border-red-100 cursor-pointer" onClick={() => setIsHardSync(!isHardSync)}>
              <input type="checkbox" checked={isHardSync} readOnly className="w-5 h-5 accent-red-600 cursor-pointer" />
              <span className="font-bold text-red-800 text-sm uppercase">ลบข้อมูลเดิมทิ้งทั้งหมดก่อนซิงก์ (Hard Sync - เปิดเฉพาะเวลาลบศัพท์)</span>
            </div>
            
            {totalSync > 0 && (
              <div className="flex flex-col gap-2 mt-2">
                <div className="flex justify-between text-xs font-bold text-emerald-700">
                  <span>กำลังอัปเดตข้อมูลทีละชุด...</span>
                  <span>{syncProgress} / {totalSync} คำ</span>
                </div>
                <div className="w-full bg-emerald-100 rounded-full h-3 overflow-hidden">
                  <div className="bg-emerald-500 h-3 rounded-full transition-all duration-300" style={{ width: `${(syncProgress / totalSync) * 100}%` }}></div>
                </div>
              </div>
            )}

            <button type="submit" disabled={loading} className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-lg p-4 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50">
              {loading ? <Loader2 className="animate-spin" size={24} /> : <RefreshCw size={24} />} SYNC VOCABULARY DATA
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto p-6 flex flex-col gap-10">
      <div className="bg-white rounded-3xl shadow-xl border border-gray-200 overflow-hidden">
        
        {/* Header & Tab Switcher */}
        <div className="bg-blue-600 flex flex-col sm:flex-row justify-between items-stretch">
          <div className="p-6 text-white flex-1 flex justify-between items-start gap-4">
            <div>
              <h1 className="text-2xl font-black tracking-widest uppercase">Content Management</h1>
              <p className="opacity-80 text-sm font-medium mt-1">ระบบจัดการเนื้อหาบทความอ่าน</p>
            </div>
            <button type="button" onClick={handleForceSync} disabled={isSyncingKV} className="bg-red-500 hover:bg-red-600 text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-2 shadow-lg transition-all active:scale-95 disabled:opacity-50 border border-red-400">
              {isSyncingKV ? <Loader2 size={16} className="animate-spin" /> : <AlertTriangle size={16} />}
              FORCE SYNC KV
            </button>
          </div>
          <div className="flex bg-blue-700/50">
            <button 
              onClick={() => handleResetForm('story')}
              className={`flex-1 sm:px-8 py-4 flex items-center justify-center gap-2 font-bold transition-colors ${activeTab === 'story' ? 'bg-white text-blue-600' : 'text-blue-100 hover:bg-blue-500/50'}`}
            >
              <BookOpen size={18} /> STORY DIARY
            </button>
            <button 
              onClick={() => handleResetForm('speedread')}
              className={`flex-1 sm:px-8 py-4 flex items-center justify-center gap-2 font-bold transition-colors ${activeTab === 'speedread' ? 'bg-gray-900 text-orange-500' : 'text-blue-100 hover:bg-blue-500/50'}`}
            >
              <Zap size={18} /> SPEED READ
            </button>
            <button 
              onClick={() => handleResetForm('vocab')}
              className={`flex-1 sm:px-8 py-4 flex items-center justify-center gap-2 font-bold transition-colors ${activeTab === 'vocab' ? 'bg-emerald-900 text-emerald-400' : 'text-blue-100 hover:bg-blue-500/50'}`}
            >
              <Database size={18} /> VOCAB SYNC
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8 flex flex-col gap-6">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-xl font-black text-gray-800">
              {editingId ? `กำลังแก้ไข: ` : `เพิ่มเนื้อหาใหม่ `}
              <span className={activeTab === 'speedread' ? 'text-orange-500' : 'text-blue-600'}>
                {activeTab === 'speedread' ? 'ULTRA SPEEDREAD' : 'STORY DIARY'}
              </span>
            </h2>
            {editingId && (
              <button type="button" onClick={() => handleResetForm()} className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs px-4 py-2 rounded-full flex items-center gap-1">
                <Plus size={14}/> ยกเลิกการแก้ไข
              </button>
            )}
          </div>

          {status.msg && (
            <div className={`p-4 rounded-xl flex items-center gap-3 font-bold text-sm ${status.type === 'success' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>
              {status.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
              {status.msg}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <label className="font-bold text-gray-700 text-sm uppercase">ชื่อบทความ (Title) *</label>
              <input required name="title" value={formData.title} onChange={handleChange} className="p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-blue-500" placeholder="The Mystery of..." />
            </div>
            {activeTab === 'story' && (
              <div className="flex flex-col gap-2">
                <label className="font-bold text-gray-700 text-sm uppercase">ลิงก์รูปภาพปก (Image URL)</label>
                <input name="image_url" value={formData.image_url} onChange={handleChange} className="p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-blue-500" placeholder="https://..." />
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <label className="font-bold text-gray-700 text-sm uppercase flex items-center justify-between">
              <span>เนื้อหาภาษาอังกฤษ (Content) *</span>
              {activeTab === 'story' && <span className="text-xs text-blue-500 normal-case font-bold">ระบุพิกัดโดยใช้โครงสร้างปูมคำศัพท์ เช่น {"{1}"}, {"{2}"} ไปจนถึง {"{10}"}</span>}
              {activeTab === 'speedread' && <span className="text-xs text-orange-500 normal-case font-bold">วางบทความ Text ยาวๆ ที่ต้องการให้อ่านเร็วลงที่นี่ได้เลย</span>}
            </label>
            <textarea required name="content" value={formData.content} onChange={handleChange} className="p-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-blue-500 min-h-[200px] leading-relaxed font-serif text-lg" placeholder="Once upon a time..."></textarea>
          </div>

          {activeTab === 'story' && (
            <>
              <div className="flex flex-col gap-2">
                <label className="font-bold text-gray-700 text-sm uppercase">คำแปลภาษาไทยรวมบทความ (Translation)</label>
                <textarea name="translation" value={formData.translation} onChange={handleChange} className="p-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-blue-500 min-h-[100px] leading-relaxed" placeholder="เนื้อเรื่องคำแปลยาวภาพรวม..."></textarea>
              </div>

              <div className="p-6 bg-gray-50 rounded-2xl border border-gray-200">
                <h3 className="font-bold text-gray-800 mb-2 uppercase">คลังคำศัพท์แยกเลเวลและคำแปลอิสระ</h3>
                <div className="flex flex-col gap-4 max-h-[500px] overflow-y-auto pr-2">
                  {vocabRows.map((row, idx) => (
                    <div key={row.id} className="flex flex-col gap-2 p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
                      <div className="font-black text-gray-400 text-sm border-b pb-1 mb-2">พิกัดตำแหน่งคำศัพท์ #{row.id}</div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="grid grid-cols-2 gap-2 border-l-4 border-rose-500 pl-2">
                          <input placeholder="Word I" value={row.I} onChange={(e) => { const r = [...vocabRows]; r[idx].I = e.target.value; setVocabRows(r); }} className="p-2 bg-gray-50 border rounded-lg text-sm focus:outline-rose-500" />
                          <input placeholder="แปล I" value={row.thai_I} onChange={(e) => { const r = [...vocabRows]; r[idx].thai_I = e.target.value; setVocabRows(r); }} className="p-2 bg-gray-50 border rounded-lg text-sm focus:outline-rose-500" />
                        </div>
                        <div className="grid grid-cols-2 gap-2 border-l-4 border-orange-500 pl-2">
                          <input placeholder="Word II" value={row.II} onChange={(e) => { const r = [...vocabRows]; r[idx].II = e.target.value; setVocabRows(r); }} className="p-2 bg-gray-50 border rounded-lg text-sm focus:outline-orange-500" />
                          <input placeholder="แปล II" value={row.thai_II} onChange={(e) => { const r = [...vocabRows]; r[idx].thai_II = e.target.value; setVocabRows(r); }} className="p-2 bg-gray-50 border rounded-lg text-sm focus:outline-orange-500" />
                        </div>
                        <div className="grid grid-cols-2 gap-2 border-l-4 border-blue-500 pl-2">
                          <input placeholder="Word III" value={row.III} onChange={(e) => { const r = [...vocabRows]; r[idx].III = e.target.value; setVocabRows(r); }} className="p-2 bg-gray-50 border rounded-lg text-sm focus:outline-blue-500" />
                          <input placeholder="แปล III" value={row.thai_III} onChange={(e) => { const r = [...vocabRows]; r[idx].thai_III = e.target.value; setVocabRows(r); }} className="p-2 bg-gray-50 border rounded-lg text-sm focus:outline-blue-500" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          <div className="flex items-center gap-3 bg-purple-50 p-4 rounded-xl border border-purple-100 cursor-pointer" onClick={() => setFormData(p => ({...p, is_premium: !p.is_premium}))}>
            <input type="checkbox" checked={formData.is_premium} readOnly className="w-5 h-5 accent-purple-600 cursor-pointer" />
            <span className="font-bold text-purple-800 text-sm uppercase">ตั้งเป็นบทความ Premium (ต้องสมัครสมาชิก)</span>
          </div>

          <button type="submit" disabled={loading} className={`mt-2 text-white font-black text-lg p-4 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 ${activeTab === 'speedread' ? 'bg-orange-500 hover:bg-orange-600' : 'bg-blue-600 hover:bg-blue-700'}`}>
            {loading ? <Loader2 className="animate-spin" size={24} /> : <Save size={24} />}
            {editingId ? 'UPDATE CONTENT' : 'PUBLISH NEW CONTENT'}
          </button>
        </form>
      </div>

      {/* List Display */}
      <div className="bg-white rounded-3xl shadow-xl border border-gray-200 overflow-hidden">
        <div className="bg-gray-800 p-5 text-white flex justify-between items-center">
          <div>
            <h2 className="text-xl font-black tracking-wider uppercase">Content Repository</h2>
            <p className="opacity-70 text-xs mt-0.5 font-medium">คลังข้อมูลในระบบหมวด {activeTab === 'speedread' ? 'Ultra Speedread' : 'Story Diary'}</p>
          </div>
          <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-bold">{displayList.length} Items</span>
        </div>
        <div className="p-4 flex flex-col divide-y divide-gray-100 max-h-[400px] overflow-y-auto">
          {displayList.length === 0 ? (
            <div className="text-center py-8 font-medium text-gray-400 text-sm">ไม่พบข้อมูลในหมวดหมู่นี้</div>
          ) : (
            displayList.map(item => (
              <div key={item.id} className="flex items-center justify-between py-3.5 px-2 hover:bg-gray-50 rounded-xl transition-colors">
                <div className="flex items-center gap-3">
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${item.is_premium ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>{item.is_premium ? 'PREMIUM' : 'FREE'}</span>
                  <span className="font-bold text-gray-800 text-sm">{item.title}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => handleEditSelect(item.id, item.type)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Edit3 size={16}/></button>
                  <button onClick={() => handleDelete(item.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={16}/></button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}