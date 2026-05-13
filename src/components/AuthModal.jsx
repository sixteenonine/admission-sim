import React, { useState } from 'react';
import { X, Eye, EyeOff, Loader2, Check, ChevronDown } from 'lucide-react';
import ForgotPassword from './ForgotPassword';

const SECURITY_QUESTIONS = [
  { id: 1, text: "สัตว์เลี้ยงตัวแรกของคุณชื่ออะไร?" },
  { id: 2, text: "ชื่อโรงเรียนประถมของคุณคืออะไร?" },
  { id: 3, text: "จังหวัดที่คุณเกิดคือจังหวัดอะไร?" },
  { id: 4, text: "ชื่อเล่นของแม่คุณคืออะไร?" }
];

const AuthModal = ({ isOpen, onClose, onLoginSuccess, themeVals }) => {
  const [view, setView] = useState('login'); // 'login' | 'register' | 'register_success' | 'forgot'
  const [regStep, setRegStep] = useState(1); // 1: User/Pass, 2: Security Question
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    securityQuestionId: 1,
    securityAnswer: ''
  });

  const { bg, theme, shadowPlateau, raisedGradient, shadowDeepInset, indentedGradient } = themeVals;

  if (!isOpen) return null;
  
  const isPassInvalid = view === 'register' && formData.password.length > 0 && formData.password.length < 8;
  const isConfirmInvalid = view === 'register' && formData.confirmPassword.length > 0 && formData.password !== formData.confirmPassword;
  const isUserInvalid = error.includes('Username') || error.includes('ระบบแล้ว') || error.includes('ไม่ถูกต้อง');
  const isPassError = error.includes('Password ไม่ถูกต้อง');
  const isAnswerInvalid = error.includes('คำตอบ');

  const isSubmitDisabled = loading || 
    (view === 'login' && (!formData.username.trim() || !formData.password)) ||
    (view === 'register' && regStep === 1 && (!formData.username.trim() || !formData.password || !formData.confirmPassword || isPassInvalid || isConfirmInvalid)) ||
    (view === 'register' && regStep === 2 && (!formData.securityQuestionId || !formData.securityAnswer.trim()));
  
    // จัดการการกดปุ่มในหน้า Register
  const handleRegisterFlow = async (e) => {
    e.preventDefault();
    setError('');

    if (regStep === 1) {
      if (formData.password.length < 8) {
        setError('รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร');
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setError('รหัสผ่านไม่ตรงกัน');
        return;
      }
      
      setLoading(true);
      try {
        const res = await fetch('/api/auth/check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: formData.username })
        });
        const data = await res.json();
        if (data.status === 'error') {
           setError(data.message);
           return;
        }
        setRegStep(2);
      } catch (err) {
        setError('เกิดข้อผิดพลาดในการตรวจสอบ Username');
        return;
      } finally {
        setLoading(false);
      }
    } else {
      // ส่งข้อมูลสมัครสมาชิกจริง
      if (!formData.securityAnswer.trim()) {
        setError('กรุณากรอกคำตอบความปลอดภัย');
        return;
      }
      handleFinalRegister();
    }
  };

  const handleFinalRegister = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          username: formData.username, 
          password: formData.password, 
          displayName: formData.username,
          securityQuestionId: formData.securityQuestionId,
          securityAnswer: formData.securityAnswer
        })
      });
      const data = await res.json();
      if (data.status === 'success') {
        setView('register_success');
      } else {
        setError(data.message);
        setRegStep(1); // ส่งกลับไปแก้ถ้า Username ซ้ำ
      }
    } catch (err) {
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: formData.username, password: formData.password })
      });
      const data = await res.json();
      if (data.status === 'success') {
        onLoginSuccess(data.user);
        onClose();
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Username หรือ Password ไม่ถูกต้อง');
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchView = (newView) => {
    setError('');
    setRegStep(1);
    setFormData({ username: '', password: '', confirmPassword: '', securityQuestionId: 1, securityAnswer: '' });
    setView(newView);
  };

  return (
    <div className="fixed inset-0 z-[500] w-full h-full flex flex-col items-center justify-center transition-colors duration-300" style={{ background: bg, fontFamily: "'Outfit', 'Prompt', sans-serif" }}>
      
      <style>{`
        @keyframes smoothFade {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
        .view-transition {
          animation: smoothFade 0.4s ease-out forwards;
        }
      `}</style>

      <button onClick={onClose} className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center rounded-full opacity-50 hover:opacity-100 transition-opacity z-50" style={{ color: theme.textMain }}>
        <X size={24} />
      </button>

      <div className="w-full max-w-[460px] flex flex-col px-6">
        <div key={`${view}-${regStep}`} className="flex flex-col gap-5 view-transition">
          
          {view === 'forgot' && <ForgotPassword onBack={() => handleSwitchView('login')} themeVals={themeVals} />}

          {view === 'register_success' && (
            <div className="flex flex-col items-center text-center py-8">
              <div className="w-20 h-20 rounded-full border-[3px] border-green-600 text-green-600 flex items-center justify-center mb-6">
                <Check size={40} strokeWidth={3} />
              </div>
              <h1 className="text-[32px] font-light tracking-wide mb-2" style={{ color: theme.textMain }}>ยินดีต้อนรับ</h1>
              <h2 className="text-[24px] font-medium uppercase mb-6" style={{ color: theme.textMain }}>{formData.username}</h2>
              <p className="text-[15px] font-medium opacity-80 mb-8" style={{ color: theme.textMain }}>สร้างบัญชีสำเร็จ</p>
              <button onClick={() => handleSwitchView('login')} className="w-full h-[54px] rounded-md font-bold text-[15px] border border-white/10" style={{ background: '#007bff', color: '#ffffff', boxShadow: shadowPlateau }}>Home</button>
            </div>
          )}

          {(view === 'login' || view === 'register') && (
            <>
              <div className="flex flex-col items-start text-left mb-2 w-full">
                <h1 className="text-[32px] font-light tracking-wide" style={{ color: theme.textMain }}>
                  {view === 'login' ? 'ยินดีต้อนรับ' : (regStep === 1 ? 'สร้างบัญชี' : 'ตั้งคำถามกู้คืนรหัสผ่าน')}
                </h1>
                {view === 'login' && <h2 className="text-[25px] font-medium italic opacity-100 -mt-1" style={{ color: theme.textMain }}>DEK70</h2>}
              </div>

              {error && <div className="p-3 text-[13px] font-bold rounded-md border border-red-500/30 text-red-500 bg-red-500/10 text-center">{error}</div>}

              <form onSubmit={view === 'login' ? handleLoginSubmit : handleRegisterFlow} className="flex flex-col gap-5">
                
                {/* หน้า Login หรือ Register Step 1 */}
                { (view === 'login' || (view === 'register' && regStep === 1)) && (
                  <>
                    <div className="flex flex-col gap-2">
                      <label className="text-[14px] font-medium opacity-90" style={{ color: theme.textMain }}>Username</label>
                      <div className={`flex items-center px-4 h-[52px] rounded-md border transition-all ${isUserInvalid ? 'border-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]' : 'border-gray-400/80 focus-within:border-[#007bff] focus-within:shadow-[0_0_8px_rgba(0,123,255,0.2)]'}`} style={{ background: '#d3d7da50', boxShadow: shadowDeepInset }}>
                        <input type="text" required className="w-full bg-transparent outline-none text-[15px] font-medium" value={formData.username} onChange={(e) => setFormData({...formData, username: e.target.value})} style={{ color: theme.textMain }} />
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-[14px] font-medium opacity-90" style={{ color: theme.textMain }}>Password</label>
                      <div className={`flex items-center px-4 h-[52px] rounded-md border transition-all ${(isPassInvalid || isPassError) ? 'border-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]' : 'border-gray-400/80 focus-within:border-[#007bff] focus-within:shadow-[0_0_8px_rgba(0,123,255,0.2)]'}`} style={{ background: '#d3d7da50', boxShadow: shadowDeepInset }}>
                        <input type={showPassword ? "text" : "password"} required className="w-full bg-transparent outline-none text-[15px] font-medium" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} style={{ color: theme.textMain }} />
                        <button type="button" onPointerDown={(e) => e.preventDefault()} onClick={(e) => { e.preventDefault(); setShowPassword(!showPassword); }} className="ml-2 opacity-40 hover:opacity-100 transition-opacity">
                          {showPassword ? <EyeOff key="hide" size={18} /> : <Eye key="show" size={18} />}
                        </button>
                      </div>
                    </div>
                  </>
                )}

                {/* หน้า Register Step 1 เท่านั้น (Confirm Pass) */}
                {view === 'register' && regStep === 1 && (
                  <div className="flex flex-col gap-2">
                    <label className="text-[14px] font-medium opacity-90" style={{ color: theme.textMain }}>Confirm Password</label>
                    <div className={`flex items-center px-4 h-[52px] rounded-md border transition-all ${isConfirmInvalid ? 'border-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]' : 'border-gray-400/80 focus-within:border-[#007bff] focus-within:shadow-[0_0_8px_rgba(0,123,255,0.2)]'}`} style={{ background: '#d3d7da50', boxShadow: shadowDeepInset }}>
                      <input type={showConfirmPassword ? "text" : "password"} required className="w-full bg-transparent outline-none text-[15px] font-medium" value={formData.confirmPassword} onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})} style={{ color: theme.textMain }} />
                      <button type="button" onPointerDown={(e) => e.preventDefault()} onClick={(e) => { e.preventDefault(); setShowConfirmPassword(!showConfirmPassword); }} className="ml-2 opacity-40 hover:opacity-100 transition-opacity">
                        {showConfirmPassword ? <EyeOff key="hide-conf" size={18} /> : <Eye key="show-conf" size={18} />}
                      </button>
                    </div>
                    <p className={`text-[12px] font-light mt-1.5 transition-colors duration-300 ${isPassInvalid ? 'text-red-500 font-medium' : ''}`} style={{ fontFamily: "'Prompt', sans-serif", color: isPassInvalid ? '#ef4444' : theme.textMain, opacity: isPassInvalid ? 1 : 0.6 }}>* ต้องมีไม่ต่ำกว่า 8 ตัวอักษร</p>
                  </div>
                )}

                {/* หน้า Register Step 2 เท่านั้น (Security Questions) */}
                {view === 'register' && regStep === 2 && (
                  <div className="flex flex-col gap-5">
                    <div className="flex flex-col gap-2">
                      <label className="text-[14px] font-medium opacity-90" style={{ color: theme.textMain }}>Question</label>
                      <div className="relative flex items-center px-4 h-[52px] rounded-md border border-gray-500 transition-all" style={{ background: indentedGradient, boxShadow: shadowDeepInset }}>
                        <select className="w-full bg-transparent outline-none text-[15px] font-medium appearance-none cursor-pointer" value={formData.securityQuestionId} onChange={(e) => setFormData({...formData, securityQuestionId: parseInt(e.target.value)})} style={{ color: theme.textMain }}>
                          {SECURITY_QUESTIONS.map(q => <option key={q.id} value={q.id} className="text-black">{q.text}</option>)}
                        </select>
                        <ChevronDown size={18} className="absolute right-4 pointer-events-none opacity-40" style={{ color: theme.textMain }} />
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-[14px] font-medium opacity-90" style={{ color: theme.textMain }}>Answer</label>
                      <div className={`flex items-center px-4 h-[52px] rounded-md border transition-all ${isAnswerInvalid ? 'border-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]' : 'border-gray-400/80 focus-within:border-[#007bff] focus-within:shadow-[0_0_8px_rgba(0,123,255,0.2)]'}`} style={{ background: '#d3d7da50', boxShadow: shadowDeepInset }}>
                        <input type="text" required className="w-full bg-transparent outline-none text-[15px] font-medium" value={formData.securityAnswer} onChange={(e) => setFormData({...formData, securityAnswer: e.target.value})} style={{ color: theme.textMain }} />
                      </div>
                    </div>
                  </div>
                )}

                <button type="submit" disabled={isSubmitDisabled} className={`w-full mt-2 h-[54px] rounded-md font-bold text-[15px] transition-all flex items-center justify-center gap-2 border border-white/10 ${isSubmitDisabled ? 'opacity-50 cursor-not-allowed' : 'active:scale-[0.98]'}`} style={{ background: '#007bff', color: '#ffffff', boxShadow: shadowPlateau }}>
                  {loading && <Loader2 className="animate-spin" size={18} />}
                  {view === 'login' ? 'Sign in' : (regStep === 1 ? 'Next' : 'Create Account')}
                </button>
              </form>

              {view === 'login' && (
                <div className="text-center mt-1">
                  <button onClick={() => handleSwitchView('forgot')} className="text-[14px] font-medium opacity-80 hover:opacity-100 transition-opacity" style={{ color: theme.textMain }}>ลืมรหัสผ่าน?</button>
                </div>
              )}

              <div className="flex items-center gap-4 my-2">
                <div className="flex-1 h-[1px] opacity-20" style={{ background: theme.textMain }}></div>
                <span className="text-[13px] font-medium opacity-80" style={{ color: theme.textMain }}>{view === 'login' ? 'หรือ' : 'มีบัญชีอยู่แล้ว?'}</span>
                <div className="flex-1 h-[1px] opacity-20" style={{ background: theme.textMain }}></div>
              </div>

              <button onClick={() => { if(regStep === 2) setRegStep(1); else handleSwitchView(view === 'login' ? 'register' : 'login'); }} className="w-full h-[54px] rounded-md font-bold text-[15px] border border-white/5" style={{ background: raisedGradient, boxShadow: shadowPlateau, color: theme.textMain }}>
                {view === 'login' ? 'สร้างบัญชี' : 'Sign in'}
              </button>
            </>
          )}

        </div>
      </div>
    </div>
  );
};

export default AuthModal;