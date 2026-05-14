import React from 'react';
import { Link, useOutletContext } from 'react-router-dom';

export function HubHome() {
  const themeVals = useOutletContext();
  return (
    <div className="flex flex-col items-center gap-10 animate-in fade-in duration-300 w-full pt-2">
      <h1 className="text-3xl font-black tracking-tight text-center" style={{ color: themeVals.textMain }}>
        เหลือเวลาเตรียมตัวอีก 295 วัน
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 w-full max-w-5xl h-[50vh] min-h-[350px]">
        <Link to="/admissim" className="md:col-span-3 rounded-[2rem] flex items-end justify-center pb-10 transition-colors border border-white/10" style={{ background: themeVals.raisedGradient, boxShadow: themeVals.shadowPlateau }}>
          <span className="text-xl font-black tracking-widest uppercase transition-colors" style={{ color: themeVals.textMain }}>ADMiSSiM</span>
        </Link>
        <div className="md:col-span-3 rounded-[2rem] flex items-end justify-center pb-10 cursor-pointer transition-colors border border-white/10" style={{ background: themeVals.raisedGradient, boxShadow: themeVals.shadowPlateau }}>
          <span className="text-xl font-black tracking-widest uppercase text-center leading-none transition-colors" style={{ color: themeVals.textMain }}>ULTRA<br/>SPEEDREAD</span>
        </div>
        <div className="md:col-span-6 grid grid-rows-2 gap-6">
          <Link to="/vocab" className="rounded-[2rem] flex items-center justify-center transition-colors border border-white/10" style={{ background: themeVals.raisedGradient, boxShadow: themeVals.shadowPlateau }}>
            <span className="text-xl font-black tracking-widest uppercase transition-colors" style={{ color: themeVals.textMain }}>FLASHCARDS</span>
          </Link>
          <div className="rounded-[2rem] flex items-center justify-center cursor-pointer transition-colors border border-white/10" style={{ background: themeVals.raisedGradient, boxShadow: themeVals.shadowPlateau }}>
            <span className="text-xl font-black tracking-widest uppercase transition-colors" style={{ color: themeVals.textMain }}>STORY DiARY</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function HubFlashcards() {
  const themeVals = useOutletContext();
  const decks = [
    { title: "SCIENCE, HEALTH & NATURE" }, { title: "MY FAVORITE" }, { title: "ACADEMIC & CAREER" },
    { title: "BUSINESS & TECHNOLOGY" }, { title: "SOCIETY & CULTURE" }, { title: "LIFESTYLE & MEDIA" }
  ];
  return (
    <div className="flex flex-col items-center gap-8 animate-in fade-in duration-300 w-full pt-2">
      <h1 className="text-2xl font-black tracking-widest uppercase" style={{ color: themeVals.textMain }}>FLASHCARD DECKS</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 w-full max-w-5xl">
        {decks.map((deck, i) => (
          <div key={i} className="aspect-[4/3] rounded-[2rem] flex items-center justify-center p-6 text-center cursor-pointer transition-colors border border-white/10" style={{ background: themeVals.raisedGradient, boxShadow: themeVals.shadowPlateau }}>
             <span className="text-lg font-black uppercase leading-tight transition-colors" style={{ color: themeVals.textMain }}>{deck.title}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function HubSpeedRead() {
  const themeVals = useOutletContext();
  return (
    <div className="flex flex-col items-center gap-8 animate-in fade-in duration-300 w-full pt-2 relative min-h-[65vh]">
      <h1 className="text-2xl font-black tracking-widest uppercase" style={{ color: themeVals.textMain }}>ULTRA SPEED READ</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 w-full max-w-5xl">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="aspect-square rounded-[2rem] flex items-center justify-center cursor-pointer transition-colors border border-white/10" style={{ background: themeVals.raisedGradient, boxShadow: themeVals.shadowPlateau }}>
            <span className="text-lg font-black uppercase transition-colors" style={{ color: themeVals.textMain }}>ARTICLE {i}</span>
          </div>
        ))}
      </div>
      <button className="fixed bottom-10 right-10 w-14 h-14 bg-[#0099ff] text-white rounded-[1.25rem] flex items-center justify-center text-3xl active:scale-95 transition-transform z-20 border border-white/10" style={{ boxShadow: themeVals.shadowPlateau }}>
        +
      </button>
    </div>
  );
}