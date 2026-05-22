import React, { useState, useEffect, useRef } from 'react';
import { useOutletContext, useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft, Undo2, Star } from 'lucide-react';
import { db } from '../../utils/db.js';

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
  
  const [isChangingWord, setIsChangingWord] = useState(false);
  const [animClass, setAnimClass] = useState('');
  const [showExampleFront, setShowExampleFront] = useState(false);
  const [showSynAnt, setShowSynAnt] = useState(false);
  const [starredWords, setStarredWords] = useState([]);
  const [sessionStats, setSessionStats] = useState({ remembered: 0, forgotten: 0 });

  const touchStartY = useRef(null);
  const touchStartX = useRef(null);
  const syncTimeoutRef = useRef(null);
  const pendingSyncRef = useRef(false);
  const latestStarsRef = useRef(starredWords);
  const fullFavsRef = useRef({ stories: [], vocab: [] });
  const actionQueueRef = useRef([]);

  useEffect(() => { latestStarsRef.current = starredWords; }, [starredWords]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && pendingSyncRef.current && user?.id) {
        syncToCloud(true);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [user?.id]);
  
  const syncToCloud = async (isEmergency = false) => {
    if (!user?.id || actionQueueRef.current.length === 0) return;
    pendingSyncRef.current = false;
    
    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    syncTimeoutRef.current = null;

    const pendingActions = [...actionQueueRef.current];
    actionQueueRef.current = [];
    
    const srsUpdates = pendingActions.filter(a => a.type === 'srs_update').map(a => a.data);
    const starUpdates = pendingActions.filter(a => a.type === 'star_vocab');

    if (srsUpdates.length > 0) {
      const srsPayload = { userId: user.id, updates: srsUpdates };
      if (isEmergency) {
        navigator.sendBeacon('/api/vocab/srs-sync', new Blob([JSON.stringify(srsPayload)], { type: 'application/json' }));
      } else {
        fetch('/api/vocab/srs-sync', { method: 'POST', body: JSON.stringify(srsPayload), headers: { 'Content-Type': 'application/json' } })
        .catch(() => {
           actionQueueRef.current = [...actionQueueRef.current, ...pendingActions.filter(a => a.type === 'srs_update')];
           pendingSyncRef.current = true;
        });
      }
    }

    if (starUpdates.length > 0) {
      const starPayload = { userId: user.id, syncActions: starUpdates };
      if (isEmergency) {
        navigator.sendBeacon('/api/user/sync', new Blob([JSON.stringify(starPayload)], { type: 'application/json' }));
      } else {
        fetch('/api/user/sync', { method: 'POST', body: JSON.stringify(starPayload), headers: { 'Content-Type': 'application/json' } })
        .catch(() => {
           actionQueueRef.current = [...actionQueueRef.current, ...starUpdates];
           pendingSyncRef.current = true;
        });
      }
    }
  };

  useEffect(() => {
    async function initLocalDB() {
      try {
        const localCount = await db.flashcards.count();
        try {
          const lastSync = localStorage.getItem('vocabLastSync') || '';
          let res = await fetch(`/api/vocab/list?t=${Date.now()}${lastSync ? `&lastSync=${encodeURIComponent(lastSync)}` : ''}`);
          let cloudVocab = await res.json();
          if (cloudVocab.status === 'success') {
            let data = cloudVocab.data || [];
            if (!lastSync || localCount === 0) {
              const activeData = data.filter(v => v.is_deleted !== 1);
              const currentStars = await db.flashcards.where('isStarred').equals(1).toArray();
              const starSet = new Set(currentStars.map(w => w.eng));
              const newData = activeData.map(v => ({ ...v, isStarred: starSet.has(v.eng) ? 1 : 0 }));
              await db.flashcards.clear();
              await db.flashcards.bulkAdd(newData);
            } else {
              if (data.length > 0) {
                const toDelete = data.filter(v => v.is_deleted === 1).map(v => v.eng);
                const toUpsert = data.filter(v => v.is_deleted !== 1);
                const currentStars = await db.flashcards.where('isStarred').equals(1).toArray();
                const starSet = new Set(currentStars.map(w => w.eng));
                const upsertData = toUpsert.map(v => ({ ...v, isStarred: starSet.has(v.eng) ? 1 : 0 }));
                if (toDelete.length > 0) await db.flashcards.where('eng').anyOf(toDelete).delete();
                if (upsertData.length > 0) await db.flashcards.bulkPut(upsertData);
              }
              const newLocalCount = await db.flashcards.count();
              if (cloudVocab.total !== undefined && newLocalCount !== cloudVocab.total) {
                const fullRes = await fetch(`/api/vocab/list?t=${Date.now()}`);
                const fullCloudVocab = await fullRes.json();
                if (fullCloudVocab.status === 'success' && fullCloudVocab.data) {
                  const currentStars = await db.flashcards.where('isStarred').equals(1).toArray();
                  const starSet = new Set(currentStars.map(w => w.eng));
                  const finalData = fullCloudVocab.data.map(v => ({ ...v, isStarred: starSet.has(v.eng) ? 1 : 0 }));
                  await db.flashcards.clear();
                  await db.flashcards.bulkAdd(finalData);
                  if (fullCloudVocab.serverTime) localStorage.setItem('vocabLastSync', fullCloudVocab.serverTime);
                }
                return;
              }
            }
            if (cloudVocab.serverTime) localStorage.setItem('vocabLastSync', cloudVocab.serverTime);
          }
        } catch (e) { console.warn('Offline mode: using local database'); }
        
        if (user?.id) {
          try {
            const res = await fetch(`/api/user/sync?userId=${user.id}`);
            const cloudData = await res.json();
            if (cloudData.status === 'success' && cloudData.data?.favorites) {
              const favData = JSON.parse(cloudData.data.favorites);
              fullFavsRef.current = favData;
              const cloudVocabFavs = favData.vocab || [];
              await db.flashcards.toCollection().modify({ isStarred: 0 });
              if (cloudVocabFavs.length > 0) {
                await db.flashcards.where('eng').anyOf(cloudVocabFavs).modify({ isStarred: 1 });
              }
            }
          } catch(e) { console.error('Cloud sync error', e); }
        }
        
        let rawDeck = [];
        if (isSRS) {
          rawDeck = await db.flashcards.toArray();
        } else if (currentCategory === 'MY FAVORITE') {
          rawDeck = await db.flashcards.where('isStarred').equals(1).toArray();
        } else {
          rawDeck = await db.flashcards.filter(word => word.category === currentCategory).toArray();
        }
        rawDeck.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

        if (!isSRS && currentCategory !== 'MY FAVORITE' && rawDeck.length > 0) {
          const chunkSize = Math.ceil(rawDeck.length / 3);
          const idx = currentLevel - 1;
          rawDeck = rawDeck.slice(idx * chunkSize, (idx + 1) * chunkSize);
        }

        const srsData = await db.vocab_srs.toArray();
        const srsMap = {};
        srsData.forEach(item => srsMap[item.eng] = item);
        
        const now = Date.now();
        let localDeck = [];
        
        if (!isSRS && currentCategory !== 'MY FAVORITE') {
          const sessionKey = `session_${currentCategory}_${currentLevel}`;
          const savedSession = localStorage.getItem(sessionKey);
          if (savedSession) {
            localDeck = JSON.parse(savedSession);
          } else {
            localDeck = rawDeck.filter(card => {
              const srs = srsMap[card.eng];
              return !srs || srs.interval === 0;
            });
            if (localDeck.length === 0) localDeck = [...rawDeck];
          }
        } else {
          localDeck = rawDeck.filter(card => {
            const srs = srsMap[card.eng];
            if (isSRS) return srs && srs.next_review <= now;
            return !srs || srs.next_review <= now;
          });
        }

        setDeck(localDeck);
        setInitialDeckSize(localDeck.length);

        const starred = await db.flashcards.filter(word => word.isStarred === 1).toArray();
        setStarredWords(starred.map(w => w.eng));
      } catch (error) { console.error('LocalDB Error:', error); }
    }
    initLocalDB();
  }, [currentCategory, user?.id]);

  const currentWord = deck[currentIndex];
  
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

    // ขั้นที่ 1: สั่งให้การ์ดใบบนปลิวออกตามทิศทาง
    if (direction === 'up') setAnimClass('-translate-y-[150%] rotate-6 opacity-0 transition-all duration-300 ease-in');
    else if (direction === 'down') setAnimClass('translate-y-[150%] -rotate-6 opacity-0 transition-all duration-300 ease-in');
    else if (direction === 'undo') setAnimClass('translate-x-[150%] rotate-6 opacity-0 transition-all duration-300 ease-in');

    setTimeout(() => {
      // ขั้นที่ 2: เปลี่ยนคำศัพท์และล้างสถานะการพลิกตอนที่มองไม่เห็นแล้ว
      actionFn();
      setIsFlipped(false);
      
      // ขั้นที่ 3: ดึงการ์ดให้มาย่อหลบอยู่ในตำแหน่ง "เตรียมเด้งขึ้น" (เลียนแบบท่าของการ์ดใบล่างที่รออยู่)
      setAnimClass('translate-y-3 scale-[0.95] opacity-100 transition-none');
      
      // ขั้นที่ 4: สั่งขยายและสไลด์การ์ดขึ้นมาแบบเด้งๆ ให้ความรู้สึกเป็นใบใหม่
      setTimeout(() => {
        setAnimClass('translate-y-0 scale-100 opacity-100 transition-transform duration-300 ease-out');
        setTimeout(() => {
          setAnimClass('');
          setIsChangingWord(false);
        }, 300);
      }, 20);
    }, 300);
  };

  const handleAnswer = async (isRemembered) => {
    if (!currentWord || isChangingWord) return;
    setSessionStats(prev => ({
      remembered: prev.remembered + (isRemembered ? 1 : 0),
      forgotten: prev.forgotten + (!isRemembered ? 1 : 0)
    }));

    const eng = currentWord.eng;
    const currentSrs = await db.vocab_srs.get(eng) || { eng, repetition: 0, interval: 0, ease_factor: 2.5 };
    let { repetition, interval, ease_factor } = currentSrs;

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

    const newSrsData = { eng, repetition, interval, ease_factor, next_review };
    await db.vocab_srs.put(newSrsData);

    const syncData = { vocab_id: currentWord.id, status: isRemembered ? 'remembered' : 'forgotten', interval, ease_factor, next_review_date: new Date(next_review).toISOString() };
    actionQueueRef.current.push({ type: 'srs_update', data: syncData, timestamp: Date.now() });
    pendingSyncRef.current = true;
    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    syncTimeoutRef.current = setTimeout(() => syncToCloud(), 3000);

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
    latestStarsRef.current = newStarredWords; 
    
    await db.flashcards.where('eng').equals(word).modify({ isStarred: isCurrentlyStarred ? 0 : 1 });

    actionQueueRef.current.push({ type: 'star_vocab', word: word, isStarred: !isCurrentlyStarred, timestamp: Date.now() });
    pendingSyncRef.current = true;
    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    syncTimeoutRef.current = setTimeout(() => syncToCloud(), 3000);
  };

  const isStarred = currentWord && starredWords.includes(currentWord.eng);

  return (
    <div className="flex flex-col items-center w-full mx-auto animate-in fade-in duration-300 min-h-[100vh] pb-10" style={{ fontFamily: "'Inter', 'Prompt', sans-serif" }}>
      
      {/* Top Nav Back Button */}
      <div className="w-full max-w-[512px] flex items-center mt-4 mb-2 px-4">
        <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center rounded-full transition-transform active:scale-90 bg-slate-200/50 dark:bg-white/10" style={{ color: themeVals.textMain }}>
          <ChevronLeft size={24} strokeWidth={2.5} />
        </button>
      </div>

      {deck.length > 0 ? (
        <div className="w-full flex flex-col items-center px-4">
          
          // The Context Above
          {/* Header Layout (อิงจากโค้ด index) */}
          <div className="w-full max-w-md flex flex-col items-center mb-8 text-center">
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
// The Code to Insert
          {/* Area การ์ดแนวนอน แบบ 3D Layering */}
          <div className="relative w-full max-w-lg h-72 mx-auto transition-all duration-300">
            
            {/* Layer 0: การ์ดจำลองสำหรับสร้างมิติให้ดูเป็นปึกการ์ด */}
            {deck.length > 1 && (
              <div className="absolute inset-0 rounded-3xl shadow-lg pointer-events-none" style={{ backgroundColor: currentStyle.color, transform: 'translateY(12px) scale(0.95)', zIndex: 0 }}>
                <div className="opacity-[0.05] w-full h-full rounded-3xl overflow-hidden relative">
                  {currentStyle.diamonds}
                </div>
              </div>
            )}

            {/* Layer 1: การ์ดจริงๆ ที่โต้ตอบได้และปลิวออกได้ (ย้าย perspective มาไว้ที่นี่เพื่อแก้บั๊ก 3D แบน) */}
            <div 
              className={`absolute inset-0 z-10 w-full h-full cursor-pointer touch-none ${animClass}`}
              style={{ perspective: '1000px' }}
              onPointerDown={handlePointerDown}
              onPointerUp={handlePointerUp}
              onPointerCancel={() => { touchStartY.current = null; touchStartX.current = null; }}
            >
              {/* แกนหมุน 3D พลิกการ์ด (หน้า-หลัง) เป็น Direct Child ของ Perspective */}
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
                  className={`absolute w-full h-full rounded-3xl flex flex-col items-center justify-center text-white shadow-lg p-8 transition-colors duration-500 ${isFlipped ? 'pointer-events-none' : 'pointer-events-auto'}`} 
                  style={{ backgroundColor: currentStyle.color, backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
                >
                  
                  {/* ปุ่ม Star ซ้ายบน */}
                  <div className="absolute top-6 left-6 h-6 flex items-center z-20 cursor-pointer" onClick={(e) => { e.stopPropagation(); toggleStar(); }}>
                    <Star size={24} fill={isStarred ? '#FFD700' : 'none'} color={isStarred ? '#FFD700' : '#ffffff'} />
                  </div>
                  
                  {/* ลาย Watermark Background */}
                  <div className="absolute inset-0 pointer-events-none opacity-[0.05] select-none text-black z-0 rounded-3xl overflow-hidden">
                    {currentStyle.diamonds}
                  </div>
                  
                  {/* ปุ่ม Info / Close (ขวาบน) */}
                  <button 
                    onClick={(e) => { e.stopPropagation(); setShowExampleFront(!showExampleFront); }} 
                    className="absolute top-6 right-6 w-6 h-6 bg-white rounded-full flex items-center justify-center text-xs font-bold shadow-md hover:scale-105 transition-all duration-300 z-20" 
                    style={{ color: currentStyle.color }}
                  >
                    {showExampleFront ? 'x' : 'i'}
                  </button>

                  {/* หน้าหลัก - คำศัพท์ & ประเภท */}
                  {!showExampleFront ? (
                    <div className="flex flex-col items-center z-10">
                      <h2 className="text-5xl font-normal tracking-wide">{currentWord.eng}</h2>
                      <div className="mt-4 px-4 py-0.5 bg-white rounded-full font-medium text-sm transition-colors duration-500" style={{ color: currentStyle.color }}>
                        {currentWord.pos}
                      </div>
                    </div>
                  ) : (
                    /* หน้าตัวอย่างประโยค (Overlay ดำ) */
                    <div className="absolute inset-0 bg-black/10 rounded-3xl p-8 flex flex-col justify-center items-center text-center z-10 pointer-events-auto" onClick={(e) => { e.stopPropagation(); setShowExampleFront(false); }}>
                      <p className="text-2xl font-semibold leading-relaxed">"{currentWord.example || '-'}"</p>
                    </div>
                  )}
                </div>

                {/* ---------------- BACK (หลังการ์ด) ---------------- */}
                <div 
                  className={`absolute w-full h-full rounded-3xl flex flex-col items-center justify-center text-white shadow-lg p-8 transition-colors duration-500 ${!isFlipped ? 'pointer-events-none' : 'pointer-events-auto'}`} 
                  style={{ backgroundColor: currentStyle.color, transform: 'rotateY(180deg)', backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
                >
                  
                  {/* ปุ่ม Star ซ้ายบน */}
                  <div className="absolute top-6 left-6 h-6 flex items-center z-20 cursor-pointer" onClick={(e) => { e.stopPropagation(); toggleStar(); }}>
                    <Star size={24} fill={isStarred ? '#FFD700' : 'none'} color={isStarred ? '#FFD700' : '#ffffff'} />
                  </div>

                  {/* iOS Style Switch ขวาบน */}
                  <div className="absolute top-6 right-6 flex items-center gap-2 z-20" onClick={(e) => e.stopPropagation()}>
                    <button 
                      onClick={() => setShowSynAnt(!showSynAnt)} 
                      className="w-11 h-6 rounded-full relative transition-all duration-300" 
                      style={{ backgroundColor: showSynAnt ? '#4bdd31' : 'rgba(255, 255, 255, 0.3)' }}
                    >
                      <div 
                        className="w-5 h-5 bg-white rounded-full absolute top-0.5 left-0.5 transition-transform duration-300" 
                        style={{ transform: showSynAnt ? 'translateX(20px)' : 'translateX(0px)' }}
                      ></div>
                    </button>
                  </div>

                  {/* เนื้อหาหลังการ์ด */}
                  <div className="w-full h-full flex items-center justify-center z-10">
                    {!showSynAnt ? (
                      /* แปลไทย */
                      <h2 className="text-4xl font-prompt font-normal px-4">{currentWord.thai}</h2>
                    ) : (
                      /* Synonyms / Antonyms Layout */
                      <div className="w-full h-full flex flex-col items-center justify-center gap-3">
                        <div className="flex flex-col items-center">
                          <span className="text-xs opacity-70 tracking-wide font-medium mb-1">Synonym</span>
                          <span className="text-4xl font-bold">{currentWord.synonyms || '-'}</span>
                        </div>
                        <div className="w-24 h-[1px] bg-white/20 my-1"></div>
                        <div className="flex flex-col items-center">
                          <span className="text-xs opacity-70 tracking-wide font-medium mb-1">Antonym</span>
                          <span className="text-4xl font-bold">{currentWord.antonyms || '-'}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </div>
          </div>
// The Context Below
          {/* ปุ่ม Undo ด้านล่าง */}
          <div className="w-full max-w-md flex justify-center mt-10">
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