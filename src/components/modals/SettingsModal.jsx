import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { X, Plus, Trash2, Edit, GripVertical } from 'lucide-react';
import { RECOMMENDED_SEQUENCE } from '../../utils/constants';
import { getDifficultyColor } from '../../utils/helpers';

const SortableItem = memo(({ item, index, isEditable, isDraggingItem, isAnimatingDrop, offsetY, shiftOffset, handlePointerDown, themeVals, dotColor, isDropping }) => {
  const { bg, shadowPlateau, theme, shadowCap, raisedGradient } = themeVals;
  const isDarkMode = theme.bg === "#1e2229";

  let transformStyle = 'translateY(0px)';
  let zIndex = 1;
  let scale = 1;
  let shadow = shadowPlateau;
  let transitionStyle = 'transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)';

  if (isDropping) {
    transitionStyle = 'none'; 
  } else if (isDraggingItem) {
    transformStyle = `translateY(${offsetY}px)`;
    zIndex = 50;
    scale = isAnimatingDrop ? 1 : 1.02;
    shadow = isDarkMode ? `0 25px 30px -5px rgba(0,0,0,0.6), ${shadowPlateau}` : `0 20px 25px -5px rgba(0,0,0,0.2), ${shadowPlateau}`;
    if (!isAnimatingDrop) transitionStyle = 'none'; 
  } else if (shiftOffset !== 0) {
    transformStyle = `translateY(${shiftOffset}px)`;
  }

  return (
    <div className={`exam-item flex items-center justify-between p-5 rounded-2xl border relative ${isDraggingItem ? 'border-white/20' : 'border-white/5'} ${isEditable ? 'hover:border-white/10' : 'cursor-default'}`} style={{ background: bg, boxShadow: shadow, transform: `${transformStyle} scale(${scale})`, zIndex: zIndex, transition: transitionStyle }}>
      <div className="flex items-center gap-4">
        {isEditable && (
          <div 
            onPointerDown={(e) => handlePointerDown(e, index)} 
            className="cursor-grab active:cursor-grabbing p-2 -ml-2"
            style={{ touchAction: 'none' }} 
          >
            <GripVertical size={20} style={{ color: theme.textHighlight }} />
          </div>
        )}
        <div className="flex flex-col"><span className="text-[10px] uppercase tracking-wider font-bold" style={{ color: theme.textHighlight }}>{item.part}</span><span className="text-[14px] font-medium" style={{ color: theme.textMain }}>{item.label}</span></div>
      </div>
      <div className="flex items-center gap-3 px-3 py-1.5 rounded-full border border-white/10 shrink-0" style={{ background: raisedGradient, boxShadow: shadowCap }}><div className="w-2 h-2 rounded-full" style={{ backgroundColor: dotColor, boxShadow: `0 0 6px ${dotColor}` }} /><span className="text-[12px] font-bold w-4 text-center opacity-70" style={{ color: theme.textSub }}>{index + 1}</span></div>
    </div>
  );
});

const SettingsModal = memo(({ cfg, themeVals, setIsSettingOpen, examSequence, setExamSequence, customPresets, setCustomPresets, activePresetId, setActivePresetId, editingPresetId, setEditingPresetId, sfxEnabled, setSfxEnabled }) => {
  const { bg, theme, shadowPlateau, shadowOuter, raisedGradient, shadowDeepInset, shadowCap } = themeVals;

  const isMounted = useRef(true);
  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  const [dragInfo, setDragInfo] = useState({
    isDragging: false, isAnimatingDrop: false, startIndex: null, hoverIndex: null, offsetY: 0
  });
  
  const dragConfigRef = useRef({ startY: 0, startScrollY: 0, itemHeight: 0, startIndex: null });
  const [isDropping, setIsDropping] = useState(false);
  const scrollContainerRef = useRef(null);
  const pointerY = useRef(0);
  const autoScrollFrame = useRef(null);

  const handlePointerDown = useCallback((e, index) => {
    if (activePresetId === 'recommend') return;
    e.stopPropagation();
    e.target.setPointerCapture(e.pointerId); 
    const itemEl = e.currentTarget.closest('.exam-item');
    const itemHeight = itemEl ? itemEl.getBoundingClientRect().height + 16 : 96; 
    const clientY = e.clientY;
    const startScrollY = scrollContainerRef.current ? scrollContainerRef.current.scrollTop : 0;
    pointerY.current = clientY;
    dragConfigRef.current = { startY: clientY, startScrollY, itemHeight, startIndex: index };
    setDragInfo({
      isDragging: true, isAnimatingDrop: false, startIndex: index, hoverIndex: index, offsetY: 0
    });
  }, [activePresetId]);

  const handleAddPreset = useCallback(() => {
    const newId = `custom-${Date.now()}`;
    setCustomPresets(prev => [...prev, { id: newId, name: `Custom ${prev.length + 1}`, sequence: [...RECOMMENDED_SEQUENCE] }]);
    setActivePresetId(newId);
    setExamSequence([...RECOMMENDED_SEQUENCE]);
    setEditingPresetId(newId);
  }, [setCustomPresets, setActivePresetId, setExamSequence, setEditingPresetId]);

  const handleSelectPreset = useCallback((id) => {
    if (editingPresetId) return; 
    setActivePresetId(id);
    if (id === 'recommend') {
      setExamSequence([...RECOMMENDED_SEQUENCE]);
    } else {
      const preset = customPresets.find(p => p.id === id);
      if (preset) setExamSequence([...preset.sequence]);
    }
  }, [editingPresetId, customPresets, setActivePresetId, setExamSequence]);

  const handleUpdatePresetName = useCallback((id, newName) => {
    setCustomPresets(prev => prev.map(p => p.id === id ? { ...p, name: newName } : p));
  }, [setCustomPresets]);

  const handleDeletePreset = useCallback((e, id) => {
    e.stopPropagation();
    setCustomPresets(prev => prev.filter(p => p.id !== id));
    setActivePresetId(prevId => {
      if (prevId === id) {
        setExamSequence([...RECOMMENDED_SEQUENCE]);
        return 'recommend';
      }
      return prevId;
    });
  }, [setCustomPresets, setActivePresetId, setExamSequence]);

  useEffect(() => {
    if (!dragInfo.isDragging) return;
    
    const handleMove = (e) => {
      e.preventDefault(); 
      const clientY = e.clientY;
      if (!clientY) return;
      pointerY.current = clientY;
      const currentScrollY = scrollContainerRef.current ? scrollContainerRef.current.scrollTop : dragConfigRef.current.startScrollY;
      const newOffsetY = (clientY - dragConfigRef.current.startY) + (currentScrollY - dragConfigRef.current.startScrollY);
      const shift = Math.round(newOffsetY / dragConfigRef.current.itemHeight);
      const newHoverIndex = Math.max(0, Math.min(examSequence.length - 1, dragConfigRef.current.startIndex + shift));
      
      setDragInfo(prev => {
        if (prev.isAnimatingDrop) return prev;
        return { ...prev, offsetY: newOffsetY, hoverIndex: newHoverIndex };
      });
    };

    const handleUp = () => {
      cancelAnimationFrame(autoScrollFrame.current);
      
      setDragInfo(prev => {
        if (!prev.isDragging || prev.isAnimatingDrop) return prev;
        const targetOffsetY = (prev.hoverIndex - prev.startIndex) * dragConfigRef.current.itemHeight;
        setTimeout(() => {
          if (!isMounted.current) return;
          if (prev.startIndex !== prev.hoverIndex) {
            setExamSequence(currentSeq => {
               let _seq = [...currentSeq];
               const item = _seq.splice(prev.startIndex, 1)[0];
               _seq.splice(prev.hoverIndex, 0, item);
               setCustomPresets(presets => presets.map(p => p.id === activePresetId ? { ...p, sequence: _seq } : p));
               return _seq;
            });
          }
          setIsDropping(true);
          setDragInfo({ isDragging: false, isAnimatingDrop: false, startIndex: null, hoverIndex: null, offsetY: 0 });
          setTimeout(() => {
            if (isMounted.current) setIsDropping(false);
          }, 50); 
        }, 300);
        return { ...prev, isAnimatingDrop: true, offsetY: targetOffsetY };
      });
    };

    const scrollLoop = () => {
      if (scrollContainerRef.current && pointerY.current) {
         const rect = scrollContainerRef.current.getBoundingClientRect();
         const y = pointerY.current;
         const edgeSize = 60;
         let scrollAmount = 0;
         const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
         
         if (y < rect.top + edgeSize && scrollTop > 0) scrollAmount = -((rect.top + edgeSize - y) / 3);
         else if (y > rect.bottom - edgeSize && scrollTop + clientHeight < scrollHeight) scrollAmount = ((y - (rect.bottom - edgeSize)) / 3);
         
         if (scrollAmount !== 0) {
           scrollContainerRef.current.scrollTop += scrollAmount;
           const currentScrollY = scrollContainerRef.current.scrollTop;
           
           setDragInfo(prev => {
              if (prev.isAnimatingDrop) return prev;
              const newOffsetY = (pointerY.current - dragConfigRef.current.startY) + (currentScrollY - dragConfigRef.current.startScrollY);
              const shift = Math.round(newOffsetY / dragConfigRef.current.itemHeight);
              const newHoverIndex = Math.max(0, Math.min(examSequence.length - 1, dragConfigRef.current.startIndex + shift));
              return { ...prev, offsetY: newOffsetY, hoverIndex: newHoverIndex };
           });
         }
      }
      autoScrollFrame.current = requestAnimationFrame(scrollLoop);
    };
    
    autoScrollFrame.current = requestAnimationFrame(scrollLoop);
    window.addEventListener('pointermove', handleMove, { passive: false });
    window.addEventListener('pointerup', handleUp);
    window.addEventListener('pointercancel', handleUp);

    return () => {
      cancelAnimationFrame(autoScrollFrame.current);
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
      window.removeEventListener('pointercancel', handleUp);
    };
  }, [dragInfo.isDragging, examSequence.length, activePresetId, setExamSequence, setCustomPresets]);

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-transparent backdrop-blur-md px-4">
      <div className="w-full max-w-3xl rounded-[2.5rem] border border-white/30 transition-all relative" style={{ padding: '9px', boxShadow: shadowPlateau, background: bg }}>
        <div className="w-full h-full rounded-[2rem] p-6 flex flex-col gap-4 border border-white/5" style={{ background: bg, boxShadow: shadowOuter }}>
          <div className="flex justify-between items-center px-2 mb-2">
            <div>
              <h3 className="text-lg font-bold tracking-wide" style={{ color: theme.textMain }}>Settings</h3>
              <p className="text-xs font-medium opacity-60" style={{ color: theme.textSub }}>Customize display & sequence</p>
            </div>
            <button onClick={() => setIsSettingOpen(false)} className="w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-95 border border-white/5" style={{ background: raisedGradient, boxShadow: shadowPlateau, color: theme.textMain }}><X size={18} /></button>
          </div>
          <div className="flex flex-col md:flex-row gap-6 mt-2">
            <div className="w-full md:w-1/3 flex flex-col gap-3 px-2">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] uppercase tracking-wider font-bold" style={{ color: theme.textHighlight }}>Sequence Presets</span>
                <button onClick={handleAddPreset} className="w-6 h-6 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95 border border-white/10" style={{ background: raisedGradient, boxShadow: shadowPlateau, color: theme.textMain }}><Plus size={12} strokeWidth={3} /></button>
              </div>
              <div onClick={() => handleSelectPreset('recommend')} className="w-full text-left px-5 py-4 text-[13px] font-medium tracking-wide transition-all flex items-center justify-between cursor-pointer" style={{ borderRadius: `${cfg.dropRadius}px`, background: activePresetId === 'recommend' ? bg : 'transparent', boxShadow: activePresetId === 'recommend' ? shadowDeepInset : 'none', color: activePresetId === 'recommend' ? theme.textMain : theme.textSub, border: '1px solid rgba(255,255,255,0.05)' }}>
                <div className="flex flex-col"><span>Recommend</span><span className="text-[10px] opacity-60 mt-0.5">Standard A-Level Order</span></div>
                <div className={`w-2 h-2 rounded-full transition-opacity ${activePresetId === 'recommend' ? 'bg-emerald-400 opacity-100 shadow-[0_0_8px_#34d399]' : 'bg-transparent opacity-0'}`} />
              </div>
              {customPresets.map((preset) => (
                <div key={preset.id} onClick={() => handleSelectPreset(preset.id)} className="w-full text-left px-5 py-4 text-[13px] font-medium tracking-wide transition-all flex items-center justify-between group cursor-pointer" style={{ borderRadius: `${cfg.dropRadius}px`, background: activePresetId === preset.id ? bg : 'transparent', boxShadow: activePresetId === preset.id ? shadowDeepInset : 'none', color: activePresetId === preset.id ? theme.textMain : theme.textSub, border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div className="flex flex-col w-full pr-4">
                    {editingPresetId === preset.id ? (
                      <input autoFocus value={preset.name} onChange={(e) => handleUpdatePresetName(preset.id, e.target.value)} onBlur={() => setEditingPresetId(null)} onKeyDown={(e) => e.key === 'Enter' && setEditingPresetId(null)} className="bg-transparent outline-none border-b border-blue-400 w-full text-blue-400 pb-0.5" onClick={(e) => e.stopPropagation()} />
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="truncate max-w-[120px]">{preset.name}</span>
                        {activePresetId === preset.id && (
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={(e) => { e.stopPropagation(); setEditingPresetId(preset.id); }} className="hover:text-blue-400 transition-colors"><Edit size={12} /></button>
                            <button onClick={(e) => handleDeletePreset(e, preset.id)} className="hover:text-red-400 transition-colors"><Trash2 size={12} /></button>
                          </div>
                        )}
                      </div>
                    )}
                    <span className="text-[10px] opacity-60 mt-0.5">Custom Sequence</span>
                  </div>
                  <div className={`w-2 h-2 rounded-full shrink-0 transition-opacity ${activePresetId === preset.id ? 'bg-blue-400 opacity-100 shadow-[0_0_8px_#60a5fa]' : 'bg-transparent opacity-0'}`} />
                </div>
              ))}
              <div className="w-full px-5 pt-4 pb-2 mt-2 border-t border-white/5 flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase font-bold tracking-wider" style={{ color: theme.textMain }}>SFX Sounds</span>
                  <span className="text-[9px] opacity-60" style={{ color: theme.textSub }}>เสียงกระดาษ/เก้าอี้</span>
                </div>
                <button onClick={() => setSfxEnabled(!sfxEnabled)} className={`w-8 h-4 rounded-full transition-colors relative ${sfxEnabled ? 'bg-emerald-500' : 'bg-black/20 dark:bg-white/10'}`}>
                   <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform ${sfxEnabled ? 'left-[18px]' : 'left-1'}`} />
                </button>
              </div>
            </div>
            <div className="w-full md:w-2/3 flex flex-col h-full">
              <div className="mb-2 flex items-center justify-between px-6">
                <span className="text-[10px] uppercase tracking-wider font-bold" style={{ color: theme.textHighlight }}>Exam Sequence</span>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-[#34d399] shadow-[0_0_4px_#34d399]"></div><span className="text-[9px] uppercase font-bold" style={{ color: theme.textSub }}>ง่าย</span></div>
                  <div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-[#60a5fa] shadow-[0_0_4px_#60a5fa]"></div><span className="text-[9px] uppercase font-bold" style={{ color: theme.textSub }}>กลาง</span></div>
                  <div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-[#f87171] shadow-[0_0_4px_#f87171]"></div><span className="text-[9px] uppercase font-bold" style={{ color: theme.textSub }}>ยาก</span></div>
                </div>
              </div>
              <div ref={scrollContainerRef} className="flex flex-col gap-4 max-h-[55vh] overflow-y-auto no-scrollbar px-8 pb-12 pt-4 -mx-4">
                {examSequence.map((item, index) => {
                  const isEditable = activePresetId !== 'recommend';
                  const dotColor = getDifficultyColor(item.difficulty);
                  const isDraggingItem = dragInfo.isDragging && dragConfigRef.current.startIndex === index;
                  const isAnimatingDrop = dragInfo.isAnimatingDrop;
                  
                  let shiftOffset = 0;
                  if (dragInfo.isDragging && !isDraggingItem) {
                    const { startIndex } = dragConfigRef.current;
                    const hoverIndex = dragInfo.hoverIndex;
                    const itemHeight = dragConfigRef.current.itemHeight;
                    if (startIndex < hoverIndex && index > startIndex && index <= hoverIndex) {
                      shiftOffset = -itemHeight;
                    } else if (startIndex > hoverIndex && index >= hoverIndex && index < startIndex) {
                      shiftOffset = itemHeight;
                    }
                  }
                  
                  return (
                    <SortableItem 
                      key={item.id} 
                      item={item} 
                      index={index} 
                      isEditable={isEditable} 
                      isDraggingItem={isDraggingItem} 
                      isAnimatingDrop={isAnimatingDrop} 
                      offsetY={isDraggingItem ? dragInfo.offsetY : 0} 
                      shiftOffset={shiftOffset} 
                      handlePointerDown={handlePointerDown} 
                      themeVals={themeVals} 
                      dotColor={dotColor} 
                      isDropping={isDropping}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

export default SettingsModal;