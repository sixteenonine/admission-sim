import React, { useState } from 'react';
import { X, Lock, User, Save, Loader2, Shield, Camera } from 'lucide-react';

const AVATARS = [
  { id: 1, color: '#3b82f6' }, { id: 2, color: '#10b981' }, 
  { id: 3, color: '#8b5cf6' }, { id: 4, color: '#f43f5e' }, 
  { id: 5, color: '#f97316' }, { id: 6, color: '#14b8a6' }
];

const SECURITY_QUESTIONS = [
  { id: 1, text: "สัตว์เลี้ยงตัวแรกของคุณชื่ออะไร?" },
  { id: 2, text: "ชื่อโรงเรียนประถมของคุณคืออะไร?" },
  { id: 3, text: "จังหวัดที่คุณเกิดคือจังหวัดอะไร?" },
  { id: 4, text: "ชื่อเล่นของแม่คุณคืออะไร?" }
];

const ProfileModal = ({ isOpen, onClose, user, themeVals }) => {
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [formData, setFormData] = useState({
    currentPassword: '',
    newUsername: user?.username || '',
    newPassword: '',
    securityQuestionId: user?.security_question_id || 1,
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
        setSuccess('อัปเดตข้อมูลสำเร็จ! (กรุณาเข้าสู่ระบบใหม่เพื่ออัปเดตข้อมูล)');
        setFormData({ ...formData, currentPassword: '', newPassword: '' }); // เคลียร์รหัสผ่านหลังเซฟ
        setTimeout(() => {
          onClose();
          setSuccess('');
        }, 2500);
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
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 sm:p-8 animate-in fade-in duration-300 font-medium" style={{ background: bg, fontFamily: "'Outfit', 'Prompt', sans-serif" }}>
      
      {/* Container หลัก */}
      <div className="w-full max-w-5xl flex flex-col gap-6 relative animate-in zoom-in-95 duration-300">
        
        {/* Header Title */}
        <div className="flex items-center justify-between px-2">
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: theme.textMain }}>Account Settings</h1>
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full transition-all active:scale-95 border border-white/5" style={{ background: raisedGradient, boxShadow: shadowPlateau, color: theme.textMain }}>
            <X size={18} />
          </button>
        </div>

        {/* Main Card (แบ่งซ้าย-ขวา) */}
        <div className="w-full flex flex-col md:flex-row min-h-[550px] overflow-hidden rounded-[2.5rem] border border-white/5" style={{ background: raisedGradient, boxShadow: shadowOuter }}>
          
          {/* ซ้าย: Sub-menu Sidebar */}
          <div className="w-full md:w-64 p-6 flex flex-col gap-4 shrink-0 border-b md:border-b-0 md:border-r border-white/5" style={{ background: bg }}>
            <button 
              onClick={() => { setActiveTab('profile'); setError(''); setSuccess(''); }}
              className="flex items-center gap-3 w-full px-5 py-3.5 rounded-2xl text-[14px] font-bold transition-all duration-200 border border-white/5"
              style={activeTab === 'profile' ? { background: indentedGradient, boxShadow: shadowDeepInset, color: '#3b82f6' } : { color: theme.textMain, background: 'transparent' }}
            >
              <User size={18} /> Profile Settings
            </button>
            <button 
              onClick={() => { setActiveTab('security'); setError(''); setSuccess(''); }}
              className="flex items-center gap-3 w-full px-5 py-3.5 rounded-2xl text-[14px] font-bold transition-all duration-200 border border-white/5"
              style={activeTab === 'security' ? { background: indentedGradient, boxShadow: shadowDeepInset, color: '#3b82f6' } : { color: theme.textMain, background: 'transparent' }}
            >
              <Lock size={18} /> Password & Security
            </button>
          </div>

          {/* ขวา: Content Area */}
          <div className="flex-1 p-8 md:p-10 flex flex-col">
            <form onSubmit={handleSubmit} className="flex flex-col h-full">
              
              {error && <div className="p-3 mb-6 text-[13px] font-bold text-red-500 bg-red-500/10 rounded-xl border border-red-500/20 text-center">{error}</div>}
              {success && <div className="p-3 mb-6 text-[13px] font-bold text-emerald-500 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-center">{success}</div>}

              {/* TAB 1: Profile Settings */}
              {activeTab === 'profile' && (
                <div className="flex flex-col gap-8 animate-in fade-in duration-300 flex-1">
                  
                  {/* Avatar Section */}
                  <div className="flex flex-col gap-4">
                    <label className="text-[13px] uppercase font-bold tracking-widest opacity-60" style={{ color: theme.textSub }}>Avatar Style</label>
                    <div className="flex flex-wrap gap-4">
                      {AVATARS.map(av => (
                        <button 
                          key={av.id} 
                          type="button" 
                          onClick={() => setFormData({...formData, avatarId: av.id})}
                          className={`w-14 h-14 rounded-full border-[3px] transition-all flex items-center justify-center ${formData.avatarId === av.id ? 'scale-110 shadow-lg' : 'opacity-40 hover:opacity-100 hover:scale-105'}`}
                          style={{ backgroundColor: av.color, borderColor: formData.avatarId === av.id ? theme.bg : 'transparent', boxShadow: formData.avatarId === av.id ? shadowPlateau : 'none' }}
                        >
                          {formData.avatarId === av.id && <User size={24} color="#ffffff" className="opacity-80" />}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Form Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
                    <div className="flex flex-col gap-2.5">
                      <label className="text-[14px] font-bold opacity-80" style={{ color: theme.textMain }}>Username</label>
                      <div className="flex items-center px-4 h-[52px] rounded-2xl border border-white/5 transition-all" style={{ background: indentedGradient, boxShadow: shadowDeepInset }}>
                        <input type="text" className="w-full bg-transparent outline-none text-[15px] font-medium" value={formData.newUsername} onChange={(e) => setFormData({...formData, newUsername: e.target.value})} style={{ color: theme.textMain }} />
                      </div>
                    </div>
                    
                    {/* Require Current Password to Save Profile Info */}
                    <div className="flex flex-col gap-2.5 md:col-span-2 mt-4 pt-6 border-t border-white/5">
                       <label className="text-[14px] font-bold opacity-80 flex items-center gap-2 text-red-500">
                         <Lock size={16} /> Current Password <span className="text-[11px] opacity-80 font-medium">(กรอกเพื่อยืนยันการบันทึกข้อมูล)</span>
                       </label>
                       <div className="flex items-center px-4 h-[52px] rounded-2xl border border-red-500/30 transition-all focus-within:border-red-500" style={{ background: indentedGradient, boxShadow: shadowDeepInset }}>
                         <input type="password" required className="w-full bg-transparent outline-none text-[15px] font-medium placeholder-red-500/40" placeholder="••••••••" value={formData.currentPassword} onChange={(e) => setFormData({...formData, currentPassword: e.target.value})} style={{ color: theme.textMain }} />
                       </div>
                    </div>
                  </div>

                  <div className="mt-auto pt-6">
                    <button type="submit" disabled={loading} className="w-full md:w-auto px-10 py-4 rounded-2xl font-bold text-[14px] uppercase tracking-widest text-white transition-all active:scale-95 shadow-lg flex items-center justify-center gap-3 border border-white/10" style={{ background: 'linear-gradient(145deg, #3b82f6, #2563eb)' }}>
                      {loading ? <Loader2 className="animate-spin" size={18} /> : <><Save size={18} /> Save Changes</>}
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 2: Password & Security */}
              {activeTab === 'security' && (
                <div className="flex flex-col gap-8 animate-in fade-in duration-300 flex-1">
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex flex-col gap-2.5">
                      <label className="text-[14px] font-bold opacity-80" style={{ color: theme.textMain }}>New Password <span className="text-[11px] opacity-60 font-medium">(เว้นว่างไว้ถ้าไม่เปลี่ยน)</span></label>
                      <div className="flex items-center px-4 h-[52px] rounded-2xl border border-white/5 transition-all focus-within:border-blue-500/50" style={{ background: indentedGradient, boxShadow: shadowDeepInset }}>
                        <input type="password" placeholder="••••••••" className="w-full bg-transparent outline-none text-[15px] font-medium tracking-widest" value={formData.newPassword} onChange={(e) => setFormData({...formData, newPassword: e.target.value})} style={{ color: theme.textMain }} />
                      </div>
                    </div>

                    <div className="flex flex-col gap-2.5 md:col-start-1 md:col-span-2 border-t border-white/5 pt-4 mt-2">
                      <label className="text-[14px] font-bold opacity-80" style={{ color: theme.textMain }}>Security Question <span className="text-[11px] opacity-60 font-medium">(ตั้งคำถามความปลอดภัยใหม่)</span></label>
                      <div className="flex items-center px-4 h-[52px] rounded-2xl border border-white/5 transition-all focus-within:border-blue-500/50" style={{ background: indentedGradient, boxShadow: shadowDeepInset }}>
                        <select className="w-full bg-transparent outline-none text-[15px] font-medium appearance-none" value={formData.securityQuestionId} onChange={e => setFormData({...formData, securityQuestionId: parseInt(e.target.value)})} style={{ color: theme.textMain }}>
                          {SECURITY_QUESTIONS.map(q => (
                            <option key={q.id} value={q.id} style={{color: '#000'}}>{q.text}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2.5 md:col-span-2">
                      <label className="text-[14px] font-bold opacity-80" style={{ color: theme.textMain }}>Answer <span className="text-[11px] opacity-60 font-medium">(คำตอบความปลอดภัย)</span></label>
                      <div className="flex items-center px-4 h-[52px] rounded-2xl border border-white/5 transition-all focus-within:border-blue-500/50" style={{ background: indentedGradient, boxShadow: shadowDeepInset }}>
                        <input type="text" placeholder="คำตอบของคุณ" className="w-full bg-transparent outline-none text-[15px] font-medium" value={formData.securityAnswer} onChange={(e) => setFormData({...formData, securityAnswer: e.target.value})} style={{ color: theme.textMain }} />
                      </div>
                    </div>

                    {/* Require Current Password to Save Security Info */}
                    <div className="flex flex-col gap-2.5 md:col-span-2 mt-4 pt-6 border-t border-white/5">
                       <label className="text-[14px] font-bold opacity-80 flex items-center gap-2 text-red-500">
                         <Lock size={16} /> Current Password <span className="text-[11px] opacity-80 font-medium">(กรอกเพื่อยืนยันการบันทึกข้อมูล)</span>
                       </label>
                       <div className="flex items-center px-4 h-[52px] rounded-2xl border border-red-500/30 transition-all focus-within:border-red-500" style={{ background: indentedGradient, boxShadow: shadowDeepInset }}>
                         <input type="password" required className="w-full bg-transparent outline-none text-[15px] font-medium placeholder-red-500/40" placeholder="••••••••" value={formData.currentPassword} onChange={(e) => setFormData({...formData, currentPassword: e.target.value})} style={{ color: theme.textMain }} />
                       </div>
                    </div>
                  </div>

                  <div className="mt-auto pt-6">
                    <button type="submit" disabled={loading} className="w-full md:w-auto px-10 py-4 rounded-2xl font-bold text-[14px] uppercase tracking-widest text-white transition-all active:scale-95 shadow-lg flex items-center justify-center gap-3 border border-white/10" style={{ background: 'linear-gradient(145deg, #3b82f6, #2563eb)' }}>
                      {loading ? <Loader2 className="animate-spin" size={18} /> : <><Shield size={18} /> Update Security</>}
                    </button>
                  </div>
                </div>
              )}

            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;