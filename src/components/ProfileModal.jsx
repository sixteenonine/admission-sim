import React, { useState } from 'react';
import { X, User, Save, Loader2, Edit3, CreditCard, RefreshCw } from 'lucide-react';

const AVATARS = [
  { id: 1, color: '#3b82f6' }, { id: 2, color: '#10b981' }, 
  { id: 3, color: '#8b5cf6' }, { id: 4, color: '#f43f5e' }, 
  { id: 5, color: '#f97316' }, { id: 6, color: '#14b8a6' }
];

const ProfileModal = ({ isOpen, onClose, user, themeVals }) => {
  const [activeTab, setActiveTab] = useState('profile');
  const [editingField, setEditingField] = useState(null);
  const [loading, setLoading] = useState(false);
  const [qrLoading, setQrLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [formData, setFormData] = useState({
    generation: user?.generation || 'DEK70',
    targetUni: user?.target_uni || 'จุฬาลงกรณ์มหาวิทยาลัย',
    targetFac: user?.target_fac || 'ศึกษาศาสตร์',
    avatarId: user?.avatar_id || 1
  });

  const [qrData, setQrData] = useState(null); // เก็บข้อมูลรูป QR Code
  const { bg, theme, shadowPlateau, shadowOuter, raisedGradient, shadowDeepInset } = themeVals;

  if (!isOpen) return null;

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('th-TH', { year: '2-digit', month: '2-digit', day: '2-digit' });
  };

  const getTierColor = (tier) => {
    if(tier === 'premium') return 'bg-[#8b5cf6]';
    if(tier === 'pro') return 'bg-[#3b82f6]';
    if(tier === 'standard') return 'bg-[#10b981]';
    return 'bg-gray-400';
  };

  // ฟังก์ชันอัปเดตข้อมูลส่วนตัว (เรียก API เดิมของคุณ)
  const handleSubmitProfile = async (e) => {
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
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.message || 'เกิดข้อผิดพลาด');
      }
    } catch (err) {
      setError('การเชื่อมต่อล้มเหลว');
    } finally {
      setLoading(false);
    }
  };

  // ฟังก์ชันสร้าง QR Code
  const handleCreatePayment = async (tier, amount) => {
    setQrLoading(true); setError('');
    try {
      const res = await fetch('/api/payment/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, amount, planTier: tier })
      });
      const data = await res.json();
      if(data.status === 'success') {
         setQrData({ image: data.qrImage, amount, tier });
      } else {
         setError(data.message || 'สร้างรายการชำระเงินไม่สำเร็จ');
      }
    } catch(err) {
      setError('เชื่อมต่อระบบชำระเงินล้มเหลว');
    } finally {
      setQrLoading(false);
    }
  };

  // ฟังก์ชันเช็คสถานะหลังโอน (ใช้วิธีรีเฟรชหน้าเว็บให้ระบบดึงข้อมูล User ใหม่)
  const handleCheckStatus = () => {
     window.location.reload();
  };

  return (
    <div className="fixed inset-0 z-[350] flex items-center justify-center bg-black/40 backdrop-blur-md px-4 animate-in fade-in duration-300">
      
      {/* ---------------- QR Code Overlay Pop-up ---------------- */}
      {qrData && (
        <div className="absolute inset-0 z-[400] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-sm rounded-[2rem] p-8 flex flex-col items-center text-center relative border border-white/20 shadow-2xl" style={{ background: bg }}>
            <button onClick={() => setQrData(null)} className="absolute top-5 right-5 w-8 h-8 rounded-full flex items-center justify-center bg-black/5 active:scale-95 transition-all" style={{ color: theme.textMain }}>
              <X size={16} />
            </button>
            <h3 className="text-xl font-bold mb-1" style={{ color: theme.textMain }}>ชำระเงินผ่าน PromptPay</h3>
            <p className="text-[13px] font-medium opacity-60 mb-6 uppercase tracking-widest" style={{ color: theme.textMain }}>แพ็กเกจ {qrData.tier}</p>
            
            <div className="w-48 h-48 bg-white p-2 rounded-xl mb-6 shadow-md border border-gray-200">
              <img src={qrData.image} alt="PromptPay QR" className="w-full h-full object-contain" />
            </div>

            <div className="text-[14px] opacity-80 mb-1" style={{ color: theme.textMain }}>ยอดที่ต้องชำระ</div>
            <div className="text-3xl font-black mb-8 text-[#3b82f6]">฿{qrData.amount}</div>

            <button onClick={handleCheckStatus} className="w-full py-4 rounded-xl font-bold text-[14px] text-white shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all" style={{ background: '#10b981' }}>
              <RefreshCw size={16} /> ตรวจสอบการชำระเงิน
            </button>
            <p className="text-[11px] opacity-50 mt-4" style={{ color: theme.textMain }}>*กรุณากดตรวจสอบหลังจากโอนเงินสำเร็จ</p>
          </div>
        </div>
      )}
      {/* -------------------------------------------------------- */}

      <div className="w-full max-w-4xl rounded-[2.5rem] border border-white/30 relative" style={{ padding: '9px', boxShadow: shadowPlateau, background: bg }}>
        <div className="w-full rounded-[2rem] p-6 sm:p-8 flex flex-col gap-8 border border-white/5" style={{ background: bg, boxShadow: shadowOuter }}>
          
          <div className="flex justify-between items-center px-2">
            <h3 className="text-2xl font-bold tracking-wide" style={{ color: theme.textMain }}>Account Settings</h3>
            <button onClick={onClose} className="w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-95 border border-white/5" style={{ background: raisedGradient, boxShadow: shadowPlateau, color: theme.textMain }}>
              <X size={18} />
            </button>
          </div>

          <div className="flex flex-col md:flex-row gap-8 min-h-[450px]">
            
            {/* Sidebar Left */}
            <div className="w-full md:w-64 flex flex-col gap-2 shrink-0">
              <button 
                onClick={() => { setActiveTab('profile'); setError(''); setSuccess(''); }}
                className={`flex items-center gap-4 w-full px-5 h-[52px] rounded-[11px] text-[15px] font-bold transition-all duration-300 border border-white/5`}
                style={activeTab === 'profile' ? { background: bg, boxShadow: shadowDeepInset, color: '#3b82f6' } : { color: theme.textMain, background: 'transparent', borderColor: 'transparent' }}
              >
                <User size={18} /> Profile Settings
              </button>
              <button 
                onClick={() => { setActiveTab('subscription'); setError(''); setSuccess(''); }}
                className={`flex items-center gap-4 w-full px-5 h-[52px] rounded-[11px] text-[15px] font-bold transition-all duration-300 border border-white/5`}
                style={activeTab === 'subscription' ? { background: bg, boxShadow: shadowDeepInset, color: '#3b82f6' } : { color: theme.textMain, background: 'transparent', borderColor: 'transparent' }}
              >
                <CreditCard size={18} /> Subscription
              </button>
            </div>

            {/* Content Right */}
            <div className="flex-1 flex flex-col pl-0 md:pl-4">
              
              {error && <div className="p-3 mb-6 text-[13px] text-red-500 bg-red-500/10 rounded-xl border border-red-500/20 text-center font-bold">{error}</div>}
              {success && <div className="p-3 mb-6 text-[13px] text-emerald-500 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-center font-bold">{success}</div>}

              {/* ---------------- Profile Tab ---------------- */}
              {activeTab === 'profile' && (
                <form onSubmit={handleSubmitProfile} className="flex flex-col animate-in fade-in duration-300 flex-1">
                  <div className="flex items-center gap-6 pb-8">
                    <div className="w-[100px] h-[100px] rounded-full border-[4px] flex items-center justify-center overflow-hidden shrink-0" style={{ backgroundColor: AVATARS.find(a => a.id === formData.avatarId)?.color || '#3b82f6', borderColor: theme.bg, boxShadow: shadowDeepInset }}>
                      <User size={44} color="#ffffff" className="opacity-80" />
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-3">
                        <h4 className="text-[26px] font-bold tracking-tight" style={{ color: theme.textMain }}>{user?.displayName || 'User'}</h4>
                        <span className={`text-white text-[11px] font-black px-2 py-0.5 rounded-md tracking-widest uppercase shadow-sm ${getTierColor(user?.plan_tier)}`}>
                          {user?.plan_tier || 'COMMON'}
                        </span>
                      </div>
                      <div className="flex flex-col mt-1.5 opacity-70 text-[14px] font-medium" style={{ color: theme.textMain }}>
                        <span>อีเมล: {user?.email || '-'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-0 mt-2">
                    {[
                      { key: 'generation', label: 'รุ่น' },
                      { key: 'targetUni', label: 'มหาวิทยาลัยที่อยากเข้า' },
                      { key: 'targetFac', label: 'คณะที่อยากเข้า' }
                    ].map((field) => (
                      <div key={field.key} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-1 group">
                        <label className="text-[15px] font-medium opacity-90 pl-2" style={{ color: theme.textMain }}>{field.label}</label>
                        {editingField === field.key ? (
                          <div className="w-full sm:w-[280px] h-[52px] px-5 rounded-[11px] border border-white/5 flex items-center transition-all focus-within:border-blue-500/30" style={{ background: bg, boxShadow: shadowDeepInset }}>
                            <input autoFocus type="text" className="w-full bg-transparent outline-none text-[15px] font-medium text-left sm:text-right" value={formData[field.key]} onChange={e => setFormData({...formData, [field.key]: e.target.value})} onBlur={() => setEditingField(null)} onKeyDown={(e) => e.key === 'Enter' && setEditingField(null)} style={{ color: theme.textMain }} />
                          </div>
                        ) : (
                          <div className="w-full sm:w-[280px] h-[52px] px-2 flex items-center justify-start sm:justify-end gap-3 cursor-pointer" onClick={() => setEditingField(field.key)}>
                            <span className="text-[15px] font-medium opacity-60 transition-opacity group-hover:opacity-100" style={{ color: theme.textMain }}>{formData[field.key] || '-'}</span>
                            <Edit3 size={14} className="opacity-0 group-hover:opacity-40 transition-opacity" style={{ color: theme.textMain }} />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="mt-auto pt-8 flex justify-end">
                    <button type="submit" disabled={loading} className="w-full sm:w-auto px-12 py-4 rounded-2xl font-black text-[13px] uppercase tracking-widest text-white shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2" style={{ background: 'linear-gradient(145deg, #3b82f6, #2563eb)' }}>
                      {loading ? <Loader2 className="animate-spin" size={18} /> : <><Save size={18} /> Save Changes</>}
                    </button>
                  </div>
                </form>
              )}

              {/* ---------------- Subscription Tab ---------------- */}
              {activeTab === 'subscription' && (
                <div className="flex flex-col animate-in fade-in duration-300 flex-1">
                  
                  {/* Status Banner */}
                  <div className="p-6 rounded-[1.5rem] border border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 mb-6" style={{ background: bg, boxShadow: shadowDeepInset }}>
                     <div>
                        <div className="text-[13px] font-medium opacity-70 mb-1" style={{ color: theme.textMain }}>สถานะปัจจุบัน</div>
                        <div className="flex items-center gap-3">
                           <span className="text-xl font-bold uppercase" style={{ color: theme.textMain }}>{user?.plan_tier || 'COMMON'}</span>
                           {user?.plan_tier !== 'common' && <span className={`text-white text-[10px] font-bold px-2 py-1 rounded uppercase ${getTierColor(user?.plan_tier)}`}>Active</span>}
                        </div>
                     </div>
                     <div className="text-left sm:text-right">
                        <div className="text-[13px] font-medium opacity-70 mb-1" style={{ color: theme.textMain }}>วันหมดอายุ</div>
                        <div className="text-lg font-bold" style={{ color: theme.textMain }}>{user?.plan_expire_at ? formatDate(user.plan_expire_at) : '-'}</div>
                     </div>
                  </div>

                  {/* Pricing Cards */}
                  <h4 className="text-[15px] font-bold mb-4 ml-2" style={{ color: theme.textMain }}>เลือกแพ็กเกจ</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                     
                     <div className="rounded-[1.5rem] p-5 flex flex-col items-center text-center border border-white/5 transition-transform hover:-translate-y-1" style={{ background: bg, boxShadow: shadowPlateau }}>
                        <h4 className="text-[15px] font-bold tracking-widest mb-1 text-[#10b981]">STANDARD</h4>
                        <p className="text-[12px] opacity-60 mb-4" style={{ color: theme.textMain }}>ใช้งาน 30 วัน</p>
                        <div className="text-2xl font-black mb-6" style={{ color: theme.textMain }}>฿69</div>
                        <button disabled={qrLoading} onClick={() => handleCreatePayment('standard', 69)} className="w-full py-3 mt-auto rounded-xl font-bold text-[12px] text-white transition-all active:scale-95 disabled:opacity-50" style={{ background: '#10b981' }}>เลือกแพ็กเกจ</button>
                     </div>

                     <div className="rounded-[1.5rem] p-5 flex flex-col items-center text-center border-2 border-[#3b82f6] transition-transform hover:-translate-y-1 relative" style={{ background: bg, boxShadow: shadowOuter }}>
                        <div className="absolute -top-3 bg-[#3b82f6] text-white text-[10px] font-bold px-3 py-1 rounded-full tracking-widest">POPULAR</div>
                        <h4 className="text-[15px] font-bold tracking-widest mb-1 mt-2 text-[#3b82f6]">PRO</h4>
                        <p className="text-[12px] opacity-60 mb-4" style={{ color: theme.textMain }}>ใช้งาน 90 วัน</p>
                        <div className="text-2xl font-black mb-6" style={{ color: theme.textMain }}>฿129</div>
                        <button disabled={qrLoading} onClick={() => handleCreatePayment('pro', 129)} className="w-full py-3 mt-auto rounded-xl font-bold text-[12px] text-white shadow-lg shadow-blue-500/30 transition-all active:scale-95 disabled:opacity-50" style={{ background: '#3b82f6' }}>เลือกแพ็กเกจ</button>
                     </div>

                     <div className="rounded-[1.5rem] p-5 flex flex-col items-center text-center border border-white/5 transition-transform hover:-translate-y-1" style={{ background: bg, boxShadow: shadowPlateau }}>
                        <h4 className="text-[15px] font-bold tracking-widest mb-1 text-[#8b5cf6]">PREMIUM</h4>
                        <p className="text-[12px] opacity-60 mb-4" style={{ color: theme.textMain }}>ใช้งาน 365 วัน</p>
                        <div className="text-2xl font-black mb-6" style={{ color: theme.textMain }}>฿420</div>
                        <button disabled={qrLoading} onClick={() => handleCreatePayment('premium', 420)} className="w-full py-3 mt-auto rounded-xl font-bold text-[12px] text-white transition-all active:scale-95 disabled:opacity-50" style={{ background: '#8b5cf6' }}>เลือกแพ็กเกจ</button>
                     </div>

                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;