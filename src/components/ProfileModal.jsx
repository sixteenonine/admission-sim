import React, { useState } from 'react';
import { X, Lock, User, Save, Loader2 } from 'lucide-react';

const AVATARS = [
  { id: 1, color: '#3b82f6' }, { id: 2, color: '#10b981' }, 
  { id: 3, color: '#8b5cf6' }, { id: 4, color: '#f43f5e' }, 
  { id: 5, color: '#f97316' }, { id: 6, color: '#14b8a6' }
];

const ProfileModal = ({ isOpen, onClose, user, themeVals }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [formData, setFormData] = useState({
    currentPassword: '',
    newUsername: user?.username || '',
    newPassword: '',
    securityQuestionId: 1,
    securityAnswer: '',
    avatarId: user?.avatar_id || 1
  });

  const { bg, theme, shadowPlateau, shadowOuter, raisedGradient, shadowDeepInset, indentedGradient } = themeVals;

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError(''); setSuccess('');
    try {
      const res = await fetch('/api/profile/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, ...formData })
      });
      const data = await res.json();
      if (data.status === 'success') {
        setSuccess('อัปเดตข้อมูลสำเร็จ! (กรุณาเข้าสู่ระบบใหม่หากเปลี่ยนชื่อหรือรหัส)');
        setTimeout(onClose, 2000);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('การเชื่อมต่อล้มเหลว');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center px-4 animate-in fade-in duration-300 font-medium" style={{ background: bg }}>
      <div className="w-full max-w-sm rounded-[2.5rem] border border-white/20 relative" style={{ padding: '9px', boxShadow: shadowPlateau, background: bg }}>
        <div className="w-full rounded-[2rem] p-8 flex flex-col gap-6 border border-white/5" style={{ background: bg, boxShadow: shadowOuter }}>
          
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold" style={{ color: theme.textMain }}>จัดการโปรไฟล์</h3>
            <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center border border-white/5" style={{ background: raisedGradient, boxShadow: shadowPlateau, color: theme.textMain }}>
              <X size={14} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {error && <div className="p-3 text-xs text-red-500 bg-red-500/10 rounded-xl border border-red-500/20">{error}</div>}
            {success && <div className="p-3 text-xs text-emerald-500 bg-emerald-500/10 rounded-xl border border-emerald-500/20">{success}</div>}

            {/* เลือกสี Avatar */}
            <div className="flex justify-between gap-2 mb-2">
              {AVATARS.map(av => (
                <button key={av.id} type="button" onClick={() => setFormData({...formData, avatarId: av.id})}
                  className={`w-10 h-10 rounded-full border-2 transition-all ${formData.avatarId === av.id ? 'border-white scale-110 shadow-lg' : 'border-transparent opacity-50 hover:opacity-100'}`}
                  style={{ backgroundColor: av.color }}
                />
              ))}
            </div>

            <div className="flex items-center px-4 py-3 rounded-xl border border-white/5" style={{ background: indentedGradient, boxShadow: shadowDeepInset }}>
              <User className="mr-3 opacity-40" size={16} style={{ color: theme.textMain }} />
              <input type="text" className="w-full bg-transparent outline-none text-sm" placeholder="Username ใหม่" value={formData.newUsername} onChange={e => setFormData({...formData, newUsername: e.target.value})} style={{ color: theme.textMain }} />
            </div>

            <div className="flex items-center px-4 py-3 rounded-xl border border-white/5" style={{ background: indentedGradient, boxShadow: shadowDeepInset }}>
              <Lock className="mr-3 opacity-40 text-red-500" size={16} />
              <input type="password" required className="w-full bg-transparent outline-none text-sm placeholder-red-500/50" placeholder="รหัสผ่านปัจจุบัน (จำเป็นต้องใส่)" value={formData.currentPassword} onChange={e => setFormData({...formData, currentPassword: e.target.value})} style={{ color: theme.textMain }} />
            </div>

            <div className="flex items-center px-4 py-3 rounded-xl border border-white/5" style={{ background: indentedGradient, boxShadow: shadowDeepInset }}>
              <Lock className="mr-3 opacity-40" size={16} style={{ color: theme.textMain }} />
              <input type="password" className="w-full bg-transparent outline-none text-sm" placeholder="รหัสผ่านใหม่ (เว้นว่างถ้าไม่เปลี่ยน)" value={formData.newPassword} onChange={e => setFormData({...formData, newPassword: e.target.value})} style={{ color: theme.textMain }} />
            </div>

            <div className="flex flex-col gap-2 p-3 rounded-xl border border-white/5" style={{ background: indentedGradient, boxShadow: shadowDeepInset }}>
              <p className="text-[11px] uppercase opacity-60 font-bold tracking-wider" style={{ color: theme.textSub }}>ตั้งคำถามกู้คืนรหัสผ่าน</p>
              <select className="bg-transparent text-sm outline-none" value={formData.securityQuestionId} onChange={e => setFormData({...formData, securityQuestionId: parseInt(e.target.value)})} style={{ color: theme.textMain }}>
                <option value={1} style={{color: '#000'}}>สัตว์เลี้ยงตัวแรกชื่ออะไร?</option>
                <option value={2} style={{color: '#000'}}>ชื่อโรงเรียนประถมคืออะไร?</option>
                <option value={3} style={{color: '#000'}}>เกิดจังหวัดอะไร?</option>
                <option value={4} style={{color: '#000'}}>ชื่อเล่นของแม่คืออะไร?</option>
              </select>
              <input type="text" className="w-full bg-transparent outline-none text-sm mt-2 border-t border-white/10 pt-2" placeholder="คำตอบของคุณ" value={formData.securityAnswer} onChange={e => setFormData({...formData, securityAnswer: e.target.value})} style={{ color: theme.textMain }} />
            </div>

            <button type="submit" disabled={loading} className="w-full py-4 rounded-xl font-bold text-sm text-white shadow-lg flex justify-center items-center gap-2 mt-2" style={{ background: 'linear-gradient(145deg, #3b82f6, #2563eb)' }}>
              {loading ? <Loader2 className="animate-spin" size={16} /> : <><Save size={16} /> บันทึกข้อมูล</>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;