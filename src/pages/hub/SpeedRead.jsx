import React, { useState, useEffect, useRef } from 'react';
import { useOutletContext, useLocation } from 'react-router-dom';
import { Play, Pause, RotateCcw, SkipBack, SkipForward, Loader2, Settings, X, AlignLeft, AlignCenter, AlignRight, AlignJustify } from 'lucide-react';

export default function SpeedRead() {
  const themeVals = useOutletContext();
  const location = useLocation();
  const isDark = themeVals.textMain === '#ffffff' || themeVals.textMain === '#FFFFFF';

  const { id, content: initialContent, isSystem } = location.state || {};

  const [isPlaying, setIsPlaying] = useState(false);
  const [wpm, setWpm] = useState(300);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [text, setText] = useState(initialContent || "");
  const [loading, setLoading] = useState(isSystem && !initialContent);
  
  const timerRef = useRef(null);
  const [showUI, setShowUI] = useState(true);
  const idleTimerRef = useRef(null);

  // Settings State (ย้ายออกมาอยู่นอก useEffect)
  const [numLines, setNumLines] = useState(1);
  const [wordsPerLine, setWordsPerLine] = useState(1);
  const [alignment, setAlignment] = useState('center');
  const [fontSize, setFontSize] = useState(48);
  const [fontColor, setFontColor] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    if (isSystem && !initialContent && id) {
      setLoading(true);
      fetch('/api/stories/get', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storyId: id })
      })
        .then(res => res.json())
        .then(data => {
          if (data.status === 'success' && data.story) {
            setText(data.story.content || "");
          }
        })
        .catch(err => console.error("โหลดเนื้อหาล้มเหลว", err))
        .finally(() => setLoading(false));
    }
  }, [id, isSystem, initialContent]);

  const words = React.useMemo(() => text ? text.split(/\s+/) : [], [text]);
  
  const chunks = React.useMemo(() => {
    const res = [];
    const chunkSize = numLines * wordsPerLine;
    if (chunkSize <= 0) return res;
    for (let i = 0; i < words.length; i += chunkSize) {
      res.push(words.slice(i, i + chunkSize));
    }
    return res;
  }, [words, numLines, wordsPerLine]);

  useEffect(() => {
    if (isPlaying && currentIndex < chunks.length) {
      const currentChunkWords = chunks[currentIndex]?.length || 1;
      const delay = (60 / wpm) * 1000 * currentChunkWords;
      timerRef.current = setTimeout(() => {
        setCurrentIndex(prev => prev + 1);
      }, delay);
    } else {
      setIsPlaying(false);
    }
    return () => clearTimeout(timerRef.current);
  }, [isPlaying, currentIndex, wpm, chunks]);

  useEffect(() => {
    const handleActivity = () => {
      setShowUI(true);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      if (isPlaying) {
        idleTimerRef.current = setTimeout(() => setShowUI(false), 2500);
      }
    };

    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('touchstart', handleActivity);
    window.addEventListener('click', handleActivity);

    handleActivity(); 

    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('touchstart', handleActivity);
      window.removeEventListener('click', handleActivity);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [isPlaying]);

  const currentChunk = chunks[currentIndex] || [];
  const linesToRender = [];
  for (let i = 0; i < currentChunk.length; i += wordsPerLine) {
    linesToRender.push(currentChunk.slice(i, i + wordsPerLine).join(" "));
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center w-full min-h-screen px-4" style={{ color: themeVals.textMain, background: themeVals.bg }}>
        <Loader2 className="animate-spin mb-2 text-[#007AFF]" size={32} />
        <span className="text-sm font-regular opacity-70 font-prompt">กำลังโหลด...</span>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 w-full h-[100dvh] flex flex-col items-center justify-center overflow-hidden" style={{ background: themeVals.bg }}>
      
      {/* Header (Fadable) */}
      <div className={`absolute top-8 left-0 w-full flex items-center justify-center pt-12 pb-6 transition-opacity duration-500 z-10 ${showUI && !isSettingsOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <span className="font-inter font-bold text-sm tracking-[0.2em] uppercase opacity-40" style={{ color: themeVals.textMain }}>{location.state?.title || "SPEED READING"}</span>
      </div>

      {/* Reader Display */}
      <div 
        className="relative w-full flex flex-col justify-center font-regular tracking-tight z-0 pb-24 px-4 font-inter"
        style={{ 
          color: fontColor || themeVals.textMain, 
          fontSize: `${fontSize}px`, 
          textAlign: alignment,
          lineHeight: 1.4
        }}
      >
        {linesToRender.map((lineText, idx) => (
          <div key={idx} className="w-full">{lineText}</div>
        ))}
      </div>

      {/* Controls (Fadable) */}
      <div className={`absolute bottom-0 left-0 w-full flex flex-col items-center px-6 pb-16 md:pb-20 transition-opacity duration-500 z-10 ${showUI ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className="w-full max-w-md space-y-8">
          <div className="flex flex-col items-center space-y-3">
            <div className="text-[11px] font-regular font-inter tracking-[0.1em] opacity-60" style={{ color: themeVals.textMain }}>SPEED: {wpm} WPM</div>
            <input 
              type="range" min="50" max="1000" step="10" value={wpm} 
              onChange={(e) => setWpm(e.target.value)}
              className="w-80 h-0.5 rounded-full appearance-none cursor-pointer"
              style={{ background: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)', accentColor: '#007AFF' }}
            />
          </div>

          <div className="flex justify-between items-center px-8 w-full">
            <button onClick={() => setCurrentIndex(0)} className="active:scale-90 transition-all opacity-40 hover:opacity-100" style={{ color: themeVals.textMain }}><RotateCcw size={24} /></button>
            <button onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))} className="active:scale-90 transition-all opacity-60 hover:opacity-100" style={{ color: themeVals.textMain }}><SkipBack size={24} /></button>
            <button 
              onClick={() => setIsPlaying(!isPlaying)} 
              className="w-20 h-11 md:w-20 md:h-11 rounded-full flex items-center justify-center text-white active:scale-95 transition-all" 
              style={{ background: '#007AFF', boxShadow: '0 8px 30px rgba(0, 122, 255, 0.4)' }}
            >
              {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-0" />}
            </button>
            <button onClick={() => setCurrentIndex(Math.min(chunks.length - 1, currentIndex + 1))} className="active:scale-90 transition-all opacity-60 hover:opacity-100" style={{ color: themeVals.textMain }}><SkipForward size={24} /></button>
            <button onClick={() => setIsSettingsOpen(true)} className="active:scale-90 transition-all opacity-60 hover:opacity-100" style={{ color: themeVals.textMain }}><Settings size={24} /></button>
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="absolute bottom-0 left-0 w-full p-6 z-50 rounded-t-3xl border-t shadow-2xl backdrop-blur-2xl transition-all font-inter" style={{ background: isDark ? 'rgba(30, 30, 30, 0.85)' : 'rgba(240, 240, 240, 0.9)', borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)', color: themeVals.textMain }}>
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-lg">Display Settings</h3>
            <button onClick={() => setIsSettingsOpen(false)} className="opacity-60 hover:opacity-100 p-2"><X size={24} /></button>
          </div>
          
          <div className="space-y-6 max-w-md mx-auto">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium opacity-80">Lines</span>
              <input type="number" min="1" max="10" value={numLines} onChange={(e) => setNumLines(Math.max(1, parseInt(e.target.value) || 1))} className="w-16 p-2 rounded-lg text-center font-bold outline-none" style={{ background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }} />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium opacity-80">Words per line</span>
              <input type="number" min="1" max="20" value={wordsPerLine} onChange={(e) => setWordsPerLine(Math.max(1, parseInt(e.target.value) || 1))} className="w-16 p-2 rounded-lg text-center font-bold outline-none" style={{ background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }} />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium opacity-80">Alignment</span>
              <div className="flex gap-2 p-1 rounded-lg" style={{ background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }}>
                <button onClick={() => setAlignment('left')} className={`p-2 rounded-md transition-all ${alignment === 'left' ? 'bg-[#007AFF] text-white shadow-md' : 'opacity-50 hover:opacity-100'}`}><AlignLeft size={18} /></button>
                <button onClick={() => setAlignment('center')} className={`p-2 rounded-md transition-all ${alignment === 'center' ? 'bg-[#007AFF] text-white shadow-md' : 'opacity-50 hover:opacity-100'}`}><AlignCenter size={18} /></button>
                <button onClick={() => setAlignment('right')} className={`p-2 rounded-md transition-all ${alignment === 'right' ? 'bg-[#007AFF] text-white shadow-md' : 'opacity-50 hover:opacity-100'}`}><AlignRight size={18} /></button>
                <button onClick={() => setAlignment('justify')} className={`p-2 rounded-md transition-all ${alignment === 'justify' ? 'bg-[#007AFF] text-white shadow-md' : 'opacity-50 hover:opacity-100'}`}><AlignJustify size={18} /></button>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <div className="flex justify-between items-end"><span className="text-sm font-medium opacity-80">Font Size</span><span className="text-xs font-bold bg-[#007AFF] text-white px-2 py-1 rounded">{fontSize}px</span></div>
              <input type="range" min="16" max="96" value={fontSize} onChange={(e) => setFontSize(parseInt(e.target.value))} className="w-full h-1.5 rounded-full appearance-none cursor-pointer" style={{ background: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)', accentColor: '#007AFF' }} />
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-sm font-medium opacity-80">Font Color</span>
              <input type="color" value={fontColor || (isDark ? '#ffffff' : '#000000')} onChange={(e) => setFontColor(e.target.value)} className="w-10 h-10 p-0 border-0 rounded-full overflow-hidden cursor-pointer bg-transparent shadow-sm" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}