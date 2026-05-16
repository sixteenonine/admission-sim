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
    ['I', 'II', 'III'].forEach(lvl => {
      if (story.vocab_levels[lvl]) {
        Object.entries(story.vocab_levels[lvl]).forEach(([eng, thai]) => {
          cards.push({ eng, thai, level: lvl });
        });
      }
    });

    if (cards.length === 0) return alert("ไม่มีคำศัพท์สำหรับเรื่องนี้");
    
    // สุ่มคำศัพท์ให้ไม่เรียงตามตัวอักษรเกินไป
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

  // ฟังก์ชันสกัดเนื้อหาและไฮไลต์คำศัพท์ (Regex System แปลงจาก Code.gs เดิม)
  const renderContent = () => {
    if (!story) return null;
    if (showThai) {
      return <div className="font-sans leading-relaxed text-[1.05em] whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: story.translation || "<i>(ยังไม่มีคำแปลภาษาไทยสำหรับเรื่องนี้)</i>" }} />;
    }

    let text = story.content || "";
    // กำหนดสีตามระดับ Level I = ชมพูแดง, II = ส้ม, III = ฟ้า
    const vocabColor = level === 'I' ? '#FD3259' : level === 'II' ? '#FF8A00' : '#007AFF';

    if (story.vocab_levels && story.vocab_levels[level]) {
      const vocabMap = story.vocab_levels[level];
      // จัดเรียงคำที่ยาวกว่าขึ้นก่อน ป้องกันการจับคำซ้อนกัน (เช่น act กับ action)
      const sortedKeys = Object.keys(vocabMap).sort((a, b) => b.length - a.length);

      if (sortedKeys.length > 0) {
        const regexParts = sortedKeys.map(k => {
          const escaped = k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          return /^[\w]+$/.test(k) ? `\\b${escaped}\\b` : escaped;
        });
        const regex = new RegExp(`(${regexParts.join('|')})`, 'gi');

        text = text.replace(regex, (match) => {
          const targetWord = vocabMap[match.toLowerCase()];
          if (!targetWord) return match;
          return `<strong class="cursor-pointer transition-opacity hover:opacity-80 drop-shadow-sm" style="color: ${vocabColor};">${targetWord}</strong>`;
        });
      }
    }

    // รองรับการใส่ ** ตัวหนา ** จากแอดมิน
    text = text.replace(/\*\*([^*]+)\*\*/g, `<strong style="color: ${vocabColor};">$1</strong>`);
    return <div className="font-serif leading-relaxed text-[1.05em] whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: text }} />;
  };

  const handleReadAloud = () => {
    if (showThai) return alert("กรุณาสลับเป็นโหมดภาษาอังกฤษเพื่อฟังเสียงอ่าน");
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      // ดึงเฉพาะ Text เพียวๆ ไม่เอา HTML Tags
      const textToRead = story?.content?.replace(/<[^>]+>/g, '') || '';
      const utterance = new SpeechSynthesisUtterance(textToRead);
      utterance.lang = 'en-US';
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    } else {
      alert("เบราว์เซอร์ของคุณไม่รองรับระบบอ่านออกเสียง");
    }
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

      {/* Adaptive Layout Container */}
      <div className="flex flex-col lg:flex-row items-center lg:items-stretch justify-center gap-6 lg:gap-10 w-full px-4 relative" style={{ transform: `scale(${zoom})`, transformOrigin: 'top center', transition: 'transform 0.3s ease' }}>
        
        {/* เลนซ้าย: รูปภาพ (ซ่อนในมือถือ แสดงบน Desktop) */}
        <div className="hidden lg:flex w-[280px] shrink-0 flex-col relative justify-center">
          <div className="absolute -top-6 -left-6 z-10 font-serif text-5xl font-black text-gray-200 opacity-50 drop-shadow-md">01</div>
          <div className="rounded-[2rem] overflow-hidden shadow-2xl border-4 border-white bg-gray-100 aspect-[3/4] relative">
            {story?.image_url ? (
              <img src={story.image_url} alt="Story Art" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-300"><Layers size={48} /></div>
            )}
          </div>
        </div>

        {/* เลนกลาง: เนื้อหา (Paper) */}
        <div className="flex-1 w-full max-w-[800px] flex flex-col relative z-10">
          
          {/* Top Controls: Level & Translate */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-4">
            <div className="lg:hidden text-xs font-black tracking-widest text-blue-500 bg-blue-500/10 px-3 py-1 rounded-full uppercase">Story 01</div>
            
            <div className="flex items-center gap-4 sm:ml-auto bg-white/30 backdrop-blur-lg border border-white/40 p-1.5 rounded-full shadow-sm" style={{ color: textMain }}>
              <div className="flex gap-1">
                {['I', 'II', 'III'].map(lvl => (
                  <button key={lvl} onClick={() => { setLevel(lvl); setShowThai(false); }} className={`w-10 h-8 rounded-full font-black text-[13px] transition-all duration-300 ${level === lvl ? 'text-white shadow-md scale-105' : 'opacity-40 hover:opacity-100'}`} style={{ backgroundColor: level === lvl ? (lvl === 'I' ? '#FD3259' : lvl === 'II' ? '#FF8A00' : '#007AFF') : 'transparent' }}>
                    {lvl}
                  </button>
                ))}
              </div>
              <div className="w-px h-6 bg-gray-300 mx-1"></div>
              <button onClick={() => setShowThai(!showThai)} className={`flex items-center gap-2 px-3 h-8 rounded-full font-bold text-xs transition-all ${showThai ? 'bg-indigo-500 text-white shadow-md' : 'opacity-60 hover:opacity-100'}`}>
                <Languages size={14} /> ไทย
              </button>
            </div>
          </div>

          {/* Paper Content */}
          <div className="bg-[#FAF9F6] border border-gray-200 rounded-[2rem] p-8 md:p-12 shadow-xl shadow-black/5 relative overflow-hidden min-h-[500px] flex flex-col">
            <div className="flex justify-between items-start mb-8 gap-4">
              <h1 className="font-serif text-3xl md:text-4xl font-black text-gray-800 leading-tight">{story?.title}</h1>
              <div className="hidden sm:flex gap-2 shrink-0">
                <button onClick={handleReadAloud} className="w-10 h-10 rounded-full flex items-center justify-center bg-white border border-gray-200 shadow-sm text-gray-500 hover:text-blue-500 hover:scale-105 transition-all"><Volume2 size={18} /></button>
                <button onClick={() => setIsFav(!isFav)} className={`w-10 h-10 rounded-full flex items-center justify-center bg-white border border-gray-200 shadow-sm hover:scale-105 transition-all ${isFav ? 'text-yellow-500' : 'text-gray-500 hover:text-yellow-500'}`}><Star size={18} fill={isFav ? 'currentColor' : 'none'} /></button>
              </div>
            </div>
            
            <div className="flex-1 text-gray-700 text-[15px] md:text-[16px] leading-loose pr-2 custom-scrollbar">
              {renderContent()}
            </div>
          </div>
        </div>

        {/* เลนขวา: Flashcards Button (แสดงบน Desktop ใหญ่) */}
        <div className="hidden xl:flex w-[160px] shrink-0 flex-col items-center justify-center pt-16">
          <button onClick={handleOpenFlashcards} className="bg-white border border-gray-200 rounded-[1.5rem] w-[140px] h-[200px] flex flex-col justify-center items-center gap-3 shadow-lg shadow-black/5 hover:-translate-y-2 hover:shadow-xl transition-all duration-300 group relative">
            <div className="absolute inset-2 border-2 border-dashed border-gray-200 rounded-[1rem] transition-colors group-hover:border-blue-400 group-hover:opacity-50"></div>
            <Layers className="text-gray-400 group-hover:text-blue-500 transition-colors z-10" size={32} />
            <span className="font-serif font-bold text-gray-500 group-hover:text-blue-600 z-10">Flashcards</span>
          </button>
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