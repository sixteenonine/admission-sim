import React, { useState, useEffect, useRef } from 'react';
import { useOutletContext, useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft, Undo2, Star, MessageSquare, Repeat } from 'lucide-react';
import { db } from '../../utils/db.js';

export default function FlashcardPlayer() {
  const contextVals = useOutletContext();
  const { currentUser: user, ...themeVals } = contextVals;
  const navigate = useNavigate();
  const location = useLocation();
  
  const isSRS = location.state?.isSRS || false;
  const currentCategory = location.state?.deckTitle || 'SCIENCE, HEALTH & NATURE';
  const currentLevel = location.state?.level || 1;

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

  // Swipe & Touch References
  const touchStartY = useRef(null);
  const touchEndY = useRef(null);

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
    
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
      syncTimeoutRef.current = null;
    }

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

  const isDark = themeVals.textMain === '#ffffff' || themeVals.textMain === '#FFFFFF';
  const cardBg = isDark ? '#1C1C1E' : '#FFFFFF';
  const btnBg = isDark ? '#2C2C2E' : '#FFFFFF';
  const borderColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)';
  const textMuted = '#8E8E93';
  const primaryColor = '#FF9500';
  const shadowSm = '0 2px 8px rgba(0, 0, 0, 0.04)';
  const shadowMd = '0 8px 24px rgba(0, 0, 0, 0.08)';

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
            if (cloudVocab.serverTime) {
              localStorage.setItem('vocabLastSync', cloudVocab.serverTime);
            }
          }
        } catch (e) {
          console.warn('Offline mode: using local database');
        }
        
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
            if (isSRS) {
              return srs && srs.next_review <= now;
            }
            return !srs || srs.next_review <= now;
          });
        }

        setDeck(localDeck);
        setInitialDeckSize(localDeck.length);

        const starred = await db.flashcards.filter(word => word.isStarred === 1).toArray();
        setStarredWords(starred.map(w => w.eng));
      } catch (error) {
        console.error('LocalDB Error:', error);
      }
    }
    initLocalDB();
  }, [currentCategory, user?.id]);

  const currentWord = deck[currentIndex];
  const progressPercent = initialDeckSize > 0 ? ((initialDeckSize - deck.length) / initialDeckSize) * 100 : 100;

  // Touch & Mouse Handlers for Swipe (ทำงานได้แม้ยังไม่พลิกการ์ด)
  const handleTouchStart = (e) => {
    touchStartY.current = e.targetTouches ? e.targetTouches[0].clientY : e.clientY;
  };

  const handleTouchMove = (e) => {
    touchEndY.current = e.targetTouches ? e.targetTouches[0].clientY : e.clientY;
  };

  const handleTouchEnd = () => {
    if (!touchStartY.current || !touchEndY.current || isChangingWord) return;
    
    const distance = touchStartY.current - touchEndY.current;
    const isUpSwipe = distance > 50;
    const isDownSwipe = distance < -50;

    if (isUpSwipe) handleAnswer(true);
    else if (isDownSwipe) handleAnswer(false);
    
    touchStartY.current = null;
    touchEndY.current = null;
  };

  // Keyboard Handlers (ทำงานได้แม้ยังไม่พลิกการ์ด)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (isChangingWord) return;
      if (e.key === 'ArrowUp') handleAnswer(true);
      if (e.key === 'ArrowDown') handleAnswer(false);
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isChangingWord, currentIndex, deck]);

  // ระบบ Animation โครงสร้างใหม่ การ์ดลอยปลิวหลุดจอสมบูรณ์แบบ
  const triggerCardAnim = (direction, actionFn) => {
    if (isChangingWord) return;
    setIsChangingWord(true);
    setShowExampleFront(false);
    setShowSynAnt(false);

    // ขั้นที่ 1: สั่งให้การ์ดเก่าลอยปลิวออกตามทิศทาง
    if (direction === 'up') setAnimClass('-translate-y-[150%] opacity-0 scale-95 transition-all duration-200 ease-in');
    else if (direction === 'down') setAnimClass('translate-y-[150%] opacity-0 scale-95 transition-all duration-200 ease-in');
    else if (direction === 'undo') setAnimClass('translate-x-[150%] opacity-0 transition-all duration-200 ease-in');

    setTimeout(() => {
      // ขั้นที่ 2: เปลี่ยนคำศัพท์และล้างสถานะพลิกการ์ดเบื้องหลังตอนที่มองไม่เห็น
      actionFn();
      setIsFlipped(false);

      // ขั้นที่ 3: เซ็ตพิกัดเริ่มต้นของการ์ดใบใหม่ (ย่อตัวรออยู่ตรงกลาง หรือซ่อนฝั่งซ้ายแบบไม่แสดงแอนิเมชัน)
      if (direction === 'up' || direction === 'down') {
        setAnimClass('scale-75 opacity-0 transition-none');
      } else if (direction === 'undo') {
        setAnimClass('-translate-x-[150%] opacity-0 transition-none');
      }

      // ขั้นที่ 4: สั่งขยายและสไลด์การ์ดใบใหม่กลับเข้ามาตรงกลางจออย่างนุ่มนวล
      setTimeout(() => {
        setAnimClass('translate-x-0 translate-y-0 scale-100 opacity-100 transition-all duration-300 cubic-bezier(0.175, 0.885, 0.32, 1.275)');
        
        setTimeout(() => {
          setAnimClass('');
          setIsChangingWord(false);
        }, 300);
      }, 30);
    }, 200);
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

    const syncData = {
      vocab_id: currentWord.id,
      status: isRemembered ? 'remembered' : 'forgotten',
      interval,
      ease_factor,
      next_review_date: new Date(next_review).toISOString()
    };

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
        if (newDeck.length > 0) {
          localStorage.setItem(sessionKey, JSON.stringify(newDeck));
        } else {
          localStorage.removeItem(sessionKey);
        }
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
      
      setSessionStats(prev => ({
        remembered: Math.max(0, prev.remembered - 1),
        forgotten: prev.forgotten
      }));
    });
  };

  const handleRestart = () => {
    setSessionStats({ remembered: 0, forgotten: 0 });
    setMasteredHistory([]);
    if (!isSRS && currentCategory !== 'MY FAVORITE') {
      localStorage.removeItem(`session_${currentCategory}_${currentLevel}`);
    }
    const event = new Event('visibilitychange');
    document.dispatchEvent(event);
    window.location.reload();
  };

  const toggleStar = async () => { 
    const word = currentWord.eng; 
    const isCurrentlyStarred = starredWords.includes(word);
    const newStarredWords = isCurrentlyStarred ? starredWords.filter(w => w !== word) : [...starredWords, word];
    setStarredWords(newStarredWords); 
    latestStarsRef.current = newStarredWords; 
    
    await db.flashcards.where('eng').equals(word).modify({ isStarred: isCurrentlyStarred ? 0 : 1 });

    actionQueueRef.current.push({
      type: 'star_vocab',
      word: word,
      isStarred: !isCurrentlyStarred,
      timestamp: Date.now()
    });

    pendingSyncRef.current = true;
    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    syncTimeoutRef.current = setTimeout(() => syncToCloud(), 3000);
  };

  const isStarred = currentWord && starredWords.includes(currentWord.eng);

  return (
    <div className="flex flex-col items-center w-full mx-auto animate-in fade-in duration-300 min-h-[100vh] pb-10" style={{ fontFamily: "'Inter', 'Prompt', sans-serif" }}>
      
      <div className="w-full max-w-[500px] flex items-center justify-between mb-4 mt-2 px-4">
        <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center rounded-full transition-transform active:scale-90" style={{ background: btnBg, border: `1px solid ${borderColor}`, boxShadow: shadowSm, color: textMuted }}>
          <ChevronLeft size={24} strokeWidth={2.5} />
        </button>
        <div className="flex flex-col items-center flex-1 px-2 overflow-hidden">
          <span className="font-bold tracking-tight text-center text-[1.1rem] truncate w-full" style={{ color: themeVals.textMain }}>{currentCategory}</span>
          {!isSRS && currentCategory !== 'MY FAVORITE' && (
            <span className="text-[0.7rem] font-bold uppercase tracking-wider text-[#FF9500]">Level {currentLevel}</span>
          )}
        </div>
        <div className="w-10 h-10"></div>
      </div>

      {deck.length > 0 ? (
        <div className="w-full flex flex-col items-center">
          
          <div className="w-full max-w-[340px] mb-4 text-center">
            <div className="text-[0.85rem] font-semibold mb-2" style={{ color: textMuted }}>
              Remaining: {deck.length} words
            </div>
            <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: borderColor }}>
              <div className="h-full transition-all duration-300" style={{ width: `${progressPercent}%`, background: primaryColor }}></div>
            </div>
          </div>

          {/* Area ควบคุมฟิสิกส์ท่า Swipe และ Click ทับพื้นที่ */}
          <div 
            className="w-full max-w-[340px] h-[420px] mb-[25px] mx-auto cursor-pointer" 
            style={{ perspective: '1000px' }} 
            onClick={() => { if(!isChangingWord) setIsFlipped(!isFlipped) }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onMouseDown={handleTouchStart}
            onMouseMove={(e) => { if (e.buttons === 1) handleTouchMove(e); }}
            onMouseUp={handleTouchEnd}
            onMouseLeave={handleTouchEnd}
          >
            {/* Animation Wrapper Div: สำหรับจัดการคลาสแปลงพิกัดการปลิวออกแยกส่วนไม่กวนแกน 3D ด้านใน */}
            <div className={`w-full h-full transform ${animClass}`}>
              
              {/* Container หมุนการ์ดแบบ 3D พลิกหน้าหลัง */}
              <div className="relative w-full h-full" style={{ transformStyle: 'preserve-3d', transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)', transitionProperty: 'transform', transitionDuration: '600ms', transitionTimingFunction: 'cubic-bezier(0.2, 0.8, 0.2, 1)' }}>
                
                {/* Front (หน้าการ์ด) */}
                <div className="absolute inset-0 flex flex-col items-center justify-center p-[30px] text-center select-none" style={{ backfaceVisibility: 'hidden', background: cardBg, border: `1px solid ${borderColor}`, borderRadius: '32px', boxShadow: shadowMd }}>
                  <button className="absolute top-[20px] left-[20px] w-10 h-10 rounded-full flex justify-center items-center transition-transform active:scale-90 z-30" style={{ background: btnBg, border: `1px solid ${isStarred ? '#FFD700' : borderColor}`, color: isStarred ? '#FFD700' : textMuted, boxShadow: shadowSm }} onClick={(e) => { e.stopPropagation(); toggleStar(); }}>
                    <Star size={20} fill={isStarred ? '#FFD700' : 'none'} stroke={isStarred ? '#FFD700' : 'currentColor'} />
                  </button>
                  <button className="absolute top-[20px] right-[20px] w-10 h-10 rounded-full flex justify-center items-center transition-transform active:scale-90 z-30" style={{ background: btnBg, border: `1px solid ${borderColor}`, color: textMuted, boxShadow: shadowSm }} onClick={(e) => { e.stopPropagation(); setShowExampleFront(true); }}>
                    <MessageSquare size={20} strokeWidth={2} />
                  </button>
                  <div className="text-[2.4rem] font-bold mb-[10px] tracking-tight leading-[1.1] break-words" style={{ color: themeVals.textMain }}>{currentWord.eng}</div>
                  <div className="text-[0.85rem] font-semibold uppercase mb-[20px]" style={{ color: textMuted }}>{currentWord.pos}</div>
                  <div className="absolute bottom-[20px] text-[0.75rem] font-medium" style={{ color: textMuted }}>Tap to flip</div>
                  
                  {/* กล่องประโยคตัวอย่างฝั่งหน้าการ์ด */}
                  <div className={`absolute inset-0 flex flex-col items-center justify-center p-[30px] text-center transition-opacity duration-300 z-40 ${showExampleFront ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`} style={{ background: cardBg, borderRadius: '32px', border: `1px solid ${borderColor}` }} onClick={(e) => { e.stopPropagation(); setShowExampleFront(false); }}>
                    <p className="text-[1.1rem] leading-[1.5] font-medium mb-5" style={{ color: themeVals.textMain }}>"{currentWord.example}"</p>
                    <span className="text-[0.8rem] font-semibold uppercase" style={{ color: primaryColor }}>Tap to close</span>
                  </div>
                </div>

                {/* Back (หลังการ์ด) */}
                <div className="absolute inset-0 flex flex-col items-center justify-center p-[30px] text-center select-none" style={{ backfaceVisibility: 'hidden', background: cardBg, border: `1px solid ${borderColor}`, borderRadius: '32px', boxShadow: shadowMd, transform: 'rotateY(180deg)' }}>
                  <button className="absolute top-[20px] left-[20px] w-10 h-10 rounded-full flex justify-center items-center transition-transform active:scale-90 z-30" style={{ background: btnBg, border: `1px solid ${isStarred ? '#FFD700' : borderColor}`, color: isStarred ? '#FFD700' : textMuted, boxShadow: shadowSm }} onClick={(e) => { e.stopPropagation(); toggleStar(); }}>
                    <Star size={20} fill={isStarred ? '#FFD700' : 'none'} stroke={isStarred ? '#FFD700' : 'currentColor'} />
                  </button>
                  <button className="absolute top-[20px] right-[20px] px-3 h-10 rounded-full flex justify-center items-center transition-transform active:scale-90 z-30 font-semibold text-xs" style={{ background: btnBg, border: `1px solid ${borderColor}`, color: themeVals.textMain, boxShadow: shadowSm }} onClick={(e) => { e.stopPropagation(); setShowSynAnt(!showSynAnt); }}>
                    <Repeat size={14} className="mr-1.5" /> {showSynAnt ? 'Hide' : 'Syn / Ant'}
                  </button>
                  
                  {!showSynAnt ? (
                    <div className="text-[1.8rem] font-semibold leading-[1.2]" style={{ color: themeVals.textMain }}>{currentWord.thai}</div>
                  ) : (
                    <div className="flex flex-col gap-4 w-full px-2">
                      <div className="flex flex-col items-center p-3 rounded-2xl bg-white/5 border border-white/10">
                        <span className="text-[0.7rem] font-bold uppercase text-[#34C759] mb-1">Synonyms</span>
                        <span className="font-semibold text-center" style={{ color: themeVals.textMain }}>{currentWord.synonyms || '-'}</span>
                      </div>
                      <div className="flex flex-col items-center p-3 rounded-2xl bg-white/5 border border-white/10">
                        <span className="text-[0.7rem] font-bold uppercase text-[#FF3B30] mb-1">Antonyms</span>
                        <span className="font-semibold text-center" style={{ color: themeVals.textMain }}>{currentWord.antonyms || '-'}</span>
                      </div>
                    </div>
                  )}
                </div>

              </div>
            </div>
          </div>

          {/* แผงฟังก์ชันปุ่มย้อนกลับและลายแทงลัด */}
          <div className="w-full max-w-[340px] grid grid-cols-4 gap-[8px]">
            <button onClick={handleUndo} disabled={masteredHistory.length === 0 || isChangingWord} className="col-span-4 py-[16px] mb-2 flex justify-center items-center rounded-[16px] font-semibold transition-transform active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed" style={{ background: btnBg, color: themeVals.textMain, boxShadow: shadowSm }}>
              <Undo2 size={20} strokeWidth={2.5} className="mr-2" /> Undo Last Action
            </button>
            
            <div className="col-span-4 flex flex-col items-center justify-center gap-1 opacity-60 pointer-events-none mt-2 text-sm font-medium" style={{ color: textMuted }}>
              <span className="flex items-center gap-1"><span className="text-xl">↑</span> Swipe UP to Remember (จำได้)</span>
              <span className="flex items-center gap-1"><span className="text-xl">↓</span> Swipe DOWN to Forget (จำไม่ได้)</span>
            </div>
          </div>

        </div>
      ) : (
        /* สรุปผลตอนท้ายเซสชัน */
        <div className="flex-1 w-full flex flex-col items-center justify-center text-center px-4">
          <h2 className="text-[2rem] font-bold mb-2 tracking-tight" style={{ color: themeVals.textMain }}>สรุปผลการทบทวน</h2>
          <div className="flex flex-col gap-4 mb-8 w-full max-w-[280px] mt-4">
            <div className="flex justify-between items-center p-4 rounded-[1rem] bg-white/5 border border-white/10">
              <span className="font-semibold text-[#34C759]">จำได้ (Remembered)</span>
              <span className="font-bold text-xl text-[#34C759]">{sessionStats.remembered}</span>
            </div>
            <div className="flex justify-between items-center p-4 rounded-[1rem] bg-white/5 border border-white/10">
              <span className="font-semibold text-[#FF3B30]">จำไม่ได้ (Forgotten)</span>
              <span className="font-bold text-xl text-[#FF3B30]">{sessionStats.forgotten}</span>
            </div>
          </div>
          <button onClick={handleRestart} disabled={isChangingWord} className="w-full max-w-[280px] py-[16px] flex justify-center items-center rounded-[20px] transition-transform active:scale-95 font-semibold text-[1rem] mb-4" style={{ background: primaryColor, color: '#ffffff', boxShadow: shadowSm }}>
            ทบทวนอีกครั้ง
          </button>
          <button onClick={() => navigate(-1)} className="w-full max-w-[280px] py-[16px] flex justify-center items-center rounded-[20px] transition-transform active:scale-95 font-semibold text-[1rem]" style={{ background: btnBg, color: themeVals.textMain, border: `1px solid ${borderColor}`, boxShadow: shadowSm }}>
            กลับหน้าหลัก
          </button>
        </div>
      )}
    </div>
  );
}