import React, { useMemo, memo } from 'react';
import { TrendingUp, Tag, Award, Asterisk, ArrowLeft, History } from 'lucide-react';
import { FLAT_EXAM_SUBS } from '../utils/constants';

const LatestInsightWidget = memo(({ history, themeVals, cfg }) => {
  const { bg, theme, raisedGradient, shadowOuter } = themeVals;
  if (!history || history.length === 0) return null;

  const latest = history[0];
  const prev = history.length > 1 ? history[1] : null;

  const getInsight = (type) => {
    let val, prevVal, diff, isGood, label, unit, formatVal;
    if (type === 'score') {
      val = latest.finalScore || 0;
      prevVal = prev ? (prev.finalScore || 0) : null;
      diff = prev ? val - prevVal : null;
      isGood = diff >= 0; 
      label = 'คะแนน (SCORE)';
      unit = 'คะแนน';
      formatVal = val;
    } else if (type === 'time') {
      val = latest.finishTime ? latest.finishTime / 60 : latest.totalTime / 60;
      prevVal = prev ? (prev.finishTime ? prev.finishTime / 60 : prev.totalTime / 60) : null;
      diff = prev ? val - prevVal : null;
      isGood = diff <= 0; 
      label = 'เวลาที่ใช้ (TIME)';
      unit = 'นาที';
      formatVal = val.toFixed(1);
    } else if (type === 'marks') {
      val = latest.pointsData?.length || 0;
      prevVal = prev ? (prev.pointsData?.length || 0) : null;
      diff = prev ? val - prevVal : null;
      isGood = diff <= 0; 
      label = 'จุดลังเล (MARKS)';
      unit = 'จุด';
      formatVal = val;
    }
    return { val: formatVal, diff, isGood, label, unit };
  };

  const scoreData = getInsight('score');
  const timeData = getInsight('time');
  const marksData = getInsight('marks');

  const renderCard = (data) => {
    let diffColor = theme.textSub;
    let diffIcon = '';
    let diffText = '';
    let diffValStr = '';
    if (data.diff !== null) {
      if (data.diff === 0) {
         diffColor = theme.textSub;
         diffIcon = '-';
         diffText = 'เท่าเดิม';
         diffValStr = '(0)';
      } else {
         diffColor = data.isGood ? '#10b981' : '#ef4444'; 
         diffIcon = data.diff > 0 ? '▲' : '▼';
         diffText = data.isGood ? 'ดีขึ้น' : 'แย่ลง';
         diffValStr = `${data.diff > 0 ? '+' : ''}${typeof data.diff === 'number' && data.diff % 1 !== 0 ? data.diff.toFixed(1) : data.diff}`;
      }
    }

    return (
      <div className="flex-1 rounded-[2rem] border border-white/5 flex flex-col justify-between relative overflow-hidden" style={{ background: raisedGradient, boxShadow: shadowOuter, padding: `${cfg.spInsightPadding}px` }}>
         <div className="absolute -right-4 top-1/2 -translate-y-1/2 opacity-[0.03] pointer-events-none flex items-center justify-center text-current" style={{ color: theme.textMain }}>
            {data.label.includes('SCORE') ? (
               <div className="w-16 h-16 relative flex items-center justify-center">
                  <div className="w-full h-4 bg-current absolute rounded-full"></div>
                  <div className="w-4 h-full bg-current absolute rounded-full"></div>
               </div>
            ) : (
               <div className="w-12 h-4 bg-current rounded-full"></div>
            )}
         </div>
        <span className="font-bold opacity-60 mb-6 tracking-wide" style={{ color: theme.textSub, fontSize: `${cfg.spInsightLabelSize}px` }}>{data.label}</span>
        <div className="flex items-baseline gap-2 mb-8 z-10">
          <span className="font-black" style={{ color: theme.textMain, fontSize: `${cfg.spInsightValSize}px` }}>{data.val}</span>
          <span className="font-bold opacity-50" style={{ color: theme.textSub, fontSize: `${cfg.spInsightUnitSize}px` }}>{data.unit}</span>
        </div>
        <div className="flex items-center gap-1.5 z-10">
          {data.diff !== null ? (
            <div className="flex items-center gap-1.5 font-bold" style={{ color: diffColor }}>
              <span style={{ fontSize: `${cfg.spInsightDiffSize}px` }}>{diffIcon} {diffText}</span>
              <span style={{ fontSize: `${cfg.spInsightDiffSize}px` }}>({diffValStr})</span>
            </div>
          ) : (
             <span className="font-bold opacity-40 tracking-widest" style={{ color: theme.textSub, fontSize: `${cfg.spInsightDiffSize}px` }}>ไม่มีข้อมูลเปรียบเทียบ</span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full flex flex-col gap-6 relative z-10" style={{ width: cfg.spInsightW > 0 ? `${cfg.spInsightW}px` : '100%', height: cfg.spInsightH > 0 ? `${cfg.spInsightH}px` : 'auto', transform: `translate(${cfg.spInsightX}px, ${cfg.spInsightY}px)` }}>
       <div className="flex flex-col relative z-10">
         <h3 className="font-bold tracking-wide" style={{ color: theme.textMain, transform: `translate(${cfg.spInsightTitleX}px, ${cfg.spInsightTitleY}px)`, fontSize: `${cfg.spInsightTitleSize}px` }}>สรุปผลงานล่าสุด (Latest Insight)</h3>
         <p className="font-medium opacity-60 mt-1" style={{ color: theme.textSub, transform: `translate(${cfg.spInsightSubX}px, ${cfg.spInsightSubY}px)`, fontSize: `${cfg.spInsightSubSize}px` }}>เทียบการสอบรอบล่าสุด กับรอบก่อนหน้า</p>
       </div>
       <div className="flex flex-col md:flex-row gap-6 w-full relative z-10" style={{ transform: `translate(${cfg.spInsightCardsX}px, ${cfg.spInsightCardsY}px)` }}>
          {renderCard(scoreData)}
          {renderCard(timeData)}
          {renderCard(marksData)}
       </div>
    </div>
  );
});

const RecentScoreChartWidget = memo(({ history, themeVals, targetScore, setTargetScore, cfg }) => {
  const { bg, theme, raisedGradient, shadowOuter, shadowDeepInset } = themeVals;

  const chartData = useMemo(() => {
    if (!history || history.length === 0) return [];
    return history.slice(0, 5).reverse().map((s, idx) => {
       return {
         label: `รอบ ${s.sessionNumber || idx + 1}`,
         score: s.finalScore || 0,
         time: s.finishTime ? s.finishTime / 60 : s.totalTime / 60,
       };
    });
  }, [history]);

  if (chartData.length < 2) return null;

  const width = cfg.spTrendWidth;
  const height = cfg.spTrendHeight;
  const padX = cfg.spTrendPadX;
  const padY = cfg.spTrendPadY;
  const innerW = width - padX * 2;
  const innerH = height - padY * 2;

  const step = innerW / Math.max(1, chartData.length - 1);
  
  const points = chartData.map((d, i) => {
     const x = padX + i * step;
     const scoreY = height - padY - (d.score / 100) * innerH;
     const timeY = height - padY - (d.time / 90) * innerH;
     return { x, scoreY, timeY, score: d.score, time: d.time, label: d.label };
  });

  const scoreLinePath = `M ${points.map(p => `${p.x},${p.scoreY}`).join(' L ')}`;
  const timeLinePath = `M ${points.map(p => `${p.x},${p.timeY}`).join(' L ')}`;
  const areaPath = points.length > 0 
    ? `${scoreLinePath} L ${points[points.length - 1].x},${height - padY} L ${points[0].x},${height - padY} Z` 
    : '';
  const targetY = height - padY - ((Number(targetScore) || 0) / 100) * innerH;

  return (
    <div className="w-full p-6 lg:p-8 rounded-[2.5rem] border border-white/5 flex flex-col gap-6 relative" style={{ background: raisedGradient, boxShadow: shadowOuter, width: cfg.spTrendContainerW > 0 ? `${cfg.spTrendContainerW}px` : '100%', height: cfg.spTrendContainerH > 0 ? `${cfg.spTrendContainerH}px` : 'auto', transform: `translate(${cfg.spTrendX}px, ${cfg.spTrendY}px)` }}>
       <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4 w-full relative z-10">
         <div className="flex flex-col">
           <h3 className="font-bold tracking-wide" style={{ color: theme.textMain, transform: `translate(${cfg.spTrendTitleX}px, ${cfg.spTrendTitleY}px)`, fontSize: `${cfg.spTrendTitleSize}px` }}>Score Trend</h3>
           <p className="font-medium opacity-60 uppercase tracking-widest mt-1" style={{ color: theme.textSub, transform: `translate(${cfg.spTrendSubX}px, ${cfg.spTrendSubY}px)`, fontSize: `${cfg.spTrendSubSize}px` }}>สถิติคะแนนและเวลาที่ใช้เทียบกับเป้าหมาย</p>
         </div>
         
         <div className="flex items-center gap-4 sm:gap-6 shrink-0 flex-wrap justify-end relative z-10" style={{ transform: `translate(${cfg.spTrendInputX}px, ${cfg.spTrendInputY}px)` }}>
            <div className="flex items-center gap-3 hidden sm:flex">
               <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-0.5 rounded-full" style={{ background: '#b46bcf' }}></div>
                  <span className="text-[9px] font-bold uppercase tracking-widest opacity-80" style={{ color: theme.textSub }}>Score</span>
               </div>
               <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-0.5 rounded-full border-t-2 border-dashed" style={{ borderColor: '#3b82f6' }}></div>
                  <span className="text-[9px] font-bold uppercase tracking-widest opacity-80" style={{ color: theme.textSub }}>Time (m)</span>
               </div>
            </div>

            <div className="flex items-center gap-3 px-4 py-2 rounded-2xl border border-white/5 shrink-0" style={{ background: shadowDeepInset ? 'transparent' : bg, boxShadow: shadowDeepInset }}>
               <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-0.5 rounded-full" style={{ background: '#10b981' }}></div>
                  <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: theme.textSub }}>Target</span>
               </div>
               <input 
                 type="number" 
                 min="0" 
                 max="100" 
                 value={targetScore} 
                 onChange={(e) => setTargetScore(e.target.value === '' ? '' : Math.min(100, Math.max(0, Number(e.target.value))))} 
                 className="w-14 bg-transparent text-right outline-none font-black text-xl transition-colors focus:text-emerald-400"
                 style={{ color: '#10b981' }}
                 placeholder="80"
               />
            </div>
          </div>
       </div>
       
       <div className="w-full overflow-x-auto no-scrollbar relative z-10" style={{ transform: `translate(${cfg.spTrendSvgX}px, ${cfg.spTrendSvgY}px)` }}>
          <div className="min-w-[500px]">
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
              <defs>
                <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#b46bcf" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#b46bcf" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              {[0, 25, 50, 75, 100].map(v => {
                const y = height - padY - (v/100) * innerH;
                return (
                  <g key={v}>
                    <text x={padX - 15} y={y + 4} textAnchor="end" fill={theme.textSub} fontSize="10" opacity="0.6" className="font-mono">{v}</text>
                    <line x1={padX} y1={y} x2={width-padX} y2={y} stroke={theme.textMain} strokeOpacity={v===0?0.2:0.05} strokeWidth="1" strokeDasharray={v===0?"none":"4 4"} />
                  </g>
                )
              })}

              {Number(targetScore) > 0 && (
                <line x1={padX} y1={targetY} x2={width-padX} y2={targetY} stroke="#10b981" strokeOpacity="0.5" strokeWidth="1.5" />
               )}

              {points.length > 0 && (
                <path d={areaPath} fill="url(#trendGradient)" />
              )}

              <path d={timeLinePath} fill="none" stroke="#3b82f6" strokeWidth={cfg.spTrendStroke * 0.8} strokeLinecap="round" strokeLinejoin="round" strokeDasharray="6 6" style={{ filter: 'drop-shadow(0 4px 6px rgba(59,130,246,0.3))' }} />
              <path d={scoreLinePath} fill="none" stroke="#b46bcf" strokeWidth={cfg.spTrendStroke} strokeLinecap="round" strokeLinejoin="round" style={{ filter: 'drop-shadow(0 4px 6px rgba(180,107,207,0.3))' }} />

              {points.map((p, i) => {
                const isScoreAbove = p.scoreY <= p.timeY;
                return (
                  <g key={`pt-${i}`}>
                    {i === points.length - 1 && (
                      <rect x={p.x - 20} y={padY/2} width="40" height={height - padY} fill="#b46bcf" opacity="0.05" rx="8" />
                    )}
                    
                    <circle cx={p.x} cy={p.timeY} r={cfg.spTrendDotR * 0.8} fill={theme.bg} stroke="#3b82f6" strokeWidth="2" />
                    <text x={p.x} y={isScoreAbove ? p.timeY + 16 : p.timeY - 10} textAnchor="middle" fill="#3b82f6" fontSize={cfg.spTrendValSize * 0.85} fontWeight="bold">
                      {p.time.toFixed(1)}
                    </text>

                    <circle cx={p.x} cy={p.scoreY} r={cfg.spTrendDotR} fill={theme.bg} stroke="#b46bcf" strokeWidth="2.5" />
                    <text x={p.x} y={isScoreAbove ? p.scoreY - 12 : p.scoreY + 18} textAnchor="middle" fill={theme.textMain} fontSize={cfg.spTrendValSize} fontWeight="bold">
                      {p.score}
                    </text>
                    <text x={p.x} y={height - 10} textAnchor="middle" fill={theme.textSub} fontSize={cfg.spTrendLblSize} fontWeight="bold" className="uppercase tracking-wider">{p.label}</text>
                  </g>
                );
              })}
            </svg>
          </div>
       </div>
    </div>
  );
});

const SHORT_LABELS = {
  s1: 'Short Conv', s2: 'Long Conv', s3: 'Ads', s4: 'Review',
  s5: 'News', s6: 'Graph', s7: 'Article', s8: 'Text Comp', s9: 'Para Org'
};

const TopTagsWidget = memo(({ history, themeVals, cfg }) => {
  const { theme, raisedGradient, shadowOuter, indentedGradient, shadowDeepInset } = themeVals;

  const topTags = useMemo(() => {
    if (!history || history.length === 0) return [];
    const counts = {};
    history.forEach(session => {
      if (session.pointsData) {
        session.pointsData.forEach(point => {
          if (point.tags) {
            point.tags.forEach(tag => {
              counts[tag] = (counts[tag] || 0) + 1;
            });
          }
        });
      }
    });
    return Object.entries(counts)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);
  }, [history]);

  if (history.length < 1) return null;

  return (
    <div className="w-full p-6 lg:p-8 rounded-[2.5rem] border border-white/5 flex flex-col gap-6 relative" style={{ background: raisedGradient, boxShadow: shadowOuter, width: cfg.spBarContainerW > 0 ? `${cfg.spBarContainerW}px` : '100%', height: cfg.spBarContainerH > 0 ? `${cfg.spBarContainerH}px` : 'auto', transform: `translate(${cfg.spBarX}px, ${cfg.spBarY}px)` }}>
       <div className="flex flex-col border-b border-white/10 pb-4 relative z-10">
         <h3 className="font-bold tracking-wide" style={{ color: theme.textMain, transform: `translate(${cfg.spBarTitleX}px, ${cfg.spBarTitleY}px)`, fontSize: `${cfg.spBarTitleSize}px` }}>Top 3 Marked Tags</h3>
         <p className="font-medium opacity-60 uppercase tracking-widest mt-1" style={{ color: theme.textSub, transform: `translate(${cfg.spBarSubX}px, ${cfg.spBarSubY}px)`, fontSize: `${cfg.spBarSubSize}px` }}>3 อันดับจุดลังเลที่ถูกบันทึกบ่อยที่สุด</p>
       </div>

       <div className="w-full flex-1 flex flex-col justify-center relative z-10" style={{ transform: `translate(${cfg.spBarSvgX}px, ${cfg.spBarSvgY}px)` }}>
         {topTags.length === 0 ? (
           <div className="w-full h-full flex flex-col items-center justify-center opacity-40 font-medium pb-4" style={{ color: theme.textSub }}>
             <Tag size={32} className="mb-2 opacity-50" />
             <span>ยังไม่มีการบันทึกแท็กในประวัติ</span>
           </div>
         ) : (
           <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
             {topTags.map((t, i) => {
                const colors = ['#f59e0b', '#94a3b8', '#d97706'];
                const rankColor = colors[i] || theme.textHighlight;
                return (
                   <div key={t.tag} className="flex-1 rounded-[1.5rem] border border-white/5 p-5 lg:p-6 flex flex-col items-center justify-center relative overflow-hidden" style={{ background: indentedGradient, boxShadow: shadowDeepInset }}>
                     <div className="absolute top-0 right-0 w-16 h-16 rounded-bl-full opacity-10 pointer-events-none" style={{ background: rankColor }}></div>
                     <div className="flex items-center gap-2 mb-3">
                       <Award size={24} color={rankColor} className="drop-shadow-md" />
                       <span className="text-xl font-black drop-shadow-sm" style={{ color: rankColor }}>อันดับ {i+1}</span>
                     </div>
                     <span className="font-bold text-lg mb-1 truncate w-full text-center" style={{ color: theme.textMain }}>{t.tag}</span>
                     <span className="text-[11px] font-bold uppercase tracking-widest opacity-60" style={{ color: theme.textSub }}>{t.count} ครั้ง</span>
                   </div>
                )
             })}
           </div>
         )}
       </div>
    </div>
  );
});

const TopMarkedPartsWidget = memo(({ history, themeVals, cfg }) => {
  const { theme, raisedGradient, shadowOuter, indentedGradient, shadowDeepInset } = themeVals;

  const topParts = useMemo(() => {
    if (!history || history.length === 0) return [];
    const counts = {};
    history.forEach(session => {
      if (session.pointsData) {
        session.pointsData.forEach(point => {
          if (point.partName) {
            counts[point.partName] = (counts[point.partName] || 0) + 1;
          }
        });
      }
    });
    return Object.entries(counts)
      .map(([part, count]) => ({ part, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);
  }, [history]);

  if (history.length < 1) return null;

  return (
    <div className="w-full p-6 lg:p-8 rounded-[2.5rem] border border-white/5 flex flex-col gap-6 relative" style={{ background: raisedGradient, boxShadow: shadowOuter, width: cfg.spBarContainerW > 0 ? `${cfg.spBarContainerW}px` : '100%', height: cfg.spBarContainerH > 0 ? `${cfg.spBarContainerH}px` : 'auto', transform: `translate(${cfg.spBarX}px, ${cfg.spBarY}px)` }}>
       <div className="flex flex-col border-b border-white/10 pb-4 relative z-10">
         <h3 className="font-bold tracking-wide" style={{ color: theme.textMain, transform: `translate(${cfg.spBarTitleX}px, ${cfg.spBarTitleY}px)`, fontSize: `${cfg.spBarTitleSize}px` }}>Top 3 Marked Sections</h3>
         <p className="font-medium opacity-60 uppercase tracking-widest mt-1" style={{ color: theme.textSub, transform: `translate(${cfg.spBarSubX}px, ${cfg.spBarSubY}px)`, fontSize: `${cfg.spBarSubSize}px` }}>3 อันดับพาร์ทย่อยที่ถูกกดลังเลและ Mark บ่อยที่สุด</p>
       </div>

       <div className="w-full flex-1 flex flex-col justify-center relative z-10" style={{ transform: `translate(${cfg.spBarSvgX}px, ${cfg.spBarSvgY}px)` }}>
         {topParts.length === 0 ? (
           <div className="w-full h-full flex flex-col items-center justify-center opacity-40 font-medium pb-4" style={{ color: theme.textSub }}>
             <Asterisk size={32} className="mb-2 opacity-50" />
             <span>ยังไม่มีการ Mark ในประวัติ</span>
           </div>
         ) : (
           <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
             {topParts.map((t, i) => {
                const colors = ['#ef4444', '#f43f5e', '#fb7185'];
                const rankColor = colors[i] || theme.textHighlight;
                return (
                   <div key={t.part} className="flex-1 rounded-[1.5rem] border border-white/5 p-5 lg:p-6 flex flex-col items-center justify-center relative overflow-hidden" style={{ background: indentedGradient, boxShadow: shadowDeepInset }}>
                     <div className="absolute top-0 right-0 w-16 h-16 rounded-bl-full opacity-10 pointer-events-none" style={{ background: rankColor }}></div>
                     <div className="flex items-center gap-2 mb-3">
                       <Asterisk size={24} color={rankColor} className="drop-shadow-md" />
                       <span className="text-xl font-black drop-shadow-sm" style={{ color: rankColor }}>อันดับ {i+1}</span>
                     </div>
                     <span className="font-bold text-[13px] md:text-[14px] mb-1 truncate w-full text-center" style={{ color: theme.textMain }}>{t.part}</span>
                     <span className="text-[11px] font-bold uppercase tracking-widest opacity-60" style={{ color: theme.textSub }}>{t.count} ครั้ง</span>
                   </div>
                )
             })}
           </div>
         )}
       </div>
    </div>
  );
});

const SubPartHeatmapWidget = memo(({ history, themeVals, cfg, onPartClick }) => {
  const { bg, theme, raisedGradient, shadowOuter } = themeVals;
  const isDarkMode = theme.bg === "#1e2229";

  const sessions = useMemo(() => {
    if (!history || history.length === 0) return [];
    return history.slice(0, 5).reverse();
  }, [history]);

  const getHeatmapColor = (percent) => {
    if (percent === null || percent === undefined || isNaN(percent)) return isDarkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)';
    if (percent >= 75) return '#10b981';
    if (percent >= 50) return '#f59e0b';
    return '#ef4444';
  };

  if (sessions.length < 1) return null;

  return (
    <div className="w-full p-6 lg:p-8 rounded-[2.5rem] border border-white/5 flex flex-col gap-6 relative" style={{ background: raisedGradient, boxShadow: shadowOuter, width: cfg.spHeatContainerW > 0 ? `${cfg.spHeatContainerW}px` : '100%', height: cfg.spHeatContainerH > 0 ? `${cfg.spHeatContainerH}px` : 'auto', transform: `translate(${cfg.spHeatX}px, ${cfg.spHeatY}px)` }}>
       <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 z-10 border-b border-white/10 pb-4 relative">
         <div className="flex flex-col">
           <h3 className="font-bold tracking-wide" style={{ color: theme.textMain, transform: `translate(${cfg.spHeatTitleX}px, ${cfg.spHeatTitleY}px)`, fontSize: `${cfg.spHeatTitleSize}px` }}>Performance Heatmap</h3>
           <p className="font-medium opacity-60 uppercase tracking-widest mt-1" style={{ color: theme.textSub, transform: `translate(${cfg.spHeatSubX}px, ${cfg.spHeatSubY}px)`, fontSize: `${cfg.spHeatSubSize}px` }}>คลิกที่ชื่อพาร์ทเพื่อดูคัมภีร์เทคนิคการทำข้อสอบ</p>
         </div>
         <div className="flex flex-col items-start lg:items-end gap-1.5" style={{ transform: `translate(${cfg.spHeatLegX}px, ${cfg.spHeatLegY}px)` }}>
            <div className="flex items-center gap-2">
               <div className="flex flex-col items-center gap-1"><span className="text-[9px] font-mono opacity-60" style={{ color: theme.textMain }}>ปรับปรุง</span><div className="w-8 h-3 rounded-sm bg-[#ef4444]"></div></div>
               <div className="flex flex-col items-center gap-1"><span className="text-[9px] font-mono opacity-60" style={{ color: theme.textMain }}>พอได้</span><div className="w-8 h-3 rounded-sm bg-[#f59e0b]"></div></div>
               <div className="flex flex-col items-center gap-1"><span className="text-[9px] font-mono opacity-60" style={{ color: theme.textMain }}>ดีเยี่ยม</span><div className="w-8 h-3 rounded-sm bg-[#10b981]"></div></div>
            </div>
         </div>
       </div>

       <div className="w-full overflow-x-auto no-scrollbar relative z-10" style={{ transform: `translate(${cfg.spHeatSvgX}px, ${cfg.spHeatSvgY}px)` }}>
          <div className="min-w-[400px]">
             <div className="flex gap-2 mb-2">
                <div className="shrink-0" style={{ width: `${cfg.spHeatLblW}px` }}></div>
                {sessions.map(s => (
                   <div key={s.id} className="flex-1 text-center flex flex-col justify-end pb-1">
                      <span className="font-bold uppercase tracking-wider" style={{ color: theme.textMain, fontSize: `${cfg.spHeatLblSize}px` }}>รอบ {s.sessionNumber}</span>
                   </div>
                ))}
             </div>
             
             <div className="flex flex-col gap-2">
                 {FLAT_EXAM_SUBS.map(sub => (
                   <div key={sub.id} className="flex gap-2 items-center group cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 rounded-xl p-1 -ml-1 transition-colors" onClick={() => onPartClick(sub.id)}>
                       <div className="shrink-0 font-bold uppercase tracking-wider text-right pr-1 leading-tight group-hover:text-blue-500 transition-colors" style={{ color: theme.textSub, width: `${cfg.spHeatLblW}px`, fontSize: `${cfg.spHeatLblSize}px` }} title={`คลิกเพื่อดูเทคนิคทำพาร์ท ${sub.label}`}>
                          {SHORT_LABELS[sub.id]}
                       </div>
                       {sessions.map(s => {
                          const scoreRaw = s.scores?.[sub.id];
                          const percent = (scoreRaw !== '' && scoreRaw !== undefined) ? (Number(scoreRaw) / sub.max) * 100 : null;
                          return (
                             <div 
                               key={`${sub.id}-${s.id}`} 
                               className="flex-1 rounded-[6px] sm:rounded-lg flex items-center justify-center"
                               style={{ backgroundColor: getHeatmapColor(percent), height: `${cfg.spHeatBoxH}px` }}
                             >
                                {percent !== null && (
                                   <span className="font-bold text-white drop-shadow-md" style={{ fontSize: `${cfg.spHeatValSize}px` }}>
                                      {scoreRaw}/{sub.max}
                                   </span>
                                )}
                             </div>
                          )
                       })}
                    </div>
                 ))}
             </div>
          </div>
       </div>
    </div>
  );
});

export default function SkillProfileView({ themeVals, setCurrentView, history, targetScore, setTargetScore, cfg, onPartClick }) {
  const { bg, theme, shadowPlateau, shadowOuter, raisedGradient } = themeVals;
  return (
    <div className="mt-24 mb-10 w-full px-4 flex flex-col z-10 animate-in fade-in duration-300 mx-auto max-w-6xl gap-8">
      <div className="flex justify-between items-center bg-white/5 p-6 rounded-3xl border border-white/10" style={{ background: raisedGradient, boxShadow: shadowPlateau }}>
        <div className="flex items-center gap-4">
          <button onClick={() => setCurrentView('timer')} className="w-12 h-12 rounded-full flex items-center justify-center transition-all active:scale-95 border border-white/5 shrink-0" style={{ background: bg, boxShadow: shadowOuter, color: theme.textMain }}>
            <ArrowLeft size={18} />
          </button>
          <div className="flex flex-col min-w-0" style={{ transform: `translate(${cfg.spMainTitleGrpX}px, ${cfg.spMainTitleGrpY}px)` }}>
            <h2 className="font-bold tracking-wide truncate" style={{ color: theme.textMain, fontSize: `${cfg.spMainTitleSize}px` }}>Growth Trend & Profile</h2>
            <p className="font-medium opacity-60 uppercase tracking-widest mt-1 truncate" style={{ color: theme.textSub, fontSize: `${cfg.spMainSubSize}px` }}>สรุปและวิเคราะห์ผลการสอบ</p>
          </div>
        </div>
        <button 
          onClick={() => setCurrentView('reflection_lobby')}
          className="hidden md:flex px-6 py-3.5 rounded-full font-bold tracking-widest text-[11px] uppercase items-center gap-2 border border-white/10 transition-transform active:scale-95"
          style={{ background: raisedGradient, boxShadow: shadowOuter, color: theme.textMain }}
        >
          <History size={14} className="text-blue-500" />
          <span>History Lobby</span>
        </button>
      </div>

      <LatestInsightWidget history={history} themeVals={themeVals} cfg={cfg} />
      <RecentScoreChartWidget history={history} themeVals={themeVals} targetScore={targetScore} setTargetScore={setTargetScore} cfg={cfg} />

      {history.length < 2 && (
         <div className="w-full p-8 rounded-[2rem] border border-white/5 opacity-70 flex flex-col items-center justify-center text-center mt-4" style={{ background: raisedGradient, boxShadow: shadowPlateau, color: theme.textSub }}>
            <TrendingUp size={48} className="mb-4 opacity-20" />
            <span className="text-lg font-bold" style={{ color: theme.textMain }}>ข้อมูลยังไม่เพียงพอสำหรับการเปรียบเทียบ</span>
            <span className="text-xs mt-2 uppercase tracking-widest">ต้องมีการทำข้อสอบอย่างน้อย 2 รอบเพื่อดูความเปลี่ยนแปลง</span>
         </div>
      )}

      {history.length >= 2 && (
         <div className="w-full flex flex-col gap-6">
           <TopTagsWidget history={history} themeVals={themeVals} cfg={cfg} />
           <TopMarkedPartsWidget history={history} themeVals={themeVals} cfg={cfg} />
           <SubPartHeatmapWidget history={history} themeVals={themeVals} cfg={cfg} onPartClick={onPartClick} />
         </div>
      )}

      <button 
        onClick={() => setCurrentView('reflection_lobby')}
        className="md:hidden w-full py-5 rounded-[2rem] font-bold tracking-[0.15em] text-[13px] uppercase flex justify-center items-center gap-3 border border-white/10 transition-transform active:scale-[0.98]"
        style={{ background: raisedGradient, boxShadow: shadowOuter, color: theme.textMain }}
      >
        <History size={18} className="text-blue-500" />
        <span>View History Lobby</span>
      </button>
    </div>
  );
}