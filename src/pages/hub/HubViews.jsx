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
        <Link to="/admissim" className="w-full md:w-[25%] rounded-[1.5rem] flex items-end justify-center pb-10 transition-colors border border-white/10" style={{ background: themeVals.raisedGradient, boxShadow: themeVals.shadowPlateau }}>
          <span className="text-xl font-black tracking-widest uppercase transition-colors" style={{ color: themeVals.textMain }}>ADMiSSiM</span>
        </Link>
        {/* กล่องที่ 2 */}
        <div 
          onClick={() => navigate('/speedread')}
          className="w-full md:w-[25%] rounded-[1.5rem] flex items-end justify-center pb-10 cursor-pointer transition-transform active:scale-95 border border-white/10" 
          style={{ background: themeVals.raisedGradient, boxShadow: themeVals.shadowPlateau }}
        >
          <span className="text-xl font-black tracking-widest uppercase text-center leading-none transition-colors" style={{ color: themeVals.textMain }}>
            ULTRA<br/>SPEEDREAD
          </span>
        </div>
        {/* กล่องที่ 3 (รวม 2 กล่องย่อยแนวตั้ง) */}
        <div className="w-full md:w-[25%] flex flex-col gap-6">
          <Link to="/vocab" className="flex-1 rounded-[1.5rem] flex items-center justify-center cursor-pointer transition-transform active:scale-95 border border-white/10" style={{ background: themeVals.raisedGradient, boxShadow: themeVals.shadowPlateau }}>
            <span className="text-xl font-black tracking-widest uppercase transition-colors" style={{ color: themeVals.textMain }}>FLASHCARDS</span>
          </Link>
          <Link to="/storydiary" className="flex-1 rounded-[1.5rem] flex items-center justify-center cursor-pointer transition-transform active:scale-95 border border-white/10" style={{ background: themeVals.raisedGradient, boxShadow: themeVals.shadowPlateau }}>
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
  const [dueCount, setDueCount] = React.useState(0);
  const [recentDecks, setRecentDecks] = React.useState([]);

  React.useEffect(() => {
    async function loadStats() {
      try {
        const recents = JSON.parse(localStorage.getItem('recent_decks') || '[]');
        setRecentDecks(recents.slice(0, 3));
      } catch (err) {
        console.error(err);
      }
    }
    loadStats();
  }, []);

  const goToAllDecks = () => navigate('/vocab/decks');
  const goToSRSReview = () => navigate('/vocab/play', { state: { isSRS: true, deckTitle: 'DAILY REVIEW' } });

  return (
    <div className="flex flex-col items-center gap-6 animate-in fade-in duration-300 w-full pt-0">
      <h1 className="text-2xl font-black tracking-widest uppercase" style={{ color: themeVals.textMain }}>FLASHCARD HUB</h1>
      
      <div className="w-full max-w-4xl flex flex-col gap-6 px-4">
        {/* Top Row */}
        <div className="flex flex-col md:flex-row gap-6 w-full h-auto md:h-[180px]">
          <div onClick={goToAllDecks} className="flex-1 rounded-[2.5rem] flex flex-col items-center justify-center p-6 cursor-pointer border border-white/10 transition-transform active:scale-95" style={{ background: themeVals.raisedGradient, boxShadow: themeVals.shadowPlateau }}>
            <span className="text-2xl font-black uppercase tracking-widest" style={{ color: themeVals.textMain }}>ALL DECKS</span>
            <span className="text-sm font-medium mt-2" style={{ color: themeVals.textMain, opacity: 0.7 }}>Browse categories & levels</span>
          </div>
          
          <div onClick={goToSRSReview} className="flex-1 rounded-[2.5rem] flex flex-col items-center justify-center p-6 cursor-pointer border border-white/10 transition-transform active:scale-95 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #FF9500 0%, #FF5E3A 100%)', boxShadow: themeVals.shadowPlateau }}>
            <span className="text-2xl font-black uppercase tracking-widest text-white">SMART REVIEW</span>
            <div className="mt-4 bg-white/20 backdrop-blur-md px-5 py-2 rounded-full border border-white/30">
              <span className="text-white font-bold">{dueCount} WORDS DUE</span>
            </div>
          </div>
        </div>

        {/* Bottom Row */}
        <div className="w-full flex flex-col gap-4 mt-6">
          <h2 className="text-lg font-bold tracking-wider uppercase text-left ml-4" style={{ color: themeVals.textMain, opacity: 0.8 }}>RECENTLY STUDIED</h2>
          <div className="flex flex-col md:flex-row gap-6 w-full h-auto md:h-[140px]">
            {recentDecks.length > 0 ? recentDecks.map((deck, idx) => (
              <div key={idx} onClick={() => navigate('/vocab/play', { state: deck })} className="flex-1 rounded-[2rem] flex flex-col items-center justify-center p-4 cursor-pointer border border-white/10 transition-transform active:scale-95" style={{ background: themeVals.raisedGradient, boxShadow: themeVals.shadowPlateau }}>
                <span className="text-md font-bold uppercase text-center leading-tight mb-3" style={{ color: themeVals.textMain }}>{deck.deckTitle}</span>
                <span className="text-xs font-bold px-4 py-1.5 rounded-full" style={{ background: deck.color || '#8c52ff', color: '#fff' }}>LEVEL {deck.level}</span>
              </div>
            )) : (
              <div className="flex-1 rounded-[2rem] flex items-center justify-center p-4 border border-white/10 opacity-60" style={{ background: themeVals.raisedGradient, boxShadow: themeVals.shadowPlateau }}>
                <span className="text-sm font-medium" style={{ color: themeVals.textMain }}>No recent decks yet. Let's study!</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function HubFlashcardDecks() {
  const themeVals = useOutletContext();
  const navigate = useNavigate();
  const [decksData, setDecksData] = React.useState(null);

  const categories = [
    { name: 'SCIENCE, HEALTH & NATURE', color: '#22c55e' },
    { name: 'BUSINESS & TECHNOLOGIES', color: '#0070fb' },
    { name: 'ACADEMIC & CAREER', color: '#ff2e57' },
    { name: 'LIFESTYLE & MEDIA', color: '#8c52ff' },
    { name: 'SOCIETY & CULTURE', color: '#505e72' },
    { name: 'MY FAVORITE', color: '#ff8301' }
  ];

  React.useEffect(() => {
    async function loadDecks() {
       try {
         const res = await fetch('/api/vocab/decks');
         const json = await res.json();
         if(json.status === 'success') {
            setDecksData(json.data);
         }
       } catch(e) { console.error(e); }
    }
    loadDecks();
  }, []);

  const goToDeck = (catName, levelIdx, color) => {
    const recent = JSON.parse(localStorage.getItem('recent_decks') || '[]');
    const newDeck = { deckTitle: catName, level: levelIdx + 1, color: color };
    const updated = [newDeck, ...recent.filter(d => d.deckTitle !== catName || d.level !== levelIdx + 1)].slice(0, 3);
    localStorage.setItem('recent_decks', JSON.stringify(updated));
    
    navigate('/vocab/play', { state: newDeck });
  };

  return (
    <div className="flex flex-col items-center gap-8 animate-in fade-in duration-300 w-full pt-0 pb-12">
      <div className="flex items-center justify-between w-full max-w-5xl px-4 mt-2">
        <button onClick={() => navigate('/vocab')} className="w-12 h-12 flex items-center justify-center rounded-full transition-transform active:scale-90 border border-white/10" style={{ background: themeVals.raisedGradient, color: themeVals.textMain, boxShadow: themeVals.shadowPlateau }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        <h1 className="text-2xl font-black tracking-widest uppercase" style={{ color: themeVals.textMain }}>ALL DECKS</h1>
        <div className="w-12 h-12"></div>
      </div>
      
      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-4">
        {categories.map((cat, i) => (
          <div key={i} className="flex flex-col gap-4 rounded-[2rem] p-6 border border-white/10" style={{ background: themeVals.raisedGradient, boxShadow: themeVals.shadowPlateau }}>
            <h2 className="text-md font-black uppercase tracking-wider text-center" style={{ color: cat.color }}>{cat.name}</h2>
            <div className="flex flex-col gap-3 mt-2">
              {[0, 1, 2].map(levelIdx => {
                const levelData = decksData ? decksData[cat.name]?.levels[levelIdx] : [];
                const wordCount = levelData ? levelData.length : 0;
                const progress = 0; 
                
                return (
                  <div key={levelIdx} onClick={() => goToDeck(cat.name, levelIdx, cat.color)} className="w-full bg-black/5 rounded-[1.5rem] p-4 flex flex-col gap-3 cursor-pointer transition-transform active:scale-95 hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10 border border-black/5 dark:border-white/5">
                    <div className="flex justify-between items-center px-1">
                      <span className="font-bold text-sm uppercase tracking-wide" style={{ color: themeVals.textMain }}>LEVEL {levelIdx + 1}</span>
                      <span className="text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-md" style={{ background: cat.color, color: '#fff' }}>{wordCount} Words</span>
                    </div>
                    <div className="w-full h-2.5 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, background: cat.color }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
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