import React from 'react';
import { Link, useOutletContext, useNavigate, useLocation } from 'react-router-dom';
import { db } from '../../utils/db.js';
import { useQuery, useQueryClient } from '@tanstack/react-query';
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
    <div className="flex flex-col items-center gap-10 animate-in fade-in duration-300 w-full -mt-[-90px]">
      <div className="flex flex-col md:flex-row flex-wrap justify-center items-stretch gap-6 w-full max-w-5xl mx-auto md:h-[60vh] md:min-h-[350px]">
        {/* กล่องที่ 1 */}
        <Link to="/admissim" className="w-full md:w-[25%] aspect-[21/9] md:aspect-auto rounded-[2rem] flex items-end justify-center pb-8 md:pb-10 transition-colors border border-white/10" style={{ background: themeVals.raisedGradient, boxShadow: themeVals.shadowPlateau }}>
          <span className="text-xl font-black tracking-widest uppercase transition-colors" style={{ color: themeVals.textMain }}>ADMiSSiM</span>
        </Link>
        
        {/* กล่องที่ 2 */}
        <div 
          onClick={() => navigate('/speedread')}
          className="w-full md:w-[25%] aspect-[21/9] md:aspect-auto rounded-[2rem] flex items-end justify-center pb-8 md:pb-10 cursor-pointer transition-transform active:scale-95 border border-white/10" 
          style={{ background: themeVals.raisedGradient, boxShadow: themeVals.shadowPlateau }}
        >
          <span className="text-xl font-black tracking-widest uppercase text-center leading-none transition-colors" style={{ color: themeVals.textMain }}>
            ULTRA<br/>SPEEDREAD
          </span>
        </div>
        
        {/* กล่องที่ 3 (รวม 2 กล่องย่อยแนวตั้ง) */}
        <div className="w-full md:w-[25%] flex flex-col gap-6">
          <Link to="/vocab" className="w-full aspect-[21/9] md:aspect-auto flex-1 rounded-[2rem] flex items-center justify-center cursor-pointer transition-transform active:scale-95 border border-white/10" style={{ background: themeVals.raisedGradient, boxShadow: themeVals.shadowPlateau }}>
            <span className="text-xl font-black tracking-widest uppercase transition-colors" style={{ color: themeVals.textMain }}>FLASHCARDS</span>
          </Link>
          <Link to="/storydiary" className="w-full aspect-[21/9] md:aspect-auto flex-1 rounded-[2rem] flex items-center justify-center cursor-pointer transition-transform active:scale-95 border border-white/10" style={{ background: themeVals.raisedGradient, boxShadow: themeVals.shadowPlateau }}>
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

  const queryClient = useQueryClient();

  useQuery({
    queryKey: ['srsData', themeVals?.currentUser?.id],
    queryFn: async () => {
      if (!themeVals?.currentUser?.id) return null;
      const res = await fetch(`/api/vocab/srs-sync?userId=${themeVals.currentUser.id}`);
      if (!res.ok) throw new Error('Network response was not ok');
      const json = await res.json();
      
      if (json.status === 'success' && json.data) {
        const srsData = json.data.map(item => ({
          vocab_id: String(item.vocab_id),
          eng: item.eng,
          repetition: item.interval > 1 ? 2 : 1,
          interval: item.interval,
          ease_factor: item.ease_factor,
          next_review: new Date(item.next_review_date).getTime(),
          revision: item.revision || 0
        }));
        await db.vocab_srs.bulkPut(srsData);
      }
      
      // อัปเดต Due Count ทันทีหลัง Sync เสร็จ
      const now = Date.now();
      const localSrs = await db.vocab_srs.toArray();
      setDueCount(localSrs.filter(s => s.next_review <= now).length);
      
      return json.data;
    },
    enabled: !!themeVals?.currentUser?.id,
  });

  React.useEffect(() => {
    async function loadLocalStats() {
      try {
        const recents = JSON.parse(localStorage.getItem('recent_decks') || '[]');
        setRecentDecks(recents.slice(0, 3));
        
        // โหลดจาก Local ระหว่างรอ Query
        const now = Date.now();
        const localSrs = await db.vocab_srs.toArray();
        setDueCount(localSrs.filter(s => s.next_review <= now).length);
      } catch (err) {
        console.error(err);
      }
    }
    loadLocalStats();
  }, []);

  const goToAllDecks = () => navigate('/vocab/decks');
  const goToSRSReview = () => navigate('/vocab/play', { state: { isSRS: true, deckTitle: 'DAILY REVIEW' } });

  return (
    <div className="flex flex-col items-center gap-6 animate-in fade-in duration-300 w-full pt-0">
      <h1 className="text-2xl font-black tracking-widest uppercase" style={{ color: themeVals.textMain }}>FLASHCARD HUB</h1>
      
      <div className="w-full max-w-4xl flex flex-col gap-6 px-4">
        {/* Top Row */}
        <div className="flex flex-col md:flex-row gap-6 w-full">
          <div onClick={goToAllDecks} className="flex-1 relative aspect-[21/9] md:aspect-[16/9] rounded-[2.5rem] flex flex-col items-center justify-center p-6 cursor-pointer border border-white/10 transition-transform active:scale-95" style={{ background: themeVals.raisedGradient, boxShadow: themeVals.shadowPlateau }}>
            <span className="text-2xl font-black uppercase tracking-widest text-center leading-tight" style={{ color: themeVals.textMain }}>ALL DECKS</span>
            <span className="text-sm font-medium mt-2 text-center" style={{ color: themeVals.textMain, opacity: 0.7 }}>Browse categories & levels</span>
          </div>
          
          <div onClick={goToSRSReview} className="flex-1 relative aspect-[21/9] md:aspect-[16/9] rounded-[2.5rem] flex flex-col items-center justify-center p-6 cursor-pointer border border-white/10 transition-transform active:scale-95 overflow-hidden" style={{ background: 'linear-gradient(135deg, #FF9500 0%, #FF5E3A 100%)', boxShadow: themeVals.shadowPlateau }}>
            <span className="text-2xl font-black uppercase tracking-widest text-white text-center leading-tight">SMART REVIEW</span>
            <div className="mt-4 bg-white/20 backdrop-blur-md px-5 py-2 rounded-full border border-white/30">
              <span className="text-white font-bold">{dueCount} WORDS DUE</span>
            </div>
          </div>
        </div>

        {/* Bottom Row */}
        <div className="w-full flex flex-col gap-4 mt-6">
          <h2 className="text-lg font-bold tracking-wider uppercase text-left ml-4" style={{ color: themeVals.textMain, opacity: 0.8 }}>RECENTLY STUDIED</h2>
          <div className="flex flex-col md:flex-row gap-5 md:gap-6 w-full">
            {recentDecks.length > 0 ? recentDecks.map((deck, idx) => {
              const catDef = FLASHCARD_CATEGORIES.find(c => c.name === deck.deckTitle) || { color: deck.color || '#8c52ff', diamonds: null };
              return (
                <div key={idx} onClick={() => navigate('/vocab/play', { state: deck })} className="flex-1 relative aspect-[21/9] md:aspect-[16/9] rounded-[2rem] flex flex-col items-center justify-center p-4 cursor-pointer border border-white/10 transition-transform duration-300 hover:-translate-y-1 active:scale-95 overflow-hidden" style={{ backgroundColor: catDef.color, boxShadow: `0 10px 25px -5px ${catDef.color}60` }}>
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.05] select-none text-black z-0 scale-[0.6]">
                    {catDef.diamonds}
                  </div>
                  <div className="flex flex-col items-center justify-center z-10 w-full px-1">
                    <span className="text-sm md:text-base font-black uppercase text-center leading-tight mb-2 text-white drop-shadow-sm line-clamp-2">{deck.deckTitle}</span>
                    <span className="text-[11px] font-black px-4 py-1.5 rounded-full bg-white shadow-sm shrink-0 mt-1" style={{ color: catDef.color }}>LEVEL {deck.level}</span>
                  </div>
                </div>
              );
            }) : (
              <div className="flex-1 relative aspect-[21/9] md:aspect-[16/9] rounded-[2rem] flex items-center justify-center p-4 border border-white/10 opacity-60" style={{ background: themeVals.raisedGradient, boxShadow: themeVals.shadowPlateau }}>
                <span className="text-sm font-medium text-center px-4" style={{ color: themeVals.textMain }}>No recent decks yet. Let's study!</span>
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
  const [favCount, setFavCount] = React.useState(null);
  const [activeCategory, setActiveCategory] = React.useState(null);

  // 1. เช็คข้อมูล Meta พร้อมแนบเวลาปัจจุบัน (?t=) เพื่อบังคับทะลวง Cache ของเบราว์เซอร์ 100%
  const { data: metaData } = useQuery({
    queryKey: ['vocabMeta'],
    queryFn: async () => {
      const res = await fetch(`/api/vocab/meta?t=${Date.now()}`);
      if (!res.ok) throw new Error('Meta fetch error');
      return res.json();
    },
    refetchOnMount: true,
    staleTime: 0,
  });

  // 2. ดึงข้อมูลคำศัพท์ (ผูกกับ localStorage ป้องกันการเคลียร์ข้อมูลมั่วซั่วตอนเด็กรีเฟรชหน้าเว็บ)
  const { data: decksData, isFetching: isDecksSyncing } = useQuery({
    queryKey: ['decksData', metaData?.version],
    queryFn: async () => {
      const localVersion = localStorage.getItem('local_vocab_version');
      const count = await db.flashcards.count();

      if (localVersion !== metaData.version || count === 0) {
          // 🔄 ต้องซิงก์ใหม่ (เวอร์ชันเปลี่ยน หรือข้อมูลในเครื่องโบ๋)
          const res = await fetch(`/api/vocab/decks?v=${metaData.version}`);
          if (!res.ok) throw new Error('Network error');
        const json = await res.json();
        
        if (json.status === 'success' && json.data) {
          const allWords = Object.values(json.data).filter(c => c.levels).flatMap(c => c.levels.flat());
          
          let starredEng = new Set();
          if (count > 0) {
            const starredWords = await db.flashcards.where('isStarred').equals(1).toArray();
            starredEng = new Set(starredWords.map(w => w.eng));
          }

          // 🛡️ คลีนข้อมูลป้องกัน iOS Safari บั๊ก (DataError) เมื่อเจอ Index เป็น null
          const wordsToSave = allWords.map(w => ({
            ...w,
            category: (w.category || "UNCATEGORIZED").toUpperCase(),
            eng: w.eng || "Unknown",
            isStarred: w.eng && starredEng.has(w.eng) ? 1 : 0,
            sort_order: w.sort_order != null ? Number(w.sort_order) : 0
          }));

          try {
            // ล็อก Transaction ป้องกันเด็กคลิกเปิดการ์ดระหว่างที่กำลังเขียนข้อมูล
            await db.transaction('rw', db.flashcards, async () => {
              await db.flashcards.clear();
              if (wordsToSave.length > 0) {
                await db.flashcards.bulkPut(wordsToSave);
              }
            });
            localStorage.setItem('local_vocab_version', metaData.version);
            return true;
          } catch (err) {
            alert("พบปัญหาการอัปเดตฐานข้อมูลบนอุปกรณ์ iOS: " + err.message);
            console.error("Dexie iOS Error:", err);
            return false;
          }
        }
      } else {
        // ⚡ เวอร์ชันตรงกัน ไม่ต้องทำ Grouping ซ้ำซ้อนให้เปลือง CPU
        return true;
      }
      return null;
    },
    enabled: !!metaData?.version,
    staleTime: Infinity,
  });

  React.useEffect(() => {
    async function loadFavs() {
       try {
         const count = await db.flashcards.where('isStarred').equals(1).count();
         setFavCount(count);
       } catch(e) { console.error(e); }
    }
    loadFavs();
  }, []);

  const handleStartLevel = (catName, color, levelIdx) => {
    if (isDecksSyncing) {
      alert("กำลังอัปเดตฐานข้อมูลคำศัพท์ โปรดรอสักครู่...");
      return;
    }
    if (catName === 'MY FAVORITE') {
      navigate('/vocab/play', { state: { deckTitle: catName, level: 1, color: color } });
      return;
    }
    const recent = JSON.parse(localStorage.getItem('recent_decks') || '[]');
    const newDeck = { deckTitle: catName, level: levelIdx, color: color };
    const updated = [newDeck, ...recent.filter(d => d.deckTitle !== catName || d.level !== levelIdx)].slice(0, 3);
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

      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-8 px-4">
        {FLASHCARD_CATEGORIES.map((cat, i) => {
          let wordCount = 0;
          let isDataLoaded = false;

          if (cat.name === 'MY FAVORITE') {
            wordCount = favCount !== null ? favCount : 0;
            isDataLoaded = favCount !== null;
          } else {
            isDataLoaded = !!metaData?.counts;
            wordCount = metaData?.counts?.[cat.name]?.total || 0;
          }

          const isActive = activeCategory === cat.name;

          return (
            <div
              key={i}
              onClick={cat.name === 'MY FAVORITE' ? () => handleStartLevel(cat.name, cat.color, 1) : () => setActiveCategory(isActive ? null : cat.name)}
              className="relative w-full aspect-[21/9] md:aspect-[16/9] cursor-pointer"
              style={{ perspective: '1000px' }}
            >
              <div className={`absolute inset-0 rounded-[2rem] flex flex-col justify-center items-center text-white transition-all duration-300 shadow-lg overflow-hidden ${!isActive ? 'hover:-translate-y-1' : ''}`} style={{ backgroundColor: cat.color, boxShadow: `0 10px 25px -5px ${cat.color}60` }}>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.05] select-none text-black z-0">
                  {cat.diamonds}
                </div>
                <div className={`flex flex-col items-center z-10 transition-transform duration-300 ${isActive ? 'scale-95 opacity-30' : ''}`}>
                  <h2 className="text-3xl sm:text-4xl font-bold tracking-tight max-w-xs mx-auto leading-tight text-center px-4">{cat.name}</h2>
                  <div className="mt-4 px-4 py-0.5 bg-white rounded-full font-medium text-sm transition-colors duration-500" style={{ color: cat.color }}>
                    {isDataLoaded ? `${wordCount} terms` : 'Loading...'}
                  </div>
                </div> 

                {cat.name !== 'MY FAVORITE' && (
                  <div className={`absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity duration-300 flex flex-col items-center justify-center z-20 ${isActive ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
                    <span className="text-white font-bold mb-2 tracking-widest text-sm drop-shadow-md">SELECT LEVEL</span>
                    <div className="flex w-full h-20 px-6 sm:px-8 gap-4 sm:gap-4">
                      {[1, 2, 3].map(lvl => {
                        const levelWordCount = metaData?.counts?.[cat.name]?.levels?.[lvl - 1] || 0;
                        return (
                          <button
                            key={lvl}
                            onClick={(e) => { e.stopPropagation(); handleStartLevel(cat.name, cat.color, lvl); }}
                            className={`flex-1 py-2 rounded-2xl bg-white transition-transform shadow-xl flex flex-col items-center justify-center ${isDecksSyncing ? 'opacity-50 cursor-not-allowed' : 'hover:-translate-y-1 active:scale-95'}`}
                            style={{ color: cat.color }}
                          >
                            <span className="font-black text-xl sm:text-2xl leading-none">{lvl}</span>
                            <span className="text-[10px] sm:text-xs font-bold opacity-80 mt-1">
                              {isDecksSyncing ? 'Syncing...' : (isDataLoaded ? `${levelWordCount} terms` : '...')}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
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