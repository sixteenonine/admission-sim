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
  
  // เพิ่มฟิลด์ใหม่: มหาลัย, คณะ, รุ่น
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
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 sm:p-8 animate-in fade-in duration-500" style={{ background: bg, fontFamily: "'Outfit', 'Prompt', sans-serif" }}>
      
      {/* หน้าต่างหลัก (Layout แบบสากล) */}
      <div className="w-full max-w-5xl flex flex-col gap-8 relative animate-in zoom-in-95 duration-500">
        
        {/* Header ส่วนบนสุด */}
        <div className="flex items-center justify-between px-4">
          <h1 className="text-[28px] font-bold tracking-tight" style={{ color: theme.textMain }}>Account Settings</h1>
          <button onClick={onClose} className="w-11 h-11 flex items-center justify-center rounded-full transition-all active:scale-90 border border-white/5" style={{ background: raisedGradient, boxShadow: shadowPlateau, color: theme.textMain }}>
            <X size={20} />
          </button>
        </div>

        <div className="flex flex-col md:flex-row gap-8 min-h-[600px]">
          
          {/* ซ้าย: Sidebar Navigation */}
          <div className="w-full md:w-72 flex flex-col gap-4">
            <div className="p-4 rounded-[2.5rem] flex flex-col gap-3 border border-white/5" style={{ background: raisedGradient, boxShadow: shadowOuter }}>
              <button 
                onClick={() => setActiveTab('profile')}
                className={`flex items-center gap-4 w-full px-6 py-4 rounded-3xl text-[14px] font-bold transition-all duration-300 border border-white/5`}
                style={activeTab === 'profile' ? { background: indentedGradient, boxShadow: shadowDeepInset, color: '#3b82f6' } : { color: theme.textMain, background: 'transparent' }}
              >
                <User size={18} /> Profile Settings
              </button>
              <button 
                onClick={() => setActiveTab('security')}
                className={`flex items-center gap-4 w-full px-6 py-4 rounded-3xl text-[14px] font-bold transition-all duration-300 border border-white/5`}
                style={activeTab === 'security' ? { background: indentedGradient, boxShadow: shadowDeepInset, color: '#3b82f6' } : { color: theme.textMain, background: 'transparent' }}
              >
                <Lock size={18} /> Password & Security
              </button>
            </div>
          </div>

          {/* ขวา: Main Content Area */}
          <div className="flex-1 p-10 rounded-[3rem] border border-white/5 flex flex-col relative" style={{ background: raisedGradient, boxShadow: shadowOuter }}>
            
            <form onSubmit={handleSubmit} className="flex flex-col gap-10">
              
              {activeTab === 'profile' && (
                <div className="flex flex-col gap-10 animate-in fade-in duration-500">
                  
                  {/* Hero Profile Section */}
                  <div className="flex flex-col sm:flex-row items-center gap-8 border-b border-white/5 pb-10">
                    <div className="relative group">
                      <div className="w-28 h-28 rounded-full border-[6px] flex items-center justify-center overflow-hidden transition-transform duration-500 group-hover:scale-105" 
                           style={{ backgroundColor: AVATARS.find(a => a.id === formData.avatarId)?.color || '#3b82f6', borderColor: theme.bg, boxShadow: shadowPlateau }}>
                        <User size={48} color="#ffffff" className="opacity-80" />
                      </div>
                      <div className="absolute inset-0 flex flex-wrap gap-1 p-1 opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 rounded-full">
                         {AVATARS.map(av => (
                           <button key={av.id} type="button" onClick={() => setFormData({...formData, avatarId: av.id})} className="w-6 h-6 rounded-full border border-white/50" style={{background: av.color}} />
                         ))}
                      </div>
                    </div>

                    <div className="flex flex-col text-center sm:text-left gap-1">
                      <div className="flex items-center justify-center sm:justify-start gap-3">
                        <h2 className="text-[32px] font-bold tracking-tight" style={{ color: theme.textMain }}>{user?.displayName || 'Sixteenonine1'}</h2>
                        <span className="bg-blue-500 text-white text-[11px] font-black px-2 py-0.5 rounded-md shadow-[0_0_10px_rgba(59,130,246,0.5)]">PRO</span>
                      </div>
                      <div className="flex flex-col opacity-60 text-[13px] font-medium" style={{ color: theme.textSub }}>
                        <div className="flex items-center gap-2 justify-center sm:justify-start">
                          <Calendar size={14} /> เข้าร่วมเมื่อ 01/11/26
                        </div>
                        <div className="flex items-center gap-2 justify-center sm:justify-start">
                          <Award size={14} /> วันหมดอายุสมาชิก 05/12/26
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Info Grid (สไตล์แบบสากล) */}
                  <div className="grid grid-cols-1 gap-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-2">
                      <label className="text-[15px] font-bold opacity-80" style={{ color: theme.textMain }}>Username</label>
                      <span className="text-[15px] opacity-60" style={{ color: theme.textMain }}>{user?.username || 'Sixteenonine'}</span>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-2">
                      <label className="text-[15px] font-bold opacity-80" style={{ color: theme.textMain }}>รุ่น</label>
                      <div className="w-full sm:w-72 h-11 px-5 rounded-2xl border border-white/5 flex items-center" style={{ background: indentedGradient, boxShadow: shadowDeepInset }}>
                        <input type="text" className="w-full bg-transparent outline-none text-[14px] font-bold" value={formData.generation} onChange={e => setFormData({...formData, generation: e.target.value})} style={{ color: theme.textMain }} />
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-2">
                      <label className="text-[15px] font-bold opacity-80" style={{ color: theme.textMain }}>มหาวิทยาลัยที่อยากเข้า</label>
                      <div className="w-full sm:w-72 h-11 px-5 rounded-2xl border border-white/5 flex items-center" style={{ background: indentedGradient, boxShadow: shadowDeepInset }}>
                        <input type="text" className="w-full bg-transparent outline-none text-[14px] font-bold" value={formData.targetUni} onChange={e => setFormData({...formData, targetUni: e.target.value})} style={{ color: theme.textMain }} />
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-2">
                      <label className="text-[15px] font-bold opacity-80" style={{ color: theme.textMain }}>คณะที่อยากเข้า</label>
                      <div className="w-full sm:w-72 h-11 px-5 rounded-2xl border border-white/5 flex items-center" style={{ background: indentedGradient, boxShadow: shadowDeepInset }}>
                        <input type="text" className="w-full bg-transparent outline-none text-[14px] font-bold" value={formData.targetFac} onChange={e => setFormData({...formData, targetFac: e.target.value})} style={{ color: theme.textMain }} />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'security' && (
                <div className="flex flex-col gap-8 animate-in fade-in duration-500">
                  <div className="flex items-center gap-3">
                    <Shield className="text-blue-500" size={24} />
                    <h2 className="text-xl font-bold" style={{ color: theme.textMain }}>Password & Security</h2>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-6 max-w-md">
                     <div className="flex flex-col gap-2.5">
                       <label className="text-sm font-bold opacity-70" style={{ color: theme.textMain }}>รหัสผ่านใหม่ (เว้นว่างได้)</label>
                       <div className="flex items-center px-5 h-[52px] rounded-2xl border border-white/5" style={{ background: indentedGradient, boxShadow: shadowDeepInset }}>
                         <input type="password" placeholder="••••••••" className="w-full bg-transparent outline-none text-[14px]" value={formData.newPassword} onChange={e => setFormData({...formData, newPassword: e.target.value})} style={{ color: theme.textMain }} />
                       </div>
                     </div>
                  </div>
                </div>
              )}

              {/* Footer Section: Save Button */}
              <div className="mt-auto pt-10 flex flex-col gap-4">
                {error && <p className="text-xs text-red-500 font-bold px-2">{error}</p>}
                {success && <p className="text-xs text-emerald-500 font-bold px-2">{success}</p>}
                
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <div className="flex-1 w-full sm:w-auto h-[52px] px-5 rounded-2xl border border-red-500/20 flex items-center" style={{ background: indentedGradient, boxShadow: shadowDeepInset }}>
                    <Lock className="mr-3 text-red-500/50" size={16} />
                    <input type="password" required className="w-full bg-transparent outline-none text-[14px] placeholder:text-red-500/30" placeholder="รหัสผ่านปัจจุบันเพื่อบันทึก..." value={formData.currentPassword} onChange={e => setFormData({...formData, currentPassword: e.target.value})} style={{ color: theme.textMain }} />
                  </div>
                  <button type="submit" disabled={loading} className="w-full sm:w-48 h-[52px] rounded-2xl font-black text-[13px] uppercase tracking-widest text-white shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2" style={{ background: 'linear-gradient(145deg, #3b82f6, #2563eb)' }}>
                    {loading ? <Loader2 className="animate-spin" size={18} /> : <><Save size={18} /> Save Changes</>}
                  </button>
                </div>
              </div>

            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;