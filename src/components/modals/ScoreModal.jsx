import React, { useState } from 'react';
import { Award, X } from 'lucide-react';

function ScoreModal({ themeVals, setIsScoreModalOpen, handleFinishExam, resetTimer }) {
  const { bg, theme, shadowPlateau, shadowOuter, raisedGradient, shadowDeepInset, shadowCap } = themeVals;
  const [totalCorrect, setTotalCorrect] = useState('');

  const handleInput = (val) => {
    const num = parseInt(val.replace(/\D/g, ''), 10);
    setTotalCorrect(isNaN(num) ? '' : Math.min(num, 80));
  };

  const finalScore = totalCorrect === '' ? 0 : totalCorrect * 1.25;

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/20 backdrop-blur-md px-4 animate-in fade-in duration-300">
      <div className="w-full max-w-sm rounded-[2.5rem] border border-white/20 transition-all relative" style={{ padding: '9px', boxShadow: shadowPlateau, background: bg }}>
        <div className="w-full rounded-[2rem] p-8 flex flex-col gap-6 border border-white/5" style={{ background: bg, boxShadow: shadowOuter }}>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center border border-white/10" style={{ background: raisedGradient, boxShadow: shadowCap }}>
                <Award size={20} className="text-blue-500" />
              </div>
              <div>
                <h3 className="text-lg font-bold tracking-wide" style={{ color: theme.textMain }}>Score Entry</h3>
                <p className="text-[11px] font-medium opacity-60 uppercase tracking-wider" style={{ color: theme.textSub }}>Exam Completed</p>
              </div>
            </div>
            <button onClick={() => { setIsScoreModalOpen(false); resetTimer(); }} className="w-8 h-8 rounded-full flex items-center justify-center transition-all active:scale-95 border border-white/5" style={{ background: raisedGradient, boxShadow: shadowPlateau, color: theme.textMain }}><X size={14} /></button>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between p-5 rounded-2xl border border-white/5" style={{ background: raisedGradient, boxShadow: shadowPlateau }}>
              <div className="flex flex-col">
                <span className="text-[14px] font-semibold" style={{ color: theme.textMain }}>จำนวนข้อที่ทำถูก</span>
                <span className="text-[10px] font-medium opacity-50 mt-0.5" style={{ color: theme.textSub }}>คะแนนรวมจากทั้งหมด 80 ข้อ</span>
              </div>
              <div className="flex items-center gap-2">
                <input 
                  type="text" 
                  value={totalCorrect} 
                  onChange={(e) => handleInput(e.target.value)}
                  placeholder="0"
                  className="w-16 text-center bg-transparent outline-none font-black text-2xl border-b-2 transition-colors focus:border-blue-400 placeholder:opacity-30" 
                  style={{ color: theme.textMain, borderColor: theme.trackBg }} 
                />
                <span className="text-sm font-bold opacity-40" style={{ color: theme.textSub }}>/ 80</span>
              </div>
            </div>
          </div>

          <div className="mt-2 p-5 rounded-2xl border border-white/5 flex items-center justify-between" style={{ background: theme.bg === '#1e2229' ? '#13161a' : '#e2e8f0', boxShadow: shadowDeepInset }}>
            <span className="text-sm font-bold uppercase tracking-widest" style={{ color: theme.textMain }}>Total Score</span>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-black" style={{ color: finalScore >= 50 ? '#10b981' : (finalScore > 0 ? '#f87171' : theme.textMain) }}>{finalScore}</span>
              <span className="text-sm font-bold opacity-50" style={{ color: theme.textSub }}>/ 100</span>
            </div>
          </div>

          <button 
            onClick={() => { handleFinishExam(finalScore, {}); setIsScoreModalOpen(false); }}
            className="w-full mt-2 py-4 rounded-[1.25rem] font-bold tracking-widest text-[13px] uppercase transition-all active:scale-[0.98] border border-white/10"
            style={{ background: 'linear-gradient(145deg, #3b82f6, #2563eb)', color: '#ffffff', boxShadow: shadowPlateau }}
          >
            Continue to Reflection
          </button>
        </div>
      </div>
    </div>
  );
}

export default ScoreModal;