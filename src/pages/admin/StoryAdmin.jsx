import React, { useState } from 'react';
import { Save, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function StoryAdmin() {
  const [formData, setFormData] = useState({ title: '', image_url: '', content: '', translation: '', is_premium: false });
  const [vocabRows, setVocabRows] = useState(
    Array.from({ length: 10 }, (_, i) => ({ id: i + 1, I: '', II: '', III: '', thai: '' }))
  );
  const [status, setStatus] = useState({ type: '', msg: '' });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });
  const handleVocabChange = (e) => setVocab({ ...vocab, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: '', msg: '' });

    const vocab_levels = {};
    vocabRows.forEach(row => {
      if (row.I.trim()) {
        vocab_levels[row.id] = {
          I: row.I.trim(),
          II: row.II.trim(),
          III: row.III.trim(),
          thai: row.thai.trim()
        };
      }
    });

    try {
      const res = await fetch('/api/admin/stories/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, vocab_levels })
      });
      const data = await res.json();
      
      if (data.status === 'success') {
        setStatus({ type: 'success', msg: 'บันทึกเรื่องสั้นลงฐานข้อมูลเรียบร้อยแล้ว!' });
        setFormData({ title: '', image_url: '', content: '', translation: '', is_premium: false });
        setVocabRows(Array.from({ length: 10 }, (_, i) => ({ id: i + 1, I: '', II: '', III: '', thai: '' })));
      } else {
        setStatus({ type: 'error', msg: data.message });
      }
    } catch (err) {
      setStatus({ type: 'error', msg: 'การเชื่อมต่อเซิร์ฟเวอร์ล้มเหลว' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6 animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl shadow-xl border border-gray-200 overflow-hidden">
        <div className="bg-blue-600 p-6 text-white">
          <h1 className="text-2xl font-black tracking-widest uppercase">StoryDiary Admin Panel</h1>
          <p className="opacity-80 text-sm font-medium mt-1">ระบบเพิ่มเรื่องสั้นและคำศัพท์เข้าสู่ Cloudflare D1 + KV</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 flex flex-col gap-6">
          {status.msg && (
            <div className={`p-4 rounded-xl flex items-center gap-3 font-bold text-sm ${status.type === 'success' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>
              {status.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
              {status.msg}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <label className="font-bold text-gray-700 text-sm uppercase">ชื่อเรื่อง (Title) *</label>
              <input required name="title" value={formData.title} onChange={handleChange} className="p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-blue-500" placeholder="The Mystery of..." />
            </div>
            <div className="flex flex-col gap-2">
              <label className="font-bold text-gray-700 text-sm uppercase">ลิงก์รูปภาพปก (Image URL)</label>
              <input name="image_url" value={formData.image_url} onChange={handleChange} className="p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-blue-500" placeholder="https://..." />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="font-bold text-gray-700 text-sm uppercase flex items-center justify-between">
              <span>เนื้อเรื่องภาษาอังกฤษ (Content) *</span>
              <span className="text-xs text-gray-400 normal-case">ใส่ **คำศัพท์** เพื่อทำตัวหนาได้</span>
            </label>
            <textarea required name="content" value={formData.content} onChange={handleChange} className="p-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-blue-500 min-h-[150px] leading-relaxed" placeholder="Once upon a time..."></textarea>
          </div>

          <div className="flex flex-col gap-2">
            <label className="font-bold text-gray-700 text-sm uppercase">คำแปลภาษาไทย (Translation)</label>
            <textarea name="translation" value={formData.translation} onChange={handleChange} className="p-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-blue-500 min-h-[100px] leading-relaxed" placeholder="กาลครั้งหนึ่งนานมาแล้ว..."></textarea>
          </div>

          <div className="p-6 bg-gray-50 rounded-2xl border border-gray-200">
            <h3 className="font-bold text-gray-800 mb-4 uppercase">คลังคำศัพท์ (Vocabulary)</h3>
            <p className="text-xs text-gray-500 mb-4 font-medium">ระบุคำศัพท์ทั้ง 3 ระดับให้สอดคล้องกันตามหมายเลขพิกัดที่กรอกในเนื้อเรื่อง (เช่น ตัวอย่างข้อความ: Moving into this {`{1}`} cabin...)</p>
            
            <div className="flex flex-col gap-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {vocabRows.map((row, idx) => (
                <div key={row.id} className="grid grid-cols-1 md:grid-cols-5 gap-3 p-3 bg-white rounded-xl border border-gray-200 items-center">
                  <div className="font-black text-gray-400 text-center text-sm">#{row.id}</div>
                  <input 
                    placeholder="Level I (ง่าย)" 
                    value={row.I} 
                    onChange={(e) => {
                      const newRows = [...vocabRows];
                      newRows[idx].I = e.target.value;
                      setVocabRows(newRows);
                    }} 
                    className="p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-rose-500"
                  />
                  <input 
                    placeholder="Level II (ปานกลาง)" 
                    value={row.II} 
                    onChange={(e) => {
                      const newRows = [...vocabRows];
                      newRows[idx].II = e.target.value;
                      setVocabRows(newRows);
                    }} 
                    className="p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-orange-500"
                  />
                  <input 
                    placeholder="Level III (ยาก)" 
                    value={row.III} 
                    onChange={(e) => {
                      const newRows = [...vocabRows];
                      newRows[idx].III = e.target.value;
                      setVocabRows(newRows);
                    }} 
                    className="p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-blue-500"
                  />
                  <input 
                    placeholder="คำแปลภาษาไทย" 
                    value={row.thai} 
                    onChange={(e) => {
                      const newRows = [...vocabRows];
                      newRows[idx].thai = e.target.value;
                      setVocabRows(newRows);
                    }} 
                    className="p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-gray-500"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 bg-purple-50 p-4 rounded-xl border border-purple-100 cursor-pointer" onClick={() => setFormData(p => ({...p, is_premium: !p.is_premium}))}>
            <input type="checkbox" checked={formData.is_premium} readOnly className="w-5 h-5 accent-purple-600 cursor-pointer" />
            <span className="font-bold text-purple-800 text-sm uppercase">ตั้งเป็นบทความ Premium (ต้องสมัครสมาชิกถึงจะอ่านได้)</span>
          </div>

          <button type="submit" disabled={loading} className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-black text-lg p-4 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50">
            {loading ? <Loader2 className="animate-spin" size={24} /> : <Save size={24} />}
            {loading ? 'SAVING TO DATABASE...' : 'PUBLISH STORY'}
          </button>
        </form>
      </div>
    </div>
  );
}