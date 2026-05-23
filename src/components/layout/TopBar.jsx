import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { UserCircle2, LogOut, Sun, Moon, ChevronDown, CreditCard, Menu, Maximize, Minimize } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useTheme } from '../../contexts/ThemeContext.jsx';

const AVATARS = [
  { id: 1, color: '#3b82f6' }, { id: 2, color: '#10b981' }, 
  { id: 3, color: '#8b5cf6' }, { id: 4, color: '#f43f5e' }, 
  { id: 5, color: '#f97316' }, { id: 6, color: '#14b8a6' }
];

export default function TopBar({ setIsSidebarOpen, setIsAuthModalOpen, setIsProfileModalOpen, setIsLogoutModalOpen, isSimulator = false, simulatorProps = {} }) {
  const location = useLocation();
  const { currentUser } = useAuth();
  const { isDarkMode, setIsDarkMode, themeVals } = useTheme();
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isModeDropdownOpen, setIsModeDropdownOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => console.log(err));
    } else if (document.exitFullscreen) {
      document.exitFullscreen();
    }
  };

  const { isRunning, isTimerStarted, mode, MODES, handleModeSelect } = simulatorProps;

  return (
    <header className="fixed top-0 left-0 right-0 h-[100px] px-6 sm:px-8 flex items-start pt-6 justify-between z-[100] pointer-events-none">
      <div className="absolute inset-0 h-[80px] z-[-1]" style={{ backgroundColor: themeVals.bg }}></div>
      
      {/* ส่วนซ้าย: โลโก้ */}
      <div className="w-1/3 flex justify-start pointer-events-auto items-center mt-2">
      <button 
          onClick={() => setIsSidebarOpen(true)}
          className="p-2.5 rounded-xl transition-transform active:scale-95 border border-white/20 mr-4"
          style={{ background: themeVals.raisedGradient, boxShadow: themeVals.shadowOuter, color: themeVals.textMain }}
        >
          <Menu size={22} />
        </button>
        <Link to="/home" className="text-xl font-bold tracking-[0.2em] hidden sm:block transition-transform active:scale-95" style={{ color: themeVals.textMain }}>
          ADMiSSIM
        </Link>
      </div>

      {/* ส่วนกลาง: ปล่อยว่างไว้เพื่อรักษา Layout 3 คอลัมน์ให้สมดุล */}
      <div className="w-1/3 flex justify-center pointer-events-auto">
      </div>

      {/* ส่วนขวา: โปรไฟล์ */}
      <div className="w-1/3 flex items-center justify-end gap-3 pointer-events-auto">
        <button
          onClick={toggleFullscreen}
          className="p-2 transition-transform active:scale-95 opacity-50 hover:opacity-100 flex items-center justify-center"
          style={{ color: themeVals.textMain }}
          title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
        >
          {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
        </button>

        {currentUser ? (
          <div className="relative">
            {isProfileDropdownOpen && <div className="fixed inset-0 z-40" onClick={() => setIsProfileDropdownOpen(false)}></div>}
            <button 
              onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
              className="w-[44px] h-[44px] rounded-full border-[2.5px] transition-transform active:scale-95 flex items-center justify-center overflow-hidden z-50 relative"
              style={{ 
                backgroundColor: AVATARS.find(a => a.id === (currentUser.avatar_id || 1))?.color || '#3b82f6', 
                borderColor: themeVals.bg, 
                boxShadow: themeVals.shadowOuter 
              }}
            >
              {currentUser?.avatar_url ? (
                <img src={currentUser.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <UserCircle2 size={26} color="#ffffff" className="opacity-80" />
              )}
            </button>

            <div 
              className={`absolute right-0 top-full mt-3 w-[260px] rounded-[1.5rem] p-2.5 border border-white/20 transition-all duration-300 origin-top-right z-50 flex flex-col gap-1
                ${isProfileDropdownOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}
              style={{ boxShadow: themeVals.shadowPlateau, background: themeVals.raisedGradient }}
            >
               <div className="px-3 pt-3 pb-4 flex items-center justify-between mb-1 border-b border-white/5">
                  <div className="flex flex-col truncate pr-2">
                     <span className="text-[16px] font-bold truncate" style={{ color: themeVals.textMain }}>{currentUser.displayName}</span>
                     <span className="text-[12px] opacity-60 truncate" style={{ color: themeVals.textSub }}>@{currentUser.username}</span>
                  </div>
                  <div className="w-12 h-12 rounded-full border-[3px] flex items-center justify-center shrink-0 overflow-hidden" style={{ backgroundColor: AVATARS.find(a => a.id === (currentUser.avatar_id || 1))?.color || '#3b82f6', borderColor: themeVals.bg }}>
                     {currentUser?.avatar_url ? (
                       <img src={currentUser.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                     ) : (
                       <UserCircle2 size={24} color="#ffffff" />
                     )}
                  </div>
               </div>
               <button onClick={() => { setIsProfileModalOpen(true); setIsProfileDropdownOpen(false); }} className="w-full text-left px-4 py-3 font-semibold flex items-center gap-3 rounded-xl hover:bg-transparent transition-colors" style={{ color: themeVals.textMain }}>
                 <UserCircle2 size={18} /> Profile
               </button>
               <button onClick={() => setIsDarkMode(!isDarkMode)} className="w-full text-left px-4 py-3 font-semibold flex items-center justify-between rounded-xl hover:bg-black/5 transition-colors" style={{ color: themeVals.textMain }}>
                 <div className="flex items-center gap-3">
                   {isDarkMode ? <Sun size={18} /> : <Moon size={18} />} Theme
                 </div>
                 <span className="text-[11px] font-bold uppercase tracking-wider opacity-50">{isDarkMode ? 'Dark' : 'Light'}</span>
               </button>
               <Link 
                 to="/subscription" 
                 onClick={() => setIsProfileDropdownOpen(false)} 
                 className="w-full text-left px-4 py-3 font-semibold flex items-center gap-3 rounded-xl hover:bg-black/5 transition-colors" 
                 style={{ color: themeVals.textMain }}
               >
                 <CreditCard size={18} /> Subscription
               </Link>
               <button onClick={() => { setIsLogoutModalOpen(true); setIsProfileDropdownOpen(false); }} className="w-full text-left px-4 py-3 font-semibold flex items-center gap-3 rounded-xl hover:bg-red-500/10 text-red-500 transition-colors">
                 <LogOut size={18} /> Sign out
               </button>
            </div>
          </div>
        ) : (
          <button onClick={() => setIsAuthModalOpen(true)} className="w-[44px] h-[44px] rounded-full border border-white/10 transition-transform active:scale-95 flex items-center justify-center" style={{ background: themeVals.raisedGradient, boxShadow: themeVals.shadowOuter, color: themeVals.textMain }}>
            <UserCircle2 size={24} />
          </button>
        )}
      </div>
    </header>
  );
}