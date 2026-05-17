import React, { useState, useEffect } from 'react';
import { Save, Loader2, AlertCircle, CheckCircle2, Trash2, Edit3, Plus } from 'lucide-react';

export default function StoryAdmin() {
  const [stories, setStories] = useState([]);
  const [editingId, setEditingId] = useState(null);
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
      if (data.status === 'success') setStories(data.stories);
    } catch (err) {
      console.error("โหลดรายการเรื่องสั้นล้มเหลว");
    }
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });

  const handleEditSelect = async (storyId) => {
    setLoading(true);
    setStatus({ type: '', msg: '' });
    try {
      const res = await fetch('/api/stories/get', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storyId })
      });
      const data = await res.json();
      if (data.status === 'success') {
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
      setStatus({ type: 'error', msg: 'โหลดข้อมูลเรื่องสั้นล้มเหลว' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (storyId) => {
    if (!confirm("คุณแน่ใจหรือไม่ว่าต้องการลบเรื่องสั้นนี้อย่างถาวร?")) return;
    try {
      const res = await fetch('/api/admin/stories/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storyId })
      });
      const data = await res.json();
      if (data.status === 'success') {
        alert("ลบเรื่องสั้นเรียบร้อยแล้ว");
        if (editingId === storyId) handleResetForm();
        fetchStories();
      }
    } catch (err) {
      alert("ไม่สามารถลบข้อมูลได้");
    }
  };

  const handleResetForm = () => {
    setEditingId(null);
    setFormData({ title: '', image_url: '', content: '', translation: '', is_premium: false });
    setVocabRows(Array.from({ length: 10 }, (_, i) => ({ id: i + 1, I: '', thai_I: '', II: '', thai_II: '', III: '', thai_III: '' })));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: '', msg: '' });

    const vocab_levels = {};
    vocabRows.forEach(row => {
      if (row.I.trim()) {
        vocab_levels[row.id] = {
          I: row.I.trim(),
          thai_I: row.thai_I.trim(),
          II: row.II.trim(),
          thai_II: row.thai_II.trim(),
          III: row.III.trim(),
          thai_III: row.thai_III.trim()
        };
      }
    });

    const endpoint = editingId ? '/api/admin/stories/edit' : '/api/admin/stories/add';
    const payload = editingId ? { id: editingId, ...formData, vocab_levels } : { ...formData, vocab_levels };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      
      if (data.status === 'success') {
        setStatus({ type: 'success', msg: editingId ? 'อัปเดตข้อมูลเรื่องสั้นเรียบร้อย!' : 'บันทึกเรื่องสั้นใหม่ลงฐานข้อมูลเรียบร้อยแล้ว!' });
        handleResetForm();
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

  return (
    <div className="w-full max-w-5xl mx-auto p-6 flex flex-col gap-10">
      <div className="bg-white rounded-3xl shadow-xl border border-gray-200 overflow-hidden">
        <div className="bg-blue-600 p-6 text-white flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-black tracking-widest uppercase">StoryDiary Management</h1>
            <p className="opacity-80 text-sm font-medium mt-1">ระบบเพิ่ม แก้ไข และลบเรื่องสั้นสลับระดับคำศัพท์</p>
          </div>
          {editingId && (
            <button onClick={handleResetForm} className="bg-white/20 hover:bg-white/30 text-white font-bold text-xs px-4 py-2 rounded-full flex items-center gap-1">
              <Plus size={14}/> โหมดเพิ่มใหม่
            </button>
          )}
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
              <span className="text-xs text-blue-500 normal-case font-bold">ระบุพิกัดโดยใช้โครงสร้างปูมคำศัพท์ เช่น {"{1}"}, {"{2}"} ไปจนถึง {"{10}"}</span>
            </label>
            <textarea required name="content" value={formData.content} onChange={handleChange} className="p-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-blue-500 min-h-[150px] leading-relaxed font-serif text-lg" placeholder="Once upon a time, a {1} man lived in a {2} house..."></textarea>
          </div>

          <div className="flex flex-col gap-2">
            <label className="font-bold text-gray-700 text-sm uppercase">คำแปลภาษาไทยรวมบทความ (Translation)</label>
            <textarea name="translation" value={formData.translation} onChange={handleChange} className="p-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-blue-500 min-h-[100px] leading-relaxed" placeholder="เนื้อเรื่องคำแปลยาวภาพรวม..."></textarea>
          </div>

          <div className="p-6 bg-gray-50 rounded-2xl border border-gray-200">
            <h3 className="font-bold text-gray-800 mb-2 uppercase">คลังคำศัพท์แยกเลเวลและคำแปลอิสระ</h3>
            <p className="text-xs text-gray-500 mb-4 font-medium">กรอกคำศัพท์พร้อมความหมายภาษาไทยที่จำเพาะเจาะจงของแต่ละระดับให้ตรงกับเลขพิกัดปีกกาในเนื้อเรื่อง</p>
            
            <div className="flex flex-col gap-4 max-h-[500px] overflow-y-auto pr-2">
              {vocabRows.map((row, idx) => (
                <div key={row.id} className="flex flex-col gap-2 p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
                  <div className="font-black text-gray-400 text-sm border-b pb-1 mb-2">พิกัดตำแหน่งคำศัพท์ #{row.id}</div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="grid grid-cols-2 gap-2 border-l-4 border-rose-500 pl-2">
                      <input placeholder="Word Lvl I" value={row.I} onChange={(e) => { const r = [...vocabRows]; r[idx].I = e.target.value; setVocabRows(r); }} className="p-2 bg-gray-50 border rounded-lg text-sm focus:outline-rose-500" />
                      <input placeholder="แปลไทย Lvl I" value={row.thai_I} onChange={(e) => { const r = [...vocabRows]; r[idx].thai_I = e.target.value; setVocabRows(r); }} className="p-2 bg-gray-50 border rounded-lg text-sm focus:outline-rose-500" />
                    </div>
                    <div className="grid grid-cols-2 gap-2 border-l-4 border-orange-500 pl-2">
                      <input placeholder="Word Lvl II" value={row.II} onChange={(e) => { const r = [...vocabRows]; r[idx].II = e.target.value; setVocabRows(r); }} className="p-2 bg-gray-50 border rounded-lg text-sm focus:outline-orange-500" />
                      <input placeholder="แปลไทย Lvl II" value={row.thai_II} onChange={(e) => { const r = [...vocabRows]; r[idx].thai_II = e.target.value; setVocabRows(r); }} className="p-2 bg-gray-50 border rounded-lg text-sm focus:outline-orange-500" />
                    </div>
                    <div className="grid grid-cols-2 gap-2 border-l-4 border-blue-500 pl-2">
                      <input placeholder="Word Lvl III" value={row.III} onChange={(e) => { const r = [...vocabRows]; r[idx].III = e.target.value; setVocabRows(r); }} className="p-2 bg-gray-50 border rounded-lg text-sm focus:outline-blue-500" />
                      <input placeholder="แปลไทย Lvl III" value={row.thai_III} onChange={(e) => { const r = [...vocabRows]; r[idx].thai_III = e.target.value; setVocabRows(r); }} className="p-2 bg-gray-50 border rounded-lg text-sm focus:outline-blue-500" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 bg-purple-50 p-4 rounded-xl border border-purple-100 cursor-pointer" onClick={() => setFormData(p => ({...p, is_premium: !p.is_premium}))}>
            <input type="checkbox" checked={formData.is_premium} readOnly className="w-5 h-5 accent-purple-600 cursor-pointer" />
            <span className="font-bold text-purple-800 text-sm uppercase">ตั้งเป็นบทความ Premium (ต้องสมัครสมาชิกถึงจะอ่านได้)</span>
          </div>

          <button type="submit" disabled={loading} className="mt-2 bg-blue-600 hover:bg-blue-700 text-white font-black text-lg p-4 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50">
            {loading ? <Loader2 className="animate-spin" size={24} /> : <Save size={24} />}
            {editingId ? 'UPDATE STORY DATA' : 'PUBLISH NEW STORY'}
          </button>
        </form>
      </div>

      <div className="bg-white rounded-3xl shadow-xl border border-gray-200 overflow-hidden">
        <div className="bg-gray-800 p-5 text-white">
          <h2 className="text-xl font-black tracking-wider uppercase">Story List Dashboard</h2>
          <p className="opacity-70 text-xs mt-0.5 font-medium">จัดการแก้ไขข้อมูลและลบคลังเรื่องสั้นที่มีอยู่ในระบบ</p>
        </div>
        <div className="p-4 flex flex-col divide-y divide-gray-100 max-h-[400px] overflow-y-auto">
          {stories.length === 0 ? (
            <div className="text-center py-8 font-medium text-gray-400 text-sm">ไม่พบเรื่องสั้นในระบบฐานข้อมูล</div>
          ) : (
            stories.map(item => (
              <div key={item.id} className="flex items-center justify-between py-3.5 px-2 hover:bg-gray-50 rounded-xl transition-colors">
                <div className="flex items-center gap-3">
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${item.is_premium ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>{item.is_premium ? 'PREMIUM' : 'FREE'}</span>
                  <span className="font-bold text-gray-800 text-sm">{item.title}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => handleEditSelect(item.id)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Edit3 size={16}/></button>
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