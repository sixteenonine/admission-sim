import React, { useState, useMemo, memo } from 'react';
import { Asterisk, CheckCircle } from 'lucide-react';

const RightPanelWidget = memo(({ cfg, themeVals, part, subPart, qText, lcdHue, setLcdHue, trackHue, setTrackHue, isAutoTrackHue, setIsAutoTrackHue, lcdBrightness, lcdScrollSpeed, lcdScrollGap, addMark, isRunning, finishTime, onFinishClick }) => {
  const [customLcdText, setCustomLcdText] = useState("CUSTOM");
  const [lcdDisplayMode, setLcdDisplayMode] = useState('exam');
  const [isLcdEditOpen, setIsLcdEditOpen] = useState(false);

  const { bg, theme, shadowPlateau, shadowOuter, raisedGradient, shadowDeepInset, shadowCap, shadowTrench } = themeVals;

  const displayedLcdText = lcdDisplayMode === 'exam' ? qText : customLcdText;
  
  const lcdText = '#4cfc23';
  const lcdTextGlow = "0 0 5px rgba(76,252,35,0.8), 0 0 15px rgba(76,252,35,0.4)";
  const lcdBg = theme.bg === "#1e2229" ? '#0f2b10' : '#1b3f1c';
  const lcdShadow = "inset 6px 6px 16px rgba(0,0,0,0.9), inset -6px -6px 16px rgba(255,255,255,0.05)";

  const marqueeElements = useMemo(() => {
    if (lcdDisplayMode === 'exam' || displayedLcdText.length <= 5) return null;
    return Array(10).fill(displayedLcdText).map((txt, i) => (
      <span key={i} className="tracking-widest leading-none whitespace-nowrap mt-2" style={{ fontSize: `${cfg.lcdFontSize}px`, fontFamily: "'Share Tech Mono', monospace", color: lcdText, textShadow: lcdTextGlow, marginRight: `${lcdScrollGap}px` }}>{txt}</span>
    ));
  }, [displayedLcdText, lcdDisplayMode, cfg.lcdFontSize, lcdText, lcdTextGlow, lcdScrollGap]);

  return (
    <div className="w-full flex flex-col items-center gap-5 transition-all relative z-[60] pointer-events-none" style={{ maxWidth: `${cfg.lcdWidth}px`, fontFamily: "'Outfit', 'Prompt', sans-serif" }}>
      <div className="relative z-20 flex flex-col items-center text-center gap-1 w-full px-4 pointer-events-auto" style={{ transform: `scale(${cfg.headerScale}) translate(${cfg.headerX}px, ${cfg.headerY}px)`, transformOrigin: 'center center', transition: 'transform 0.1s' }}>
        <span className="text-[11px] uppercase tracking-[0.2em] font-medium" style={{ color: theme.textSub }}>{part}</span>
        <h2 className="text-[36px] leading-[1.1] font-light tracking-wide whitespace-nowrap" style={{ color: theme.textMain }}>{subPart}</h2>
      </div>

      <div className="w-full rounded-[2.5rem] p-6 flex flex-col gap-6 border border-white/10 pointer-events-auto" style={{ boxShadow: shadowOuter, background: bg, transform: `scale(${cfg.rightPanelScale}) translate(${cfg.rightPanelX}px, ${cfg.rightPanelY}px)`, transformOrigin: 'top center', transition: 'transform 0.1s' }}>
        <div className="w-full rounded-[2rem] transition-colors duration-300 border border-white/30 relative" style={{ padding: `${cfg.lcdBezelPadding}px`, boxShadow: shadowPlateau, background: bg }}>
          <div onClick={() => setIsLcdEditOpen(!isLcdEditOpen)} className="w-full flex items-center overflow-hidden border border-black/5 transition-all duration-300 relative cursor-pointer" style={{ height: `${cfg.lcdHeight}px`, borderRadius: `${cfg.lcdRadiusInner}px`, boxShadow: lcdShadow, background: lcdBg, filter: `hue-rotate(${lcdHue}deg) brightness(${lcdBrightness})` }}>
            <div className="absolute inset-0 pointer-events-none rounded-[inherit]" style={{ background: 'linear-gradient(110deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.02) 30%, transparent 35%)' }}></div>
            <div className="absolute inset-0 pointer-events-none rounded-[inherit]" style={{ background: 'radial-gradient(circle at center, transparent 50%, rgba(0,0,0,0.4) 120%)' }}></div>
            {marqueeElements ? (
              <div className="flex animate-marquee z-10" style={{ animationDuration: `${lcdScrollSpeed * 2}s` }}>
                {marqueeElements}
              </div>
            ) : (
              <div className="w-full flex justify-center z-10 mt-2">
                <span className="tracking-widest leading-none whitespace-nowrap" style={{ fontSize: `${cfg.lcdFontSize}px`, fontFamily: "'Share Tech Mono', monospace", color: lcdText, textShadow: lcdTextGlow }}>{displayedLcdText}</span>
              </div>
            )}
            <div className="absolute inset-0 opacity-20 pointer-events-none z-20" style={{ backgroundImage: 'linear-gradient(rgba(0,0,0,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.8) 1px, transparent 1px)', backgroundSize: '3px 3px' }}></div>
          </div>

          {isLcdEditOpen && (
             <div className="absolute top-1/2 -translate-y-1/2 left-[calc(100%+16px)] w-[260px] rounded-[1.5rem] p-2.5 border border-white/20 z-[100] transition-all flex flex-col gap-1" style={{ background: raisedGradient, boxShadow: shadowPlateau }}>
                <button onClick={(e) => { e.stopPropagation(); setLcdDisplayMode('exam'); }} className="w-full text-left px-5 py-3.5 text-[13px] font-medium tracking-wide transition-all flex items-center justify-between" style={{ borderRadius: `${cfg.dropRadius}px`, background: lcdDisplayMode === 'exam' ? bg : 'transparent', boxShadow: lcdDisplayMode === 'exam' ? shadowDeepInset : 'none', color: lcdDisplayMode === 'exam' ? theme.textMain : theme.textSub }} >
                  <span>Exam Progress</span>
                  <div className={`w-1.5 h-1.5 rounded-full transition-opacity ${lcdDisplayMode === 'exam' ? 'bg-blue-400 opacity-100 shadow-[0_0_8px_#60a5fa]' : 'bg-transparent opacity-0'}`} />
                </button>
                <div className="w-full px-5 py-3.5 flex items-center justify-between transition-all cursor-text" style={{ borderRadius: `${cfg.dropRadius}px`, background: lcdDisplayMode === 'custom' ? bg : 'transparent', boxShadow: lcdDisplayMode === 'custom' ? shadowDeepInset : 'none' }} onClick={(e) => { e.stopPropagation(); setLcdDisplayMode('custom'); }}>
                  <input type="text" maxLength={25} value={customLcdText} onChange={(e) => { setCustomLcdText(e.target.value.toUpperCase()); setLcdDisplayMode('custom'); }} className="w-full bg-transparent outline-none text-[13px] font-medium tracking-wide placeholder:text-current/50" style={{ color: lcdDisplayMode === 'custom' ? theme.textMain : theme.textSub, fontFamily: "'Outfit', 'Prompt', sans-serif" }} placeholder="Custom" />
                  <div className={`w-1.5 h-1.5 rounded-full shrink-0 transition-opacity ${lcdDisplayMode === 'custom' ? 'bg-blue-400 opacity-100 shadow-[0_0_8px_#60a5fa]' : 'bg-transparent opacity-0'}`} />
                </div>
                <div className="w-full px-5 pt-3 pb-2 mt-1 flex flex-col gap-3 border-t border-white/5">
                  <div className="flex justify-between items-center"><span className="text-[10px] uppercase font-bold tracking-wider" style={{ color: theme.textSub }}>LCD Hue</span><span className="text-[10px] font-mono font-medium" style={{ color: theme.textSub }}>{lcdHue}°</span></div>
                  <input type="range" min="0" max="360" value={lcdHue} onChange={(e) => setLcdHue(e.target.value)} onClick={(e) => e.stopPropagation()} className="w-full h-1.5 rounded-full accent-[#10b981] bg-black/10 outline-none" style={{ boxShadow: shadowTrench }} />
                </div>
                <div className="w-full px-5 pt-2 pb-3 flex flex-col gap-3 border-t border-white/5">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] uppercase font-bold tracking-wider" style={{ color: theme.textSub }}>Track Hue</span>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={(e) => { e.stopPropagation(); setIsAutoTrackHue(!isAutoTrackHue); }}
                        className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase transition-colors ${isAutoTrackHue ? 'bg-blue-500 text-white shadow-[0_0_6px_#3b82f6]' : 'bg-black/10 text-current'}`}
                      >
                        Auto
                      </button>
                      <span className="text-[10px] font-mono font-medium" style={{ color: theme.textSub }}>{Math.round(trackHue)}°</span>
                    </div>
                  </div>
                  <input type="range" min="0" max="360" value={Math.round(trackHue)} onChange={(e) => { setTrackHue(Number(e.target.value)); setIsAutoTrackHue(false); }} onClick={(e) => e.stopPropagation()} className="w-full h-1.5 rounded-full accent-[#3b82f6] bg-black/10 outline-none" style={{ boxShadow: shadowTrench }} />
                </div>
            </div>
          )}
        </div>
        <div className="w-full flex gap-3">
          <button onClick={addMark} disabled={!isRunning} className="flex-1 flex flex-col items-center justify-center transition-all active:scale-[0.98] border border-white/30" style={{ height: `${cfg.btnHeight * 0.8}px`, borderRadius: `${cfg.btnRadius}px`, boxShadow: shadowPlateau, background: bg, opacity: isRunning ? 1 : 0.6 }}>
            <Asterisk size={cfg.btnIconSize * 0.5} strokeWidth={3} className="text-[#ea580c] mb-1" />
            <span className="font-semibold tracking-[0.15em] uppercase" style={{ fontSize: `${cfg.btnFontSize * 0.8}px`, color: theme.textSub }}>Mark</span>
          </button>
          <button onClick={onFinishClick} disabled={!isRunning && !finishTime} className="flex-1 flex flex-col items-center justify-center transition-all active:scale-[0.98] border border-white/30" style={{ height: `${cfg.btnHeight * 0.8}px`, borderRadius: `${cfg.btnRadius}px`, boxShadow: shadowPlateau, background: finishTime ? '#10b981' : bg, color: finishTime ? '#ffffff' : theme.textSub, opacity: (isRunning || finishTime) ? 1 : 0.6 }}>
            {finishTime ? (
              <>
                <span className="font-bold uppercase opacity-90" style={{ fontSize: `${cfg.btnFontSize * 0.7}px` }}>Done in {Math.floor(finishTime/60)}:{(Math.floor(finishTime)%60).toString().padStart(2,'0')}</span>
                <span className="font-black tracking-[0.1em] uppercase mt-1 drop-shadow-md" style={{ fontSize: `${cfg.btnFontSize * 0.8}px` }}>End Exam</span>
              </>
            ) : (
               <>
                <CheckCircle size={cfg.btnIconSize * 0.5} strokeWidth={2.5} className="mb-1" />
                <span className="font-semibold tracking-[0.15em] uppercase" style={{ fontSize: `${cfg.btnFontSize * 0.8}px` }}>Finish</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
});

export default RightPanelWidget;