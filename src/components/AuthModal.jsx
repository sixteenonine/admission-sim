import React, { useState } from 'react';
import { X, User, Lock, UserCircle, Loader2, Asterisk } from 'lucide-react';

const AuthModal = ({ isOpen, onClose, onLoginSuccess, themeVals }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    displayName: ''
  });

  const { bg, theme, shadowPlateau, shadowOuter, raisedGradient, shadowDeepInset, indentedGradient } = themeVals;

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const endpoint = isLogin ? '/api/login' : '/api/register';
    
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();

      if (data.status === 'success') {
        if (isLogin) {
          onLoginSuccess(data.user);
          onClose();
        } else {
          setIsLogin(true);
          setError('สมัครสมาชิกสำเร็จ! กรุณาเข้าสู่ระบบ');
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

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-transparent backdrop-blur-md px-4 animate-in fade-in duration-300 font-medium" style={{ fontFamily: "'Outfit', 'Prompt', sans-serif" }}>
      
      {/* Outer Container (เหมือนหน้า Settings) */}
      <div className="w-full max-w-sm rounded-[2.5rem] border border-white/20 transition-all relative" style={{ padding: '9px', boxShadow: shadowPlateau, background: bg }}>
        
        {/* Inner Container */}
        <div className="w-full rounded-[2rem] p-8 flex flex-col gap-6 border border-white/5" style={{ background: bg, boxShadow: shadowOuter }}>
          
          {/* Header */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center border border-white/10" style={{ background: raisedGradient, boxShadow: shadowPlateau }}>
                <UserCircle size={20} className="text-blue-500" />
              </div>
              <div>
                <h3 className="text-lg font-bold tracking-wide" style={{ color: theme.textMain }}>
                  {isLogin ? 'Welcome Back' : 'Create Account'}
                </h3>
                <p className="text-[11px] font-bold opacity-60 uppercase tracking-wider" style={{ color: theme.textSub }}>
                  {isLogin ? 'เข้าสู่ระบบเพื่อซิงค์ประวัติ' : 'สมัครสมาชิกใหม่'}
                </p>
              </div>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center transition-all active:scale-95 border border-white/5" style={{ background: raisedGradient, boxShadow: shadowPlateau, color: theme.textMain }}>
              <X size={14} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            
            {/* Error / Success Message */}
            {error && (
              <div className={`p-4 text-[12px] font-bold rounded-2xl flex items-center justify-center text-center border ${error.includes('สำเร็จ') ? 'border-emerald-500/30 text-emerald-500 bg-emerald-500/10' : 'border-red-500/30 text-red-500 bg-red-500/10'}`}>
                {error}
              </div>
            )}

            {/* Input Fields */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center px-5 py-4 rounded-[1.5rem] border border-white/5 transition-all" style={{ background: indentedGradient, boxShadow: shadowDeepInset }}>
                <User className="mr-3 opacity-40 shrink-0" size={18} style={{ color: theme.textMain }} />
                <input
                  type="text"
                  required
                  className="w-full bg-transparent outline-none text-[14px] font-bold placeholder:opacity-30 transition-colors focus:text-blue-500"
                  placeholder="Username"
                  value={formData.username}
                  onChange={(e) => setFormData({...formData, username: e.target.value})}
                  style={{ color: theme.textMain }}
                />
              </div>

              {!isLogin && (
                <div className="flex items-center px-5 py-4 rounded-[1.5rem] border border-white/5 transition-all animate-in fade-in slide-in-from-top-2" style={{ background: indentedGradient, boxShadow: shadowDeepInset }}>
                  <Asterisk className="mr-3 opacity-40 shrink-0 text-orange-500" size={18} />
                  <input
                    type="text"
                    required
                    className="w-full bg-transparent outline-none text-[14px] font-bold placeholder:opacity-30 transition-colors focus:text-orange-500"
                    placeholder="Display Name (ชื่อที่จะแสดง)"
                    value={formData.displayName}
                    onChange={(e) => setFormData({...formData, displayName: e.target.value})}
                    style={{ color: theme.textMain }}
                  />
                </div>
              )}

              <div className="flex items-center px-5 py-4 rounded-[1.5rem] border border-white/5 transition-all" style={{ background: indentedGradient, boxShadow: shadowDeepInset }}>
                <Lock className="mr-3 opacity-40 shrink-0" size={18} style={{ color: theme.textMain }} />
                <input
                  type="password"
                  required
                  className="w-full bg-transparent outline-none text-[14px] font-bold placeholder:opacity-30 transition-colors focus:text-blue-500"
                  placeholder="Password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  style={{ color: theme.textMain }}
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-4 rounded-[1.25rem] font-bold tracking-widest text-[13px] uppercase transition-all active:scale-[0.98] border border-white/10 shadow-lg flex items-center justify-center gap-2"
              style={{ background: 'linear-gradient(145deg, #3b82f6, #2563eb)', color: '#ffffff', boxShadow: shadowPlateau }}
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : null}
              {isLogin ? 'Sign In' : 'Sign Up'}
            </button>

            {/* Switch Mode Button */}
            <button
              type="button"
              onClick={() => { setIsLogin(!isLogin); setError(''); setFormData({username: '', password: '', displayName: ''}); }}
              className="w-full text-[11px] font-bold uppercase tracking-widest opacity-50 hover:opacity-100 transition-opacity mt-1"
              style={{ color: theme.textSub }}
            >
              {isLogin ? 'Don\'t have an account? Sign up' : 'Already have an account? Sign in'}
            </button>

          </form>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;