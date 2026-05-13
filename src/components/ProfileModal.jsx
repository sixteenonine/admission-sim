import React, { useState } from 'react';
import { X, Lock, User, Save, Loader2, Shield, Camera, Award, Calendar } from 'lucide-react';

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
  
  const [formData, setFormData] = useState({
    currentPassword: '',
    newUsername: user?.username || '',
    newPassword: '',
    targetUni: user?.target_uni || 'จุฬาลงกรณ์มหาวิทยาลัย',
    targetFac: user?.target_fac || 'ศึกษาศาสตร์',
    generation: user?.generation || 'DEK70',
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

  return (
    <div className="fixed inset-0 z-[350] flex items-center justify-center bg-transparent backdrop-blur-md px-4 animate-in fade-in duration-300">
      
      {/* กรอบนอกแบบเดียวกับ Settings (Padding 9px + shadowPlateau) */}
      <div className="w-full max-w-4xl rounded-[2.5rem] border border-white/30 relative" style={{ padding: '9px', boxShadow: shadowPlateau, background: bg }}>
        
        {/* กรอบในแบบเดียวกับ Settings (shadowOuter) */}
        <div className="w-full rounded-[2rem] p-6 sm:p-8 flex flex-col gap-6 border border-white/5" style={{ background: bg, boxShadow: shadowOuter }}>
          
          {/* Header สไตล์ Settings */}
          <div className="flex justify-between items-center px-2">
            <div>
              <h3 className="text-xl font-bold tracking-wide" style={{ color: theme.textMain }}>Account Profile</h3>
              <p className="text-xs font-medium opacity-60" style={{ color: theme.textSub }}>Manage your personal information and security</p>
            </div>
            <button onClick={onClose} className="w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-95 border border-white/5" style={{ background: raisedGradient, boxShadow: shadowPlateau, color: theme.textMain }}>
              <X size={18} />
            </button>
          </div>

          <div className="flex flex-col md:flex-row gap-8 min-h-[450px]">
            
            {/* Sidebar Left */}
            <div className="w-full md:w-60 flex flex-col gap-3 shrink-0">
              <button 
                onClick={() => setActiveTab('profile')}
                className={`flex items-center gap-4 w-full px-5 py-4 rounded-2xl text-[14px] font-bold transition-all duration-300 border border-white/5`}
                style={activeTab === 'profile' ? { background: indentedGradient, boxShadow: shadowDeepInset, color: '#3b82f6' } : { color: theme.textMain, background: 'transparent' }}
              >
                <User size={18} /> Profile
              </button>
              <button 
                onClick={() => setActiveTab('security')}
                className={`flex items-center gap-4 w-full px-5 py-4 rounded-2xl text-[14px] font-bold transition-all duration-300 border border-white/5`}
                style={activeTab === 'security' ? { background: indentedGradient, boxShadow: shadowDeepInset, color: '#3b82f6' } : { color: theme.textMain, background: 'transparent' }}
              >
                <Lock size={18} /> Security
              </button>
            </div>

            {/* Content Right */}
            <div className="flex-1 flex flex-col">
              <form onSubmit={handleSubmit} className="flex flex-col h-full">
                
                {error && <div className="p-3 mb-6 text-xs text-red-500 bg-red-500/10 rounded-xl border border-red-500/20 text-center font-bold">{error}</div>}
                {success && <div className="p-3 mb-6 text-xs text-emerald-500 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-center font-bold">{success}</div>}

                {activeTab === 'profile' && (
                  <div className="flex flex-col gap-6 animate-in fade-in duration-300 flex-1">
                    
                    {/* Avatar & Basic Info */}
                    <div className="flex items-center gap-6 pb-6 border-b border-white/5">
                      <div className="w-20 h-20 rounded-full border-[4px] flex items-center justify-center overflow-hidden shrink-0" 
                           style={{ backgroundColor: AVATARS.find(a => a.id === formData.avatarId)?.color || '#3b82f6', borderColor: theme.bg, boxShadow: shadowDeepInset }}>
                        <User size={32} color="#ffffff" className="opacity-80" />
                      </div>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xl font-bold" style={{ color: theme.textMain }}>{user?.displayName}</h4>
                          <span className="bg-green-500/20 text-green-500 text-[10px] font-black px-2 py-0.5 rounded-md tracking-widest">PRO</span>
                        </div>
                        <p className="text-xs opacity-50 font-bold uppercase tracking-wider" style={{ color: theme.textSub }}>@{user?.username}</p>
                      </div>
                    </div>

                    {/* Inputs */}
                    <div className="flex flex-col gap-6">
                      <div className="flex flex-col gap-2">
                        <label className="text-xs font-black uppercase tracking-widest opacity-60" style={{ color: theme.textSub }}>มหาลัยที่อยากเข้า</label>
                        <div className="w-full h-12 px-5 rounded-xl border border-white/5 flex items-center" style={{ background: indentedGradient, boxShadow: shadowDeepInset }}>
                          <input type="text" className="w-full bg-transparent outline-none text-sm font-bold" value={formData.targetUni} onChange={e => setFormData({...formData, targetUni: e.target.value})} style={{ color: theme.textMain }} />
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        <label className="text-xs font-black uppercase tracking-widest opacity-60" style={{ color: theme.textSub }}>คณะที่อยากเข้า</label>
                        <div className="w-full h-12 px-5 rounded-xl border border-white/5 flex items-center" style={{ background: indentedGradient, boxShadow: shadowDeepInset }}>
                          <input type="text" className="w-full bg-transparent outline-none text-sm font-bold" value={formData.targetFac} onChange={e => setFormData({...formData, targetFac: e.target.value})} style={{ color: theme.textMain }} />
                        </div>
                      </div>
                    </div>

                    <div className="mt-auto pt-6 flex justify-end">
                      <button type="submit" disabled={loading} className="px-10 py-4 rounded-2xl font-black text-[12px] uppercase tracking-widest text-white shadow-lg transition-all active:scale-95 flex items-center gap-2" style={{ background: 'linear-gradient(145deg, #3b82f6, #2563eb)' }}>
                        {loading ? <Loader2 className="animate-spin" size={16} /> : <><Save size={16} /> Save Changes</>}
                      </button>
                    </div>
                  </div>
                )}

                {activeTab === 'security' && (
                  <div className="flex flex-col gap-6 animate-in fade-in duration-300 flex-1">
                    <p className="text-sm font-bold opacity-70" style={{ color: theme.textMain }}>เปลี่ยนรหัสผ่านหรือตั้งคำถามความปลอดภัยใหม่</p>
                    {/* Add Security fields here similar to Settings layout if needed */}
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