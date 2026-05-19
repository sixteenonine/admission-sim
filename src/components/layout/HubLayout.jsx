import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import TopBar from './TopBar';
import AuthModal from '../../components/AuthModal';
import ProfileModal from '../../components/ProfileModal';
import { AlertTriangle } from 'lucide-react';

const themeVals = {
  bg: "#eef2f6",
  textMain: "#475569",
  textSub: "#94a3b8",
  raisedGradient: "linear-gradient(145deg, #ffffff, #dce3ec)",
  indentedGradient: "linear-gradient(145deg, #dce3ec, #ffffff)",
  shadowPlateau: "18px 18px 30px #c8d4e2, -18px -18px 30px #ffffff, inset 2px 2px 0px rgba(255,255,255,0.9), inset -2px -2px 0px rgba(0,0,0,0.02)",
  shadowOuter: "18px 18px 36px #c8d4e2, -18px -18px 36px #ffffff",
  shadowDeepInset: "inset 8px 8px 11px -10px #c8d4e2, inset -8px -8px 11px -10px #ffffff"
};

export default function HubLayout() {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  // 1. ตรวจสอบสถานะการล็อกอินด้วย HttpOnly Cookie เมื่อเปิดหน้าเว็บ
  useEffect(() => {
    fetch('/api/auth/check', { 
      credentials: 'include',
      headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
    })
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success' && data.user) {
          setCurrentUser(data.user);
        }
      })
      .catch(console.error)
      .finally(() => setIsAuthChecking(false));
  }, []);

  const handleLogout = async () => {
    setCurrentUser(null);
    setIsLogoutModalOpen(false);
    // 2. สั่งให้หลังบ้านทำลายคุกกี้ทิ้ง
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } catch (e) {
      console.error("Logout error:", e);
    }
  };

  const handleRefreshUser = async () => {
    // 3. ใช้ endpoint auth/check ดึงข้อมูลโปรไฟล์ล่าสุดแทน
    try {
      const res = await fetch('/api/auth/check', { 
        credentials: 'include',
        headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
      });
      const data = await res.json();
      if (data.status === 'success') {
        setCurrentUser(data.user);
        return true;
      }
    } catch (error) {
      console.error("Refresh failed:", error);
    }
    return false;
  };

  return (
    <div className="min-h-screen font-['Outfit','Prompt',sans-serif]" style={{ backgroundColor: themeVals.bg }}>
      <TopBar 
        themeVals={themeVals} 
        currentUser={currentUser} 
        setIsAuthModalOpen={setIsAuthModalOpen}
        setIsProfileModalOpen={setIsProfileModalOpen}
        setIsLogoutModalOpen={setIsLogoutModalOpen}
        isSimulator={false}
      />
      
      <main className="max-w-6xl mx-auto px-6 pt-32 pb-12 relative z-10">
        {!isAuthChecking && (
          <Outlet context={{ ...themeVals, currentUser, handleRefreshUser }} />
        )}
      </main>

      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
        onLoginSuccess={(user) => setCurrentUser(user)} // เลิกใช้ localStorage
        themeVals={{ theme: { textMain: themeVals.textMain, textSub: themeVals.textSub }, bg: themeVals.bg, shadowOuter: themeVals.shadowOuter, shadowDeepInset: themeVals.shadowDeepInset, indentedGradient: themeVals.indentedGradient, raisedGradient: themeVals.raisedGradient }}
      />

      <ProfileModal 
        isOpen={isProfileModalOpen} 
        onClose={() => setIsProfileModalOpen(false)} 
        user={currentUser}
        themeVals={{ theme: { textMain: themeVals.textMain, textSub: themeVals.textSub }, bg: themeVals.bg, shadowOuter: themeVals.shadowOuter, shadowDeepInset: themeVals.shadowDeepInset, indentedGradient: themeVals.indentedGradient, raisedGradient: themeVals.raisedGradient }}
        onUpdateUser={(updatedUser) => setCurrentUser(updatedUser)} // เลิกใช้ localStorage
        onRefreshUser={handleRefreshUser}
      />

      {isLogoutModalOpen && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center bg-black/20 backdrop-blur-sm px-4">
          <div className="w-full max-w-sm p-8 rounded-[2.5rem] text-center border border-white/10" style={{ background: themeVals.bg, boxShadow: themeVals.shadowOuter }}>
            <AlertTriangle size={40} className="mx-auto mb-4 text-red-500" />
            <h3 className="text-xl font-bold mb-2" style={{ color: themeVals.textMain }}>Log Out?</h3>
            <p className="text-sm mb-8 opacity-70" style={{ color: themeVals.textSub }}>หนูต้องการออกจากระบบใช่หรือไม่?</p>
            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => setIsLogoutModalOpen(false)} className="py-4 rounded-2xl font-bold text-[13px] uppercase tracking-widest transition-all active:scale-95" style={{ background: themeVals.indentedGradient, color: themeVals.textMain, boxShadow: themeVals.shadowDeepInset }}>Cancel</button>
              <button onClick={handleLogout} className="py-4 rounded-2xl font-bold text-[13px] uppercase tracking-widest text-white transition-all active:scale-95 shadow-lg" style={{ background: 'linear-gradient(145deg, #ef4444, #dc2626)' }}>Confirm</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}