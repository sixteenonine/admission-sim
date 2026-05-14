import React, { useState, useCallback } from 'react';
import { ArrowLeft, Award, ChevronRight, History, Tag, MessageSquare, Clock, Asterisk, X, Plus } from 'lucide-react';
import { EXAM_PARTS, FLAT_EXAM_SUBS } from '../utils/constants';
import { calculateScores } from '../utils/helpers';

function NoteInputArea({ initialNote, onSave, onClose, themeVals, cfg }) {
  const [val, setVal] = useState(initialNote || '');
  const { bg, theme, shadowDeepInset } = themeVals;

  const handleBlur = () => { onSave(val); };

  return (
      <div className="animate-in fade-in slide-in-from-top-2 duration-300 w-full mt-2">
          <textarea
              value={val}
              onChange={e => setVal(e.target.value)}
              onBlur={handleBlur}
              placeholder="บันทึกข้อผิดพลาด หรือความคิดในตอนนั้น..."
              className="w-full rounded-2xl outline-none resize-none placeholder:opacity-30 border transition-colors focus:border-blue-400/50"
              style={{ fontSize: `${cfg.refNoteSize}px`, padding: `${cfg.refNoteSize}px`, height: `${cfg.refNoteSize * 6}px`, background: bg, color: theme.textMain, borderColor: theme.trackBg, boxShadow: shadowDeepInset }}
              autoFocus
          />
          <div className="flex justify-end mt-2">
              <button onClick={onClose} className="font-bold uppercase tracking-wider opacity-60 transition-opacity" style={{ fontSize: `${cfg.refNoteSize - 2}px`, color: theme.textSub }}>ปิดช่องบันทึก</button>
          </div>
      </div>
  )
}

function ManageTagsPanel({ customTags, setCustomTags, themeVals, cfg, isManageTagsOpen }) {
  const [newTagInput, setNewTagInput] = useState('');
  const { bg, theme, shadowPlateau, shadowOuter, raisedGradient, shadowDeepInset, indentedGradient, shadowTrench } = themeVals;

  if (!isManageTagsOpen) return null;
  const safeCustomTags = Array.isArray(customTags) ? customTags : [];

  const handleAddCustomTag = (e) => {
    e.preventDefault();
    const trimmed = newTagInput.trim();
    if (!trimmed) return;
    const finalTag = trimmed.startsWith('#') ? trimmed : `#${trimmed}`;
    if (!safeCustomTags.includes(finalTag)) setCustomTags([...safeCustomTags, finalTag]);
    setNewTagInput('');
  };

  const handleDeleteTag = (tagToDelete) => {
    setCustomTags(safeCustomTags.filter(t => t !== tagToDelete));
  };

  const tagShadow = `inset 2px 2px ${cfg.refTagShadow}px ${theme.shadowDark}, inset -2px -2px ${cfg.refTagShadow}px ${theme.shadowLight}`;

  const renderTag = (tag, onClick) => (
    <button
      key={tag}
      onClick={onClick}
      className="font-bold flex items-center justify-center border border-white/5 opacity-60 transition-opacity hover:opacity-100"
      style={{ 
        fontSize: `${cfg.refTagSize}px`, padding: `${cfg.refTagSize/2}px ${cfg.refTagSize}px`, color: theme.textMain, 
        background: indentedGradient, boxShadow: tagShadow, borderRadius: `${cfg.dropRadius}px`
      }}
    >
      {tag}
      <X size={cfg.refTagSize * 0.8} className="ml-1.5 opacity-50" />
    </button>
  );

  return (
    <div className="p-6 rounded-3xl border border-white/5 flex flex-col gap-4 animate-in slide-in-from-top-4 fade-in duration-300 w-full" style={{ background: raisedGradient, boxShadow: shadowPlateau }}>
      <span className="text-[10px] uppercase font-bold tracking-widest" style={{ color: theme.textHighlight }}>Manage Custom Tags</span>
      <form onSubmit={handleAddCustomTag} className="flex gap-2">
        <input 
          type="text" 
          value={newTagInput} 
          onChange={(e) => setNewTagInput(e.target.value)} 
          placeholder="พิมพ์แท็กใหม่แล้วกด Enter..." 
          className="flex-1 rounded-xl px-4 py-2.5 text-xs font-medium outline-none placeholder:opacity-30 border transition-colors focus:border-blue-400/50"
          style={{ background: bg, color: theme.textMain, borderColor: theme.trackBg, boxShadow: shadowDeepInset }}
        />
        <button type="submit" className="w-10 h-10 shrink-0 rounded-xl flex items-center justify-center border border-white/10 transition-transform active:scale-95" style={{ background: bg, boxShadow: shadowOuter, color: theme.textMain }}>
          <Plus size={16} />
        </button>
      </form>
      <div className="flex flex-wrap" style={{ gap: `${cfg.refItemGap}px` }}>
        {safeCustomTags.map(tag => renderTag(tag, () => handleDeleteTag(tag)))}
      </div>
    </div>
  );
}

function ReflectionCardItem({ point, index, customTags, themeVals, cfg, onUpdatePoint, sessionId }) {
  const [isNoteExpanded, setIsNoteExpanded] = useState(false);
  const { bg, theme, shadowPlateau, raisedGradient, shadowDeepInset, indentedGradient, shadowTrench } = themeVals;

  const safeQText = point?.qText != null ? String(point.qText) : '0/0';
  const [qCurr, qTot] = safeQText.split('/');
  const safeTags = Array.isArray(point?.tags) ? point.tags : [];
  const safeCustomTags = Array.isArray(customTags) ? customTags : [];

  const rightColShadow = `inset 4px 4px ${cfg.refRightColShadow}px ${theme.shadowDark}, inset -4px -4px ${cfg.refRightColShadow}px ${theme.shadowLight}`;
  const tagShadow = `inset 2px 2px ${cfg.refTagShadow}px ${theme.shadowDark}, inset -2px -2px ${cfg.refTagShadow}px ${theme.shadowLight}`;

  const handleTagClick = useCallback((tag) => {
      const currentTags = Array.isArray(point?.tags) ? point.tags : [];
      const isActive = currentTags.includes(tag);
      const newTags = isActive ? currentTags.filter(t => t !== tag) : [...currentTags, tag];
      onUpdatePoint(sessionId, point?.id, 'tags', newTags);
  }, [point?.tags, point?.id, sessionId, onUpdatePoint]);

  const renderTag = (tag, isActive, onClick) => (
    <button
      key={tag}
      onClick={onClick}
      className={`font-bold flex items-center justify-center border border-white/5 transition-opacity ${isActive ? 'opacity-100' : 'opacity-60 hover:opacity-100'}`}
      style={{ 
        fontSize: `${cfg.refTagSize}px`, padding: `${cfg.refTagSize/2}px ${cfg.refTagSize}px`, color: theme.textMain, 
        background: indentedGradient, boxShadow: isActive ? shadowTrench : tagShadow, borderRadius: `${cfg.dropRadius}px`
      }}
    >
      {tag}
    </button>
  );

  return (
    <div className="w-full flex rounded-[2rem] border border-white/5 overflow-hidden relative z-10" style={{ background: raisedGradient, boxShadow: shadowPlateau, height: cfg.refCardHeight > 0 ? `${cfg.refCardHeight}px` : 'auto' }}>
      <div className="flex-1 flex flex-col border-r border-black/5" style={{ padding: `${cfg.refCardPadding}px`, gap: `${cfg.refItemGap}px`, borderColor: theme.bg === "#1e2229" ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.05)', lineHeight: cfg.refLineHeight }}>
        
        <div className="flex justify-between items-center w-full" style={{ fontFamily: "'Outfit', 'Prompt', sans-serif" }}>
          <div className="flex items-center opacity-50" style={{ color: theme.textMain, gap: `${cfg.refItemGap/2}px`, transform: `translate(${cfg.refTimeX}px, ${cfg.refTimeY}px)` }}>
            <Clock size={cfg.refIconSize} />
            <span style={{ fontSize: `${cfg.refTimeSize}px`, fontWeight: 'bold', letterSpacing: '0.05em' }}>{point?.timestamp || '--:--'}</span>
          </div>
          {qCurr && qTot && (
            <div style={{ color: theme.textMain, fontSize: `${cfg.refQTextSize}px`, fontWeight: 900, transform: `translate(${cfg.refQTextX}px, ${cfg.refQTextY}px)` }}>
              {qCurr}<span style={{ fontSize: `${cfg.refQTextSize * 0.6}px`, opacity: 0.5, fontWeight: 'bold' }}>/{qTot}</span>
            </div>
          )}
        </div>

        <h3 style={{ color: theme.textMain, fontSize: `${cfg.refPartSize}px`, fontWeight: 'bold', letterSpacing: '0.025em', transform: `translate(${cfg.refPartX}px, ${cfg.refPartY}px)` }}>
          {point?.partName || 'Unknown Part'}
        </h3>

        <div className="w-full h-[1px] opacity-10" style={{ background: theme.textMain }} />

        <div className="flex flex-wrap" style={{ gap: `${cfg.refItemGap}px`, transform: `translate(${cfg.refTagX}px, ${cfg.refTagY}px)` }}>
          {safeCustomTags.map(tag => renderTag(tag, safeTags.includes(tag), () => handleTagClick(tag)))}
        </div>

        <div style={{ transform: `translate(${cfg.refNoteX}px, ${cfg.refNoteY}px)` }}>
          {isNoteExpanded ? (
            <NoteInputArea initialNote={point?.note} onSave={(val) => onUpdatePoint(sessionId, point?.id, 'note', val)} onClose={() => setIsNoteExpanded(false)} themeVals={themeVals} cfg={cfg} />
          ) : (
            <div className="flex flex-col items-start" style={{ gap: `${cfg.refItemGap/2}px` }}>
              <button 
                onClick={() => setIsNoteExpanded(true)} 
                className="font-bold flex items-center opacity-60 hover:opacity-100 transition-opacity"
                style={{ fontSize: `${cfg.refNoteSize}px`, gap: `${cfg.refItemGap/2}px`, color: point?.note ? '#3b82f6' : theme.textMain }}
              >
                <MessageSquare size={cfg.refIconSize * 0.7} /> {point?.note ? 'แก้ไขบันทึกย่อ' : 'เพิ่มบันทึกย่อ'}
              </button>
              {point?.note && (
                <p className="opacity-70 italic border-l-2 border-blue-500/30 pl-2 ml-1 mt-1" style={{ fontSize: `${cfg.refNoteSize}px`, color: theme.textSub }}>
                  "{point.note.length > 60 ? point.note.substring(0, 60) + '...' : point.note}"
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="shrink-0 flex flex-col items-center justify-center relative border-l border-white/5" style={{ width: `${cfg.refRightColWidth}px`, gap: `${cfg.refItemGap}px`, background: indentedGradient, boxShadow: rightColShadow }}>
        <Asterisk size={cfg.refAsteriskSize} strokeWidth={2.5} className="text-[#ea580c] relative z-10 drop-shadow-md" style={{ transform: `translate(${cfg.refAsteriskX}px, ${cfg.refAsteriskY}px)` }} />
        <span className="font-black uppercase tracking-widest opacity-40 relative z-10" style={{ color: theme.textMain, fontSize: `${cfg.refMarkSize}px`, fontFamily: "'Outfit', 'Prompt', sans-serif", transform: `translate(${cfg.refMarkX}px, ${cfg.refMarkY}px)` }}>Mark {index + 1}</span>
      </div>
    </div>
  );
}

export function ReflectionView({ themeVals, setCurrentView, sessionData, isDraftMode, onUpdatePoint, onUpdateSessionData, onSaveDraft, onDiscardDraft, customTags, setCustomTags, cfg, onOpenScoreEdit }) {
  const { bg, theme, shadowPlateau, shadowOuter, raisedGradient, shadowDeepInset, indentedGradient, shadowTrench, shadowCap } = themeVals;
  const [isManageTagsOpen, setIsManageTagsOpen] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  if (!sessionData) return null;
  
  const pointsData = Array.isArray(sessionData.pointsData) ? sessionData.pointsData : [];
  const currentCalculatedScores = calculateScores(sessionData.scores || {});
  const safeCustomTags = Array.isArray(customTags) ? customTags : [];

  return (
    <div className="mt-24 mb-10 w-full px-4 flex flex-col z-10 animate-in fade-in slide-in-from-bottom-8 duration-500 mx-auto" style={{ maxWidth: `${cfg.refCardMaxWidth}px`, gap: `${cfg.refCardGap}px` }}>
      
      <div className="flex justify-between items-center bg-white/5 p-6 rounded-3xl border border-white/10" style={{ background: raisedGradient, boxShadow: shadowPlateau }}>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => {
              if (isDraftMode) setShowDiscardConfirm(true);
              else setCurrentView('reflection_lobby');
            }} 
            className="w-12 h-12 rounded-full flex items-center justify-center border border-white/5 shrink-0" 
            style={{ background: bg, boxShadow: shadowOuter, color: theme.textMain }}
          >
            <ArrowLeft size={18} />
          </button>
          <div className="flex flex-col min-w-0">
            <h2 className="text-xl font-bold tracking-wide truncate" style={{ color: theme.textMain }}>
              Time Reflection รอบ {sessionData.sessionNumber || '?'}
            </h2>
            <div className="flex items-center gap-2 mt-1 text-xs font-medium opacity-80 uppercase tracking-widest truncate" style={{ color: theme.textSub }}>
              <span className="truncate">{sessionData.date || 'Unknown Date'}</span>
              <span className="w-1 h-1 rounded-full bg-current shrink-0"></span>
              <span className="font-bold shrink-0" style={{ color: sessionData.finalScore >= 50 ? '#10b981' : '#f87171' }}>
                SCORE: {sessionData.finalScore != null ? sessionData.finalScore : '-'}/100
              </span>
              {sessionData.finishTime != null && (
                <>
                  <span className="w-1 h-1 rounded-full bg-current shrink-0"></span>
                  <span className="font-bold shrink-0 text-blue-400">
                    TIME: {Math.floor(sessionData.finishTime/60)}:{(Math.floor(sessionData.finishTime)%60).toString().padStart(2,'0')} M
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button 
            onClick={() => setIsManageTagsOpen(!isManageTagsOpen)}
            className={`px-4 py-2.5 rounded-full flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider border ${isManageTagsOpen ? 'border-white/20 opacity-100' : 'border-white/5 opacity-70'}`}
            style={{ background: isManageTagsOpen ? indentedGradient : bg, boxShadow: shadowOuter, color: theme.textMain }}
          >
            <Tag size={14} /> แท็ก
          </button>
        </div>
      </div>

      <div className="w-full p-6 rounded-[2rem] border border-white/5 flex flex-col gap-5 z-10 relative" style={{ background: raisedGradient, boxShadow: shadowPlateau }}>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Award size={16} className="text-blue-500" />
            <span className="text-[11px] uppercase font-bold tracking-widest" style={{ color: theme.textHighlight }}>Score Breakdown</span>
          </div>
          <button onClick={onOpenScoreEdit} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/5" style={{ background: indentedGradient, boxShadow: shadowDeepInset, color: theme.textMain }}>
            <span className="text-[9px] font-bold uppercase tracking-wider">แก้ไขคะแนนรายหัวข้อ</span>
            <ChevronRight size={12} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {EXAM_PARTS.map(part => (
            <div key={part.id} className="p-4 rounded-[1.25rem] border border-white/5 flex flex-col gap-1" style={{ background: indentedGradient, boxShadow: shadowDeepInset }}>
              <span className="text-[10px] font-bold opacity-50 uppercase tracking-widest truncate" style={{ color: theme.textSub }} title={part.label}>{part.label}</span>
              <div className="flex items-baseline gap-1 mt-1">
                 <span className="text-2xl font-black" style={{ color: theme.textMain }}>
                   {currentCalculatedScores.hasInput ? currentCalculatedScores[part.id] : '-'}
                 </span>
                 <span className="text-xs font-bold opacity-40" style={{ color: theme.textSub }}>/ {part.max}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showDiscardConfirm && (
        <div className="fixed inset-0 z-[350] flex items-center justify-center bg-black/20 backdrop-blur-md px-4 animate-in fade-in duration-200">
          <div className="p-6 rounded-[2rem] max-w-sm w-full border border-white/10 flex flex-col items-center text-center animate-in zoom-in-95 duration-200" style={{ background: bg, boxShadow: shadowOuter }}>
             <h3 className="text-lg font-bold mb-2" style={{color: theme.textMain}}>ละทิ้งบันทึกนี้?</h3>
             <p className="text-sm mb-6 opacity-70" style={{color: theme.textSub}}>หากกดละทิ้ง ข้อมูล Reflection ครั้งนี้จะไม่ถูกบันทึกลงใน History Lobby</p>
             <div className="flex w-full gap-3">
                <button onClick={() => setShowDiscardConfirm(false)} className="flex-1 py-3.5 rounded-2xl font-bold opacity-70 border border-white/10 hover:opacity-100 transition-opacity" style={{color: theme.textMain, background: indentedGradient}}>ยกเลิก</button>
                <button onClick={() => { setShowDiscardConfirm(false); onDiscardDraft(); }} className="flex-1 py-3.5 rounded-2xl font-bold text-white shadow-lg transition-transform active:scale-95" style={{background: '#f87171'}}>ยืนยันละทิ้ง</button>
             </div>
          </div>
        </div>
      )}

      <ManageTagsPanel customTags={safeCustomTags} setCustomTags={setCustomTags} themeVals={themeVals} cfg={cfg} isManageTagsOpen={isManageTagsOpen} />

      <div className="w-full flex flex-col relative mt-4" style={{ gap: `${cfg.refCardGap}px` }}>
        {pointsData.length === 0 ? (
          <div className="text-center p-12 rounded-3xl border border-white/5 opacity-50 font-medium" style={{ color: theme.textSub, background: raisedGradient, boxShadow: shadowPlateau }}>
            ไม่มีบันทึกเวลา (Mark Point) ในรอบนี้
          </div>
        ) : (
          pointsData.map((point, index) => (
             <ReflectionCardItem 
                key={point?.id != null ? point.id : `point-${index}`} 
                point={point} 
                index={index} 
                customTags={safeCustomTags} 
                themeVals={themeVals} 
                cfg={cfg} 
                onUpdatePoint={onUpdatePoint} 
                sessionId={sessionData.id} 
             />
          ))
        )}

        {isDraftMode && (
          <button 
            onClick={onSaveDraft}
            className="w-full mt-4 mb-8 py-5 rounded-[2rem] font-bold tracking-[0.15em] text-[13px] uppercase flex justify-center items-center gap-3 border border-white/5 transition-transform active:scale-[0.98]"
            style={{ background: raisedGradient, boxShadow: shadowPlateau, color: theme.textMain }}
          >
            <History size={18} className="text-emerald-500" />
            <span>บันทึก Reflection ลงใน Lobby</span>
          </button>
        )}
      </div>
    </div>
  );
}

export function ScoreEditView({ themeVals, sessionData, onSave, onCancel, cfg }) {
  const { bg, theme, shadowPlateau, shadowOuter, raisedGradient, shadowDeepInset, indentedGradient, shadowCap } = themeVals;
  const [editScoresState, setEditScoresState] = useState(sessionData?.scores || {});

  const handleEditScoreChange = useCallback((partId, val, max) => {
    const num = parseInt(val.replace(/\D/g, ''), 10);
    setEditScoresState(p => ({ ...p, [partId]: isNaN(num) ? '' : Math.min(num, max) }));
  }, []);

  const handleSaveEditedScores = () => {
    const { finalScore } = calculateScores(editScoresState);
    onSave(editScoresState, finalScore);
  };

  return (
    <div className="mt-24 mb-10 w-full px-4 flex flex-col z-10 animate-in fade-in duration-300 mx-auto max-w-4xl gap-6">
      <div className="flex justify-between items-center bg-white/5 p-6 rounded-3xl border border-white/10" style={{ background: raisedGradient, boxShadow: shadowPlateau }}>
        <div className="flex items-center gap-4">
          <button onClick={onCancel} className="w-12 h-12 rounded-full flex items-center justify-center transition-all active:scale-95 border border-white/5 shrink-0" style={{ background: bg, boxShadow: shadowOuter, color: theme.textMain }}>
            <ArrowLeft size={18} />
          </button>
          <div>
            <h2 className="text-xl font-bold tracking-wide" style={{ color: theme.textMain }}>Score Breakdown</h2>
            <p className="text-xs font-medium opacity-60 uppercase tracking-widest mt-1" style={{ color: theme.textSub }}>กรอกคะแนนรายพาร์ทย่อย 9 อัน</p>
          </div>
        </div>
      </div>

      <div className="w-full p-6 lg:p-8 rounded-[2.5rem] border border-white/5 flex flex-col gap-6" style={{ background: bg, boxShadow: shadowOuter }}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FLAT_EXAM_SUBS.map(sub => (
            <div key={sub.id} className="p-5 rounded-[1.5rem] border border-white/5 transition-colors flex flex-col justify-between" style={{ background: indentedGradient, boxShadow: shadowDeepInset }}>
              <div className="flex flex-col mb-4">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[9px] font-black uppercase tracking-widest opacity-40 truncate pr-2" style={{ color: theme.textHighlight }}>{sub.mainLabel}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border border-white/5 shrink-0" style={{ background: raisedGradient, color: theme.textSub, boxShadow: shadowPlateau }}>{sub.range}</span>
                </div>
                <span className="text-[14px] font-bold leading-snug" style={{ color: theme.textMain }}>{sub.label}</span>
              </div>
              <div className="flex items-center justify-between mt-auto pt-3 border-t border-black/5 dark:border-white/5">
                <span className="text-[10px] font-bold uppercase tracking-widest opacity-50" style={{ color: theme.textSub }}>Correct</span>
                <div className="flex items-baseline gap-1.5 shrink-0">
                  <input 
                    type="text" 
                    value={editScoresState[sub.id] ?? ''} 
                    onChange={(e) => handleEditScoreChange(sub.id, e.target.value, sub.max)}
                    placeholder="0"
                    className="w-12 text-center bg-transparent outline-none font-black text-xl border-b-2 transition-colors focus:border-blue-400 placeholder:opacity-20" 
                    style={{ color: theme.textMain, borderColor: 'transparent' }} 
                  />
                  <span className="text-[12px] font-bold opacity-40" style={{ color: theme.textSub }}>/ {sub.max}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <button 
          onClick={handleSaveEditedScores}
          className="w-full shrink-0 py-4 mt-2 rounded-[1.5rem] font-bold tracking-widest text-[13px] uppercase transition-all active:scale-[0.98] border border-white/10 shadow-lg"
          style={{ background: 'linear-gradient(145deg, #3b82f6, #2563eb)', color: '#ffffff', boxShadow: shadowPlateau }}
        >
          บันทึกการแก้ไข
        </button>
      </div>
    </div>
  );
}