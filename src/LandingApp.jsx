import React, { useState, useEffect } from 'react'; // เพิ่มการนำเข้า hooks
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Timer, Headphones, PieChart, Bookmark, Layers, Zap, BookOpen, ChevronDown } from 'lucide-react';

const themeVals = {
  bg: "#eef2f6",
  textMain: "#1e293b", // ปรับให้เข้มขึ้นตามภาพตัวอย่าง
  textSub: "#64748b",
  raisedGradient: "linear-gradient(145deg, #ffffff, #dce3ec)",
  indentedGradient: "linear-gradient(145deg, #dce3ec, #ffffff)",
  shadowPlateau: "18px 18px 30px #c8d4e2, -18px -18px 30px #ffffff, inset 2px 2px 0px rgba(255,255,255,0.9), inset -2px -2px 0px rgba(0,0,0,0.02)",
  shadowOuter: "12px 12px 24px #c8d4e2, -12px -12px 24px #ffffff",
  shadowDeepInset: "inset 6px 6px 12px #c8d4e2, inset -6px -6px 12px #ffffff"
};

export default function LandingApp() {
  const [examType, setExamType] = useState('TGAT');
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const targetString = examType === 'TGAT' ? "January 30, 2027 09:00:00" : "March 13, 2027 09:00:00";
    const targetDate = new Date(targetString).getTime();

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = targetDate - now;

      if (distance < 0) {
        clearInterval(timer);
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      } else {
        setTimeLeft({
          days: Math.floor(distance / (1000 * 60 * 60 * 24)),
          hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((distance % (1000 * 60)) / 1000),
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [examType]);
  // Helper สำหรับเติมเลข 0 ข้างหน้า
  const formatNum = (num) => num.toString().padStart(2, '0');

  return (
    <div className="min-h-screen font-['Outfit','Prompt',sans-serif] overflow-x-hidden" style={{ backgroundColor: themeVals.bg, color: themeVals.textMain }}>
      {/* Navbar (คงเดิมจากที่แก้รอบก่อน) */}
      <header className="fixed top-0 left-0 right-0 h-[100px] px-6 sm:px-8 flex items-start pt-6 justify-between z-[100] pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-[80px] z-[-1] pointer-events-none" style={{ 
          backgroundColor: themeVals.bg, 
          WebkitMaskImage: 'linear-gradient(to bottom, black 40%, transparent 100%)', 
          maskImage: 'linear-gradient(to bottom, black 40%, transparent 100%)' 
        }}></div>
        <div className="w-1/3 flex justify-start items-center pointer-events-auto mt-2">
          <Link to="/home" className="text-xl font-bold opacity-80 tracking-[0.2em] hidden sm:block transition-transform active:scale-95" style={{ color: themeVals.textMain }}>
            ADMiSSIM
          </Link>
        </div>
        <div className="w-1/3 hidden md:flex justify-center items-center pointer-events-auto mt-4 gap-10">
          <a href="#home" className="text-[12px] font-bold tracking-widest uppercase opacity-100 hover:opacity-100 transition-all">Home</a>
          <a href="#features" className="text-[12px] font-bold tracking-widest uppercase opacity-100 hover:opacity-100 transition-all">Features</a>
          <a href="#price" className="text-[12px] font-bold tracking-widest uppercase opacity-100 hover:opacity-100 transition-all">Membership</a>
        </div>
        <div className="w-1/3 flex items-center justify-end pointer-events-auto mt-1">
          <Link to="/home" className="px-6 py-2.5 rounded-full font-bold text-[12px] tracking-widest uppercase hover:scale-105 active:scale-95 transition-all bg-[#1d1d1f] text-white shadow-lg"
            style={{ boxShadow: themeVals.shadowOuter }}>
            Let's go
          </Link>
        </div>
      </header>

      {/* Hero Section - Digital Clock Countdown */}
      <section id="home" className="pt-32 pb-20 px-6 max-w-7xl mx-auto min-h-screen flex flex-col justify-center">
        
        {/* Main Countdown Display */}
        <div className="relative rounded-[3rem] p-12 mb-16 flex flex-col items-center justify-center border border-white/50" 
             style={{ background: themeVals.bg, boxShadow: themeVals.shadowOuter }}>
          
          <div className="flex flex-col items-center mb-8 relative z-30">
            <div className="relative mb-3">
              <select 
                value={examType}
                onChange={(e) => setExamType(e.target.value)}
                className="pl-6 pr-10 py-1.5 rounded-2xl font-medium text-[30px] tracking-widest uppercase bg-transparent border border-white/60 outline-none cursor-pointer appearance-none transition-all active:scale-95"
                style={{ background: themeVals.raisedGradient, boxShadow: themeVals.shadowOuter, color: themeVals.textMain }}
              >
                <option value="TGAT">นับถอยหลัง Tgat 70</option>
                <option value="ALEVEL">นับถอยหลัง A-LEVEL 70</option>
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-60" style={{ color: themeVals.textMain }}>
                <ChevronDown size={16} />
              </div>
            </div>
            <div className="h-0 w-12 rounded-full bg-blue-500/20"></div>
          </div>

          {/* Clock Digits */}
          <div className="flex items-baseline gap-2 md:gap-4 relative z-10">
            <div className="flex flex-col items-center">
               <span className="text-[6rem] md:text-[10rem] font-light leading-none tracking-tighter">{timeLeft.days}</span>
               <span className="text-[20px] font-bold uppercase opacity-30 tracking-widest">วัน</span>
            </div>
            <span className="text-[4rem] md:text-[7rem] font-light opacity-20 animate-pulse">:</span>
            <div className="flex flex-col items-center">
               <span className="text-[6rem] md:text-[10rem] font-light leading-none tracking-tighter">{formatNum(timeLeft.hours)}</span>
               <span className="text-[20px] font-bold uppercase opacity-30 tracking-widest">ชั่วโมง</span>
            </div>
            <span className="text-[4rem] md:text-[7rem] font-light opacity-20 animate-pulse">:</span>
            <div className="flex flex-col items-center">
               <span className="text-[6rem] md:text-[10rem] font-light leading-none tracking-tighter">{formatNum(timeLeft.minutes)}</span>
               <span className="text-[20px] font-bold uppercase opacity-30 tracking-widest">นาที</span>
            </div>
            <span className="text-[4rem] md:text-[7rem] font-light opacity-20 animate-pulse">:</span>
            <div className="flex flex-col items-center w-[120px] md:w-[220px]">
               <span className="text-[6rem] md:text-[10rem] font-light leading-none tracking-tighter text-orange-500">{formatNum(timeLeft.seconds)}</span>
               <span className="text-[20px] font-bold uppercase opacity-30 tracking-widest">วินาที</span>
            </div>
          </div>
          
          {/* Date Label */}
          <div className="mt-5 px-8 py-2 rounded-full bg-white/40 text-[40px] font-medium tracking-wide shadow-inner border border-white/20 relative z-10">
            {examType === 'TGAT' ? 'วันศุกร์, 30 มกราคม, 2569' : 'วันเสาร์, 13 มีนาคม, 2569'}
          </div>
        </div>

        {/* Bottom Milestone Info - Adapted from sample image */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 px-4">
          <div className="flex flex-col">
            <h2 className="text-4xl md:text-5xl font-medium mb-4 tracking-tight leading-tight">
              เตรียมตัวให้พร้อม<br />ก่อนลงสนามจริง
            </h2>
            <p className="text-lg opacity-60 max-w-md">
              ระบบจำลองการสอบที่แม่นยำที่สุด พร้อมวิเคราะห์จุดแข็งจุดอ่อนแบบรายบุคคล เพื่อให้ทุกนาทีของการอ่านหนังสือมีความหมาย
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
             {[
               { label: 'TGAT 1', time: '09:00', status: 'Morning' },
               { label: 'TGAT 2', time: '11:00', status: 'Morning' },
               { label: 'TGAT 3', time: '13:00', status: 'Afternoon' },
               { label: 'Closing', time: '16:00', status: 'Done' }
             ].map((item, idx) => (
               <div key={idx} className="p-6 rounded-[2rem] border border-white/50 shadow-sm" style={{ background: themeVals.raisedGradient }}>
                  <div className="text-[10px] font-black uppercase opacity-30 mb-1 tracking-tighter">{item.label}</div>
                  <div className="text-2xl font-bold mb-2">{item.time}</div>
                  <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest opacity-60">
                    <div className={`w-1.5 h-1.5 rounded-full ${idx < 2 ? 'bg-orange-400' : 'bg-blue-400'}`}></div>
                    {item.status}
                  </div>
               </div>
             ))}
          </div>
        </div>

      </section>
      {/* Features Section - Apple Bento Box Style */}
      <section id="features" className="py-32 px-6 max-w-6xl mx-auto min-h-screen flex flex-col justify-center">
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          className="text-center mb-16 md:mb-24"
        >
          <h2 className="text-4xl md:text-6xl font-black font-medium tracking-tighter mb-4" style={{ color: themeVals.textMain }}>ครบทุกมิติ<br/>แห่งการเตรียมสอบ</h2>
          <p className="text-lg md:text-xl font-medium tracking-wide opacity-60" style={{ color: themeVals.textSub }}>สถาปัตยกรรมที่ออกแบบมาเพื่อสอดรับกับพฤติกรรมเด็กไทยโดยเฉพาะ</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:auto-rows-[280px]">
          {/* Bento 1: Timer (Span 2) */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}
            className="md:col-span-2 rounded-[2.5rem] p-8 md:p-10 flex flex-col justify-between border border-white/40 overflow-hidden relative group"
            style={{ background: themeVals.raisedGradient, boxShadow: themeVals.shadowOuter }}
          >
            <div className="relative z-10">
               <Timer size={40} className="mb-4 text-blue-500" />
               <h3 className="text-2xl md:text-3xl font-bold mb-2 tracking-tight" style={{ color: themeVals.textMain }}>ระบบจับเวลาเสมือนจริง</h3>
               <p className="text-sm md:text-base opacity-70 max-w-sm" style={{ color: themeVals.textSub }}>ควบคุมจังหวะการทำข้อสอบด้วยระบบเวลา 90 นาที พร้อมแจ้งเตือนช่วงสำคัญเพื่อให้คุ้นเคยกับแรงกดดัน</p>
            </div>
            <div className="absolute -bottom-10 -right-10 opacity-5 group-hover:scale-110 transition-transform duration-700">
               <Timer size={250} />
            </div>
          </motion.div>

          {/* Bento 2: Weakness (Span 1) */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }}
            className="rounded-[2.5rem] p-8 flex flex-col justify-between border border-white/40 overflow-hidden relative group"
            style={{ background: themeVals.raisedGradient, boxShadow: themeVals.shadowOuter }}
          >
            <div className="relative z-10">
               <PieChart size={36} className="mb-4 text-orange-500" />
               <h3 className="text-xl font-bold mb-2 tracking-tight" style={{ color: themeVals.textMain }}>วิเคราะห์จุดอ่อน</h3>
               <p className="text-sm opacity-70" style={{ color: themeVals.textSub }}>ประเมินผลรายบุคคลแบบเจาะลึก รู้ทันทีว่าพลาดจุดไหนและต้องแก้ไขอย่างไร</p>
            </div>
          </motion.div>

          {/* Bento 3: Ambient (Span 1) */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.3 }}
            className="rounded-[2.5rem] p-8 flex flex-col justify-between border border-white/40 overflow-hidden relative group"
            style={{ background: themeVals.raisedGradient, boxShadow: themeVals.shadowOuter }}
          >
            <div className="relative z-10">
               <Headphones size={36} className="mb-4 text-purple-500" />
               <h3 className="text-xl font-bold mb-2 tracking-tight" style={{ color: themeVals.textMain }}>เสียงบรรยากาศ</h3>
               <p className="text-sm opacity-70" style={{ color: themeVals.textSub }}>เสริมสร้างสมาธิด้วยการจำลองเสียงแอร์ ดินสอ และสภาพแวดล้อมจากสนามสอบจริง</p>
            </div>
          </motion.div>

          {/* Bento 4: Mark (Span 2) */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.4 }}
            className="md:col-span-2 rounded-[2.5rem] p-8 md:p-10 flex flex-col justify-between border border-white/40 overflow-hidden relative group"
            style={{ background: themeVals.raisedGradient, boxShadow: themeVals.shadowOuter }}
          >
            <div className="relative z-10">
               <Bookmark size={40} className="mb-4 text-red-500" />
               <h3 className="text-2xl md:text-3xl font-bold mb-2 tracking-tight" style={{ color: themeVals.textMain }}>ระบบ Mark ข้อสงสัย</h3>
               <p className="text-sm md:text-base opacity-70 max-w-sm" style={{ color: themeVals.textSub }}>หากไม่แน่ใจสามารถข้ามไปก่อนแล้วมาร์คไว้ ระบบจะคอยเตือนให้กลับมาทบทวนก่อนหมดเวลา</p>
            </div>
            <div className="absolute -bottom-8 -right-8 opacity-5 group-hover:scale-110 transition-transform duration-700">
               <Bookmark size={200} />
            </div>
          </motion.div>

          {/* Bento 5: Flashcards */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.5 }}
            className="rounded-[2.5rem] p-6 flex flex-col items-center text-center justify-center border border-white/40 hover:scale-[1.02] transition-transform"
            style={{ background: themeVals.raisedGradient, boxShadow: themeVals.shadowOuter }}
          >
             <Layers size={32} className="mb-3 text-emerald-500" />
             <h3 className="text-lg font-bold mb-1" style={{ color: themeVals.textMain }}>Flashcards</h3>
             <p className="text-[12px] opacity-70" style={{ color: themeVals.textSub }}>ทบทวนคลังศัพท์ระดับ B1-C1</p>
          </motion.div>

          {/* Bento 6: SpeedRead */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.6 }}
            className="rounded-[2.5rem] p-6 flex flex-col items-center text-center justify-center border border-white/40 hover:scale-[1.02] transition-transform"
            style={{ background: themeVals.raisedGradient, boxShadow: themeVals.shadowOuter }}
          >
             <Zap size={32} className="mb-3 text-yellow-500" />
             <h3 className="text-lg font-bold mb-1" style={{ color: themeVals.textMain }}>SpeedRead</h3>
             <p className="text-[12px] opacity-70" style={{ color: themeVals.textSub }}>ฝึกกวาดสายตาและจับใจความ</p>
          </motion.div>

          {/* Bento 7: StoryDiary */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.7 }}
            className="rounded-[2.5rem] p-6 flex flex-col items-center text-center justify-center border border-white/40 hover:scale-[1.02] transition-transform"
            style={{ background: themeVals.raisedGradient, boxShadow: themeVals.shadowOuter }}
          >
             <BookOpen size={32} className="mb-3 text-cyan-500" />
             <h3 className="text-lg font-bold mb-1" style={{ color: themeVals.textMain }}>StoryDiary</h3>
             <p className="text-[12px] opacity-70" style={{ color: themeVals.textSub }}>บันทึกความก้าวหน้าการอ่าน</p>
          </motion.div>
        </div>
      </section>
    </div>
  );
}