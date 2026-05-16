import React, { useState } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { X, Loader2 } from 'lucide-react';

export default function AuthModal({ isOpen, onClose, onLoginSuccess, themeVals }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { bg, theme, shadowOuter, shadowPlateau, raisedGradient } = themeVals;

  const login = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setLoading(true);
      setError("");
      try {
        const userInfo = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        }).then(res => res.json());

        const res = await fetch('/api/auth/google', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(userInfo)
        });
        
        const data = await res.json();
        if (data.status === 'success') {
          onLoginSuccess(data.user);
          onClose();
        } else {
          setError(data.message || "เกิดข้อผิดพลาดในการเข้าสู่ระบบ");
        }
      } catch (err) {
        setError("เชื่อมต่อเซิร์ฟเวอร์ล้มเหลว");
      } finally {
        setLoading(false);
      }
    },
    onError: () => setError("การเข้าสู่ระบบผ่าน Google ถูกยกเลิก")
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/40 backdrop-blur-md px-4">
      <div className="w-full max-w-sm rounded-[2.5rem] border border-white/20 p-8 relative flex flex-col items-center" style={{ background: bg, boxShadow: shadowOuter }}>
        <button onClick={onClose} className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center rounded-full border border-white/10 active:scale-95 transition-transform" style={{ background: raisedGradient, color: theme.textMain }}>
          <X size={14} />
        </button>
        
        <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4 border border-white/10" style={{ background: raisedGradient, boxShadow: shadowPlateau }}>
           <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-8 h-8 drop-shadow-md" />
        </div>
        
        <h2 className="text-xl font-bold mb-1" style={{ color: theme.textMain }}>Sign In</h2>
        <p className="text-[11px] uppercase tracking-widest font-bold opacity-60 mb-8 text-center" style={{ color: theme.textSub }}>เข้าสู่ระบบด้วยบัญชี Google</p>
        
        {error && <p className="text-[#ef4444] text-[11px] font-bold uppercase tracking-wider mb-4 px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20">{error}</p>}
        
        <button 
          onClick={() => login()} 
          disabled={loading}
          className="w-full py-4 rounded-2xl font-bold text-[12px] uppercase tracking-widest text-white shadow-lg flex items-center justify-center gap-3 transition-transform active:scale-95" 
          style={{ background: '#4285F4' }}
        >
          {loading ? <Loader2 size={18} className="animate-spin" /> : "Continue with Google"}
        </button>
      </div>
    </div>
  );
}