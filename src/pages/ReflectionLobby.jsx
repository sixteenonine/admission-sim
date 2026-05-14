import React, { useState } from 'react';
import { ArrowLeft, History, CalendarDays, Trash2 } from 'lucide-react';
import { MODES } from '../utils/constants';

export default function ReflectionLobby({ themeVals, setCurrentView, reflectionHistory, setActiveSessionId, deleteHistory }) {
  const { bg, theme, shadowPlateau, shadowOuter, raisedGradient, shadowDeepInset, shadowCap, indentedGradient } = themeVals;
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  return (
    <div className="mt-24 mb-10 w-full px-4 flex flex-col z-10 animate-in fade-in slide-in-from-right-8 duration-300 mx-auto max-w-5xl gap-6">
      
      <div className="flex justify-between items-center bg-white/5 p-6 rounded-3xl border border-white/10" style={{ background: raisedGradient, boxShadow: shadowPlateau }}>
        <div className="flex items-center gap-4">
          <button onClick={() => setCurrentView('skill_profile')} className="w-12 h-12 rounded-full flex items-center justify-center transition-all active:scale-95 border border-white/5 shrink-0" style={{ background: bg, boxShadow: shadowOuter, color: theme.textMain }}>
            <ArrowLeft size={18} />
          </button>
          <div className="flex flex-col min-w-0">
            <h2 className="text-xl font-bold tracking-wide truncate" style={{ color: theme.textMain }}>Reflection History</h2>
            <p className="text-xs font-medium opacity-60 uppercase tracking-widest mt-1 truncate" style={{ color: theme.textSub }}>ประวัติการทบทวนกลยุทธ์สอบ</p>
          </div>
        </div>
      </div>

      {reflectionHistory.length === 0 ? (
        <div className="w-full flex flex-col items-center justify-center p-16 rounded-[2.5rem] border border-white/5 opacity-50" style={{ background: raisedGradient, boxShadow: shadowPlateau, color: theme.textSub }}>
          <History size={64} className="mb-4 opacity-20" />
          <p className="font-medium text-lg">ยังไม่มีประวัติการสอบ</p>
          <p className="text-sm mt-1">ข้อมูลจะถูกบันทึกเมื่อคุณทำข้อสอบจนเวลาหมดและกรอกคะแนน</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6 auto-rows-max">
          {reflectionHistory.map(session => (
            <div key={session.id} className="relative group p-4 lg:p-6 rounded-[2rem] lg:rounded-[2.5rem] border border-white/5 flex flex-col justify-between transition-all hover:scale-[1.02] cursor-pointer aspect-square" style={{ background: raisedGradient, boxShadow: shadowOuter }} onClick={() => { setActiveSessionId(session.id); setCurrentView('reflection'); }}>
              
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2 lg:gap-3 overflow-hidden">
                  <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-full shrink-0 flex items-center justify-center border border-white/10" style={{ background: bg, boxShadow: shadowCap, color: theme.textMain }}>
                    <CalendarDays size={18} />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="font-bold text-xs lg:text-sm truncate" style={{ color: theme.textMain }}>รอบ {session.sessionNumber || '?'}</span>
                    <span className="text-[8px] lg:text-[10px] font-bold uppercase tracking-wider opacity-60 truncate" style={{ color: theme.textSub }}>{session.date}</span>
                    <span className="text-[8px] font-bold uppercase opacity-40 truncate mt-0.5" style={{ color: theme.textSub }}>{MODES[session.mode]?.label || session.mode}</span>
                  </div>
                </div>
                <button onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(session.id); }} className="w-8 h-8 shrink-0 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 hover:text-red-500 transition-all border border-white/5" style={{ background: bg, boxShadow: shadowPlateau, color: theme.textSub }}>
                  <Trash2 size={14} />
                </button>
              </div>

              <div className="flex flex-col gap-2 mt-auto">
                <div className="px-3 py-2 lg:px-4 lg:py-3 rounded-2xl flex items-center justify-between gap-1 border border-white/5" style={{ background: shadowDeepInset ? 'transparent' : bg, boxShadow: shadowDeepInset }}>
                  <span className="text-[9px] lg:text-[10px] uppercase font-bold tracking-widest opacity-60" style={{ color: theme.textSub }}>Score</span>
                  <span className="text-lg lg:text-2xl font-black" style={{ color: session.finalScore >= 50 ? '#10b981' : (session.finalScore > 0 ? '#f87171' : theme.textMain) }}>{session.finalScore > 0 ? session.finalScore : '-'}</span>
                </div>
                <div className="px-3 py-2 lg:px-4 lg:py-3 rounded-2xl flex items-center justify-between gap-1 border border-white/5" style={{ background: shadowDeepInset ? 'transparent' : bg, boxShadow: shadowDeepInset }}>
                  <span className="text-[9px] lg:text-[10px] uppercase font-bold tracking-widest opacity-60" style={{ color: theme.textSub }}>Marks</span>
                  <span className="text-lg lg:text-2xl font-black" style={{ color: '#ea580c' }}>{session.pointsData?.length || 0}</span>
                </div>
              </div>

            </div>
          ))}
        </div>
      )}

      {confirmDeleteId && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/20 backdrop-blur-md px-4 animate-in fade-in duration-200">
          <div className="p-6 rounded-[2rem] max-w-sm w-full border border-white/10 flex flex-col items-center text-center animate-in zoom-in-95 duration-200" style={{ background: bg, boxShadow: shadowOuter }}>
             <h3 className="text-lg font-bold mb-2" style={{color: theme.textMain}}>ลบประวัติการสอบ?</h3>
             <p className="text-sm mb-6 opacity-70" style={{color: theme.textSub}}>ประวัติการสอบและบันทึก Reflection ในรอบนี้จะถูกลบถาวร ไม่สามารถกู้คืนได้</p>
             <div className="flex w-full gap-3">
                <button onClick={() => setConfirmDeleteId(null)} className="flex-1 py-3.5 rounded-2xl font-bold opacity-70 border border-white/10 hover:opacity-100 transition-opacity" style={{color: theme.textMain, background: indentedGradient}}>ยกเลิก</button>
                <button onClick={() => { deleteHistory(confirmDeleteId); setConfirmDeleteId(null); }} className="flex-1 py-3.5 rounded-2xl font-bold text-white shadow-lg transition-transform active:scale-95" style={{background: '#ef4444'}}>ยืนยันลบ</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}