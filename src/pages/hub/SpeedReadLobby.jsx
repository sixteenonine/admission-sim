import React from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { ChevronLeft, Plus } from 'lucide-react';

export default function SpeedReadLobby() {
  const themeVals = useOutletContext();
  const navigate = useNavigate();
  const isDark = themeVals.textMain === '#ffffff' || themeVals.textMain === '#FFFFFF';
  
  const articles = [
    { title: "The Art of Learning", level: "Intermediate" },
    { title: "Science of Sleep", level: "Beginner" },
    { title: "Future of AI", level: "Advanced" },
    { title: "Healthy Lifestyle", level: "Beginner" }
  ];

  return (
    <div className="flex flex-col items-center w-full max-w-[500px] mx-auto animate-in fade-in duration-300 min-h-screen px-4">
      {/* Header */}
      <div className="w-full flex items-center justify-between mb-8 mt-2">
        <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center rounded-full" style={{ background: isDark ? '#2C2C2E' : '#FFFFFF', border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`, color: '#8E8E93' }}>
          <ChevronLeft size={24} />
        </button>
        <span className="font-bold text-[1.1rem]" style={{ color: themeVals.textMain }}>ULTRA SPEED READ</span>
        <div className="w-10"></div>
      </div>

      {/* Grid Articles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
        {articles.map((art, i) => (
          <div 
            key={i} 
            onClick={() => navigate('/speedread/play', { state: { title: art.title } })}
            className="p-6 rounded-[24px] cursor-pointer transition-transform active:scale-95 flex flex-col justify-between h-[160px]"
            style={{ background: isDark ? '#1C1C1E' : '#FFFFFF', border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}` }}
          >
            <div className="font-bold text-lg leading-tight" style={{ color: themeVals.textMain }}>{art.title}</div>
            <div className="text-xs font-bold uppercase tracking-widest" style={{ color: '#FF9500' }}>{art.level}</div>
          </div>
        ))}
      </div>

      {/* Floating Add Button */}
      <button className="fixed bottom-10 right-10 w-14 h-14 rounded-full flex items-center justify-center text-white shadow-lg active:scale-90 transition-transform z-30" style={{ background: '#FF9500' }}>
        <Plus size={30} />
      </button>
    </div>
  );
}