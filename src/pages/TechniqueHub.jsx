import React, { useMemo } from 'react';
import { ArrowLeft, BookOpen, TrendingDown, Award, Activity } from 'lucide-react';
import { FLAT_EXAM_SUBS, TECHNIQUE_GUIDES } from '../utils/constants';

export function TechniqueHubView({ themeVals, setCurrentView, history, cfg, onPartClick }) {
  const { bg, theme, shadowPlateau, shadowOuter, raisedGradient, indentedGradient, shadowDeepInset, shadowCap, shadowTrench } = themeVals;
  
  const averages = useMemo(() => {
    const result = {};
    FLAT_EXAM_SUBS.forEach(sub => {
      let totalRaw = 0;
      let validCount = 0;
      history.forEach(s => {
        const scoreRaw = s.scores?.[sub.id];
        if (scoreRaw !== '' && scoreRaw !== undefined && scoreRaw !== null) {
          totalRaw += Number(scoreRaw);
          validCount++;
        }
      });
      if (validCount > 0) {
        result[sub.id] = (totalRaw / validCount) / sub.max * 100;
      } else {
        result[sub.id] = null;
      }
    });
    return result;
  }, [history]);

  return (
    <div className="mt-24 mb-10 w-full px-4 flex flex-col z-10 animate-in fade-in slide-in-from-bottom-8 duration-300 mx-auto max-w-6xl gap-8">
      <div className="flex justify-between items-center bg-white/5 p-6 rounded-3xl border border-white/10" style={{ background: raisedGradient, boxShadow: shadowPlateau }}>
        <div className="flex items-center gap-4">
          <button onClick={() => setCurrentView('timer')} className="w-12 h-12 rounded-full flex items-center justify-center transition-all active:scale-95 border border-white/5 shrink-0" style={{ background: bg, boxShadow: shadowOuter, color: theme.textMain }}>
            <ArrowLeft size={18} />
          </button>
          <div className="flex flex-col min-w-0">
            <h2 className="text-xl font-bold tracking-wide truncate" style={{ color: theme.textMain }}>Technique Hub</h2>
            <p className="text-xs font-medium opacity-60 uppercase tracking-widest mt-1 truncate" style={{ color: theme.textSub }}>คัมภีร์เทคนิคการทำข้อสอบ 9 พาร์ท</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {FLAT_EXAM_SUBS.map(sub => {
          const percent = averages[sub.id];
          const needsImprovement = percent !== null && percent < 50;
          const isExcellent = percent !== null && percent >= 75;
          let statusColor = theme.textHighlight;
          let statusText = "ไม่มีประวัติคะแนน";
          let shadowStyle = shadowOuter;
          let bgStyle = raisedGradient;
          let StatusIcon = BookOpen;
          if (needsImprovement) {
            statusColor = '#ef4444';
            statusText = "ต้องปรับปรุง (Score < 50%)";
            StatusIcon = TrendingDown;
          } else if (isExcellent) {
            statusColor = '#10b981';
            statusText = "ทำได้ดีเยี่ยม (Score ≥ 75%)";
            StatusIcon = Award;
          } else if (percent !== null) {
            statusColor = '#f59e0b';
            statusText = "พอใช้ (Score 50-74%)";
            StatusIcon = Activity;
          }

          return (
            <div key={sub.id} onClick={() => onPartClick(sub.id)} className="p-6 rounded-[2rem] border border-white/5 flex flex-col gap-4 cursor-pointer hover:scale-[1.02] transition-transform relative overflow-hidden group" style={{ background: bgStyle, boxShadow: shadowStyle }}>
              {needsImprovement && (
                <div className="absolute top-0 right-0 w-24 h-24 rounded-bl-full opacity-[0.05] pointer-events-none" style={{ background: statusColor }}></div>
              )}
              <div className="flex justify-between items-start relative z-10">
                 <div className="w-12 h-12 rounded-full flex items-center justify-center border border-white/10 shrink-0 group-hover:scale-110 transition-transform" style={{ background: indentedGradient, boxShadow: shadowTrench, color: statusColor }}>
                    <StatusIcon size={20} />
                  </div>
                 <span className="text-[10px] font-bold px-2 py-1 rounded-full border border-white/5" style={{ background: indentedGradient, color: theme.textSub, boxShadow: shadowDeepInset }}>{sub.range}</span>
              </div>
              <div className="flex flex-col relative z-10">
                <span className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-1 truncate" style={{ color: theme.textMain }}>{sub.mainLabel}</span>
                <span className="text-lg font-bold leading-tight" style={{ color: theme.textMain }}>{sub.label}</span>
              </div>
              <div className="mt-auto pt-4 border-t border-black/5 dark:border-white/5 flex items-center gap-2 relative z-10">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: statusColor, boxShadow: `0 0 6px ${statusColor}` }}></div>
                <span className="text-[11px] font-bold tracking-wider" style={{ color: statusColor }}>{statusText}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function TechniqueDetailView({ themeVals, partId, onBack, cfg }) {
  const { bg, theme, shadowPlateau, shadowOuter, raisedGradient, shadowCap, indentedGradient, shadowDeepInset } = themeVals;
  const guide = TECHNIQUE_GUIDES[partId];
  if (!guide) return null;

  return (
    <div className="mt-24 mb-10 w-full px-4 flex flex-col z-10 animate-in fade-in slide-in-from-right-8 duration-300 mx-auto max-w-4xl gap-6">
      <div className="flex justify-between items-center bg-white/5 p-6 rounded-3xl border border-white/10" style={{ background: raisedGradient, boxShadow: shadowPlateau }}>
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="w-12 h-12 rounded-full flex items-center justify-center transition-all active:scale-95 border border-white/5 shrink-0" style={{ background: bg, boxShadow: shadowOuter, color: theme.textMain }}>
            <ArrowLeft size={18} />
          </button>
          <div className="flex flex-col min-w-0">
            <h2 className="text-xl font-bold tracking-wide truncate" style={{ color: theme.textMain }}>{guide.title}</h2>
            <p className="text-xs font-medium opacity-60 uppercase tracking-widest mt-1 truncate" style={{ color: theme.textSub }}>คัมภีร์เทคนิคสอบ</p>
          </div>
        </div>
      </div>

      <div className="w-full p-6 lg:p-10 rounded-[2.5rem] border border-white/5 flex flex-col gap-6" style={{ background: bg, boxShadow: shadowOuter }}>
         <div className="flex items-center gap-4 mb-2">
            <div className="w-14 h-14 rounded-full flex items-center justify-center border border-white/10 shrink-0" style={{ background: raisedGradient, boxShadow: shadowCap }}>
              <BookOpen size={28} className="text-emerald-500 drop-shadow-md" />
            </div>
            <div className="flex flex-col">
               <span className="text-2xl font-black leading-tight" style={{ color: theme.textMain }}>Techniques & Tips</span>
              <span className="text-sm font-bold opacity-50 uppercase tracking-widest mt-1" style={{ color: theme.textSub }}>เทคนิคการทำโจทย์</span>
            </div>
         </div>

         <div className="flex flex-col gap-4 mt-2">
            {guide.tips.map((tip, idx) => (
               <div key={idx} className="flex gap-4 p-5 md:p-6 rounded-[2rem] border border-white/5 items-start" style={{ background: indentedGradient, boxShadow: shadowDeepInset }}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-sm font-black mt-0.5" style={{ background: raisedGradient, color: '#10b981', boxShadow: shadowPlateau }}>
                  {idx + 1}
                </div>
                <p className="text-base md:text-lg font-medium leading-relaxed" style={{ color: theme.textMain }}>
                  {tip}
                </p>
              </div>
            ))}
         </div>
      </div>
    </div>
  );
}