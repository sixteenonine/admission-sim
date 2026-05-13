import React, { useState } from 'react';
import { X, Lock, User, Save, Loader2 } from 'lucide-react';

const AVATARS = [
  { id: 1, color: '#3b82f6' }, { id: 2, color: '#10b981' }, 
  { id: 3, color: '#8b5cf6' }, { id: 4, color: '#f43f5e' }, 
  { id: 5, color: '#f97316' }, { id: 6, color: '#14b8a6' }
];

const ProfileModal = ({ isOpen, onClose, user, themeVals }) => {
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // ลบ currentPassword ออกจากระบบ
  const [formData, setFormData] = useState({
    newUsername: user?.username || '',
    newPassword: '',
    generation: user?.generation || 'DEK70',
    targetUni: user?.target_uni || 'จุฬาลงกรณ์มหาวิทยาลัย',
    targetFac: user?.target_fac || 'ศึกษาศาสตร์',
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
        setSuccess('อัปเดตข้อมูลสำเร็จ!');
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

  // เส้นคั่นบางๆ แบบ Responsive กับ ธีมมืด/สว่าง
  const dividerColor = theme.bg === "#1e2229" ? 'border-white/5' : 'border-black/5';

  return (
    <div className="fixed inset-0 z-[350] flex items-center justify-center bg-transparent backdrop-blur-md px-4 animate-in fade-in duration-300">
      
      {/* กรอบนอก */}
      <div className="w-full max-w-4xl rounded-[2.5rem] border border-white/30 relative" style={{ padding: '9px', boxShadow: shadowPlateau, background: bg }}>
        
        {/* กรอบใน */}
        <div className="w-full rounded-[2rem] p-6 sm:p-8 flex flex-col gap-8 border border-white/5" style={{ background: bg, boxShadow: shadowOuter }}>
          
          {/* Header */}
          <div className="flex justify-between items-center px-2">
            <h3 className="text-2xl font-bold tracking-wide" style={{ color: theme.textMain }}>Account Settings</h3>
            <button onClick={onClose} className="w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-95 border border-white/5" style={{ background: raisedGradient, boxShadow: shadowPlateau, color: theme.textMain }}>
              <X size={18} />
            </button>
          </div>

          <div className="flex flex-col md:flex-row gap-8 min-h-[450px]">
            
            {/* Sidebar Left */}
            <div className="w-full md:w-64 flex flex-col gap-3 shrink-0">
              <button 
                onClick={() => { setActiveTab('profile'); setError(''); setSuccess(''); }}
                className={`flex items-center gap-4 w-full px-5 py-4 rounded-[1.25rem] text-[15px] font-bold transition-all duration-300 border border-white/5`}
                style={activeTab === 'profile' ? { background: indentedGradient, boxShadow: shadowDeepInset, color: '#3b82f6' } : { color: theme.textMain, background: 'transparent' }}
              >
                <User size={18} /> Profile Settings
              </button>
              <button 
                onClick={() => { setActiveTab('security'); setError(''); setSuccess(''); }}
                className={`flex items-center gap-4 w-full px-5 py-4 rounded-[1.25rem] text-[15px] font-bold transition-all duration-300 border border-white/5`}
                style={activeTab === 'security' ? { background: indentedGradient, boxShadow: shadowDeepInset, color: '#3b82f6' } : { color: theme.textMain, background: 'transparent' }}
              >
                <Lock size={18} /> Password & Security
              </button>
            </div>

            {/* Content Right */}
            <div className="flex-1 flex flex-col pl-0 md:pl-4">
              <form onSubmit={handleSubmit} className="flex flex-col h-full">
                
                {error && <div className="p-3 mb-6 text-[13px] text-red-500 bg-red-500/10 rounded-xl border border-red-500/20 text-center font-bold">{error}</div>}
                {success && <div className="p-3 mb-6 text-[13px] text-emerald-500 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-center font-bold">{success}</div>}

                {activeTab === 'profile' && (
                  <div className="flex flex-col animate-in fade-in duration-300 flex-1">
                    
                    {/* Avatar & Info */}
                    <div className="flex items-center gap-6 pb-8">
                      <div className="w-[100px] h-[100px] rounded-full border-[4px] flex items-center justify-center overflow-hidden shrink-0" 
                           style={{ backgroundColor: AVATARS.find(a => a.id === formData.avatarId)?.color || '#3b82f6', borderColor: theme.bg, boxShadow: shadowDeepInset }}>
                        <User size={44} color="#ffffff" className="opacity-80" />
                      </div>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-3">
                          <h4 className="text-[26px] font-bold tracking-tight" style={{ color: theme.textMain }}>{user?.displayName || 'Sixteenonine1'}</h4>
                          <span className="bg-blue-600 text-white text-[11px] font-black px-2 py-0.5 rounded-md tracking-widest shadow-sm">PRO</span>
                        </div>
                        <div className="flex flex-col mt-1.5 opacity-70 text-[14px] font-medium" style={{ color: theme.textMain }}>
                          <span>เข้าร่วมเมื่อ 01/11/26</span>
                          <span>วันหมดอายุสมาชิก 05/12/26</span>
                        </div>
                      </div>
                    </div>

                    {/* Data List (จัดเรียงตามภาพ) */}
                    <div className="flex flex-col mt-2">
                      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-5 border-b ${dividerColor}`}>
                        <label className="text-[16px] font-medium opacity-90" style={{ color: theme.textMain }}>Username</label>
                        <span className="text-[16px] font-medium opacity-60 text-left sm:text-right" style={{ color: theme.textMain }}>{user?.username || 'Sixteenonine1'}</span>
                      </div>

                      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-5 border-b ${dividerColor}`}>
                        <label className="text-[16px] font-medium opacity-90" style={{ color: theme.textMain }}>รุ่น</label>
                        <div className="w-full sm:w-[280px] h-[52px] px-5 rounded-[11px] border border-white/5 flex items-center transition-all focus-within:border-blue-500/30" style={{ background: bg, boxShadow: shadowDeepInset }}>
                          <input type="text" className="w-full bg-transparent outline-none text-[15px] font-medium text-left sm:text-right" value={formData.generation} onChange={e => setFormData({...formData, generation: e.target.value})} style={{ color: theme.textMain }} />
                        </div>
                      </div>

                      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-5 border-b ${dividerColor}`}>
                        <label className="text-[16px] font-medium opacity-90" style={{ color: theme.textMain }}>มหาวิทยาลัยที่อยากเข้า</label>
                        <div className="w-full sm:w-[280px] h-[52px] px-5 rounded-[11px] border border-white/5 flex items-center transition-all focus-within:border-blue-500/30" style={{ background: bg, boxShadow: shadowDeepInset }}>
                          <input type="text" className="w-full bg-transparent outline-none text-[15px] font-medium text-left sm:text-right" value={formData.targetUni} onChange={e => setFormData({...formData, targetUni: e.target.value})} style={{ color: theme.textMain }} />
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-5">
                        <label className="text-[16px] font-medium opacity-90" style={{ color: theme.textMain }}>คณะที่อยากเข้า</label>
                        <div className="w-full sm:w-[280px] h-[52px] px-5 rounded-[11px] border border-white/5 flex items-center transition-all focus-within:border-blue-500/30" style={{ background: bg, boxShadow: shadowDeepInset }}>
                          <input type="text" className="w-full bg-transparent outline-none text-[15px] font-medium text-left sm:text-right" value={formData.targetFac} onChange={e => setFormData({...formData, targetFac: e.target.value})} style={{ color: theme.textMain }} />
                        </div>
                      </div>
                    </div>

                    {/* ปุ่ม Save Changes ไม่มีรหัสผ่าน */}
                    <div className="mt-auto pt-8 flex justify-end">
                      <button type="submit" disabled={loading} className="w-full sm:w-auto px-12 py-4 rounded-2xl font-black text-[13px] uppercase tracking-widest text-white shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2" style={{ background: 'linear-gradient(145deg, #3b82f6, #2563eb)' }}>
                        {loading ? <Loader2 className="animate-spin" size={18} /> : <><Save size={18} /> Save Changes</>}
                      </button>
                    </div>
                  </div>
                )}

                {activeTab === 'security' && (
                  <div className="flex flex-col animate-in fade-in duration-300 flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-5">
                      <label className="text-[16px] font-medium opacity-90" style={{ color: theme.textMain }}>ตั้งรหัสผ่านใหม่</label>
                      <div className="w-full sm:w-[280px] h-[52px] px-5 rounded-[11px] border border-white/5 flex items-center transition-all focus-within:border-blue-500/30" style={{ background: bg, boxShadow: shadowDeepInset }}>
                        <input type="password" placeholder="เว้นว่างได้ถ้าไม่เปลี่ยน" className="w-full bg-transparent outline-none text-[14px] text-left sm:text-right" value={formData.newPassword} onChange={e => setFormData({...formData, newPassword: e.target.value})} style={{ color: theme.textMain }} />
                      </div>
                    </div>

                    <div className="mt-auto pt-8 flex justify-end">
                      <button type="submit" disabled={loading} className="w-full sm:w-auto px-12 py-4 rounded-2xl font-black text-[13px] uppercase tracking-widest text-white shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2" style={{ background: 'linear-gradient(145deg, #3b82f6, #2563eb)' }}>
                        {loading ? <Loader2 className="animate-spin" size={18} /> : <><Save size={18} /> Update Password</>}
                      </button>
                    </div>
                  </div>
                )}

              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;