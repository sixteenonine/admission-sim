import React, { useState, useEffect } from 'react';
import { useOutletContext, useSearchParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Volume2, Star, Languages, Layers, ZoomIn, ZoomOut, Loader2 } from 'lucide-react';

export default function StoryReader() {
  const contextVals = useOutletContext();
  const { bg, textMain, shadowPlateau, shadowOuter, shadowDeepInset, raisedGradient } = contextVals;
  
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const storyId = searchParams.get('id');

  const [story, setStory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [level, setLevel] = useState('I');
  const [showThai, setShowThai] = useState(false);
  const [isFav, setIsFav] = useState(false); // เตรียมไว้เชื่อม DB ในอนาคต
  const [zoom, setZoom] = useState(1);
  // Flashcard States
  const [showFlashcards, setShowFlashcards] = useState(false);
  const [flashcardList, setFlashcardList] = useState([]);
  const [cardIndex, setCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [baseScale, setBaseScale] = useState(1);
  const [isLandscapeMode, setIsLandscapeMode] = useState(true);

  useEffect(() => {
    let timeoutId;
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        const w = window.innerWidth;
        const h = window.innerHeight;
        const isLandscape = w > 900 && w > h;
        setIsLandscapeMode(isLandscape);

        if (isLandscape) {
          // คำนวณสเกลโดยสร้างขอบสมมติ (Viewport Padding) ให้ห่างจาก UI จริงด้านละเท่าๆ กัน
          const targetWidth = 1320; 
          const targetHeight = 760;
          const scaleX = w / targetWidth;
          const scaleY = h / targetHeight;
          setBaseScale(Math.min(scaleX, scaleY));
        } else {
          setBaseScale(1);
        }
      }, 100);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const handleOpenFlashcards = () => {
    if (!story?.vocab_levels) return alert("ไม่มีคำศัพท์สำหรับเรื่องนี้");
    
    let cards = [];
    Object.values(story.vocab_levels).forEach(item => {
      if (item[level]) {
        cards.push({ eng: item[level], thai: item['thai_' + level] || item.thai, level: level });
      }
    });

    if (cards.length === 0) return alert("ไม่มีคำศัพท์สำหรับเรื่องนี้");
    
    cards = cards.sort(() => Math.random() - 0.5);
    setFlashcardList(cards);
    setCardIndex(0);
    setIsFlipped(false);
    setShowFlashcards(true);
  };

  useEffect(() => {
    async function fetchStory() {
      if (!storyId) {
        setError('ไม่พบรหัสเรื่องสั้น');
        setLoading(false);
        return;
      }
      try {
        const res = await fetch('/api/stories/get', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ storyId })
        });
        const data = await res.json();
        if (data.status === 'success') {
          setStory(data.story);
        } else {
          setError(data.message || 'ไม่สามารถโหลดเรื่องสั้นได้');
        }
      } catch (err) {
        setError('เชื่อมต่อเซิร์ฟเวอร์ล้มเหลว');
      } finally {
        setLoading(false);
      }
    }
    fetchStory();
  }, [storyId]);

  const handleReadAloud = () => {
    if (showThai) return alert("กรุณาสลับเป็นโหมดภาษาอังกฤษเพื่อฟังเสียงอ่าน");
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      // แปลงแท็กพิกัดอย่าง {1} ให้กลายเป็นคำศัพท์ของเลเวลปัจจุบันก่อนส่งไปอ่านออกเสียง
      const textToRead = story?.content?.replace(/\{(\d+)\}/g, (match, id) => {
        return story.vocab_levels?.[id]?.[level] || '';
      }) || '';
      const utterance = new SpeechSynthesisUtterance(textToRead);
      utterance.lang = 'en-US';
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    } else {
      alert("เบราว์เซอร์ของคุณไม่รองรับระบบอ่านออกเสียง");
    }
  };

  const renderContent = () => {
    if (!story) return null;

    // จัดการโหมดแสดงคำแปลภาษาไทย
    if (showThai) {
      return <div className="font-sans leading-relaxed text-[1.05em] whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: story.translation || "<i>(ยังไม่มีคำแปลภาษาไทยสำหรับเรื่องนี้)</i>" }} />;
    }

    if (!story.content) return null;

    // ระบบแกะรหัส {1} และสลับคำศัพท์ตาม Level
    const parts = story.content.split(/(\{\d+\})/g);
    const elements = parts.map((part, index) => {
      const match = part.match(/^\{(\d+)\}$/);
      if (match) {
        const vocabId = match[1];
        const vocabItem = story.vocab_levels?.[vocabId];
        if (vocabItem) {
          const word = vocabItem[level] || '';
          const color = level === 'I' ? '#FD3259' : level === 'II' ? '#FF8A00' : '#007AFF';
          return (
            <span 
              key={index} 
              className="font-bold underline decoration-2 cursor-pointer transition-colors px-1 rounded hover:bg-black/5" 
              style={{ color: color, borderColor: color }}
              title={vocabItem['thai_' + level] || vocabItem.thai}
            >
              {word}
            </span>
          );
        }
      }
      return <span key={index}>{part}</span>;
    });

    return <div className="font-solway leading-[1.4] text-[1rem] whitespace-pre-wrap text-black break-words">{elements}</div>;
  };

  if (loading) return <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3"><Loader2 className="animate-spin text-blue-500" size={32} /><span className="font-medium opacity-60" style={{ color: textMain }}>กำลังกางหน้ากระดาษ...</span></div>;
  if (error) return <div className="p-8 text-center text-red-500 bg-red-500/10 rounded-2xl font-bold max-w-md mx-auto mt-20">{error}</div>;

  return (
    <div className="w-full min-h-[100dvh] flex flex-col relative overflow-x-hidden" style={{ background: bg }}>
      
      {/* Zoom Controls (Desktop Only) - ขยับไปชิดมุมขวาบนเหมือนต้นฉบับ */}
      {isLandscapeMode && (
        <div className="fixed top-[20px] right-[20px] flex flex-col gap-[8px] z-[1000]">
          <button onClick={() => setZoom(z => Math.min(z + 0.05, 2.5))} className="w-[44px] h-[44px] rounded-[14px] bg-white/50 backdrop-blur-md border border-[rgba(0,0,0,0.08)] flex justify-center items-center text-[#8E8E93] transition-all active:scale-90 hover:bg-[#8E8E93] hover:text-white"><ZoomIn size={22} /></button>
          <button onClick={() => setZoom(z => Math.max(z - 0.05, 0.4))} className="w-[44px] h-[44px] rounded-[14px] bg-white/50 backdrop-blur-md border border-[rgba(0,0,0,0.08)] flex justify-center items-center text-[#8E8E93] transition-all active:scale-90 hover:bg-[#8E8E93] hover:text-white"><ZoomOut size={22} /></button>
        </div>
      )}

      {isLandscapeMode ? (
        /* 💻 Desktop Layout: ใช้วิธี Center Bounding Box ขนาด 1240x660 */
        <div className="flex flex-1 w-full items-center justify-center overflow-hidden">
          <div 
            className="relative flex flex-row items-center justify-center shrink-0"
            style={{
              width: '1240px',
              height: '660px',
              transform: `scale(${baseScale * zoom})`,
              transformOrigin: 'center center',
              transition: 'transform 0.2s ease-out'
            }}
          >
              {/* Left Column (Image) */}
              <div className="relative flex flex-col justify-center shrink-0 w-[280px] h-full">
                 <div className="absolute z-10 font-solway font-bold text-[3rem] text-[#1d1d1f]" style={{ top: '70px', left: '10px' }}>
                    01
                 </div>
                 {story?.image_url ? (
                   <img src={story.image_url} alt="Cover" className="w-[280px] h-[380px] rounded-[24px] object-cover mx-auto" style={{ filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.15))', marginTop: '30px' }} />
                 ) : (
                   <div className="w-[280px] h-[380px] mx-auto bg-white border border-[rgba(0,0,0,0.08)] rounded-[24px] flex items-center justify-center text-gray-300 shadow-[0_2px_8px_rgba(0,0,0,0.04)]" style={{ marginTop: '30px' }}><Layers size={48} /></div>
                 )}
              </div>

              {/* Center Column (Paper) */}
              <div className="flex flex-col shrink-0 z-10 mx-[40px] w-[700px] h-full">
                  <div className="w-full flex justify-end items-center relative h-[60px] mb-[10px]">
                      <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-[10px]">
                          {['I', 'II', 'III'].map(lvl => (
                            <button 
                              key={lvl}
                              onClick={() => { setLevel(lvl); setShowThai(false); }}
                              className={`border-none rounded-[20px] px-[22px] py-[6px] font-solway text-[1.1rem] font-bold text-white cursor-pointer transition-all duration-200 ${level === lvl ? 'opacity-100 scale-[1.05] shadow-[0_4px_10px_rgba(0,0,0,0.15)]' : 'opacity-30 hover:opacity-80'}`}
                              style={{ backgroundColor: lvl === 'I' ? '#FD3259' : lvl === 'II' ? '#FF8A00' : '#007AFF' }}
                            >
                              {lvl}
                            </button>
                          ))}
                      </div>
                      <label className="relative inline-block w-[50px] h-[28px] cursor-pointer">
                        <input type="checkbox" className="opacity-0 w-0 h-0 peer" checked={showThai} onChange={() => setShowThai(!showThai)} />
                        <span className="absolute inset-0 bg-[#e5e5ea] rounded-[24px] transition-all duration-300 peer-checked:bg-[#007AFF] shadow-inner border border-black/5"></span>
                        <span className="absolute left-[3px] bottom-[3px] w-[22px] h-[22px] bg-white rounded-full transition-all duration-300 peer-checked:translate-x-[22px] shadow-[0_2px_4px_rgba(0,0,0,0.2)]"></span>
                      </label>
                  </div>
                  
                  <div className="notebook-paper-effect flex flex-col relative z-1 w-full h-[580px]" style={{ padding: '40px 60px' }}>
                      <div className="flex justify-between items-center mb-[30px] shrink-0">
                          <h2 className="font-solway font-extrabold text-[2.6rem] text-[#1d1d1f] m-0 leading-none">{story?.title}</h2>
                          <div className="flex gap-[12px]">
                              <button onClick={handleReadAloud} className="w-[44px] h-[44px] rounded-full bg-[#FFFFFF] border border-[rgba(0,0,0,0.08)] flex justify-center items-center text-[#8E8E93] transition-all active:scale-90 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:text-[#007AFF]"><Volume2 size={22} /></button>
                              <button onClick={() => setIsFav(!isFav)} className={`w-[44px] h-[44px] rounded-full bg-[#FFFFFF] border border-[rgba(0,0,0,0.08)] flex justify-center items-center transition-all active:scale-90 shadow-[0_2px_8px_rgba(0,0,0,0.04)] ${isFav ? 'text-[#FFD700] border-[#FFD700]' : 'text-[#8E8E93] hover:text-[#FFD700]'}`}><Star size={22} fill={isFav ? '#FFD700' : 'none'} /></button>
                          </div>
                      </div>
                      <div className="flex-1 overflow-y-auto pr-[15px] custom-scrollbar font-solway text-[1.1rem] leading-[1.6] text-[#1d1d1f] break-words">
                          {renderContent()}
                      </div>
                  </div>
              </div>

              {/* Right Column (Flashcards) */}
              <div className="flex flex-col justify-center shrink-0 w-[180px] h-full relative">
                  <div onClick={handleOpenFlashcards} className="side-flashcard-legacy w-[160px] h-[220px] flex justify-center items-center font-solway font-bold text-[#8E8E93] hover:text-[#007AFF] text-[1.2rem] mx-auto cursor-pointer" style={{ transform: 'rotate(6deg)', marginTop: '40px' }}>
                      <span className="z-10">Flashcards</span>
                  </div>
              </div>
          </div>
        </div>
      ) : (
        /* 📱 Mobile Layout (เหมือนเดิม) */
        <div className="flex flex-col items-center justify-start w-full min-h-screen px-6 pt-[30px] pb-[120px]">
            <div className="w-full flex justify-center items-center mb-6">
                <div className="flex gap-2 items-center bg-white/50 backdrop-blur-md border border-black/10 px-3 py-2 rounded-full shadow-sm">
                    {['I', 'II', 'III'].map(lvl => (
                      <button key={lvl} onClick={() => { setLevel(lvl); setShowThai(false); }} className={`border-none rounded-full px-5 py-1.5 font-solway text-[0.95rem] font-bold text-white transition-all duration-200 ${level === lvl ? 'opacity-100 scale-105 shadow-md' : 'opacity-30'}`} style={{ backgroundColor: lvl === 'I' ? '#FD3259' : lvl === 'II' ? '#FF8A00' : '#007AFF' }}>{lvl}</button>
                    ))}
                </div>
            </div>
            <div className="w-full flex flex-col relative z-10 max-w-[600px]">
                <div className="font-solway text-[0.85rem] font-bold text-[#FF9500] tracking-[1.5px] uppercase mb-2">STORY 01</div>
                <h2 className="font-solway font-extrabold text-[2.2rem] text-[#1d1d1f] leading-[1.1] mb-6 text-left">{story?.title}</h2>
                <div className="w-full font-solway text-[1.1rem] leading-relaxed text-[#1d1d1f] break-words">{renderContent()}</div>
            </div>
            <div className="fixed bottom-[30px] left-1/2 -translate-x-1/2 bg-[#1C1C1E] border border-white/10 rounded-[999px] p-2 gap-2 flex items-center shadow-[0_8px_30px_rgba(0,0,0,0.4)] z-[2000]">
               <button onClick={handleReadAloud} className="w-[44px] h-[44px] rounded-full flex justify-center items-center text-white transition-all active:scale-90 hover:bg-white/10"><Volume2 size={22} /></button>
               <button onClick={handleOpenFlashcards} className="h-[44px] px-[20px] rounded-full bg-[#2C2C2E] text-white font-semibold text-[0.95rem] transition-all active:scale-95 flex items-center gap-2 border border-white/5">Flashcards</button>
               <button onClick={() => setShowThai(!showThai)} className={`w-[44px] h-[44px] rounded-full flex justify-center items-center transition-all active:scale-90 ${showThai ? 'text-[#FF8A00] bg-white/10' : 'text-white hover:bg-white/10'}`}><Languages size={22} /></button>
               <button onClick={() => setIsFav(!isFav)} className={`w-[44px] h-[44px] rounded-full flex justify-center items-center transition-all active:scale-90 ${isFav ? 'text-[#FFD700]' : 'text-white hover:bg-white/10'}`}><Star size={22} fill={isFav ? 'currentColor' : 'none'} /></button>
            </div>
        </div>
      )}

      {/* 🃏 Flashcard Modal (เหมือนเดิม) */}
      {showFlashcards && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md px-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm flex flex-col items-center">
            <div className="text-white/60 font-bold tracking-widest text-sm mb-6">{cardIndex + 1} / {flashcardList.length}</div>
            <div className="w-full h-[400px] relative perspective-1000 cursor-pointer group" onClick={() => setIsFlipped(!isFlipped)}>
              <div className={`w-full h-full transition-transform duration-500 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
                <div className="absolute inset-0 backface-hidden bg-white rounded-[2rem] border border-white/20 shadow-2xl flex flex-col items-center justify-center p-8 text-center" style={{ background: bg }}>
                  <div className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest mb-6 ${flashcardList[cardIndex].level === 'I' ? 'bg-rose-100 text-rose-600' : flashcardList[cardIndex].level === 'II' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}`}>Level {flashcardList[cardIndex].level}</div>
                  <h2 className="text-4xl font-solway font-black text-gray-800 break-words w-full" style={{ color: textMain }}>{flashcardList[cardIndex].eng}</h2>
                  <p className="text-gray-400 font-bold text-sm mt-8 opacity-60">Tap to flip</p>
                </div>
                <div className="absolute inset-0 backface-hidden rotate-y-180 bg-white rounded-[2rem] border border-white/20 shadow-2xl flex flex-col items-center justify-center p-8 text-center" style={{ background: bg }}>
                  <h2 className="text-3xl font-bold text-blue-600 break-words w-full">{flashcardList[cardIndex].thai}</h2>
                  <p className="text-gray-400 font-bold text-sm mt-8 opacity-60">Tap to flip</p>
                </div>
              </div>
            </div>
            <div className="w-full grid grid-cols-2 gap-4 mt-8">
              <button onClick={() => setCardIndex(prev => Math.max(0, prev - 1))} disabled={cardIndex === 0} className="py-4 rounded-2xl font-bold text-white bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:pointer-events-none transition-all active:scale-95">ย้อนกลับ</button>
              <button onClick={() => { if (cardIndex < flashcardList.length - 1) { setIsFlipped(false); setTimeout(() => setCardIndex(prev => prev + 1), 150); } else { setShowFlashcards(false); } }} className="py-4 rounded-2xl font-bold text-white bg-blue-500 hover:bg-blue-600 transition-all active:scale-95 shadow-lg shadow-blue-500/20">{cardIndex === flashcardList.length - 1 ? 'เสร็จสิ้น' : 'ถัดไป'}</button>
            </div>
            <button onClick={() => setShowFlashcards(false)} className="mt-8 text-white/50 hover:text-white font-bold text-sm underline underline-offset-4 transition-colors">ปิดหน้าต่าง (Close)</button>
          </div>
        </div>
      )}
    </div>
  );
}