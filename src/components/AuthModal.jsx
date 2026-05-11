import React, { useState } from 'react';
import { X, Eye, EyeOff, Loader2, Check } from 'lucide-react';
import ForgotPassword from './ForgotPassword';

const AuthModal = ({ isOpen, onClose, onLoginSuccess, themeVals }) => {
  const [view, setView] = useState('login'); // 'login' | 'register' | 'register_success' | 'forgot'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    displayName: '' 
  });

  const { bg, theme, shadowPlateau, raisedGradient, shadowDeepInset, indentedGradient } = themeVals;

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (view === 'register') {
      if (formData.password.length < 8) {
        setError('รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร');
        setLoading(false);
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setError('รหัสผ่านไม่ตรงกัน');
        setLoading(false);
        return;
      }
    }

    const endpoint = view === 'login' ? '/api/login' : '/api/register';
    const payload = view === 'login' 
      ? { username: formData.username, password: formData.password }
      : { username: formData.username, password: formData.password, displayName: formData.username };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (data.status === 'success') {
        if (view === 'login') {
          onLoginSuccess(data.user);
          onClose();
        } else {
          setView('register_success');
        }
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchView = (newView) => {
    setError('');
    setFormData({ username: '', password: '', confirmPassword: '', displayName: '' });
    setShowPassword(false);
    setShowConfirmPassword(false);
    setView(newView);
  };

  return (
    <div className="fixed inset-0 z-[500] w-full h-full flex flex-col items-center justify-center transition-colors duration-300" style={{ background: bg, fontFamily: "'Outfit', 'Prompt', sans-serif" }}>
      
      <button onClick={onClose} className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center rounded-full opacity-50 hover:opacity-100 transition-opacity z-50" style={{ color: theme.textMain }}>
        <X size={24} />
      </button>

      <div className="w-full max-w-[460px] flex flex-col px-6">
        {/* ใช้ key ช่วยให้ React รีเรนเดอร์และแสดงเอฟเฟกต์ Fade-in ใหม่ทุกครั้งที่เปลี่ยนหน้า */}
        <div key={view} className="flex flex-col gap-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          {view === 'forgot' && (
            <ForgotPassword onBack={() => handleSwitchView('login')} themeVals={themeVals} />
          )}

          {view === 'register_success' && (
            <div className="flex flex-col items-center text-center py-8">
              <div className="w-20 h-20 rounded-full border-[3px] border-green-600 text-green-600 flex items-center justify-center mb-6">
                <Check size={40} strokeWidth={3} />
              </div>
              <h1 className="text-[32px] font-light tracking-wide mb-2" style={{ color: theme.textMain }}>ยินดีต้อนรับ</h1>
              <h2 className="text-[24px] font-medium uppercase mb-6" style={{ color: theme.textMain }}>{formData.username}</h2>
              <p className="text-[15px] font-medium opacity-80 mb-8" style={{ color: theme.textMain }}>สร้างบัญชีสำเร็จ</p>
              
              <button
                onClick={() => handleSwitchView('login')}
                className="w-full h-[54px] rounded-md font-bold text-[15px] transition-all active:scale-[0.98] flex items-center justify-center border border-white/10"
                style={{ background: '#007bff', color: '#ffffff', boxShadow: shadowPlateau }}
              >
                Home
              </button>
            </div>
          )}

          {(view === 'login' || view === 'register') && (
            <>
              <div className="flex flex-col items-start text-left mb-2 w-full">
                <h1 className="text-[32px] font-light tracking-wide" style={{ color: theme.textMain }}>
                  {view === 'login' ? 'ยินดีต้อนรับ' : 'สร้างบัญชี'}
                </h1>
                {view === 'login' && (
                  <h2 className="text-[25px] font-medium italic opacity-100 -mt-1" style={{ color: theme.textMain }}>DEK70</h2>
                )}
              </div>

              {error && (
                <div className="p-3 text-[13px] font-bold rounded-md border border-red-500/30 text-red-500 bg-red-500/10 text-center">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                {/* Username */}
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

                {/* Password */}
                <div className="flex flex-col gap-2">
                  <label className="text-[14px] font-medium opacity-90" style={{ color: theme.textMain }}>Password</label>
                  <div className="flex items-center px-4 h-[52px] rounded-md border border-gray-400/80 transition-all" style={{ background: indentedGradient, boxShadow: shadowDeepInset }}>
                    <input
                      type={showPassword ? "text" : "password"} required
                      className="w-full bg-transparent outline-none text-[15px] font-medium focus:text-blue-600"
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      style={{ color: theme.textMain }}
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="ml-2 opacity-40 hover:opacity-100 transition-opacity" style={{ color: theme.textMain }}>
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password (สำหรับ Register) */}
                {view === 'register' && (
                  <div className="flex flex-col gap-2 animate-in fade-in slide-in-from-top-2">
                    <label className="text-[14px] font-medium opacity-90" style={{ color: theme.textMain }}>Confirm Password</label>
                    <div className="flex items-center px-4 h-[52px] rounded-md border border-gray-400/80 transition-all" style={{ background: indentedGradient, boxShadow: shadowDeepInset }}>
                      <input
                        type={showConfirmPassword ? "text" : "password"} required
                        className="w-full bg-transparent outline-none text-[15px] font-medium focus:text-blue-600"
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                        style={{ color: theme.textMain }}
                      />
                      <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="ml-2 opacity-40 hover:opacity-100 transition-opacity" style={{ color: theme.textMain }}>
                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    <p className="text-[12px] font-medium italic opacity-70 mt-1" style={{ color: theme.textMain }}>(ต้องมีไม่ต่ำกว่า 8 ตัวอักษร)</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 h-[54px] rounded-md font-bold text-[15px] transition-all active:scale-[0.98] flex items-center justify-center gap-2 border border-white/10"
                  style={{ background: '#007bff', color: '#ffffff', boxShadow: shadowPlateau }}
                >
                  {loading ? <Loader2 className="animate-spin" size={18} /> : null}
                  {view === 'login' ? 'Sign in' : 'Create Account'}
                </button>
              </form>

              {view === 'login' && (
                <div className="text-center mt-1">
                  <button onClick={() => handleSwitchView('forgot')} type="button" className="text-[14px] font-medium opacity-80 hover:opacity-100 transition-opacity" style={{ color: theme.textMain }}>
                    ลืมรหัสผ่าน?
                  </button>
                </div>
              )}

              <div className="flex items-center gap-4 my-2">
                <div className="flex-1 h-[1px] opacity-20" style={{ background: theme.textMain }}></div>
                <span className="text-[13px] font-medium opacity-80" style={{ color: theme.textMain }}>
                  {view === 'login' ? 'หรือ' : 'มีบัญชีอยู่แล้ว?'}
                </span>
                <div className="flex-1 h-[1px] opacity-20" style={{ background: theme.textMain }}></div>
              </div>

              <button
                type="button"
                onClick={() => handleSwitchView(view === 'login' ? 'register' : 'login')}
                className="w-full h-[54px] rounded-md font-bold text-[15px] transition-all active:scale-[0.98] border border-white/5"
                style={{ background: raisedGradient, boxShadow: shadowPlateau, color: theme.textMain }}
              >
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