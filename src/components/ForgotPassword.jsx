import React, { useState } from 'react';
import { ArrowLeft, Loader2, Check, Eye, EyeOff } from 'lucide-react';

const SECURITY_QUESTIONS = {
  1: "สัตว์เลี้ยงตัวแรกของคุณชื่ออะไร?",
  2: "ชื่อโรงเรียนประถมของคุณคืออะไร?",
  3: "จังหวัดที่คุณเกิดคือจังหวัดอะไร?",
  4: "ชื่อเล่นของแม่คุณคืออะไร?"
};

const ForgotPassword = ({ onBack, themeVals }) => {
  const [step, setStep] = useState(1); // 1: User, 2: Answer, 3: New Pass, 4: Success
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    username: "",
    securityQuestionId: null,
    securityAnswer: "",
    newPassword: "",
    confirmNewPassword: ""
  });

  const { theme, shadowPlateau, indentedGradient, shadowDeepInset } = themeVals;

  const handleCheckUsername = async (e) => {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const res = await fetch('/api/auth/recover', {
        method: 'POST',
        body: JSON.stringify({ action: 'get_question', username: formData.username })
      });
      const data = await res.json();
      if (data.status === 'success') {
        setFormData({ ...formData, securityQuestionId: data.securityQuestionId });
        setStep(2);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError("การเชื่อมต่อล้มเหลว");
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSubmit = (e) => {
    e.preventDefault();
    if (!formData.securityAnswer.trim()) {
      setError("กรุณากรอกคำตอบ");
      return;
    }
    setError("");
    setStep(3);
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (formData.newPassword.length < 8) {
      setError("รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร");
      return;
    }
    if (formData.newPassword !== formData.confirmNewPassword) {
      setError("รหัสผ่านไม่ตรงกัน");
      return;
    }

    setLoading(true); setError("");
    try {
      const res = await fetch('/api/auth/recover', {
        method: 'POST',
        body: JSON.stringify({
          action: 'reset_password',
          username: formData.username,
          securityAnswer: formData.securityAnswer,
          newPassword: formData.newPassword
        })
      });
      const data = await res.json();
      if (data.status === 'success') {
        setStep(4);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError("เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full flex flex-col gap-5 relative">
      
      <style>{`
        @keyframes slideFade {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
        .step-transition {
          animation: slideFade 0.3s ease-out forwards;
        }
      `}</style>

      {/* Header กลับ */}
      {step < 4 && (
        <button onClick={step === 1 ? onBack : () => { setStep(step - 1); setError(''); }} className="flex items-center text-[14px] font-medium opacity-60 hover:opacity-100 transition-opacity w-fit -ml-2 p-2" style={{ color: theme.textMain }}>
          <ArrowLeft size={18} className="mr-1.5" /> กลับ
        </button>
      )}

      {error && (
        <div className="p-3 text-[13px] font-bold rounded-md border border-red-500/30 text-red-500 bg-red-500/10 text-center mb-2">
          {error}
        </div>
      )}

      {/* Step 1: Username */}
      {step === 1 && (
        <form onSubmit={handleCheckUsername} className="flex flex-col gap-6 step-transition">
          <h2 className="text-[32px] font-light tracking-wide mb-2" style={{ color: theme.textMain }}>เปลี่ยนรหัสผ่าน</h2>
          <div className="flex flex-col gap-2">
            <label className="text-[14px] font-medium opacity-90" style={{ color: theme.textMain }}>Username</label>
            <div className="flex items-center px-4 h-[52px] rounded-md border border-gray-400/80 transition-all" style={{ background: indentedGradient, boxShadow: shadowDeepInset }}>
              <input 
                type="text" required
                className="w-full bg-transparent outline-none text-[15px] font-medium focus:text-blue-600"
                value={formData.username}
                onChange={(e) => setFormData({...formData, username: e.target.value})}
                style={{ color: theme.textMain }}
              />
            </div>
          </div>
          <button disabled={loading} className="w-full mt-2 h-[54px] rounded-md font-bold text-[15px] transition-all active:scale-[0.98] flex items-center justify-center gap-2" style={{ background: '#007bff', color: '#ffffff', boxShadow: shadowPlateau }}>
            {loading ? <Loader2 className="animate-spin" size={18} /> : null} Next
          </button>
        </form>
      )}

      {/* Step 2: Security Question */}
      {step === 2 && (
        <form onSubmit={handleAnswerSubmit} className="flex flex-col gap-6 animate-in fade-in slide-in-from-right-4 duration-300">
          <div className="flex flex-col">
            <h2 className="text-[18px] font-medium opacity-80 mb-2" style={{ color: theme.textMain }}>คำถามความปลอดภัยของคุณ</h2>
            <h3 className="text-[32px] font-light tracking-wide leading-tight" style={{ color: theme.textMain }}>{SECURITY_QUESTIONS[formData.securityQuestionId]}</h3>
          </div>
          <div className="flex flex-col gap-2 mt-2">
            <div className="flex items-center px-4 h-[52px] rounded-md border border-gray-400/80 transition-all" style={{ background: indentedGradient, boxShadow: shadowDeepInset }}>
              <input 
                type="text" required
                className="w-full bg-transparent outline-none text-[15px] font-medium focus:text-blue-600"
                value={formData.securityAnswer}
                onChange={(e) => setFormData({...formData, securityAnswer: e.target.value})}
                style={{ color: theme.textMain }}
              />
            </div>
          </div>
          <button className="w-full mt-2 h-[54px] rounded-md font-bold text-[15px] transition-all active:scale-[0.98] flex items-center justify-center gap-2" style={{ background: '#007bff', color: '#ffffff', boxShadow: shadowPlateau }}>
            Next
          </button>
        </form>
      )}

      {/* Step 3: New Password */}
      {step === 3 && (
        <form onSubmit={handleResetPassword} className="flex flex-col gap-6 animate-in fade-in slide-in-from-right-4 duration-300">
          <h2 className="text-[32px] font-light tracking-wide mb-2" style={{ color: theme.textMain }}>ตั้งรหัสผ่านใหม่</h2>
          
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <label className="text-[14px] font-medium opacity-90" style={{ color: theme.textMain }}>Password</label>
              <div className="flex items-center px-4 h-[52px] rounded-md border border-gray-400/80 transition-all" style={{ background: indentedGradient, boxShadow: shadowDeepInset }}>
                <input 
                  type={showPassword ? "text" : "password"} required
                  className="w-full bg-transparent outline-none text-[15px] font-medium focus:text-blue-600"
                  value={formData.newPassword}
                  onChange={(e) => setFormData({...formData, newPassword: e.target.value})}
                  style={{ color: theme.textMain }}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="ml-2 opacity-40 hover:opacity-100 transition-opacity" style={{ color: theme.textMain }}>
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[14px] font-medium opacity-90" style={{ color: theme.textMain }}>Confirm Password</label>
              <div className="flex items-center px-4 h-[52px] rounded-md border border-gray-400/80 transition-all" style={{ background: indentedGradient, boxShadow: shadowDeepInset }}>
                <input 
                  type={showConfirmPassword ? "text" : "password"} required
                  className="w-full bg-transparent outline-none text-[15px] font-medium focus:text-blue-600"
                  value={formData.confirmNewPassword}
                  onChange={(e) => setFormData({...formData, confirmNewPassword: e.target.value})}
                  style={{ color: theme.textMain }}
                />
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="ml-2 opacity-40 hover:opacity-100 transition-opacity" style={{ color: theme.textMain }}>
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          </div>

          <button disabled={loading} className="w-full mt-2 h-[54px] rounded-md font-bold text-[15px] transition-all active:scale-[0.98] flex items-center justify-center gap-2" style={{ background: '#007bff', color: '#ffffff', boxShadow: shadowPlateau }}>
            {loading ? <Loader2 className="animate-spin" size={18} /> : null} Next
          </button>
        </form>
      )}

      {/* Step 4: Success */}
      {step === 4 && (
        <div className="flex flex-col items-center text-center py-8 animate-in zoom-in-95 duration-500">
          <div className="w-20 h-20 rounded-full border-[3px] border-green-600 text-green-600 flex items-center justify-center mb-6">
            <Check size={40} strokeWidth={3} />
          </div>
          <h2 className="text-[32px] font-light tracking-wide mb-4" style={{ color: theme.textMain }}>เปลี่ยนรหัสผ่านสำเร็จ</h2>
          <p className="text-[15px] font-medium opacity-80 mb-8" style={{ color: theme.textMain }}>คุณสามารถใช้รหัสผ่านใหม่เข้าสู่ระบบได้ทันที</p>
          <button onClick={onBack} className="w-full h-[54px] rounded-md font-bold text-[15px] transition-all active:scale-[0.98] flex items-center justify-center border border-white/10" style={{ background: '#007bff', color: '#ffffff', boxShadow: shadowPlateau }}>
            Next
          </button>
        </div>
      )}

    </div>
  );
};

export default ForgotPassword;