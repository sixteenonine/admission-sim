import React, { useState, useEffect, useRef } from 'react';
import { useOutletContext, useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft, Play, Pause, RotateCcw, SkipBack, SkipForward } from 'lucide-react';

export default function SpeedRead() {
  const themeVals = useOutletContext();
  const navigate = useNavigate();
  const location = useLocation();
  const isDark = themeVals.textMain === '#ffffff' || themeVals.textMain === '#FFFFFF';

  const [isPlaying, setIsPlaying] = useState(false);
  const [wpm, setWpm] = useState(300);
  const [currentIndex, setCurrentIndex] = useState(0);
  const timerRef = useRef(null);

  const text = "Speed reading is a process of rapidly recognizing and absorbing phrases or sentences on a page all at once, rather than identifying individual words.";
  const words = text.split(/\s+/);

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

  const currentWord = words[currentIndex] || "";
  const focusIdx = getFocusIndex(currentWord);

  return (
    <div className="flex flex-col items-center w-full max-w-[500px] mx-auto min-h-screen px-4 overflow-hidden">
      {/* Header */}
      <div className="w-full flex items-center justify-between mb-20 mt-2">
        <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center rounded-full" style={{ background: isDark ? '#2C2C2E' : '#FFFFFF', border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`, color: '#8E8E93' }}>
          <ChevronLeft size={24} />
        </button>
        <span className="font-bold text-sm truncate px-4" style={{ color: themeVals.textMain }}>{location.state?.title || "READING"}</span>
        <div className="w-10"></div>
      </div>

      {/* Reader Display */}
      <div className="relative w-full h-32 flex items-center justify-center text-4xl md:text-5xl font-bold tracking-tight mb-20">
        <div className="absolute top-0 w-10 h-1 bg-orange-500 rounded-full opacity-20"></div>
        <div className="absolute bottom-0 w-10 h-1 bg-orange-500 rounded-full opacity-20"></div>
        <div className="flex justify-center w-full relative">
          <div className="text-right flex-1 pr-[2px]" style={{ color: themeVals.textMain }}>{currentWord.substring(0, focusIdx)}</div>
          <div className="text-orange-500">{currentWord[focusIdx]}</div>
          <div className="text-left flex-1 pl-[2px]" style={{ color: themeVals.textMain }}>{currentWord.substring(focusIdx + 1)}</div>
        </div>
      </div>

      {/* Controls */}
      <div className="w-full max-w-[340px] space-y-10">
        <div className="flex flex-col items-center space-y-4">
          <div className="text-sm font-bold" style={{ color: '#8E8E93' }}>SPEED: {wpm} WPM</div>
          <input 
            type="range" min="50" max="1000" step="10" value={wpm} 
            onChange={(e) => setWpm(e.target.value)}
            className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
          />
        </div>

        <div className="flex justify-between items-center px-4">
          <button onClick={() => setCurrentIndex(0)} style={{ color: '#8E8E93' }}><RotateCcw size={28} /></button>
          <button onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))} style={{ color: themeVals.textMain }}><SkipBack size={32} /></button>
          <button 
            onClick={() => setIsPlaying(!isPlaying)} 
            className="w-20 h-20 rounded-full flex items-center justify-center text-white shadow-xl active:scale-90 transition-transform" 
            style={{ background: '#FF9500' }}
          >
            {isPlaying ? <Pause size={40} fill="currentColor" /> : <Play size={40} fill="currentColor" className="ml-2" />}
          </button>
          <button onClick={() => setCurrentIndex(Math.min(words.length - 1, currentIndex + 1))} style={{ color: themeVals.textMain }}><SkipForward size={32} /></button>
          <div className="w-7"></div>
        </div>
      </div>
    </div>
  );
}