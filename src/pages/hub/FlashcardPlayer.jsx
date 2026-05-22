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

  const categoryColors = {
    'SCIENCE, HEALTH & NATURE': '#22c55e',
    'BUSINESS & TECHNOLOGIES': '#0070fb',
    'ACADEMIC & CAREER': '#ff2e57',
    'LIFESTYLE & MEDIA': '#8c52ff',
    'SOCIETY & CULTURE': '#505e72',
    'MY FAVORITE': '#ff8301'
  };
  const deckColor = isSRS ? '#FF9500' : (location.state?.color || categoryColors[currentCategory] || '#8c52ff');

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
  const shadowSm = '0 2px 8px rgba(0, 0, 0, 0.04)';
  const shadowMd = '0 12px 32px rgba(0, 0, 0, 0.12)';

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
  const progressPercent = initialDeckSize > 0 ? ((initialDeckSize - deck.length) / initialDeckSize) * 100 : 100;

  const handleTouchStart = (e) => { touchStartY.current = e.targetTouches ? e.targetTouches[0].clientY : e.clientY; };
  const handleTouchMove = (e) => { touchEndY.current = e.targetTouches ? e.targetTouches[0].clientY : e.clientY; };
  const handleTouchEnd = () => {
    if (!touchStartY.current || !touchEndY.current || isChangingWord) return;
    const distance = touchStartY.current - touchEndY.current;
    if (distance > 50) handleAnswer(true);
    else if (distance < -50) handleAnswer(false);
    touchStartY.current = null;
    touchEndY.current = null;
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (isChangingWord) return;
      if (e.key === 'ArrowUp') handleAnswer(true);
      if (e.key === 'ArrowDown') handleAnswer(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isChangingWord, currentIndex, deck]);

  const triggerCardAnim = (direction, actionFn) => {
    if (isChangingWord) return;
    setIsChangingWord(true);
    setShowExampleFront(false);
    setShowSynAnt(false);

    if (direction === 'up') setAnimClass('-translate-y-[150%] rotate-6 opacity-0 transition-all duration-300 ease-in');
    else if (direction === 'down') setAnimClass('translate-y-[150%] -rotate-6 opacity-0 transition-all duration-300 ease-in');
    else if (direction === 'undo') setAnimClass('translate-x-[150%] rotate-6 opacity-0 transition-all duration-300 ease-in');

    setTimeout(() => {
      actionFn();
      setIsFlipped(false);
      setAnimClass('transition-none'); // ดึงการ์ดกลับมาจุดศูนย์กลางทันทีแบบไม่มีแอนิเมชัน ให้ความรู้สึกเหมือนเป็นใบถัดไปที่รออยู่
      setTimeout(() => { setIsChangingWord(false); }, 50);
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
    <div className="flex flex-col items-center w-full mx-auto animate-in fade-in duration-300 min-h-[100vh] pb-10 pt-4" style={{ fontFamily: "'Inter', 'Prompt', sans-serif" }}>
      
      {/* Top Navigation */}
      <div className="w-full max-w-[420px] flex items-center mb-6 px-4 relative">
        <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center rounded-full transition-transform active:scale-90 bg-black/5 dark:bg-white/10" style={{ color: themeVals.textMain }}>
          <ChevronLeft size={24} strokeWidth={2.5} />
        </button>
      </div>

      {deck.length > 0 ? (
        <div className="w-full flex flex-col items-center px-4">
          
          {/* Header & Progress Bar */}
          <div className="w-full max-w-[420px] mb-6">
            <div className="flex justify-between items-end mb-3 px-1">
              <span className="font-black text-lg md:text-xl tracking-tight uppercase truncate mr-4" style={{ color: themeVals.textMain }}>
                {currentCategory}
              </span>
              <span className="text-xs md:text-sm font-bold opacity-60 whitespace-nowrap" style={{ color: themeVals.textMain }}>
                {initialDeckSize - deck.length} / {initialDeckSize} WORDS
              </span>
            </div>
            <div className="w-full h-2 md:h-2.5 rounded-full overflow-hidden bg-black/10 dark:bg-white/10">
              <div className="h-full transition-all duration-300" style={{ width: `${progressPercent}%`, background: deckColor }}></div>
            </div>
          </div>

          {/* Card Area */}
          <div 
            className="relative w-full max-w-[420px] aspect-[4/3] sm:aspect-[3/2] mb-[25px] mx-auto cursor-pointer" 
            style={{ perspective: '1200px' }} 
          >
            {/* Dummy Card underneath to look like a stack */}
            {deck.length > 1 && (
              <div className="absolute inset-0 rounded-[2rem] opacity-40 scale-95 translate-y-3 z-0" style={{ background: deckColor }} />
            )}

            {/* Animating Wrapper */}
            <div 
              className={`absolute inset-0 z-10 w-full h-full ${animClass}`}
              onClick={() => { if(!isChangingWord) setIsFlipped(!isFlipped) }}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onMouseDown={handleTouchStart}
              onMouseMove={(e) => { if (e.buttons === 1) handleTouchMove(e); }}
              onMouseUp={handleTouchEnd}
              onMouseLeave={handleTouchEnd}
            >
              {/* 3D Flipper */}
              <div className="relative w-full h-full" style={{ transformStyle: 'preserve-3d', transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)', transition: 'transform 0.5s cubic-bezier(0.4, 0.0, 0.2, 1)' }}>
                
                {/* Front Side */}
                <div className={`absolute inset-0 flex flex-col items-center justify-center p-6 md:p-[30px] text-center select-none rounded-[2rem] ${isFlipped ? 'pointer-events-none' : 'pointer-events-auto'}`} style={{ backfaceVisibility: 'hidden', background: deckColor, boxShadow: shadowMd }}>
                  <button className="absolute top-[20px] left-[20px] w-10 h-10 rounded-full flex justify-center items-center transition-transform active:scale-90 z-30 bg-black/10 text-white" onClick={(e) => { e.stopPropagation(); toggleStar(); }}>
                    <Star size={20} fill={isStarred ? '#FFD700' : 'none'} stroke={isStarred ? '#FFD700' : 'currentColor'} />
                  </button>
                  <button className="absolute top-[20px] right-[20px] w-10 h-10 rounded-full flex justify-center items-center transition-transform active:scale-90 z-30 bg-black/10 text-white" onClick={(e) => { e.stopPropagation(); setShowExampleFront(true); }}>
                    <MessageSquare size={20} strokeWidth={2} />
                  </button>
                  
                  <div className="text-[2.2rem] md:text-[2.6rem] font-bold mb-2 tracking-tight leading-[1.1] break-words text-white drop-shadow-sm">{currentWord.eng}</div>
                  <div className="text-[0.85rem] font-bold uppercase text-white/70">{currentWord.pos}</div>
                  
                  <div className={`absolute inset-0 flex flex-col items-center justify-center p-[30px] text-center transition-opacity duration-300 z-40 rounded-[2rem] ${showExampleFront ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`} style={{ background: deckColor }} onClick={(e) => { e.stopPropagation(); setShowExampleFront(false); }}>
                    <p className="text-[1.1rem] leading-[1.5] font-medium mb-5 text-white drop-shadow-sm">"{currentWord.example}"</p>
                    <span className="text-[0.8rem] font-bold uppercase text-white/70">Tap to close</span>
                  </div>
                </div>

                {/* Back Side */}
                <div className={`absolute inset-0 flex flex-col items-center justify-center p-6 md:p-[30px] text-center select-none rounded-[2rem] ${!isFlipped ? 'pointer-events-none' : 'pointer-events-auto'}`} style={{ backfaceVisibility: 'hidden', background: deckColor, boxShadow: shadowMd, transform: 'rotateY(180deg)' }}>
                  <button className="absolute top-[20px] left-[20px] w-10 h-10 rounded-full flex justify-center items-center transition-transform active:scale-90 z-30 bg-black/10 text-white" onClick={(e) => { e.stopPropagation(); toggleStar(); }}>
                    <Star size={20} fill={isStarred ? '#FFD700' : 'none'} stroke={isStarred ? '#FFD700' : 'currentColor'} />
                  </button>
                  <button className="absolute top-[20px] right-[20px] px-4 h-10 rounded-full flex justify-center items-center transition-transform active:scale-90 z-30 font-bold text-xs bg-black/10 text-white" onClick={(e) => { e.stopPropagation(); setShowSynAnt(!showSynAnt); }}>
                    <Repeat size={14} className="mr-2" /> {showSynAnt ? 'HIDE' : 'SYN / ANT'}
                  </button>
                  
                  {!showSynAnt ? (
                    <div className="text-[2rem] font-bold leading-[1.2] text-white drop-shadow-sm">{currentWord.thai}</div>
                  ) : (
                    <div className="flex flex-col gap-4 w-full px-2">
                      <div className="flex flex-col items-center p-3 rounded-2xl bg-black/10">
                        <span className="text-[0.7rem] font-bold uppercase text-white/80 mb-1">Synonyms</span>
                        <span className="font-bold text-center text-white">{currentWord.synonyms || '-'}</span>
                      </div>
                      <div className="flex flex-col items-center p-3 rounded-2xl bg-black/10">
                        <span className="text-[0.7rem] font-bold uppercase text-white/80 mb-1">Antonyms</span>
                        <span className="font-bold text-center text-white">{currentWord.antonyms || '-'}</span>
                      </div>
                    </div>
                  )}
                </div>

              </div>
            </div>
          </div>

          <div className="w-full max-w-[420px] flex justify-center mt-4">
            <button onClick={handleUndo} disabled={masteredHistory.length === 0 || isChangingWord} className="py-[14px] px-8 flex justify-center items-center rounded-[1rem] font-bold transition-transform active:scale-95 disabled:opacity-20 disabled:cursor-not-allowed bg-black/5 dark:bg-white/10" style={{ color: themeVals.textMain }}>
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
          <button onClick={handleRestart} disabled={isChangingWord} className="w-full max-w-[320px] py-[16px] flex justify-center items-center rounded-[1.5rem] transition-transform active:scale-95 font-black text-[1.1rem] mb-4 shadow-md text-white" style={{ background: deckColor }}>
            REVIEW AGAIN
          </button>
          <button onClick={() => navigate(-1)} className="w-full max-w-[320px] py-[16px] flex justify-center items-center rounded-[1.5rem] transition-transform active:scale-95 font-bold text-[1rem] bg-black/5 dark:bg-white/5" style={{ color: themeVals.textMain }}>
            BACK TO MENU
          </button>
        </div>
      )}
    </div>
  );
}