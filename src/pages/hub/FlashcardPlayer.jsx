import React, { useState, useEffect, useRef } from 'react';
import { useOutletContext, useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft, Undo2, Star } from 'lucide-react';
import { db } from '../../utils/db.js';
import { syncManager } from '../../utils/syncManager.js';

// สร้าง Web Worker แบบ Singleton
const dbWorker = new Worker(new URL('../../workers/dbWorker.js', import.meta.url), { type: 'module' });

function fetchDeckFromWorker(payload) {
  return new Promise((resolve, reject) => {
    const messageId = Math.random().toString(36).substring(7);
    const handler = (e) => {
      if (e.data.id === messageId) {
        dbWorker.removeEventListener('message', handler);
        if (e.data.status === 'success') resolve(e.data.data);
        else reject(new Error(e.data.error));
      }
    };
    dbWorker.addEventListener('message', handler);
    dbWorker.postMessage({ type: 'LOAD_DECK', id: messageId, payload });
  });
}

export default function FlashcardPlayer() {
  const contextVals = useOutletContext();
  const { currentUser: user, ...themeVals } = contextVals;
  const navigate = useNavigate();
  const location = useLocation();
  
  const isSRS = location.state?.isSRS || false;
  const currentCategory = location.state?.deckTitle || 'SCIENCE, HEALTH & NATURE';
  const currentLevel = location.state?.level || 1;

  // ลวดลายและสีจากโค้ด HTML ต้นฉบับ
  const CATEGORY_STYLES = {
    'SCIENCE, HEALTH & NATURE': {
      color: '#4bdd31',
      diamonds: <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none text-black z-0"><svg className="w-28 h-56" viewBox="0 0 100 200"><polygon points="50,10 90,100 50,190 10,100" fill="currentColor" stroke="currentColor" strokeWidth="12" strokeLinejoin="round" /></svg></div>
    },
    'BUSINESS & TECHNOLOGIES': {
      color: '#0070fb',
      diamonds: <div className="absolute inset-0 flex items-center justify-between px-16 pointer-events-none select-none text-black z-0"><svg className="w-28 h-56" viewBox="0 0 100 200"><polygon points="50,10 90,100 50,190 10,100" fill="currentColor" stroke="currentColor" strokeWidth="12" strokeLinejoin="round" /></svg><svg className="w-28 h-56" viewBox="0 0 100 200"><polygon points="50,10 90,100 50,190 10,100" fill="currentColor" stroke="currentColor" strokeWidth="12" strokeLinejoin="round" /></svg></div>
    },
    'ACADEMIC & CAREER': {
      color: '#ff2e57',
      diamonds: <div className="absolute inset-0 flex items-center justify-center space-x-10 pointer-events-none select-none text-black z-0"><svg className="w-20 h-40" viewBox="0 0 100 200"><polygon points="50,10 90,100 50,190 10,100" fill="currentColor" stroke="currentColor" strokeWidth="12" strokeLinejoin="round" /></svg><svg className="w-24 h-48" viewBox="0 0 100 200"><polygon points="50,10 90,100 50,190 10,100" fill="currentColor" stroke="currentColor" strokeWidth="12" strokeLinejoin="round" /></svg><svg className="w-20 h-40" viewBox="0 0 100 200"><polygon points="50,10 90,100 50,190 10,100" fill="currentColor" stroke="currentColor" strokeWidth="12" strokeLinejoin="round" /></svg></div>
    },
    'LIFESTYLE & MEDIA': {
      color: '#8c52ff',
      diamonds: <div className="absolute inset-0 flex flex-col items-center justify-between py-6 pointer-events-none select-none text-black z-0"><svg className="w-64 h-28" viewBox="0 0 200 100"><polygon points="100,10 190,50 100,90 10,50" fill="currentColor" stroke="currentColor" strokeWidth="12" strokeLinejoin="round" /></svg><svg className="w-64 h-28" viewBox="0 0 200 100"><polygon points="100,10 190,50 100,90 10,50" fill="currentColor" stroke="currentColor" strokeWidth="12" strokeLinejoin="round" /></svg></div>
    },
    'SOCIETY & CULTURE': {
      color: '#505e72',
      diamonds: <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none text-black z-0"><svg className="w-80 h-40" viewBox="0 0 200 100"><polygon points="100,10 190,50 100,90 10,50" fill="currentColor" stroke="currentColor" strokeWidth="12" strokeLinejoin="round" /></svg></div>
    },
    'MY FAVORITE': {
      color: '#ff8301',
      diamonds: null
    }
  };

  const currentStyle = CATEGORY_STYLES[isSRS ? 'MY FAVORITE' : currentCategory] || CATEGORY_STYLES['MY FAVORITE'];

  const [deck, setDeck] = useState([]);
  const [initialDeckSize, setInitialDeckSize] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [masteredHistory, setMasteredHistory] = useState([]);
  const [isReady, setIsReady] = useState(false);
  
  const [isChangingWord, setIsChangingWord] = useState(false);
  const [animClass, setAnimClass] = useState('');
  const [swipeGlow, setSwipeGlow] = useState('');
  const [swipeBg, setSwipeBg] = useState(null);
  const [showExampleFront, setShowExampleFront] = useState(false);
  const [showSynAnt, setShowSynAnt] = useState(false);
  const [starredWords, setStarredWords] = useState([]);
  const [sessionStats, setSessionStats] = useState({ remembered: 0, forgotten: 0 });

  const touchStartY = useRef(null);
  const touchStartX = useRef(null);
  // บังคับล็อกไม่ให้หน้าจอ Scroll ได้
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && user?.id) {
        syncManager.flushVocabWithBeacon(user.id);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [user?.id]);
  useEffect(() => {
    async function loadDeck() {
      try {
        const sessionKey = `session_${currentCategory}_${currentLevel}`;
        const savedSession = localStorage.getItem(sessionKey);
        
        // ให้ Worker ไปประมวลผลหาคำศัพท์มาจากเบื้องหลัง
        const result = await fetchDeckFromWorker({
          isSRS,
          currentCategory,
          currentLevel,
          now: Date.now()
        });

        let finalDeck = result.deck;
        
        // ถ้ามีเซสชันที่เล่นค้างไว้ ให้โหลดข้อมูลนั้นแทน
        if (savedSession && !isSRS && currentCategory !== 'MY FAVORITE') {
           finalDeck = JSON.parse(savedSession);
        }

        setDeck(finalDeck);
        setInitialDeckSize(finalDeck.length);
        setStarredWords(result.starredWords);
        setIsReady(true);
      } catch (error) {
        console.error('Worker Error:', error);
        setIsReady(true);
      }
    }
    loadDeck();
  }, [currentCategory, currentLevel, isSRS]);

  const currentWord = deck[currentIndex];
  // คำนวณสีและลายแบบไดนามิกตามหมวดหมู่จริงของคำศัพท์คำนั้น ๆ (สลับสีส้มออกเมื่อเป็นหมวดหมู่ย่อย)
  const cardColor = (currentCategory === 'MY FAVORITE' && currentWord)
    ? (CATEGORY_STYLES[currentWord.category]?.color || currentStyle.color)
    : currentStyle.color;

  const cardDiamonds = (currentCategory === 'MY FAVORITE' && currentWord)
    ? (CATEGORY_STYLES[currentWord.category]?.diamonds || currentStyle.diamonds)
    : currentStyle.diamonds;
  
  // Progress Bar Calculation
  const progressPercent = initialDeckSize > 0 ? (((initialDeckSize - deck.length) / initialDeckSize) * 100) : 100;

  // Pointer & Swipe Events (แยกระหว่างลาก กับ คลิกพลิกการ์ด)
  const handlePointerDown = (e) => {
    if (isChangingWord) return;
    touchStartY.current = e.clientY || (e.touches && e.touches[0].clientY);
    touchStartX.current = e.clientX || (e.touches && e.touches[0].clientX);
  };

  const handlePointerUp = (e) => {
    if (!touchStartY.current || isChangingWord) return;
    
    const endY = e.clientY || (e.changedTouches ? e.changedTouches[0].clientY : null);
    const endX = e.clientX || (e.changedTouches ? e.changedTouches[0].clientX : null);
    
    if (endY === null || endX === null) return;
    
    const distanceY = touchStartY.current - endY;
    const distanceX = touchStartX.current - endX;
    
    if (Math.abs(distanceY) > Math.abs(distanceX) && Math.abs(distanceY) > 50) {
      if (distanceY > 50) handleAnswer(true); // ปัดขึ้น (จำได้)
      else handleAnswer(false); // ปัดลง (จำไม่ได้)
    } else if (Math.abs(distanceX) < 10 && Math.abs(distanceY) < 10) {
      setIsFlipped(!isFlipped); // แตะธรรมดาเพื่อพลิกการ์ด
    }
    
    touchStartY.current = null;
    touchStartX.current = null;
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (isChangingWord || deck.length === 0) return;
      if (e.key === 'ArrowUp') handleAnswer(true);
      if (e.key === 'ArrowDown') handleAnswer(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isChangingWord, currentIndex, deck]);

  // ระบบ Animation โครงสร้างใหม่ การ์ดสไลด์ออกแล้วโผล่ขึ้นมาทันที (Stacking Wait Effect)
  const triggerCardAnim = (direction, actionFn) => {
    if (isChangingWord) return;
    setIsChangingWord(true);
    setShowExampleFront(false);
    setShowSynAnt(false);

    // ขั้นที่ 1: สั่งให้การ์ดใบบนปลิวออกตามทิศทาง (เปลี่ยนสีทั้งใบและเรืองแสง)
    if (direction === 'up') {
      setAnimClass('-translate-y-[150%] rotate-6 opacity-0 transition-all duration-250 ease-in');
      setSwipeGlow('shadow-[0_0_120px_rgba(52,199,89,1)] scale-105');
      setSwipeBg('#34C759');
    } else if (direction === 'down') {
      setAnimClass('translate-y-[150%] -rotate-6 opacity-0 transition-all duration-250 ease-in');
      setSwipeGlow('shadow-[0_0_120px_rgba(255,59,48,1)] scale-105');
      setSwipeBg('#FF3B30');
    } else if (direction === 'undo') {
      setAnimClass('translate-x-[150%] rotate-6 opacity-0 transition-all duration-250 ease-in');
      setSwipeGlow('');
      setSwipeBg(null);
    }

    setTimeout(() => {
      // ขั้นที่ 2: เปลี่ยนคำศัพท์และล้างสถานะการพลิกตอนที่มองไม่เห็นแล้ว
      actionFn();
      setIsFlipped(false);
      setSwipeGlow('');
      setSwipeBg(null);
      
      // ขั้นที่ 3: ดึงการ์ดให้มาย่อหลบอยู่ในตำแหน่ง "เตรียมเด้งขึ้น"
      setAnimClass('translate-y-3 scale-[0.95] opacity-100 transition-none');
      
      // ขั้นที่ 4: สั่งขยายและสไลด์การ์ดขึ้นมาแบบเด้งๆ ให้ความรู้สึกเป็นใบใหม่
      setTimeout(() => {
        setAnimClass('translate-y-0 scale-100 opacity-100 transition-transform duration-150 ease-out');
        setTimeout(() => {
          setAnimClass('');
          setIsChangingWord(false);
        }, 150);
      }, 20);
    }, 150);
  };
  const handleAnswer = async (isRemembered) => {
    if (!currentWord || isChangingWord) return;
    setSessionStats(prev => ({
      remembered: prev.remembered + (isRemembered ? 1 : 0),
      forgotten: prev.forgotten + (!isRemembered ? 1 : 0)
    }));

    const eng = currentWord.eng;
    const currentSrs = await db.vocab_srs.get(eng) || { eng, vocab_id: currentWord.id, repetition: 0, interval: 0, ease_factor: 2.5, revision: 0 };
    let { repetition, interval, ease_factor, revision = 0 } = currentSrs;

    let q = isRemembered ? 4 : 1;
    if (q >= 3) {
      if (repetition === 0) interval = 1;
      else if (repetition === 1) interval = 6;
      else interval = Math.round(interval * ease_factor);
      repetition += 1;
    } else {
      repetition = 0;
      interval = 0;
    }

    ease_factor = ease_factor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
    if (ease_factor < 1.3) ease_factor = 1.3;
    const next_review = Date.now() + (interval * 24 * 60 * 60 * 1000);
    revision += 1;

    const newSrsData = { eng, vocab_id: currentWord.id, repetition, interval, ease_factor, next_review, revision };
    await db.vocab_srs.put(newSrsData);

    if (user?.id) {
      await db.sync_outbox.put({
        user_id: user.id,
        vocab_id: currentWord.id,
        timestamp: Date.now()
      });
      syncManager.triggerVocabSync(user.id);
    }

    triggerCardAnim(isRemembered ? 'up' : 'down', () => {
      setMasteredHistory(prev => [...prev, { word: currentWord, originalIndex: currentIndex }]);
      const newDeck = [...deck];
      newDeck.splice(currentIndex, 1);
      setDeck(newDeck);
      if (currentIndex >= newDeck.length && currentIndex > 0) setCurrentIndex(newDeck.length - 1);
      
      if (!isSRS && currentCategory !== 'MY FAVORITE') {
        const sessionKey = `session_${currentCategory}_${currentLevel}`;
        if (newDeck.length > 0) localStorage.setItem(sessionKey, JSON.stringify(newDeck));
        else localStorage.removeItem(sessionKey);
      }
    });
  };

  const handleUndo = () => {
    if (masteredHistory.length === 0) return;
    triggerCardAnim('undo', () => {
      const historyCopy = [...masteredHistory];
      const lastMastered = historyCopy.pop();
      const newDeck = [...deck];
      newDeck.splice(lastMastered.originalIndex, 0, lastMastered.word);
      setDeck(newDeck);
      setMasteredHistory(historyCopy);
      setCurrentIndex(lastMastered.originalIndex);
      
      if (!isSRS && currentCategory !== 'MY FAVORITE') {
        localStorage.setItem(`session_${currentCategory}_${currentLevel}`, JSON.stringify(newDeck));
      }
      
      setSessionStats(prev => ({ remembered: Math.max(0, prev.remembered - 1), forgotten: prev.forgotten }));
    });
  };

  const handleRestart = () => {
    setSessionStats({ remembered: 0, forgotten: 0 });
    setMasteredHistory([]);
    if (!isSRS && currentCategory !== 'MY FAVORITE') localStorage.removeItem(`session_${currentCategory}_${currentLevel}`);
    window.location.reload();
  };

  const toggleStar = async () => { 
    const word = currentWord.eng; 
    const isCurrentlyStarred = starredWords.includes(word);
    const newStarredWords = isCurrentlyStarred ? starredWords.filter(w => w !== word) : [...starredWords, word];
    setStarredWords(newStarredWords); 
    await db.flashcards.where('eng').equals(word).modify({ isStarred: isCurrentlyStarred ? 0 : 1 });
  };

  const isStarred = currentWord && starredWords.includes(currentWord.eng);

  return (
    <div className="flex flex-col items-center w-full h-[calc(100dvh-110px)] overflow-hidden mx-auto animate-in fade-in duration-300 pb-4" style={{ fontFamily: "'Inter', 'Prompt', sans-serif" }}>

      {!isReady ? (
        <div className="w-full flex flex-col items-center px-4 animate-pulse pointer-events-none mt-2 h-full">
          <div className="w-full max-w-md flex flex-col items-center mb-4 md:mb-6 shrink-0 text-center">
            <div className="h-8 w-48 bg-black/10 dark:bg-white/10 rounded-full mb-3"></div>
            <div className="h-4 w-24 bg-black/10 dark:bg-white/10 rounded-full mb-4"></div>
            <div className="w-full max-w-[280px] h-1.5 bg-black/10 dark:bg-white/10 rounded-full"></div>
          </div>
          <div className="relative w-full max-w-5xl flex-1 min-h-[300px] mx-auto">
            <div className="absolute inset-0 rounded-[2.5rem] shadow-xl flex flex-col items-center justify-center p-8" style={{ backgroundColor: currentStyle.color }}>
              <div className="w-2/3 h-16 md:h-20 bg-white/20 rounded-full mb-6"></div>
              <div className="w-1/3 h-8 md:h-10 bg-white/20 rounded-full"></div>
            </div>
          </div>
        </div>
      ) : deck.length > 0 ? (
        <div className="w-full flex flex-col items-center px-4 mt-2 h-full">
          
          {/* Header Layout (อิงจากโค้ด index) */}
          <div className="w-full max-w-md flex flex-col items-center mb-4 md:mb-6 shrink-0 text-center">
            <h1 className="text-2xl font-extrabold mb-2 tracking-tight" style={{ color: themeVals.textMain }}>
              {currentCategory}
            </h1>
            <div className="flex items-center text-base font-bold mb-3" style={{ color: themeVals.textMain }}>
              <span>{initialDeckSize - deck.length + 1}</span>
              <span className="mx-3 font-normal opacity-40">|</span>
              <span>{initialDeckSize}</span>
            </div>
            <div className="w-full max-w-[280px] h-1.5 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
              <div className="h-1.5 rounded-full transition-all duration-500" style={{ width: `${progressPercent}%`, backgroundColor: currentStyle.color }}></div>
            </div>
          </div>

          {/* Area การ์ดแนวนอน แบบ 3D Layering */}
          <div className="relative w-full max-w-5xl flex-1 min-h-[300px] mx-auto transition-all duration-300">
            
            {/* Layer 0: การ์ดจำลองสำหรับสร้างมิติให้ดูเป็นปึกการ์ด */}
            {deck.length > 1 && (
              <div className="absolute inset-0 rounded-[2.5rem] shadow-xl pointer-events-none" style={{ backgroundColor: cardColor, transform: 'translateY(16px) scale(0.95)', zIndex: 0 }}>
                <div className="opacity-[0.05] w-full h-full rounded-[2.5rem] overflow-hidden relative">
                  {cardDiamonds}
                </div>
              </div>
            )}

            {/* Layer 1: การ์ดจริงๆ ที่โต้ตอบได้และปลิวออกได้ */}
            <div 
              className={`absolute inset-0 z-10 w-full h-full cursor-pointer touch-none ${animClass}`}
              style={{ perspective: '1200px' }}
              onPointerDown={handlePointerDown}
              onPointerUp={handlePointerUp}
              onPointerCancel={() => { touchStartY.current = null; touchStartX.current = null; }}
            >
              {/* แกนหมุน 3D พลิกการ์ด (หน้า-หลัง) */}
              <div 
                className="relative w-full h-full text-center transition-transform duration-500 cursor-pointer" 
                style={{ 
                  transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)', 
                  transition: 'transform 0.6s cubic-bezier(0.4, 0.0, 0.2, 1)', 
                  transformStyle: 'preserve-3d' 
                }}
              >
                
                {/* ---------------- FRONT (หน้าการ์ด) ---------------- */}
                <div 
                  className={`absolute w-full h-full rounded-[2.5rem] flex flex-col items-center justify-center text-white p-8 md:p-12 transition-all duration-150 ${swipeGlow || 'shadow-xl'} ${isFlipped ? 'pointer-events-none' : 'pointer-events-auto'}`} 
                  style={{ backgroundColor: swipeBg || cardColor, backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', transform: 'translateZ(0)', WebkitTransform: 'translateZ(0)' }}
                >
                  
                  {/* ปุ่ม Star ซ้ายบน */}
                  <div 
                    className="absolute top-6 left-6 md:top-8 md:left-8 h-8 flex items-center z-20 cursor-pointer hover:scale-110 transition-transform" 
                    onClick={(e) => { e.stopPropagation(); toggleStar(); }}
                    onPointerDown={(e) => e.stopPropagation()}
                    onPointerUp={(e) => e.stopPropagation()}
                  >
                    <Star size={32} fill={isStarred ? '#FFD700' : 'none'} color={isStarred ? '#FFD700' : '#ffffff'} />
                  </div>
                  
                  {/* ลาย Watermark Background */}
                  <div className="absolute inset-0 pointer-events-none opacity-[0.05] select-none text-black z-0 rounded-[2.5rem] overflow-hidden">
                    {cardDiamonds}
                  </div>
                  
                  {/* ปุ่ม Info / Close (ขวาบน) */}
                  <button 
                    onClick={(e) => { e.stopPropagation(); setShowExampleFront(!showExampleFront); }} 
                    onPointerDown={(e) => e.stopPropagation()}
                    onPointerUp={(e) => e.stopPropagation()}
                    className="absolute top-6 right-6 md:top-8 md:right-8 w-8 h-8 md:w-10 md:h-10 bg-white rounded-full flex items-center justify-center text-sm md:text-base font-bold shadow-md hover:scale-105 transition-all duration-300 z-20" 
                    style={{ color: cardColor }}
                  >
                    {showExampleFront ? '✕' : 'i'}
                  </button>

                  {/* หน้าหลัก - คำศัพท์ & ประเภท */}
                  {!showExampleFront ? (
                    <div className="flex flex-col items-center z-10 w-full px-4">
                      <h2 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-normal tracking-wide text-center break-words w-full">{currentWord.eng}</h2>
                      <div className="mt-6 md:mt-8 px-6 py-1 md:px-8 md:py-2 bg-white rounded-full font-bold text-sm md:text-lg transition-colors duration-500 shadow-sm" style={{ color: cardColor }}>
                        {currentWord.pos}
                      </div>
                    </div>
                  ) : (
                    /* หน้าตัวอย่างประโยค (Overlay ดำ) */
                    <div className="absolute inset-0 bg-black/20 rounded-[2.5rem] p-8 md:p-12 flex flex-col justify-center items-center text-center z-10 pointer-events-auto backdrop-blur-sm" onClick={(e) => { e.stopPropagation(); setShowExampleFront(false); }}>
                      <p className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-semibold leading-relaxed md:leading-normal drop-shadow-md">"{currentWord.example || '-'}"</p>
                    </div>
                  )}
                </div>

                {/* ---------------- BACK (หลังการ์ด) ---------------- */}
                <div 
                  className={`absolute w-full h-full rounded-[2.5rem] flex flex-col items-center justify-center text-white p-8 md:p-12 transition-all duration-150 ${swipeGlow || 'shadow-xl'} ${!isFlipped ? 'pointer-events-none' : 'pointer-events-auto'}`} 
                  style={{ backgroundColor: swipeBg || cardColor, transform: 'rotateY(180deg) translateZ(0)', WebkitTransform: 'rotateY(180deg) translateZ(0)', backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
                >
                  
                  {/* ปุ่ม Star ซ้ายบน */}
                  <div 
                    className="absolute top-6 left-6 md:top-8 md:left-8 h-8 flex items-center z-20 cursor-pointer hover:scale-110 transition-transform" 
                    onClick={(e) => { e.stopPropagation(); toggleStar(); }}
                    onPointerDown={(e) => e.stopPropagation()}
                    onPointerUp={(e) => e.stopPropagation()}
                  >
                    <Star size={32} fill={isStarred ? '#FFD700' : 'none'} color={isStarred ? '#FFD700' : '#ffffff'} />
                  </div>

                  {/* iOS Style Switch ขวาบน */}
                  <div 
                    className="absolute top-6 right-6 md:top-8 md:right-8 flex items-center gap-2 z-20 cursor-pointer hover:opacity-90 transition-opacity" 
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowSynAnt(!showSynAnt);
                    }}
                    onPointerDown={(e) => e.stopPropagation()}
                    onPointerUp={(e) => e.stopPropagation()}
                  >
                    <div 
                      className="w-14 h-8 md:w-16 md:h-9 rounded-full relative transition-all duration-300 shadow-inner" 
                      style={{ backgroundColor: showSynAnt ? '#4bdd31' : 'rgba(0, 0, 0, 0.2)' }}
                    >
                      <div 
                        className="w-6 h-6 md:w-7 md:h-7 bg-white rounded-full absolute top-1 left-1 md:top-1 md:left-1 transition-transform duration-300 shadow-md" 
                        style={{ transform: showSynAnt ? 'translateX(24px)' : 'translateX(0px)', ...(window.innerWidth >= 768 && showSynAnt ? { transform: 'translateX(28px)' } : {}) }}
                      ></div>
                    </div>
                  </div>

                  {/* เนื้อหาหลังการ์ด */}
                  <div className="w-full h-full flex items-center justify-center z-10 mt-4 md:mt-0 px-4">
                    {!showSynAnt ? (
                      /* แปลไทย */
                      <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-prompt font-normal text-center leading-tight break-words w-full">{currentWord.thai}</h2>
                    ) : (
                      /* Synonyms / Antonyms Layout */
                      <div className="w-full h-full flex flex-col items-center justify-center gap-6 md:gap-10">
                        <div className="flex flex-col items-center w-full">
                          <span className="text-sm md:text-base opacity-70 tracking-widest font-bold mb-2 md:mb-3 uppercase">Synonym</span>
                          <span className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-center break-words w-full px-2">{currentWord.synonyms || '-'}</span>
                        </div>
                        <div className="w-32 md:w-48 h-[2px] bg-white/20 my-2 md:my-4 rounded-full"></div>
                        <div className="flex flex-col items-center w-full">
                          <span className="text-sm md:text-base opacity-70 tracking-widest font-bold mb-2 md:mb-3 uppercase">Antonym</span>
                          <span className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-center break-words w-full px-2">{currentWord.antonyms || '-'}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </div>
          </div>

          {/* ปุ่ม Undo ด้านล่าง */}
          <div className="w-full max-w-md flex justify-center mt-6 shrink-0">
            <button onClick={handleUndo} disabled={masteredHistory.length === 0 || isChangingWord} className="py-3 px-8 flex justify-center items-center rounded-full font-bold transition-transform active:scale-95 disabled:opacity-20 disabled:cursor-not-allowed bg-black/5 dark:bg-white/10" style={{ color: themeVals.textMain }}>
              <Undo2 size={18} strokeWidth={2.5} className="mr-2" /> UNDO
            </button>
          </div>

        </div>
      ) : (
        <div className="flex-1 w-full flex flex-col items-center justify-center text-center px-4">
          <h2 className="text-[2rem] font-black mb-2 tracking-tight uppercase" style={{ color: themeVals.textMain }}>SESSION COMPLETE</h2>
          <div className="flex flex-col gap-4 mb-8 w-full max-w-[320px] mt-6">
            <div className="flex justify-between items-center p-5 rounded-[1.5rem] bg-black/5 dark:bg-white/5">
              <span className="font-bold text-[#34C759]">REMEMBERED</span>
              <span className="font-black text-2xl text-[#34C759]">{sessionStats.remembered}</span>
            </div>
            <div className="flex justify-between items-center p-5 rounded-[1.5rem] bg-black/5 dark:bg-white/5">
              <span className="font-bold text-[#FF3B30]">FORGOTTEN</span>
              <span className="font-black text-2xl text-[#FF3B30]">{sessionStats.forgotten}</span>
            </div>
          </div>
          <button onClick={handleRestart} disabled={isChangingWord} className="w-full max-w-[320px] py-[16px] flex justify-center items-center rounded-full transition-transform active:scale-95 font-black text-[1.1rem] mb-4 shadow-md text-white" style={{ backgroundColor: currentStyle.color }}>
            REVIEW AGAIN
          </button>
          <button onClick={() => navigate(-1)} className="w-full max-w-[320px] py-[16px] flex justify-center items-center rounded-full transition-transform active:scale-95 font-bold text-[1rem] bg-black/5 dark:bg-white/10" style={{ color: themeVals.textMain }}>
            BACK TO MENU
          </button>
        </div>
      )}
    </div>
  );
}