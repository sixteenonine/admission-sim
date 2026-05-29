import React, { useState } from 'react';
import { ArrowLeft, History, CalendarDays, Trash2, ChevronDown, Filter } from 'lucide-react';
import { MODES } from '../utils/constants';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { syncManager } from '../utils/syncManager';
export default function ReflectionLobby({ themeVals, setCurrentView, reflectionHistory, setActiveSessionId, deleteHistory }) {
  const { bg, theme, shadowPlateau, shadowOuter, raisedGradient, shadowDeepInset, shadowCap, indentedGradient } = themeVals;
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [filterMode, setFilterMode] = useState('all');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const queryClient = useQueryClient();

  const { data: rawHistory = [] } = useQuery({
    queryKey: ['reflectionHistory', themeVals.currentUser?.id],
    queryFn: async () => {
      if (!themeVals.currentUser?.id) return [];
      const res = await fetch(`/api/history?userId=${themeVals.currentUser.id}`);
      if (!res.ok) throw new Error('Failed to fetch history');
      const json = await res.json();
      return json.data || [];
    },
    enabled: !!themeVals.currentUser?.id,
  });

  // ผสานข้อมูลจาก Local (กรณีออฟไลน์หรือเพิ่งสอบเสร็จ)
  const localHistoryStr = localStorage.getItem('bw_syncQueue');
  const localHistory = localHistoryStr ? JSON.parse(localHistoryStr).map(item => item.reflectionData) : [];
  
  const mergedHistoryMap = new Map();
  [...rawHistory, ...localHistory].forEach(session => {
     if (!mergedHistoryMap.has(session.id)) {
       mergedHistoryMap.set(session.id, session);
     }
  });
  const currentReflectionHistory = Array.from(mergedHistoryMap.values()).sort((a, b) => b.savedAt - a.savedAt);

  const deleteMutation = useMutation({
    mutationFn: async (idToDelete) => {
      // อัปเดตใน Local ทันทีเพื่อให้ UI หายไปก่อน
      const queueStr = localStorage.getItem('bw_syncQueue');
      let queue = queueStr ? JSON.parse(queueStr) : [];
      queue = queue.filter(item => item.reflectionData?.id !== idToDelete);
      localStorage.setItem('bw_syncQueue', JSON.stringify(queue));

      // ส่งคำสั่งลบไปเซิร์ฟเวอร์
      const response = await fetch('/api/history', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: themeVals.currentUser?.id, id: idToDelete })
      });
      if (!response.ok) throw new Error('Failed to delete on server');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reflectionHistory'] });
    }
  });

  const handleDelete = (id) => {
    deleteMutation.mutate(id);
    if(typeof deleteHistory === 'function') deleteHistory(id); // เผื่อ props เดิมยังส่งมา
  };

  const filteredHistory = currentReflectionHistory.filter(session => 
    filterMode === 'all' || (session.mode || 'full') === filterMode
  );

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
        <div className="relative shrink-0">
          {isFilterOpen && <div className="fixed inset-0 z-40" onClick={() => setIsFilterOpen(false)}></div>}
          <button 
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2.5 rounded-2xl border border-white/5 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider transition-all active:scale-95"
            style={{ background: shadowDeepInset ? 'transparent' : bg, boxShadow: shadowDeepInset, color: theme.textMain }}
          >
            <Filter size={14} className="opacity-70" />
            <span className="hidden sm:inline">{filterMode === 'all' ? 'ALL MODES' : MODES[filterMode]?.label.split(' ')[0]}</span>
            <ChevronDown size={14} className={`transition-transform duration-300 ${isFilterOpen ? 'rotate-180' : ''}`} />
          </button>
          
          <div 
            className={`absolute right-0 top-full mt-2 w-[160px] sm:w-[180px] rounded-2xl p-2 border border-white/10 transition-all duration-300 origin-top-right z-50 flex flex-col gap-1 ${isFilterOpen ? 'opacity-100 scale-100 pointer-events-auto translate-y-0' : 'opacity-0 scale-95 pointer-events-none -translate-y-2'}`}
            style={{ boxShadow: shadowOuter, background: raisedGradient }}
          >
            <button 
              onClick={() => { setFilterMode('all'); setIsFilterOpen(false); }} 
              className={`w-full text-left px-3 py-2 sm:px-4 sm:py-2.5 text-[10px] sm:text-[11px] font-bold tracking-wide transition-all flex items-center justify-between rounded-xl hover:bg-black/5 dark:hover:bg-white/5 ${filterMode === 'all' ? 'opacity-100' : 'opacity-70 hover:opacity-100'}`} 
              style={{ background: filterMode === 'all' ? (theme.bg === '#1e2229' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)') : 'transparent', color: filterMode === 'all' ? theme.textMain : theme.textSub }}
            >
              <span>ALL MODES</span>
              {filterMode === 'all' && <div className="w-1.5 h-1.5 rounded-full bg-blue-400 shadow-[0_0_8px_#60a5fa]" />}
            </button>
            {Object.entries(MODES).map(([key, { label }]) => {
              const isSelected = filterMode === key;
              return (
                <button 
                  key={key} 
                  onClick={() => { setFilterMode(key); setIsFilterOpen(false); }} 
                  className={`w-full text-left px-3 py-2 sm:px-4 sm:py-2.5 text-[10px] sm:text-[11px] font-bold tracking-wide transition-all flex items-center justify-between rounded-xl hover:bg-black/5 dark:hover:bg-white/5 ${isSelected ? 'opacity-100' : 'opacity-70 hover:opacity-100'}`} 
                  style={{ background: isSelected ? (theme.bg === '#1e2229' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)') : 'transparent', color: isSelected ? theme.textMain : theme.textSub }}
                >
                  <span>{label.split(' ')[0]}</span>
                  {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-blue-400 shadow-[0_0_8px_#60a5fa]" />}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {filteredHistory.length === 0 ? (
        <div className="w-full flex flex-col items-center justify-center p-16 rounded-[2.5rem] border border-white/5 opacity-50" style={{ background: raisedGradient, boxShadow: shadowPlateau, color: theme.textSub }}>
          <History size={64} className="mb-4 opacity-20" />
          <p className="font-medium text-lg">
            {reflectionHistory.length === 0 ? 'ยังไม่มีประวัติการสอบ' : 'ไม่พบประวัติในโหมดที่เลือก'}
          </p>
          <p className="text-sm mt-1 text-center">
            {reflectionHistory.length === 0 ? 'ข้อมูลจะถูกบันทึกเมื่อคุณทำข้อสอบจนเวลาหมดและกรอกคะแนน' : 'ลองเปลี่ยนตัวกรองเป็นโหมดอื่นเพื่อดูประวัติเพิ่มเติม'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6 auto-rows-max">
          {filteredHistory.map(session => (
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
                  <span className="text-lg lg:text-2xl font-black" style={{ color: session.finalScore > 0 ? ((session.finalScore / (MODES[session.mode]?.maxScore || 100)) >= 0.5 ? '#10b981' : '#f87171') : theme.textMain }}>
                    {session.finalScore > 0 ? `${session.finalScore}/${MODES[session.mode]?.maxScore || 100}` : '-'}
                  </span>
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
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-transparent backdrop-blur-md px-4 animate-in fade-in duration-200">
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