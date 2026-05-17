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
    <div className="w-full max-w-[1240px] mx-auto animate-in fade-in duration-500 relative flex flex-col items-center">
      
      {/* Top Navigation */}
      <div className="w-full flex items-center justify-between mb-6 px-4 z-20">
        <button onClick={() => navigate('/storydiary')} className="w-11 h-11 rounded-full flex items-center justify-center transition-all active:scale-95 border border-white/5" style={{ background: raisedGradient, boxShadow: shadowPlateau, color: textMain }}>
          <ChevronLeft size={22} />
        </button>
        <div className="flex gap-2">
          <button onClick={() => setZoom(z => Math.min(z + 0.1, 1.5))} className="w-10 h-10 rounded-xl flex items-center justify-center transition-all active:scale-95 bg-white/10 backdrop-blur-md border border-white/20" style={{ color: textMain }}><ZoomIn size={18} /></button>
          <button onClick={() => setZoom(z => Math.max(z - 0.1, 0.7))} className="w-10 h-10 rounded-xl flex items-center justify-center transition-all active:scale-95 bg-white/10 backdrop-blur-md border border-white/20" style={{ color: textMain }}><ZoomOut size={18} /></button>
        </div>
      </div>

      {/* Adaptive Layout Container (Reconstructed Legacy UI) */}
      <div className="flex flex-col lg:flex-row items-center justify-center w-full px-4 relative mt-8 lg:mt-4 lg:w-[1150px] lg:min-w-[1150px] mx-auto" style={{ transform: `scale(${zoom})`, transformOrigin: 'top center', transition: 'transform 0.3s ease' }}>
        
        {/* เลนซ้าย: รูปภาพกล้อง (ซ่อนในมือถือ) */}
        <div className="hidden lg:flex flex-none w-[310px] relative justify-center items-center lg:-translate-x-[53px] lg:translate-y-[73px]">
          <div className="absolute top-[-15px] left-[-15px] z-10 font-solway text-[2.3rem] font-semibold text-black drop-shadow-sm lg:translate-x-[19px] lg:translate-y-[5px]">
            01
          </div>
          {story?.image_url && (
            <img src={story.image_url} alt="Story Art" className="w-full max-w-[310px] h-auto rounded-[16px] min-h-[400px] object-cover" style={{ filter: 'drop-shadow(0 15px 30px rgba(0,0,0,0.15))' }} />
          )}
        </div>

        {/* เลนกลาง: กระดาษเนื้อเรื่อง */}
        <div className="flex-1 min-w-0 w-full max-w-[800px] flex flex-col z-10">
          
          {/* Top Controls: Level & Toggle */}
          <div className="flex justify-center lg:justify-end items-center gap-4 mb-4 lg:mb-[15px] lg:pr-[20px] relative">
            <div className="flex gap-2 items-center lg:absolute lg:left-[40%] lg:-translate-x-1/2 lg:translate-y-[31px]">
              {['I', 'II', 'III'].map(lvl => (
                <button 
                  key={lvl} 
                  onClick={() => { setLevel(lvl); setShowThai(false); }} 
                  className={`border-none rounded-full px-5 lg:px-[18px] py-1 lg:py-[4px] font-solway text-[0.95rem] font-bold text-white cursor-pointer transition-all duration-200 ${level === lvl ? 'opacity-100 scale-105 shadow-md' : 'opacity-30 hover:opacity-80'}`} 
                  style={{ backgroundColor: lvl === 'I' ? '#FD3259' : lvl === 'II' ? '#FF8A00' : '#007AFF' }}
                >
                  {lvl}
                </button>
              ))}
            </div>

            <label className="relative inline-block w-[44px] h-[24px] lg:ml-[10px] lg:-translate-x-[44px] lg:translate-y-[31px]">
              <input type="checkbox" className="opacity-0 w-0 h-0 peer" checked={showThai} onChange={() => setShowThai(!showThai)} />
              <span className="absolute cursor-pointer top-0 left-0 right-0 bottom-0 bg-black/10 rounded-full transition-all duration-300 peer-checked:bg-[#FF8A00] before:absolute before:content-[''] before:h-[18px] before:w-[18px] before:left-[3px] before:bottom-[3px] before:bg-white before:rounded-full before:transition-all before:duration-300 peer-checked:before:translate-x-[20px] before:shadow-md"></span>
            </label>
          </div>

          {/* Notebook Paper */}
          <div className="notebook-paper-effect w-full lg:h-[550px] min-h-[500px] flex flex-col p-6 lg:px-[60px] lg:py-[30px] lg:-translate-x-[59px] lg:translate-y-[27px]">
            
            <div className="flex justify-between items-start lg:items-center mb-6 lg:mb-[25px] shrink-0 gap-4">
              <h1 className="font-solway font-extrabold text-2xl lg:text-[2.2rem] text-black m-0 leading-tight lg:leading-[0.5] lg:tracking-[-0.5px] lg:translate-y-[5px]">
                {story?.title || 'Loading...'}
              </h1>
              
              <div className="hidden lg:flex gap-[10px] lg:translate-x-[34px]">
                <button onClick={handleReadAloud} className="w-[38px] h-[38px] rounded-full bg-white border border-black/10 text-gray-400 flex justify-center items-center cursor-pointer transition-all active:scale-90 shadow-sm hover:text-blue-500">
                  <Volume2 size={20} />
                </button>
                <button onClick={() => setIsFav(!isFav)} className="w-[38px] h-[38px] rounded-full bg-white border border-black/10 text-gray-400 flex justify-center items-center cursor-pointer transition-all active:scale-90 shadow-sm hover:text-yellow-500">
                  <Star size={20} fill={isFav ? '#EAB308' : 'none'} stroke={isFav ? '#EAB308' : 'currentColor'} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto lg:pr-[15px] custom-scrollbar font-solway text-[1rem] leading-[1.4] text-black break-words">
              {renderContent()}
            </div>

          </div>
        </div>

        {/* เลนขวา: ปุ่ม Flashcards (ซ่อนในมือถือ) */}
        <div className="hidden lg:flex flex-none w-[150px] items-center justify-center lg:translate-x-[10px] lg:translate-y-[52px] lg:scale-[1.6] lg:rotate-[6deg]">
          <div onClick={handleOpenFlashcards} className="side-flashcard-legacy w-[140px] h-[200px] flex justify-center items-center font-solway font-bold text-gray-400 hover:text-blue-500">
            <span className="z-10">Flashcards</span>
          </div>
        </div>

      </div>

      {/* 📱 Mobile Portrait Pill Controls */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 lg:hidden flex items-center gap-1.5 p-2 rounded-full shadow-2xl z-50 border border-white/10" style={{ background: 'rgba(28, 28, 30, 0.85)', backdropFilter: 'blur(16px)' }}>
        <button onClick={handleReadAloud} className="w-12 h-12 rounded-full flex items-center justify-center text-white/70 hover:bg-white/10 active:scale-95 transition-all"><Volume2 size={20} /></button>
        <button onClick={() => setShowThai(!showThai)} className={`w-12 h-12 rounded-full flex items-center justify-center active:scale-95 transition-all ${showThai ? 'text-indigo-400 bg-indigo-500/20' : 'text-white/70 hover:bg-white/10'}`}><Languages size={20} /></button>
        <button onClick={handleOpenFlashcards} className="h-12 px-6 rounded-full bg-white text-black font-bold text-sm mx-1 active:scale-95 transition-transform shadow-lg flex items-center gap-2">
          <Layers size={16} /> Flashcards
        </button>
        <button onClick={() => setIsFav(!isFav)} className={`w-12 h-12 rounded-full flex items-center justify-center active:scale-95 transition-all ${isFav ? 'text-yellow-400' : 'text-white/70 hover:bg-white/10'}`}><Star size={20} fill={isFav ? 'currentColor' : 'none'} /></button>
      </div>

      {/* 🃏 Flashcard Modal Overlay */}
      {showFlashcards && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md px-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm flex flex-col items-center">
            
            {/* Progress Text */}
            <div className="text-white/60 font-bold tracking-widest text-sm mb-6">
              {cardIndex + 1} / {flashcardList.length}
            </div>

            {/* The 3D Card */}
            <div 
              className="w-full h-[400px] relative perspective-1000 cursor-pointer group"
              onClick={() => setIsFlipped(!isFlipped)}
            >
              <div className={`w-full h-full transition-transform duration-500 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
                
                {/* Front (English) */}
                <div className="absolute inset-0 backface-hidden bg-white rounded-[2rem] border border-white/20 shadow-2xl flex flex-col items-center justify-center p-8 text-center" style={{ background: bg }}>
                  <div className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest mb-6 ${flashcardList[cardIndex].level === 'I' ? 'bg-rose-100 text-rose-600' : flashcardList[cardIndex].level === 'II' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}`}>
                    Level {flashcardList[cardIndex].level}
                  </div>
                  <h2 className="text-4xl font-serif font-black text-gray-800 break-words w-full" style={{ color: textMain }}>{flashcardList[cardIndex].eng}</h2>
                  <p className="text-gray-400 font-bold text-sm mt-8 opacity-60">Tap to flip</p>
                </div>

                {/* Back (Thai) */}
                <div className="absolute inset-0 backface-hidden rotate-y-180 bg-white rounded-[2rem] border border-white/20 shadow-2xl flex flex-col items-center justify-center p-8 text-center" style={{ background: bg }}>
                  <h2 className="text-3xl font-bold text-blue-600 break-words w-full">{flashcardList[cardIndex].thai}</h2>
                  <p className="text-gray-400 font-bold text-sm mt-8 opacity-60">Tap to flip</p>
                </div>

              </div>
            </div>

            {/* Controls */}
            <div className="w-full grid grid-cols-2 gap-4 mt-8">
              <button 
                onClick={() => setCardIndex(prev => Math.max(0, prev - 1))}
                disabled={cardIndex === 0}
                className="py-4 rounded-2xl font-bold text-white bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:pointer-events-none transition-all active:scale-95"
              >
                ย้อนกลับ
              </button>
              <button 
                onClick={() => {
                  if (cardIndex < flashcardList.length - 1) {
                    setIsFlipped(false);
                    setTimeout(() => setCardIndex(prev => prev + 1), 150);
                  } else {
                    setShowFlashcards(false);
                  }
                }}
                className="py-4 rounded-2xl font-bold text-white bg-blue-500 hover:bg-blue-600 transition-all active:scale-95 shadow-lg shadow-blue-500/20"
              >
                {cardIndex === flashcardList.length - 1 ? 'เสร็จสิ้น' : 'ถัดไป'}
              </button>
            </div>

            <button onClick={() => setShowFlashcards(false)} className="mt-8 text-white/50 hover:text-white font-bold text-sm underline underline-offset-4 transition-colors">
              ปิดหน้าต่าง (Close)
            </button>

          </div>
        </div>
      )}

    </div>
  );
}