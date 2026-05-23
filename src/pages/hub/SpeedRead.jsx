import React, { useState, useEffect, useRef } from 'react';
import { useOutletContext, useLocation } from 'react-router-dom';
import { Play, Pause, RotateCcw, SkipBack, SkipForward, Loader2 } from 'lucide-react';

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

  const words = text ? text.split(/\s+/) : [];

  // ฟังก์ชันหาตำแหน่ง Focus Letter แบบใน Index.txt
  const getFocusIndex = (word) => {
    const len = word.length;
    if (len <= 1) return 0;
    if (len <= 5) return 1;
    if (len <= 9) return 2;
    if (len <= 13) return 3;
    return 4;
  };

  useEffect(() => {
    if (isPlaying && currentIndex < words.length) {
      const delay = (60 / wpm) * 1000;
      timerRef.current = setTimeout(() => {
        setCurrentIndex(prev => prev + 1);
      }, delay);
    } else {
      setIsPlaying(false);
    }
    return () => clearTimeout(timerRef.current);
  }, [isPlaying, currentIndex, wpm, words.length]);

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

  const currentWord = words[currentIndex] || "";
  const focusIdx = getFocusIndex(currentWord);
  
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center w-full min-h-screen px-4" style={{ color: themeVals.textMain, background: themeVals.bg }}>
        <Loader2 className="animate-spin mb-2 text-[#007AFF]" size={32} />
        <span className="text-sm font-bold opacity-70 font-solway">กำลังโหลดเนื้อหา...</span>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 w-full h-[100dvh] flex flex-col items-center justify-center overflow-hidden" style={{ background: themeVals.bg }}>
      
      {/* Header (Fadable) */}
      <div className={`absolute top-0 left-0 w-full flex items-center justify-center pt-12 pb-6 transition-opacity duration-500 z-10 ${showUI ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <span className="font-solway font-bold text-sm tracking-[0.2em] uppercase opacity-40" style={{ color: themeVals.textMain }}>{location.state?.title || "SPEED READING"}</span>
      </div>

      {/* Reader Display (Always visible, centered) */}
      <div className="relative w-full flex items-center justify-center text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight z-0 py-12 px-4">
        <div className="absolute top-0 w-12 h-1.5 bg-[#007AFF] rounded-full opacity-20"></div>
        <div className="absolute bottom-0 w-12 h-1.5 bg-[#007AFF] rounded-full opacity-20"></div>
        <div className="flex justify-center w-full relative font-solway">
          <div className="text-right flex-1 pr-[2px]" style={{ color: themeVals.textMain }}>{currentWord.substring(0, focusIdx)}</div>
          <div className="text-[#007AFF]">{currentWord[focusIdx]}</div>
          <div className="text-left flex-1 pl-[2px]" style={{ color: themeVals.textMain }}>{currentWord.substring(focusIdx + 1)}</div>
        </div>
      </div>

      {/* Controls (Fadable) */}
      <div className={`absolute bottom-0 left-0 w-full flex flex-col items-center px-6 pb-16 md:pb-20 transition-opacity duration-500 z-10 ${showUI ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className="w-full max-w-md space-y-12">
          <div className="flex flex-col items-center space-y-5">
            <div className="text-[13px] font-bold font-solway tracking-[0.1em] opacity-60" style={{ color: themeVals.textMain }}>SPEED: {wpm} WPM</div>
            <input 
              type="range" min="50" max="1000" step="10" value={wpm} 
              onChange={(e) => setWpm(e.target.value)}
              className="w-full h-2 rounded-full appearance-none cursor-pointer"
              style={{ background: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)', accentColor: '#007AFF' }}
            />
          </div>

          <div className="flex justify-between items-center px-2 w-full">
            <button onClick={() => setCurrentIndex(0)} className="active:scale-90 transition-all opacity-40 hover:opacity-100" style={{ color: themeVals.textMain }}><RotateCcw size={26} /></button>
            <button onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))} className="active:scale-90 transition-all opacity-60 hover:opacity-100" style={{ color: themeVals.textMain }}><SkipBack size={34} /></button>
            <button 
              onClick={() => setIsPlaying(!isPlaying)} 
              className="w-20 h-20 md:w-24 md:h-24 rounded-full flex items-center justify-center text-white active:scale-95 transition-all" 
              style={{ background: '#007AFF', boxShadow: '0 8px 30px rgba(0, 122, 255, 0.4)' }}
            >
              {isPlaying ? <Pause size={38} fill="currentColor" /> : <Play size={38} fill="currentColor" className="ml-2" />}
            </button>
            <button onClick={() => setCurrentIndex(Math.min(words.length - 1, currentIndex + 1))} className="active:scale-90 transition-all opacity-60 hover:opacity-100" style={{ color: themeVals.textMain }}><SkipForward size={34} /></button>
            <div className="w-[26px]"></div>
          </div>
        </div>
      </div>
    </div>
  );
}