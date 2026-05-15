import React, { useState, useEffect } from 'react';
import { useOutletContext, useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Shuffle, Undo2, Star, MessageSquare, CheckCircle2 } from 'lucide-react';
import { vocabDatabase } from '../../data/vocab.js';

export default function FlashcardPlayer() {
  const themeVals = useOutletContext();
  const navigate = useNavigate();
  const location = useLocation();
  
  const currentCategory = location.state?.deckTitle || 'SCIENCE, HEALTH & NATURE';

  const [deck, setDeck] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [masteredHistory, setMasteredHistory] = useState([]);
  
  // States เลียนแบบพฤติกรรมดั้งเดิมของ Index.txt
  const [isChangingWord, setIsChangingWord] = useState(false);
  const [disableFlipTransition, setDisableFlipTransition] = useState(false);
  const [animClass, setAnimClass] = useState('translate-x-0 opacity-100');
  const [showExampleFront, setShowExampleFront] = useState(false);
  const [showExampleBack, setShowExampleBack] = useState(false);
  const [starredWords, setStarredWords] = useState([]);

  // ดึงค่าสีพื้นฐานมาใช้เป็น Apple-like design เหมือนต้นฉบับ
  const isDark = themeVals.textMain === '#ffffff' || themeVals.textMain === '#FFFFFF';
  const cardBg = isDark ? '#1C1C1E' : '#FFFFFF';
  const btnBg = isDark ? '#2C2C2E' : '#FFFFFF';
  const borderColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)';
  const textMuted = '#8E8E93';
  const primaryColor = '#FF9500';
  const shadowSm = '0 2px 8px rgba(0, 0, 0, 0.04)';
  const shadowMd = '0 8px 24px rgba(0, 0, 0, 0.08)';

  useEffect(() => {
    const filteredDeck = vocabDatabase.filter(word => word.category === currentCategory);
    setDeck(filteredDeck);
  }, [currentCategory]);

  const currentWord = deck[currentIndex];
  const progressPercent = deck.length > 0 ? ((currentIndex + 1) / deck.length) * 100 : 100;

  // ฟังก์ชันจำลองแอนิเมชันเปลี่ยนไพ่
  const triggerCardAnim = (direction, actionFn) => {
    if (isChangingWord) return;
    setIsChangingWord(true);
    setDisableFlipTransition(true);
    setIsFlipped(false);
    setShowExampleFront(false);
    setShowExampleBack(false);

    setTimeout(() => {
        setDisableFlipTransition(false);
        
        if (direction === 'next') setAnimClass('-translate-x-[120%] opacity-0 transition-all duration-200');
        else if (direction === 'prev') setAnimClass('translate-x-[120%] opacity-0 transition-all duration-200');
        else if (direction === 'down') setAnimClass('translate-y-[120%] opacity-0 transition-all duration-200');
        else if (direction === 'shuffle') setAnimClass('scale-50 opacity-0 transition-all duration-200');
        else if (direction === 'undo') setAnimClass('-translate-y-[120%] opacity-0 transition-all duration-200');

        setTimeout(() => {
            actionFn();
            setDisableFlipTransition(true);
            
            if (direction === 'next') setAnimClass('translate-x-[120%] opacity-0 transition-none');
            else if (direction === 'prev') setAnimClass('-translate-x-[120%] opacity-0 transition-none');
            else if (direction === 'down') setAnimClass('-translate-y-[120%] opacity-0 transition-none');
            else if (direction === 'shuffle') setAnimClass('scale-150 opacity-0 transition-none');
            else if (direction === 'undo') setAnimClass('translate-y-[120%] opacity-0 transition-none');

            setTimeout(() => {
                setDisableFlipTransition(false);
                setAnimClass('translate-x-0 translate-y-0 scale-100 opacity-100 transition-all duration-200');
                setTimeout(() => { setAnimClass(''); setIsChangingWord(false); }, 200);
            }, 30);
        }, 200);
    }, 20);
  };

  const handleNext = () => { if (currentIndex < deck.length - 1) triggerCardAnim('next', () => setCurrentIndex(prev => prev + 1)); };
  const handlePrev = () => { if (currentIndex > 0) triggerCardAnim('prev', () => setCurrentIndex(prev => prev - 1)); };
  const handleShuffle = () => { triggerCardAnim('shuffle', () => { const shuffled = [...deck].sort(() => Math.random() - 0.5); setDeck(shuffled); setCurrentIndex(0); }); };
  const handleMastered = () => {
    triggerCardAnim('down', () => {
      setMasteredHistory(prev => [...prev, { word: currentWord, originalIndex: currentIndex }]);
      const newDeck = [...deck];
      newDeck.splice(currentIndex, 1);
      setDeck(newDeck);
      if (currentIndex >= newDeck.length && currentIndex > 0) setCurrentIndex(newDeck.length - 1);
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
    });
  };
  const handleRestart = () => { triggerCardAnim('shuffle', () => { const filteredDeck = vocabDatabase.filter(word => word.category === currentCategory); setDeck(filteredDeck); setCurrentIndex(0); setMasteredHistory([]); }); };

  const toggleStar = () => { const word = currentWord.eng; setStarredWords(prev => prev.includes(word) ? prev.filter(w => w !== word) : [...prev, word]); };
  const isStarred = currentWord && starredWords.includes(currentWord.eng);

  return (
    <div className="flex flex-col items-center w-full mx-auto animate-in fade-in duration-300 min-h-[100vh] pb-10" style={{ fontFamily: "'Inter', 'Prompt', sans-serif" }}>
      
      {/* Header */}
      <div className="w-full max-w-[500px] flex items-center justify-between mb-4 mt-2 px-4">
        <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center rounded-full transition-transform active:scale-90" style={{ background: btnBg, border: `1px solid ${borderColor}`, boxShadow: shadowSm, color: textMuted }}>
          <ChevronLeft size={24} strokeWidth={2.5} />
        </button>
        <span className="font-bold tracking-tight text-center text-[1.1rem] px-2 flex-1 truncate" style={{ color: themeVals.textMain }}>{currentCategory}</span>
        <div className="w-10 h-10"></div>
      </div>

      {deck.length > 0 ? (
        <div className="w-full flex flex-col items-center">
          
          {/* Progress */}
          <div className="w-full max-w-[340px] mb-4 text-center">
            <div className="text-[0.85rem] font-semibold mb-2" style={{ color: textMuted }}>
              {currentIndex + 1} / {deck.length}
            </div>
            <div className="w-full h-1 rounded-full overflow-hidden" style={{ background: borderColor }}>
              <div className="h-full transition-all duration-300" style={{ width: `${progressPercent}%`, background: primaryColor }}></div>
            </div>
          </div>

          {/* Scene */}
          <div className="w-full max-w-[340px] h-[420px] mb-[25px] mx-auto cursor-pointer" style={{ perspective: '1000px' }} onClick={() => { if(!isChangingWord) setIsFlipped(!isFlipped) }}>
            <div className={`relative w-full h-full ${disableFlipTransition ? 'transition-none' : ''} ${animClass}`} style={{ transformStyle: 'preserve-3d', transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)', transitionProperty: 'transform', transitionDuration: disableFlipTransition ? '0ms' : '600ms', transitionTimingFunction: 'cubic-bezier(0.2, 0.8, 0.2, 1)' }}>
              
              {/* Front */}
              <div className="absolute inset-0 flex flex-col items-center justify-center p-[30px] text-center" style={{ backfaceVisibility: 'hidden', background: cardBg, border: `1px solid ${borderColor}`, borderRadius: '32px', boxShadow: shadowMd }}>
                <button className="absolute top-[20px] left-[20px] w-10 h-10 rounded-full flex justify-center items-center transition-transform active:scale-90 z-30" style={{ background: btnBg, border: `1px solid ${isStarred ? '#FFD700' : borderColor}`, color: isStarred ? '#FFD700' : textMuted, boxShadow: shadowSm }} onClick={(e) => { e.stopPropagation(); toggleStar(); }}>
                  <Star size={20} fill={isStarred ? '#FFD700' : 'none'} stroke={isStarred ? '#FFD700' : 'currentColor'} />
                </button>
                <button className="absolute top-[20px] right-[20px] w-10 h-10 rounded-full flex justify-center items-center transition-transform active:scale-90 z-30" style={{ background: btnBg, border: `1px solid ${borderColor}`, color: textMuted, boxShadow: shadowSm }} onClick={(e) => { e.stopPropagation(); setShowExampleFront(true); }}>
                  <MessageSquare size={20} strokeWidth={2} />
                </button>
                <div className="text-[2.4rem] font-bold mb-[10px] tracking-tight leading-[1.1] break-words" style={{ color: themeVals.textMain }}>{currentWord.eng}</div>
                <div className="text-[0.85rem] font-semibold uppercase mb-[20px]" style={{ color: textMuted }}>{currentWord.type}</div>
                <div className="text-[1.8rem] font-semibold leading-[1.2]" style={{ color: themeVals.textMain }}>{currentWord.thai}</div>
                <div className="absolute bottom-[20px] text-[0.75rem] font-medium" style={{ color: textMuted }}>Tap to flip</div>
                
                {/* Overlay Front */}
                <div className={`absolute inset-0 flex flex-col items-center justify-center p-[30px] text-center transition-opacity duration-300 z-40 ${showExampleFront ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`} style={{ background: cardBg, borderRadius: '32px', border: `1px solid ${borderColor}` }} onClick={(e) => { e.stopPropagation(); setShowExampleFront(false); }}>
                  <p className="text-[1.1rem] leading-[1.5] font-medium mb-5" style={{ color: themeVals.textMain }}>"{currentWord.example}"</p>
                  <span className="text-[0.8rem] font-semibold uppercase" style={{ color: primaryColor }}>Tap to close</span>
                </div>
              </div>

              {/* Back */}
              <div className="absolute inset-0 flex flex-col items-center justify-center p-[30px] text-center" style={{ backfaceVisibility: 'hidden', background: cardBg, border: `1px solid ${borderColor}`, borderRadius: '32px', boxShadow: shadowMd, transform: 'rotateY(180deg)' }}>
                <button className="absolute top-[20px] left-[20px] w-10 h-10 rounded-full flex justify-center items-center transition-transform active:scale-90 z-30" style={{ background: btnBg, border: `1px solid ${isStarred ? '#FFD700' : borderColor}`, color: isStarred ? '#FFD700' : textMuted, boxShadow: shadowSm }} onClick={(e) => { e.stopPropagation(); toggleStar(); }}>
                  <Star size={20} fill={isStarred ? '#FFD700' : 'none'} stroke={isStarred ? '#FFD700' : 'currentColor'} />
                </button>
                <button className="absolute top-[20px] right-[20px] w-10 h-10 rounded-full flex justify-center items-center transition-transform active:scale-90 z-30" style={{ background: btnBg, border: `1px solid ${borderColor}`, color: textMuted, boxShadow: shadowSm }} onClick={(e) => { e.stopPropagation(); setShowExampleBack(true); }}>
                  <MessageSquare size={20} strokeWidth={2} />
                </button>
                <div className="text-[1.8rem] font-semibold leading-[1.2]" style={{ color: themeVals.textMain }}>{currentWord.thai}</div>
                <div className="absolute bottom-[20px] text-[0.75rem] font-medium" style={{ color: textMuted }}>Tap to flip</div>
                
                {/* Overlay Back */}
                <div className={`absolute inset-0 flex flex-col items-center justify-center p-[30px] text-center transition-opacity duration-300 z-40 ${showExampleBack ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`} style={{ background: cardBg, borderRadius: '32px', border: `1px solid ${borderColor}` }} onClick={(e) => { e.stopPropagation(); setShowExampleBack(false); }}>
                  <p className="text-[1.1rem] leading-[1.5] font-medium mb-5" style={{ color: themeVals.textMain }}>"{currentWord.example}"</p>
                  <span className="text-[0.8rem] font-semibold uppercase" style={{ color: primaryColor }}>Tap to close</span>
                </div>
              </div>

            </div>
          </div>

          {/* Controls */}
          <div className="w-full max-w-[340px] grid grid-cols-4 gap-[8px]">
            <button onClick={handleUndo} disabled={masteredHistory.length === 0 || isChangingWord} className="col-span-1 py-[16px] flex justify-center items-center rounded-[16px] font-semibold transition-transform active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed" style={{ background: btnBg, color: themeVals.textMain, boxShadow: shadowSm }}>
              <Undo2 size={22} strokeWidth={2.5} />
            </button>
            <button onClick={handlePrev} disabled={isChangingWord} className="col-span-1 py-[16px] flex justify-center items-center rounded-[16px] font-semibold transition-transform active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed" style={{ background: btnBg, color: themeVals.textMain, boxShadow: shadowSm }}>
              <ChevronLeft size={22} strokeWidth={2.5} />
            </button>
            <button onClick={handleNext} disabled={isChangingWord} className="col-span-1 py-[16px] flex justify-center items-center rounded-[16px] font-semibold transition-transform active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed" style={{ background: btnBg, color: themeVals.textMain, boxShadow: shadowSm }}>
              <ChevronRight size={22} strokeWidth={2.5} />
            </button>
            <button onClick={handleShuffle} disabled={isChangingWord} className="col-span-1 py-[16px] flex justify-center items-center rounded-[16px] font-semibold transition-transform active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed" style={{ background: btnBg, color: textMuted, boxShadow: shadowSm }}>
              <Shuffle size={22} strokeWidth={2.5} />
            </button>
            <button onClick={handleMastered} disabled={isChangingWord} className="col-span-4 py-[16px] flex justify-center items-center rounded-[16px] font-semibold text-[1rem] transition-transform active:scale-95 disabled:opacity-80 disabled:cursor-not-allowed" style={{ background: primaryColor, color: '#FFF', boxShadow: shadowSm }}>
              I Know This
            </button>
          </div>

        </div>
      ) : (
        <div className="flex-1 w-full flex flex-col items-center justify-center text-center px-4">
          <h2 className="text-[2rem] font-bold mb-2 tracking-tight" style={{ color: themeVals.textMain }}>Completed!</h2>
          <p className="font-medium mb-8" style={{ color: textMuted }}>You've finished this deck.</p>
          <button onClick={handleRestart} disabled={isChangingWord} className="px-8 py-[16px] flex justify-center items-center rounded-[20px] transition-transform active:scale-95 font-semibold text-[1rem]" style={{ background: primaryColor, color: '#ffffff', boxShadow: shadowSm }}>
            Study Again
          </button>
        </div>
      )}
    </div>
  );
}