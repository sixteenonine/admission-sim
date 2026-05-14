import React, { useState, memo } from 'react';
import { Play, Pause, Volume2, VolumeX, RefreshCcw, FastForward } from 'lucide-react';
import { getTipColor } from '../../utils/helpers';

const StaticClockFace = memo(({ textSubColor }) => (
  <svg className="absolute inset-0 w-full h-full" viewBox="0 0 240 240">
    {[...Array(60)].map((_, i) => {
      const isHour = i % 5 === 0;
      return <line key={i} x1="120" y1={isHour ? "14" : "18"} x2="120" y2="24" stroke={textSubColor} strokeWidth={isHour ? "2" : "1"} transform={`rotate(${i * 6} 120 120)`} opacity={isHour ? 0.8 : 0.4} strokeLinecap="round" />;
    })}
  </svg>
));

const TimerDashboard = memo(({ cfg, themeVals, timeLeft, totalTime, isRunning, speed, marks, ambientOn, toggleAmbient, toggleTimer, skipTime, resetTimer, trackHue, countdown, isAutoTrackHue, mode }) => {
  const [isClockMode, setIsClockMode] = useState(false);
  const { bg, theme, raisedGradient, indentedGradient, shadowOuter, shadowCap, shadowPlateau, shadowTrench, shadowDimple } = themeVals;

  const isIdle = timeLeft === totalTime && !isRunning && countdown === null;
  
  let progressPercent;
  if (countdown !== null) {
    progressPercent = 0; 
  } else if (isIdle) {
    progressPercent = 100; 
  } else {
    progressPercent = ((totalTime - timeLeft) / totalTime) * 100; 
  }
  
  const trackSize = 340; 
  const circumference = 2 * Math.PI * cfg.trackRadius;
  const dashoffset = circumference - (progressPercent / 100) * circumference;
  const trackGlowColor = (isIdle || countdown !== null) ? '#3b82f6' : getTipColor(progressPercent);

  const currentTotalSeconds = (11 * 3600) + (totalTime - timeLeft);
  const hourDeg = (currentTotalSeconds / 43200) * 360;
  const minuteDeg = (currentTotalSeconds / 3600) * 360;
  const secondDeg = currentTotalSeconds * 6;

  return (
    <>
      <div 
        className="relative flex items-center justify-center w-[400px] h-[400px] rounded-full shrink-0"
        style={{ transform: `scale(${cfg.leftPanelScale}) translate(${cfg.leftPanelX}px, ${cfg.leftPanelY}px)`, transformOrigin: 'center center', transition: 'transform 0.1s' }}
      >
        <div className="absolute w-[340px] h-[340px] rounded-full flex items-center justify-center transition-shadow duration-100" style={{ boxShadow: shadowOuter, background: raisedGradient }}>
          <div className="absolute w-[290px] h-[290px] rounded-full flex items-center justify-center transition-shadow duration-100" style={{ background: indentedGradient, boxShadow: shadowTrench }}>
            <svg width={trackSize} height={trackSize} className="absolute transform rotate-90 pointer-events-none overflow-visible">
              <defs>
                <mask id="progressMask">
                  <circle cx={trackSize/2} cy={trackSize/2} r={cfg.trackRadius} fill="none" stroke="white" strokeWidth={cfg.trackStroke} strokeLinecap="butt" strokeDasharray={circumference} strokeDashoffset={dashoffset} style={{ transition: countdown !== null ? 'stroke-dashoffset 5s linear' : (isRunning ? 'stroke-dashoffset 1s linear' : 'stroke-dashoffset 0.5s ease') }} />
                </mask>
                <filter id="neonDrop" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#000000" floodOpacity="0.15" />
                  <feDropShadow dx="0" dy="0" stdDeviation="8" floodColor={trackGlowColor} floodOpacity="0.8" />
                </filter>
              </defs>
              <circle cx={trackSize/2} cy={trackSize/2} r={cfg.trackRadius} fill="none" stroke={theme.trackBg} strokeWidth={cfg.bgTrackStroke} />
              
              <g className={isAutoTrackHue ? "rgb-loop-anim" : ""} style={isAutoTrackHue ? undefined : { filter: `hue-rotate(${trackHue}deg)` }}>
                <g mask="url(#progressMask)" filter="url(#neonDrop)">
                  <foreignObject x="0" y="0" width={trackSize} height={trackSize}>
                    <div style={{ width: '100%', height: '100%', background: 'conic-gradient(from 90deg, #3b82f6 0%, #3b82f6 40%, #f97316 75%, #ef4444 100%)' }} />
                  </foreignObject>
                </g>
              </g>
              
              {marks.map((markPercent, i) => {
                const markAngleRad = ((markPercent / 100) * 360) * (Math.PI / 180);
                const cx = trackSize / 2, cy = trackSize / 2;
                const innerR = cfg.trackRadius - 10, outerR = cfg.trackRadius + 10;
                const x1 = cx + innerR * Math.cos(markAngleRad), y1 = cy + innerR * Math.sin(markAngleRad);
                const x2 = cx + outerR * Math.cos(markAngleRad), y2 = cy + outerR * Math.sin(markAngleRad);
                return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#ff0000" strokeWidth="3" strokeLinecap="round" className="drop-shadow-[0_0_4px_rgba(255,0,0,0.8)]" />;
              })}
            </svg>

            <div onClick={() => setIsClockMode(!isClockMode)} className="absolute w-[240px] h-[240px] rounded-full flex flex-col items-center justify-center border-[4px] transition-all duration-300 cursor-pointer overflow-hidden group" style={{ borderColor: theme.bg, boxShadow: shadowCap, background: raisedGradient }} title="Click to toggle Analog Clock">
              {isClockMode ? (
                <div className="relative w-full h-full rounded-full flex items-center justify-center" style={{ fontFamily: "'Outfit', 'Prompt', sans-serif" }}>
                  <StaticClockFace textSubColor={theme.textSub} />
                  <span className="absolute top-[32px] text-[18px] font-medium" style={{ color: theme.textMain }}>12</span>
                  <span className="absolute right-[34px] text-[18px] font-medium" style={{ color: theme.textMain }}>3</span>
                  <span className="absolute bottom-[32px] text-[18px] font-medium" style={{ color: theme.textMain }}>6</span>
                  <span className="absolute left-[34px] text-[18px] font-medium" style={{ color: theme.textMain }}>9</span>
                  <div className="absolute w-[4px] rounded-full origin-bottom z-10 drop-shadow-md" style={{ height: '55px', background: theme.textMain, bottom: '120px', transform: `rotate(${hourDeg}deg)`, transition: isRunning ? `transform ${1000/speed}ms linear` : 'transform 0.2s ease-out' }}></div>
                  <div className="absolute w-[3px] rounded-full origin-bottom z-10 drop-shadow-md" style={{ height: '80px', background: theme.textMain, bottom: '120px', transform: `rotate(${minuteDeg}deg)`, transition: isRunning ? `transform ${1000/speed}ms linear` : 'transform 0.2s ease-out' }}></div>
                  <div className="absolute w-[1.5px] z-20 drop-shadow-md" style={{ height: '110px', bottom: '100px', transformOrigin: 'center 90px', transform: `rotate(${secondDeg}deg)`, transition: isRunning ? `transform ${1000/speed}ms linear` : 'transform 0.2s ease-out' }}><div className="w-full h-full bg-[#ef4444] rounded-full"></div></div>
                  <div className="absolute w-3 h-3 rounded-full z-30" style={{ background: '#ef4444', border: `2px solid ${theme.bg}` }}></div>
                </div>
              ) : (
                <>
                  <div className="absolute inset-0 rounded-full">
                    <div className="absolute top-[16px] left-1/2 -translate-x-1/2 rounded-full flex items-center justify-center border-[2px] border-white/5 transition-all duration-100" style={{ width: cfg.dimpleSize, height: cfg.dimpleSize, boxShadow: shadowDimple, background: indentedGradient }}>
                      <div className={`w-2 h-2 rounded-full transition-colors duration-300 ${isRunning ? 'bg-red-500 shadow-[0_0_10px_#f87171,0_0_16px_#ef4444]' : 'bg-blue-400 shadow-[0_0_10px_#60a5fa,0_0_16px_#3b82f6]'}`}></div>
                    </div>
                  </div>
                  <div className="relative z-10 flex flex-col items-center pointer-events-none w-full" style={{ fontFamily: "'Outfit', 'Prompt', sans-serif" }}>
                    <div className="flex justify-center leading-none tracking-tight drop-shadow-[1px_1px_1px_rgba(255,255,255,0.05)]" style={{ color: theme.textHighlight, fontWeight: 200, fontSize: `${cfg.timeFontSize}rem`, transform: `translateY(${cfg.timeY}px)` }}>
                      <span className="w-[1.2em] text-right">{Math.floor(Math.ceil(timeLeft) / 60).toString().padStart(2, '0')}</span>
                      <span className="w-[0.3em] text-center">:</span>
                      <span className="w-[1.2em] text-left">{(Math.ceil(timeLeft) % 60).toString().padStart(2, '0')}</span>
                    </div>
                    <span className="tracking-[0.15em] uppercase" style={{ color: theme.textSub, fontWeight: 400, fontSize: `${cfg.labelFontSize}px`, transform: `translateY(${cfg.labelY}px)` }}>Minutes</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
 
      </div>

      <div 
        className="flex items-center justify-center gap-6 mt-6 z-10 w-full max-w-[340px]"
        style={{ transform: `scale(${cfg.controlPanelScale}) translate(${cfg.controlPanelX}px, ${cfg.controlPanelY}px)`, transformOrigin: 'center center', transition: 'transform 0.1s' }}
      >
        <button onClick={toggleAmbient} disabled={mode !== 'full'} className={`w-14 h-14 rounded-full flex items-center justify-center transition-all border border-white/5 ${mode !== 'full' ? 'opacity-30 cursor-not-allowed' : 'active:scale-[0.98]'}`} style={{ background: bg, color: ambientOn && mode === 'full' ? '#3b82f6' : theme.textMain, boxShadow: shadowPlateau }}>
  {ambientOn && mode === 'full' ? <Volume2 size={20} /> : <VolumeX size={20} />}
</button>
        <button onClick={toggleTimer} className="w-[84px] h-[84px] rounded-full flex items-center justify-center transition-all active:scale-[0.98] border border-white/5" style={{ background: bg, color: theme.textMain, boxShadow: shadowPlateau }}>
          {isRunning ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="ml-2" />}
        </button>
        <button onClick={skipTime} className="w-14 h-14 rounded-full flex items-center justify-center transition-all active:scale-[0.98] border border-white/5" style={{ background: bg, color: theme.textMain, boxShadow: shadowPlateau }} title="Skip 5 Minutes">
          <FastForward size={20} />
        </button>
        <button onClick={resetTimer} className="w-14 h-14 rounded-full flex items-center justify-center transition-all active:scale-[0.98] border border-white/5" style={{ background: bg, color: theme.textMain, boxShadow: shadowPlateau }}>
          <RefreshCcw size={20} />
        </button>
      </div>
    </>
  );
});

export default TimerDashboard;