import React, { useState, memo } from 'react';
import { Sun, Moon, ChevronDown } from 'lucide-react';
import { MODES } from '../../utils/constants';

const TopBarWidget = memo(({ cfg, themeVals, isDarkMode, setIsDarkMode, mode, handleModeSelect, isTimerStarted, isRunning }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const { theme, bg, shadowOuter, raisedGradient, shadowPlateau, shadowDeepInset } = themeVals;

  return (
    <div className="fixed top-6 right-[70px] sm:right-[90px] flex items-center z-[90]">
      <div className="flex gap-3 sm:gap-4 items-center">
        <button 
          onClick={() => { if (!isRunning) setIsDarkMode(!isDarkMode); }} 
          disabled={isRunning}
          className={`w-10 h-10 rounded-full flex items-center justify-center transition-all border border-white/10 ${isRunning ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'}`} 
          style={{ boxShadow: shadowOuter, background: raisedGradient, color: theme.textMain }}
        >
          {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
        </button>
        
        <div className="relative">
          {isDropdownOpen && <div className="fixed inset-0 z-40" onClick={() => setIsDropdownOpen(false)}></div>}
          <button 
            onClick={() => { if (!isTimerStarted) setIsDropdownOpen(!isDropdownOpen); }}
            disabled={isTimerStarted}
            className={`flex items-center gap-3 px-5 py-2.5 rounded-[1.25rem] transition-all border border-white/10 ${isTimerStarted ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'}`}
            style={{ boxShadow: shadowOuter, background: raisedGradient, color: theme.textSub }}
          >
            <span className="text-[11px] font-semibold uppercase tracking-wider">{MODES[mode].label}</span>
            <ChevronDown size={14} className={`transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          <div 
            className={`absolute right-0 top-full mt-3 w-[260px] rounded-[1.5rem] p-2.5 border border-white/20 transition-all duration-300 origin-top-right z-50 flex flex-col gap-1
              ${isDropdownOpen ? 'opacity-100 scale-100 pointer-events-auto translate-y-0' : 'opacity-0 scale-95 pointer-events-none -translate-y-2'}`}
            style={{ boxShadow: shadowPlateau, background: raisedGradient }}
          >
            {Object.entries(MODES).map(([key, { label }]) => {
              const isSelected = mode === key;
              return (
                <button key={key} onClick={() => { handleModeSelect(key); setIsDropdownOpen(false); }} className="w-full text-left px-5 py-3.5 text-[13px] font-medium tracking-wide transition-all flex items-center justify-between" style={{ borderRadius: `${cfg.dropRadius}px`, background: isSelected ? bg : 'transparent', boxShadow: isSelected ? shadowDeepInset : 'none', color: isSelected ? theme.textMain : theme.textSub }}>
                  <span>{label}</span>
                  <div className={`w-1.5 h-1.5 rounded-full transition-opacity ${isSelected ? 'bg-blue-400 opacity-100 shadow-[0_0_8px_#60a5fa]' : 'bg-transparent opacity-0'}`} />
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
});

export default TopBarWidget;