import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useOutletContext, useLocation } from 'react-router-dom';
import { Play, Pause, RotateCcw, SkipBack, SkipForward, Loader2, Settings, X, AlignLeft, AlignCenter, AlignRight, AlignJustify, Type, Gauge, ListMinus } from 'lucide-react';

export default function SpeedRead() {
  const themeVals = useOutletContext();
  const location = useLocation();
  const isDark = themeVals.textMain === '#ffffff' || themeVals.textMain === '#FFFFFF';
  const { id, content: initialContent, isSystem } = location.state || {};

  const [isPlaying, setIsPlaying] = useState(false);
  const [wpm, setWpm] = useState(300);
  const [globalWordIndex, setGlobalWordIndex] = useState(0);
  const [text, setText] = useState(initialContent || "");
  const [loading, setLoading] = useState(isSystem && !initialContent);
  const timerRef = useRef(null);

  // Settings State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [readMode, setReadMode] = useState('serial'); // serial | highlight | teleprompter
  const [numLines, setNumLines] = useState(1);
  const [wordsPerLine, setWordsPerLine] = useState(1);
  const [alignment, setAlignment] = useState('center');
  const [fontFamily, setFontFamily] = useState('Inter, sans-serif');
  const [fontSize, setFontSize] = useState(48);
  const [fontColor, setFontColor] = useState('');
  const [adaptiveWpm, setAdaptiveWpm] = useState(false);

  useEffect(() => {
    if (isSystem && !initialContent && id) {
      setLoading(true);
      fetch('/api/stories/get', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storyId: id })
      })
        .then(res => res.json())
        .then(data => { if (data.status === 'success' && data.story) setText(data.story.content || ""); })
        .catch(err => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [id, isSystem, initialContent]);

  const words = useMemo(() => text ? text.split(/\s+/) : [], [text]);

  const currentDelay = useMemo(() => {
    if (words.length === 0) return 300;
    let chunkWords = 1;
    let chunkChars = 5;

    if (readMode === 'serial') {
      const wordsToRead = Math.min(words.length - globalWordIndex, numLines * wordsPerLine);
      chunkWords = wordsToRead;
      chunkChars = words.slice(globalWordIndex, globalWordIndex + wordsToRead).join(" ").length;
    } else if (readMode === 'highlight') {
      chunkWords = 1;
      chunkChars = words[globalWordIndex]?.length || 5;
    } else if (readMode === 'teleprompter') {
      chunkWords = 1; // อัปเดตทีละคำเพื่อความสมูทและตอบสนองทันที
      chunkChars = words[globalWordIndex]?.length || 5;
    }

    let delay = (60 / wpm) * 1000 * chunkWords;
    if (adaptiveWpm) {
      delay = (60 / wpm) * 1000 * (Math.max(1, chunkChars) / 5);
    }
    return delay;
  }, [globalWordIndex, wpm, words, readMode, numLines, wordsPerLine, adaptiveWpm]);

  // Main Loop
  useEffect(() => {
    if (isPlaying && globalWordIndex < words.length) {
      let chunkWords = 1;
      if (readMode === 'serial') {
        chunkWords = Math.min(words.length - globalWordIndex, numLines * wordsPerLine);
      } else if (readMode === 'highlight') {
        chunkWords = 1;
      } else if (readMode === 'teleprompter') {
        chunkWords = 1; // เลื่อนทีละคำ
      }

      timerRef.current = setTimeout(() => {
        setGlobalWordIndex(prev => Math.min(words.length, prev + chunkWords));
      }, currentDelay);
    } else if (globalWordIndex >= words.length) {
      setIsPlaying(false);
    }
    return () => clearTimeout(timerRef.current);
  }, [isPlaying, globalWordIndex, words, readMode, numLines, wordsPerLine, currentDelay]);
  // Click background to pause
  const handleBackgroundClick = (e) => {
    if (isPlaying) {
      e.stopPropagation();
      setIsPlaying(false);
    }
  };

  const skipForward = () => setGlobalWordIndex(prev => Math.min(words.length - 1, prev + (readMode === 'serial' ? numLines * wordsPerLine : (readMode === 'teleprompter' ? 12 : 1))));
  const skipBackward = () => setGlobalWordIndex(prev => Math.max(0, prev - (readMode === 'serial' ? numLines * wordsPerLine : (readMode === 'teleprompter' ? 12 : 1))));
  const showUI = !isPlaying && !isSettingsOpen;

  const renderContent = () => {
    if (words.length === 0) return null;
    const justifyClass = alignment === 'left' ? 'justify-start' : alignment === 'right' ? 'justify-end' : 'justify-center';

    if (readMode === 'serial') {
      const currentChunk = words.slice(globalWordIndex, globalWordIndex + (numLines * wordsPerLine));
      const lines = [];
      for (let i = 0; i < currentChunk.length; i += wordsPerLine) {
        lines.push(currentChunk.slice(i, i + wordsPerLine).join(" "));
      }
      return (
        <div className="flex flex-col justify-center w-full px-8 md:px-16 lg:px-24" style={{ textAlign: alignment }}>
          {lines.map((line, i) => <div key={i}>{line}</div>)}
        </div>
      );
    }

    if (readMode === 'highlight') {
      const pageSize = 20; // ลดเหลือ 20 คำต่อหน้า
      const pageStart = Math.floor(globalWordIndex / pageSize) * pageSize;
      const pageWords = words.slice(pageStart, pageStart + pageSize);
      const activeIdxInPage = globalWordIndex - pageStart;

      return (
        <div className={`w-full max-w-4xl mx-auto px-8 md:px-16 lg:px-24 flex flex-wrap gap-x-2 gap-y-1 pb-32 ${justifyClass}`}>
          {pageWords.map((word, i) => (
            <span key={i} className={i === activeIdxInPage ? 'opacity-100' : 'opacity-20'}>
              {word}
            </span>
          ))}
        </div>
      );
    }

    if (readMode === 'teleprompter') {
      const lines = [];
      for (let i = 0; i < words.length; i += 12) {
        lines.push({ text: words.slice(i, i + 12).join(" "), index: i });
      }
      
      const activeLineFloat = globalWordIndex / 12; 
      const activeLineInt = Math.floor(globalWordIndex / 12);
      const lineSpacing = fontSize * 5; // เพิ่มระยะเผื่อการตัดขึ้นบรรทัดใหม่บนมือถือสูงสุด 3-4 บรรทัด

      return (
        <div className="relative w-full max-w-6xl mx-auto h-[60vh] flex flex-col justify-center overflow-hidden mask-image-vertical pb-8">
          <div className="absolute left-0 right-0 px-6 md:px-12 lg:px-16" style={{ 
            top: '50%', 
            transform: `translateY(calc(-${(activeLineFloat + 0.5) * lineSpacing}px))`, 
            transition: isPlaying ? `transform ${currentDelay}ms linear` : 'transform 150ms ease-out' 
          }}>
            {lines.map((line, i) => (
              <div key={i} className={`w-full transition-opacity duration-150 ${i === activeLineInt ? 'opacity-100' : 'opacity-20'}`} style={{ 
                height: `${lineSpacing}px`, 
                display: 'flex', 
                flexDirection: 'column', 
                justifyContent: 'center',
                textAlign: alignment 
              }}>
                <div style={{ wordBreak: 'break-word' }}>{line.text}</div>
              </div>
            ))}
          </div>
        </div>
      );
    }
  };

  if (loading) return <div className="flex flex-col items-center justify-center w-full min-h-screen px-4" style={{ color: themeVals.textMain, background: themeVals.bg }}><Loader2 className="animate-spin mb-2" size={32} /></div>;

  return (
    <div className="fixed inset-0 w-full h-[100dvh] flex flex-col items-center justify-center overflow-hidden" style={{ background: themeVals.bg, fontFamily }} onClick={handleBackgroundClick}>
      
      {/* Header */}
      <div className={`absolute top-8 left-0 w-full flex items-center justify-center pt-12 pb-6 z-10 ${showUI ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <span className="font-bold text-sm tracking-[0.2em] uppercase opacity-40" style={{ color: themeVals.textMain, fontFamily: 'Inter, sans-serif' }}>{location.state?.title || "SPEED READING"}</span>
      </div>

      {/* Reader Area */}
      <div 
        className="relative w-full flex flex-col justify-center z-0 tracking-tight"
        style={{ color: fontColor || themeVals.textMain, fontSize: `${fontSize}px`, textAlign: alignment, lineHeight: 1.5 }}
      >
        {renderContent()}
      </div>

      {/* Controls */}
      <div className={`absolute bottom-0 left-0 w-full flex flex-col items-center px-6 pb-12 z-10 ${showUI ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className="w-full max-w-md space-y-8">
          <div className="flex flex-col items-center space-y-3">
            <div className="text-[11px] font-bold tracking-[0.1em] opacity-60" style={{ color: themeVals.textMain, fontFamily: 'Inter, sans-serif' }}>SPEED: {wpm} WPM</div>
            <input type="range" min="50" max="1000" step="10" value={wpm} onChange={(e) => setWpm(e.target.value)} onClick={(e) => e.stopPropagation()} className="w-80 h-1.5 rounded-full appearance-none cursor-pointer" style={{ background: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)', accentColor: '#007AFF' }} />
          </div>

          <div className="flex justify-between items-center px-6 w-full">
            <button onClick={(e) => { e.stopPropagation(); setGlobalWordIndex(0); }} className="active:scale-90 opacity-40 hover:opacity-100" style={{ color: themeVals.textMain }}><RotateCcw size={22} /></button>
            <button onClick={(e) => { e.stopPropagation(); skipBackward(); }} className="active:scale-90 opacity-60 hover:opacity-100" style={{ color: themeVals.textMain }}><SkipBack size={24} /></button>
            <button 
              onClick={(e) => { e.stopPropagation(); setIsPlaying(!isPlaying); }} 
              className="w-16 h-16 rounded-full flex items-center justify-center text-white active:scale-95 transition-all shadow-lg" 
              style={{ background: '#007AFF' }}
            >
              <Play size={24} fill="currentColor" className="ml-1" />
            </button>
            <button onClick={(e) => { e.stopPropagation(); skipForward(); }} className="active:scale-90 opacity-60 hover:opacity-100" style={{ color: themeVals.textMain }}><SkipForward size={24} /></button>
            <button onClick={(e) => { e.stopPropagation(); setIsSettingsOpen(true); }} className="active:scale-90 opacity-60 hover:opacity-100" style={{ color: themeVals.textMain }}><Settings size={22} /></button>
          </div>
        </div>
      </div>

      {/* Settings Modal (Centered) */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4" onClick={() => setIsSettingsOpen(false)}>
          <div className="w-full max-w-md p-6 rounded-3xl shadow-2xl transition-all" style={{ background: themeVals.bg, color: themeVals.textMain, border: '1px solid rgba(255,255,255,0.1)', fontFamily: 'Inter, sans-serif' }} onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-sm uppercase tracking-wider opacity-80">Settings</h3>
              <button onClick={() => setIsSettingsOpen(false)} className="opacity-60 hover:opacity-100 transition-opacity"><X size={20} /></button>
            </div>
            
            <div className="space-y-6 text-sm">
              {/* Reading Mode */}
              <div className="flex p-1 rounded-xl" style={{ background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}>
                {[ {id: 'serial', label: 'Serial'}, {id: 'highlight', label: 'Highlight'}, {id: 'teleprompter', label: 'Scroll'} ].map(m => (
                  <button key={m.id} onClick={() => setReadMode(m.id)} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all shadow-sm ${readMode !== m.id && 'opacity-60 shadow-none'}`} style={readMode === m.id ? { background: isDark ? 'rgba(255,255,255,0.1)' : '#FFF', color: '#007AFF' } : {}}>{m.label}</button>
                ))}
              </div>

              {/* Layout Sliders */}
              <div className="space-y-4">
                {readMode === 'serial' && (
                  <div className="space-y-2">
                    <div className="flex justify-between opacity-80 text-xs font-medium"><span>Lines</span><span>{numLines}</span></div>
                    <input type="range" min="1" max="5" value={numLines} onChange={(e) => setNumLines(parseInt(e.target.value))} className="w-full h-1.5 rounded-full appearance-none cursor-pointer" style={{ background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)', accentColor: '#007AFF' }} />
                  </div>
                )}
                {readMode === 'serial' && (
                  <div className="space-y-2">
                    <div className="flex justify-between opacity-80 text-xs font-medium"><span>Words / Line</span><span>{wordsPerLine}</span></div>
                    <input type="range" min="1" max="5" value={wordsPerLine} onChange={(e) => setWordsPerLine(parseInt(e.target.value))} className="w-full h-1.5 rounded-full appearance-none cursor-pointer" style={{ background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)', accentColor: '#007AFF' }} />
                  </div>
                )}
                <div className="space-y-2">
                  <div className="flex justify-between opacity-80 text-xs font-medium"><span>Font Size</span><span>{fontSize}px</span></div>
                  <input type="range" min="24" max="120" step="4" value={fontSize} onChange={(e) => setFontSize(parseInt(e.target.value))} className="w-full h-1.5 rounded-full appearance-none cursor-pointer" style={{ background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)', accentColor: '#007AFF' }} />
                </div>
              </div>

              {/* Font & Alignment */}
              <div className="flex gap-4 items-center">
                <select value={fontFamily} onChange={(e) => setFontFamily(e.target.value)} className="flex-1 p-2.5 rounded-xl outline-none font-medium cursor-pointer text-xs appearance-none" style={{ background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', color: themeVals.textMain, fontFamily, border: 'none' }}>
                  <option value="Inter, sans-serif" style={{ background: themeVals.bg }}>Google Sans</option>
                  <option value="'Baskervville', serif" style={{ background: themeVals.bg }}>Baskervville</option>
                  <option value="'Space Mono', monospace" style={{ background: themeVals.bg }}>Space Mono</option>
                </select>
                <div className="flex gap-1 p-1 rounded-xl" style={{ background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}>
                  {[ {icon: AlignLeft, v: 'left'}, {icon: AlignCenter, v: 'center'}, {icon: AlignRight, v: 'right'} ].map(a => <button key={a.v} onClick={() => setAlignment(a.v)} className={`p-2 rounded-lg transition-all shadow-sm ${alignment !== a.v && 'opacity-50 shadow-none'}`} style={alignment === a.v ? { background: isDark ? 'rgba(255,255,255,0.1)' : '#FFF', color: '#007AFF' } : {}}><a.icon size={16} /></button>)}
                </div>
              </div>

              {/* Adaptive WPM Toggle */}
              <div className="flex justify-between items-center py-2 border-t" style={{ borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}>
                <div className="flex flex-col"><span className="font-bold opacity-90 text-xs">Adaptive Speed</span><span className="text-[10px] opacity-50">Slow down for larger words</span></div>
                <button onClick={() => setAdaptiveWpm(!adaptiveWpm)} className={`w-12 h-7 rounded-full p-1 transition-colors`} style={{ background: adaptiveWpm ? '#007AFF' : isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)' }}>
                  <div className={`w-5 h-5 bg-white rounded-full transition-transform shadow-sm ${adaptiveWpm ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Global CSS for Teleprompter Mask */}
      <style>{`
        .mask-image-vertical {
          -webkit-mask-image: linear-gradient(to bottom, transparent, black 15%, black 85%, transparent);
          mask-image: linear-gradient(to bottom, transparent, black 15%, black 85%, transparent);
        }
      `}</style>
    </div>
  );
}