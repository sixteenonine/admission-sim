import React from 'react';
import { Link, useOutletContext, useNavigate, useLocation } from 'react-router-dom';
import { db } from '../../utils/db.js';
export const FLASHCARD_CATEGORIES = [
  { name: 'SCIENCE, HEALTH & NATURE', color: '#4bdd31', diamonds: <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none text-black z-0"><svg className="w-28 h-56" viewBox="0 0 100 200"><polygon points="50,10 90,100 50,190 10,100" fill="currentColor" stroke="currentColor" strokeWidth="12" strokeLinejoin="round" /></svg></div> },
  { name: 'BUSINESS & TECHNOLOGIES', color: '#0070fb', diamonds: <div className="absolute inset-0 flex items-center justify-between px-16 pointer-events-none select-none text-black z-0"><svg className="w-28 h-56" viewBox="0 0 100 200"><polygon points="50,10 90,100 50,190 10,100" fill="currentColor" stroke="currentColor" strokeWidth="12" strokeLinejoin="round" /></svg><svg className="w-28 h-56" viewBox="0 0 100 200"><polygon points="50,10 90,100 50,190 10,100" fill="currentColor" stroke="currentColor" strokeWidth="12" strokeLinejoin="round" /></svg></div> },
  { name: 'ACADEMIC & CAREER', color: '#ff2e57', diamonds: <div className="absolute inset-0 flex items-center justify-center space-x-10 pointer-events-none select-none text-black z-0"><svg className="w-20 h-40" viewBox="0 0 100 200"><polygon points="50,10 90,100 50,190 10,100" fill="currentColor" stroke="currentColor" strokeWidth="12" strokeLinejoin="round" /></svg><svg className="w-24 h-48" viewBox="0 0 100 200"><polygon points="50,10 90,100 50,190 10,100" fill="currentColor" stroke="currentColor" strokeWidth="12" strokeLinejoin="round" /></svg><svg className="w-20 h-40" viewBox="0 0 100 200"><polygon points="50,10 90,100 50,190 10,100" fill="currentColor" stroke="currentColor" strokeWidth="12" strokeLinejoin="round" /></svg></div> },
  { name: 'LIFESTYLE & MEDIA', color: '#8c52ff', diamonds: <div className="absolute inset-0 flex flex-col items-center justify-between py-6 pointer-events-none select-none text-black z-0"><svg className="w-64 h-28" viewBox="0 0 200 100"><polygon points="100,10 190,50 100,90 10,50" fill="currentColor" stroke="currentColor" strokeWidth="12" strokeLinejoin="round" /></svg><svg className="w-64 h-28" viewBox="0 0 200 100"><polygon points="100,10 190,50 100,90 10,50" fill="currentColor" stroke="currentColor" strokeWidth="12" strokeLinejoin="round" /></svg></div> },
  { name: 'SOCIETY & CULTURE', color: '#505e72', diamonds: <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none text-black z-0"><svg className="w-80 h-40" viewBox="0 0 200 100"><polygon points="100,10 190,50 100,90 10,50" fill="currentColor" stroke="currentColor" strokeWidth="12" strokeLinejoin="round" /></svg></div> },
  { name: 'MY FAVORITE', color: '#ff8301', diamonds: null }
];

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
        if (themeVals?.currentUser?.id) {
          try {
            const res = await fetch(`/api/vocab/srs-sync?userId=${themeVals.currentUser.id}`);
            const json = await res.json();
            if (json.status === 'success' && json.data) {
              const srsData = json.data.map(item => ({
                eng: item.eng,
                repetition: item.interval > 1 ? 2 : 1,
                interval: item.interval,
                ease_factor: item.ease_factor,
                next_review: new Date(item.next_review_date).getTime()
              }));
              await db.vocab_srs.bulkPut(srsData);
            }
          } catch(e) { console.error('Sync GET error', e); }
        }

        const now = Date.now();
        const localSrs = await db.vocab_srs.toArray();
        const count = localSrs.filter(s => s.next_review <= now).length;
        setDueCount(count);
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
            {recentDecks.length > 0 ? recentDecks.map((deck, idx) => {
              const catDef = FLASHCARD_CATEGORIES.find(c => c.name === deck.deckTitle) || { color: deck.color || '#8c52ff', diamonds: null };
              return (
                <div key={idx} onClick={() => navigate('/vocab/play', { state: deck })} className="flex-1 relative rounded-[2rem] flex flex-col items-center justify-center p-4 cursor-pointer border border-white/10 transition-transform duration-300 hover:-translate-y-1 active:scale-95 overflow-hidden min-h-[120px]" style={{ backgroundColor: catDef.color, boxShadow: `0 10px 25px -5px ${catDef.color}60` }}>
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.05] select-none text-black z-0 scale-[0.6]">
                    {catDef.diamonds}
                  </div>
                  <div className="flex flex-col items-center z-10">
                    <span className="text-sm md:text-base font-black uppercase text-center leading-tight mb-3 text-white drop-shadow-sm">{deck.deckTitle}</span>
                    <span className="text-[11px] font-black px-4 py-1.5 rounded-full bg-white shadow-sm" style={{ color: catDef.color }}>LEVEL {deck.level}</span>
                  </div>
                </div>
              );
            }) : (
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
  const [favCount, setFavCount] = React.useState(null);

  // ลบตัวแปร categories เดิมออก และใช้ FLASHCARD_CATEGORIES ที่ประกาศไว้ด้านบนแทน
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
    async function loadFavs() {
       try {
         const count = await db.flashcards.where('isStarred').equals(1).count();
         setFavCount(count);
       } catch(e) { console.error(e); }
    }
    loadFavs();
    loadDecks();
  }, []);

  const goToLevelSelection = (catName, color) => {
    if (catName === 'MY FAVORITE') {
      navigate('/vocab/play', { state: { deckTitle: catName, level: 1, color: color } });
    } else {
      navigate('/vocab/levels', { state: { category: catName, color: color, decksData: decksData ? decksData[catName] : null } });
    }
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
      
      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-8 px-4">
        {FLASHCARD_CATEGORIES.map((cat, i) => {
          let wordCount = 0;
          let isDataLoaded = false;

          if (cat.name === 'MY FAVORITE') {
            wordCount = favCount !== null ? favCount : 0;
            isDataLoaded = favCount !== null;
          } else {
            isDataLoaded = decksData !== null;
            // ป้องกันแครชหาก API ส่งข้อมูลมาแต่ไม่มีฟิลด์ levels
            if (decksData && decksData[cat.name] && Array.isArray(decksData[cat.name].levels)) {
              wordCount = decksData[cat.name].levels.flat().length;
            } else {
              wordCount = 0;
            }
          }
          
          return (
            <div key={i} onClick={() => goToLevelSelection(cat.name, cat.color)} className="relative w-full aspect-[21/9] md:aspect-[16/9] cursor-pointer group" style={{ perspective: '1000px' }}>
              {/* Layer 1-3 เหมือนเดิม... */}
              
              {/* ... (คงส่วน Layer 1 และ 2 ไว้เหมือนเดิม) */}

              {/* Layer 3 (Top Code-Based Card) */}
              <div className="absolute inset-0 rounded-[2rem] flex flex-col justify-center items-center text-white transition-all duration-300 group-hover:-translate-y-1 group-active:scale-95 shadow-lg overflow-hidden" style={{ backgroundColor: cat.color, boxShadow: `0 10px 25px -5px ${cat.color}60` }}>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.05] select-none text-black z-0">
                  {cat.diamonds}
                </div>
                <div className="flex flex-col items-center z-10">
                  <h2 className="text-3xl sm:text-4xl font-bold tracking-tight max-w-xs mx-auto leading-tight text-center px-4">{cat.name}</h2>
                  <div className="mt-4 px-4 py-0.5 bg-white rounded-full font-medium text-sm transition-colors duration-500" style={{ color: cat.color }}>
                    {isDataLoaded ? `${wordCount} terms` : 'Loading...'}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function HubFlashcardLevels() {
  const themeVals = useOutletContext();
  const navigate = useNavigate();
  const location = useLocation();
  
  const category = location.state?.category || 'SCIENCE, HEALTH & NATURE';
  const color = location.state?.color || '#22c55e';
  
  const [levelProgress, setLevelProgress] = React.useState([0, 0, 0]);
  const [levelCounts, setLevelCounts] = React.useState([0, 0, 0]);
  const [activeLevel, setActiveLevel] = React.useState(0);

  React.useEffect(() => {
    async function loadLevelData() {
      try {
        const res = await fetch('/api/vocab/decks');
        const json = await res.json();
        if (json.status !== 'success' || !json.data[category]) return;
        
        const catData = json.data[category];
        const counts = catData.levels.map(lvl => lvl.length);
        setLevelCounts(counts);

        const localSrs = await db.vocab_srs.toArray();
        const rememberedWords = new Set(localSrs.filter(s => s.interval > 0).map(s => s.eng));

        const progressArr = catData.levels.map((lvlWords) => {
          if (lvlWords.length === 0) return 0;
          const matched = lvlWords.filter(w => rememberedWords.has(w.eng)).length;
          return Math.round((matched / lvlWords.length) * 100);
        });

        setLevelProgress(progressArr);
        
        if (progressArr[0] === 100 && progressArr[1] < 100) setActiveLevel(1);
        else if (progressArr[0] === 100 && progressArr[1] === 100) setActiveLevel(2);
        else setActiveLevel(0);

      } catch (e) {
        console.error(e);
      }
    }
    loadLevelData();
  }, [category]);

  const handleStartLevel = (lvlIdx) => {
    const recent = JSON.parse(localStorage.getItem('recent_decks') || '[]');
    const newDeck = { deckTitle: category, level: lvlIdx + 1, color: color };
    const updated = [newDeck, ...recent.filter(d => d.deckTitle !== category || d.level !== lvlIdx + 1)].slice(0, 3);
    localStorage.setItem('recent_decks', JSON.stringify(updated));
    navigate('/vocab/play', { state: newDeck });
  };

  return (
    <div className="flex flex-col items-center gap-8 animate-in fade-in duration-300 w-full pt-0 pb-12 overflow-hidden relative">
      <div className="flex items-center justify-between w-full max-w-xl px-4 mt-2 z-10">
        <button onClick={() => navigate('/vocab/decks')} className="w-12 h-12 flex items-center justify-center rounded-full border border-white/10" style={{ background: themeVals.raisedGradient, color: themeVals.textMain }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        <h1 className="text-xl font-black tracking-widest uppercase text-center truncate max-w-[250px]" style={{ color: themeVals.textMain }}>{category}</h1>
        <div className="w-12 h-12"></div>
      </div>

      <div className="relative w-full max-w-md flex flex-col items-center justify-center px-6 mt-8">
        <div className="flex transition-transform duration-500 ease-out gap-8 w-full justify-center">
          {[0, 1, 2].map((lvlIdx) => {
            const isLocked = lvlIdx > activeLevel;
            const progress = levelProgress[lvlIdx];
            const total = levelCounts[lvlIdx];
            const currentDone = Math.round((progress / 100) * total);

            return (
              <div 
                key={lvlIdx} 
                className={`w-[280px] shrink-0 rounded-[2.5rem] p-6 border border-white/10 flex flex-col items-center transition-all duration-300 ${lvlIdx === activeLevel ? 'scale-100 opacity-100' : 'scale-90 opacity-40 pointer-events-none'}`}
                style={{ background: themeVals.raisedGradient, boxShadow: `0 20px 40px -10px ${color}30` }}
              >
                <div className="w-20 h-20 rounded-full flex items-center justify-center text-white font-black text-2xl mb-4 shadow-md" style={{ background: isLocked ? '#505e72' : `linear-gradient(135deg, ${color} 0%, ${color}aa 100%)` }}>
                  {isLocked ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  ) : lvlIdx + 1}
                </div>

                <h3 className="font-black text-lg mb-1" style={{ color: themeVals.textMain }}>LEVEL {lvlIdx + 1}</h3>
                <span className="text-xs font-bold uppercase tracking-wider mb-6" style={{ color: color }}>
                  {isLocked ? 'Locked' : progress === 100 ? 'Completed' : 'In Progress'}
                </span>

                <div className="w-full flex flex-col gap-2 mb-6">
                  <div className="flex justify-between text-xs font-bold px-1" style={{ color: themeVals.textMain }}>
                    <span>PROGRESS</span>
                    <span>{currentDone}/{total} WORDS</span>
                  </div>
                  <div className="w-full h-3 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${progress}%`, background: color }}></div>
                  </div>
                </div>

                {!isLocked && (
                  <button 
                    onClick={() => handleStartLevel(lvlIdx)}
                    className="w-full py-4 rounded-2xl font-bold text-white text-sm transition-transform active:scale-95 shadow-md"
                    style={{ background: color }}
                  >
                    START LEVEL
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex gap-4 mt-10">
          {[0, 1, 2].map((i) => (
            <button 
              key={i} 
              onClick={() => i <= activeLevel && setActiveLevel(i)}
              disabled={i > activeLevel}
              className={`h-2.5 rounded-full transition-all ${i === activeLevel ? 'w-8' : 'w-2.5'} disabled:opacity-20`}
              style={{ background: i === activeLevel ? color : '#505e72' }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export function HubSpeedRead() {
  const themeVals = useOutletContext();
  return (
    <div className="flex flex-col items-center gap-8 animate-in fade-in duration-300 w-full pt-2 relative">
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