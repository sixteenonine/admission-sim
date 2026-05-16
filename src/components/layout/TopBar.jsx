import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { UserCircle2, LogOut, Settings, Sun, Moon, ChevronDown, CreditCard } from 'lucide-react';

const AVATARS = [
  { id: 1, color: '#3b82f6' }, { id: 2, color: '#10b981' }, 
  { id: 3, color: '#8b5cf6' }, { id: 4, color: '#f43f5e' }, 
  { id: 5, color: '#f97316' }, { id: 6, color: '#14b8a6' }
];

export default function TopBar({ themeVals, currentUser, setIsAuthModalOpen, setIsProfileModalOpen, setIsLogoutModalOpen, isSimulator = false, simulatorProps = {} }) {
  const location = useLocation();
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isModeDropdownOpen, setIsModeDropdownOpen] = useState(false);

  const { isRunning, isTimerStarted, mode, MODES, handleModeSelect, isDarkMode, setIsDarkMode } = simulatorProps;

  return (
    <>
      <div className="fixed top-0 left-0 right-0 h-[80px] z-[80] pointer-events-none" style={{ backgroundColor: themeVals.bg }}></div>
      
      <Link to="/home" className="fixed top-8 left-8 z-[100] text-xl font-bold tracking-[0.2em] hidden sm:block pointer-events-auto transition-transform active:scale-95" style={{ color: themeVals.textMain }}>
        ADMiSSIM
      </Link>

      {/* ตรงกลาง: สวิตช์โหมด */}
      <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-4">
        {isSimulator ? (
          <div className="flex gap-3 sm:gap-4 items-center">
            <button 
              onClick={() => !isRunning && setIsDarkMode(!isDarkMode)} 
              disabled={isRunning}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all border border-white/10 ${isRunning ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'}`} 
              style={{ boxShadow: themeVals.shadowOuter, background: themeVals.raisedGradient, color: themeVals.textMain }}
            >
              {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <div className="relative">
              {isModeDropdownOpen && <div className="fixed inset-0 z-40" onClick={() => setIsModeDropdownOpen(false)}></div>}
              <button 
                onClick={() => !isTimerStarted && setIsModeDropdownOpen(!isModeDropdownOpen)}
                disabled={isTimerStarted}
                className={`flex items-center gap-3 px-5 py-2.5 rounded-[1.25rem] transition-all border border-white/10 ${isTimerStarted ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'}`}
                style={{ boxShadow: themeVals.shadowOuter, background: themeVals.raisedGradient, color: themeVals.textSub }}
              >
                <span className="text-[11px] font-semibold uppercase tracking-wider">{MODES?.[mode]?.label}</span>
                <ChevronDown size={14} className={`transition-transform duration-300 ${isModeDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              <div 
                className={`absolute right-0 top-full mt-3 w-[260px] rounded-[1.5rem] p-2.5 border border-white/20 transition-all duration-300 origin-top-right z-50 flex flex-col gap-1
                  ${isModeDropdownOpen ? 'opacity-100 scale-100 pointer-events-auto translate-y-0' : 'opacity-0 scale-95 pointer-events-none -translate-y-2'}`}
                style={{ boxShadow: themeVals.shadowPlateau, background: themeVals.raisedGradient }}
              >
                {MODES && Object.entries(MODES).map(([key, { label }]) => {
                  const isSelected = mode === key;
                  return (
                    <button key={key} onClick={() => { handleModeSelect(key); setIsModeDropdownOpen(false); }} className="w-full text-left px-5 py-3.5 text-[13px] font-medium tracking-wide transition-all flex items-center justify-between rounded-[1rem]" style={{ background: isSelected ? themeVals.bg : 'transparent', boxShadow: isSelected ? themeVals.shadowDeepInset : 'none', color: isSelected ? themeVals.textMain : themeVals.textSub }}>
                      <span>{label}</span>
                      <div className={`w-1.5 h-1.5 rounded-full transition-opacity ${isSelected ? 'bg-blue-400 opacity-100 shadow-[0_0_8px_#60a5fa]' : 'bg-transparent opacity-0'}`} />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex p-1.5 rounded-2xl border border-white/20" style={{ background: themeVals.indentedGradient, boxShadow: themeVals.shadowDeepInset }}>
            {[ { path: '/home', label: 'Home' }, { path: '/vocab', label: 'Vocab' } ].map(item => {
              const isActive = location.pathname.includes(item.path);
              return (
                <Link key={item.path} to={item.path} className="px-6 py-2 rounded-xl text-sm font-bold transition-all"
                  style={{ background: isActive ? themeVals.bg : 'transparent', boxShadow: isActive ? themeVals.shadowPlateau : 'none', color: isActive ? '#3b82f6' : themeVals.textSub }}>
                  {item.label}
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* มุมขวาบน: โปรไฟล์/ล็อกอิน (อิงจากโค้ด App.jsx ต้นฉบับเป๊ะๆ) */}
      <div className="fixed top-6 right-6 z-[100] flex items-center gap-3">
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
               <UserCircle2 size={26} color="#ffffff" className="opacity-80" />
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
                  <div className="w-12 h-12 rounded-full border-[3px] flex items-center justify-center shrink-0" style={{ backgroundColor: AVATARS.find(a => a.id === (currentUser.avatar_id || 1))?.color || '#3b82f6', borderColor: themeVals.bg }}>
                     <UserCircle2 size={24} color="#ffffff" />
                  </div>
               </div>
               <button onClick={() => { setIsProfileModalOpen(true); setIsProfileDropdownOpen(false); }} className="w-full text-left px-4 py-3 font-semibold flex items-center gap-3 rounded-xl hover:bg-black/5 transition-colors" style={{ color: themeVals.textMain }}>
                 <UserCircle2 size={18} /> Profile
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
    </>
  );
}