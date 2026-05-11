import React, { useState } from 'react';
import { KeyRound, User, HelpCircle, Lock, ArrowLeft } from 'lucide-react';

const SECURITY_QUESTIONS = {
  1: "สัตว์เลี้ยงตัวแรกของคุณชื่ออะไร?",
  2: "ชื่อโรงเรียนประถมของคุณคืออะไร?",
  3: "จังหวัดที่คุณเกิดคือจังหวัดอะไร?",
  4: "ชื่อเล่นของแม่คุณคืออะไร?"
};

const ForgotPassword = ({ onBack, themeVals }) => {
  const [step, setStep] = useState(1); // 1: Username, 2: Answer, 3: Success
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const [formData, setFormData] = useState({
    username: "",
    securityQuestionId: null,
    securityAnswer: "",
    newPassword: ""
  });

  // Step 1: ตรวจสอบ Username และดึงคำถาม
  const handleCheckUsername = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
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

  // Step 2: ตรวจคำตอบและเปลี่ยนรหัสผ่าน
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
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
        setStep(3);
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
    <div className="p-6">
      <button onClick={onBack} className="flex items-center text-sm opacity-60 mb-6 hover:opacity-100">
        <ArrowLeft size={16} className="mr-2" /> กลับไปหน้าเข้าสู่ระบบ
      </button>

      <h2 className="text-2xl font-bold mb-2">กู้คืนรหัสผ่าน</h2>
      <p className="text-sm opacity-70 mb-6">ยืนยันตัวตนผ่านคำถามความปลอดภัย</p>

      {error && <div className="p-3 mb-4 bg-red-500/10 text-red-500 text-sm rounded-lg border border-red-500/20">{error}</div>}

      {step === 1 && (
        <form onSubmit={handleCheckUsername} className="space-y-4">
          <div>
            <label className="block text-sm mb-2">Username ของคุณ</label>
            <div className="relative">
              <User className="absolute left-3 top-3 opacity-40" size={18} />
              <input 
                type="text" required
                className="w-full pl-10 pr-4 py-2 rounded-xl border bg-transparent"
                style={{ borderColor: themeVals.theme.border }}
                value={formData.username}
                onChange={(e) => setFormData({...formData, username: e.target.value})}
              />
            </div>
          </div>
          <button disabled={loading} className="w-full py-3 rounded-xl font-bold bg-blue-600 text-white">
            {loading ? "กำลังตรวจสอบ..." : "ถัดไป"}
          </button>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={handleResetPassword} className="space-y-4">
          <div className="p-4 rounded-xl mb-2" style={{ backgroundColor: themeVals.theme.bgSecondary }}>
            <p className="text-xs opacity-50 mb-1">คำถามความปลอดภัยของคุณ:</p>
            <p className="font-medium text-blue-400">{SECURITY_QUESTIONS[formData.securityQuestionId]}</p>
          </div>
          
          <div>
            <label className="block text-sm mb-2">คำตอบของคุณ</label>
            <div className="relative">
              <HelpCircle className="absolute left-3 top-3 opacity-40" size={18} />
              <input 
                type="text" required
                className="w-full pl-10 pr-4 py-2 rounded-xl border bg-transparent"
                style={{ borderColor: themeVals.theme.border }}
                value={formData.securityAnswer}
                onChange={(e) => setFormData({...formData, securityAnswer: e.target.value})}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm mb-2">รหัสผ่านใหม่</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 opacity-40" size={18} />
              <input 
                type="password" required minLength={6}
                className="w-full pl-10 pr-4 py-2 rounded-xl border bg-transparent"
                style={{ borderColor: themeVals.theme.border }}
                value={formData.newPassword}
                onChange={(e) => setFormData({...formData, newPassword: e.target.value})}
              />
            </div>
          </div>

          <button disabled={loading} className="w-full py-3 rounded-xl font-bold bg-green-600 text-white">
            {loading ? "กำลังบันทึก..." : "ยืนยันการเปลี่ยนรหัสผ่าน"}
          </button>
        </form>
      )}

      {step === 3 && (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <KeyRound size={32} />
          </div>
          <h3 className="text-xl font-bold mb-2">เปลี่ยนรหัสผ่านสำเร็จ!</h3>
          <p className="text-sm opacity-70 mb-6">คุณสามารถใช้รหัสผ่านใหม่เข้าสู่ระบบได้ทันที</p>
          <button onClick={onBack} className="w-full py-3 rounded-xl font-bold bg-blue-600 text-white">
            กลับไปหน้า Login
          </button>
        </div>
      )}
    </div>
  );
};

export default ForgotPassword;