import React from 'react';
import { Link, useOutletContext, useNavigate } from 'react-router-dom';

export function HubHome() {
  const themeVals = useOutletContext();
  const navigate = useNavigate();
  return (
    <div className="flex flex-col items-center gap-10 animate-in fade-in duration-300 w-full -mt-[30px]">
      <h1 className="text-3xl font-black tracking-tight text-center" style={{ color: themeVals.textMain }}>
        เหลือเวลาเตรียมตัวอีก 295 วัน
      </h1>
      {/* ใช้ flex และ justify-center เพื่อให้อยู่ตรงกลางเสมอ */}
      <div className="flex flex-col md:flex-row flex-wrap justify-center items-stretch gap-6 w-full max-w-5xl mx-auto h-[60vh] min-h-[350px]">
        {/* กล่องที่ 1 ปรับความกว้างด้วย md:w-[เปอร์เซ็นต์ หรือ px] */}
        <Link to="/admissim" className="w-full md:w-[25%] rounded-[0.8rem] flex items-end justify-center pb-10 transition-colors border border-white/10" style={{ background: themeVals.raisedGradient, boxShadow: themeVals.shadowPlateau }}>
          <span className="text-xl font-black tracking-widest uppercase transition-colors" style={{ color: themeVals.textMain }}>ADMiSSiM</span>
        </Link>
        {/* กล่องที่ 2 */}
        <div 
          onClick={() => navigate('/speedread')}
          className="w-full md:w-[25%] rounded-[0.8rem] flex items-end justify-center pb-10 cursor-pointer transition-transform active:scale-95 border border-white/10" 
          style={{ background: themeVals.raisedGradient, boxShadow: themeVals.shadowPlateau }}
        >
          <span className="text-xl font-black tracking-widest uppercase text-center leading-none transition-colors" style={{ color: themeVals.textMain }}>
            ULTRA<br/>SPEEDREAD
          </span>
        </div>
        {/* กล่องที่ 3 (รวม 2 กล่องย่อยแนวตั้ง) */}
        <div className="w-full md:w-[25%] flex flex-col gap-6">
          <Link to="/vocab" className="flex-1 rounded-[0.8rem] flex items-center justify-center cursor-pointer transition-transform active:scale-95 border border-white/10" style={{ background: themeVals.raisedGradient, boxShadow: themeVals.shadowPlateau }}>
            <span className="text-xl font-black tracking-widest uppercase transition-colors" style={{ color: themeVals.textMain }}>FLASHCARDS</span>
          </Link>
          <Link to="/storydiary" className="flex-1 rounded-[0.8rem] flex items-center justify-center cursor-pointer transition-transform active:scale-95 border border-white/10" style={{ background: themeVals.raisedGradient, boxShadow: themeVals.shadowPlateau }}>
            <span className="text-xl font-black tracking-widest uppercase transition-colors" style={{ color: themeVals.textMain }}>STORY DiARY</span>
          </Link>
          
          
        </div>
      </div>
    </div>
  );
}

export function HubFlashcards() {
  const themeVals = useOutletContext();
  const navigate = useNavigate();
  
  // ฟังก์ชันช่วยนำทางและส่งชื่อหมวดหมู่ไปด้วย
  const goToDeck = (deckName) => {
    navigate('/vocab/play', { state: { deckTitle: deckName } });
  };

  return (
    <div className="flex flex-col items-center gap-8 animate-in fade-in duration-300 w-full pt-2">
      <h1 className="text-2xl font-black tracking-widest uppercase" style={{ color: themeVals.textMain }}>FLASHCARD DECKS</h1>
      
      <div className="flex flex-col md:flex-row justify-center items-stretch gap-6 w-full max-w-5xl mx-auto px-4">
        
        {/* คอลัมน์ที่ 1 (ซ้าย) */}
        <div className="flex flex-col gap-6 w-full md:flex-1">
          <div onClick={() => goToDeck('SCIENCE, HEALTH & NATURE')} className="w-full h-[200px] rounded-[0.8rem] flex items-center justify-center p-6 text-center cursor-pointer border border-white/10 transition-transform active:scale-95" style={{ background: themeVals.raisedGradient, boxShadow: themeVals.shadowPlateau }}>
            <span className="text-lg font-black uppercase leading-tight" style={{ color: themeVals.textMain }}>SCIENCE, HEALTH & NATURE</span>
          </div>
          <div onClick={() => goToDeck('BUSINESS & TECHNOLOGY')} className="w-full h-[240px] rounded-[0.8rem] flex items-center justify-center p-6 text-center cursor-pointer border border-white/10 transition-transform active:scale-95" style={{ background: themeVals.raisedGradient, boxShadow: themeVals.shadowPlateau }}>
            <span className="text-lg font-black uppercase leading-tight" style={{ color: themeVals.textMain }}>BUSINESS & TECHNOLOGY</span>
          </div>
        </div>

        {/* คอลัมน์ที่ 2 (กลาง) */}
        <div className="flex flex-col gap-6 w-full md:flex-1">
          <div onClick={() => goToDeck('MY FAVORITE')} className="w-full h-[260px] rounded-[0.8rem] flex items-center justify-center p-6 text-center cursor-pointer border border-white/10 transition-transform active:scale-95" style={{ background: themeVals.raisedGradient, boxShadow: themeVals.shadowPlateau }}>
            <span className="text-lg font-black uppercase leading-tight" style={{ color: themeVals.textMain }}>MY FAVORITE</span>
          </div>
          <div onClick={() => goToDeck('SOCIETY & CULTURE')} className="w-full h-[180px] rounded-[0.8rem] flex items-center justify-center p-6 text-center cursor-pointer border border-white/10 transition-transform active:scale-95" style={{ background: themeVals.raisedGradient, boxShadow: themeVals.shadowPlateau }}>
            <span className="text-lg font-black uppercase leading-tight" style={{ color: themeVals.textMain }}>SOCIETY & CULTURE</span>
          </div>
        </div>

        {/* คอลัมน์ที่ 3 (ขวา) */}
        <div className="flex flex-col gap-6 w-full md:flex-1">
          <div onClick={() => goToDeck('ACADEMIC & CAREER')} className="w-full h-[200px] rounded-[0.8rem] flex items-center justify-center p-6 text-center cursor-pointer border border-white/10 transition-transform active:scale-95" style={{ background: themeVals.raisedGradient, boxShadow: themeVals.shadowPlateau }}>
            <span className="text-lg font-black uppercase leading-tight" style={{ color: themeVals.textMain }}>ACADEMIC & CAREER</span>
          </div>
          <div onClick={() => goToDeck('LIFESTYLE & MEDIA')} className="w-full h-[240px] rounded-[0.8rem] flex items-center justify-center p-6 text-center cursor-pointer border border-white/10 transition-transform active:scale-95" style={{ background: themeVals.raisedGradient, boxShadow: themeVals.shadowPlateau }}>
            <span className="text-lg font-black uppercase leading-tight" style={{ color: themeVals.textMain }}>LIFESTYLE & MEDIA</span>
          </div>
        </div>

      </div>
    </div>
  );
}

export function HubSpeedRead() {
  const themeVals = useOutletContext();
  return (
    <div className="flex flex-col items-center gap-8 animate-in fade-in duration-300 w-full pt-2 relative min-h-[65vh]">
      <h1 className="text-2xl font-black tracking-widest uppercase" style={{ color: themeVals.textMain }}>ULTRA SPEED READ</h1>
      {/* ใช้ flex และ justify-center กรณีการ์ดเหลือเศษ จะตกลงมาอยู่ตรงกลางเป๊ะ */}
      <div className="flex flex-wrap justify-center gap-6 w-full max-w-5xl mx-auto">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="w-full sm:w-[250px] md:w-[280px] aspect-square rounded-[2rem] flex items-center justify-center cursor-pointer transition-colors border border-white/10" style={{ background: themeVals.raisedGradient, boxShadow: themeVals.shadowPlateau }}>
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