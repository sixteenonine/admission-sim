import React from 'react';
import { motion } from 'framer-motion';

export default function LandingApp() {
  return (
    <div className="min-h-screen bg-[#f5f5f7] text-[#1d1d1f] font-['Prompt','Outfit',sans-serif] overflow-x-hidden selection:bg-[#ea580c] selection:text-white">
      {/* Navbar */}
      <nav className="fixed top-0 w-full bg-[#f5f5f7]/80 backdrop-blur-md z-50 border-b border-black/5">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between text-[11px] font-semibold tracking-widest uppercase">
          <div className="font-black text-[13px]">
            ADMISSION<span className="text-[#ea580c]">SIM</span>
          </div>
          <div className="hidden md:flex gap-10 opacity-70">
            <a href="#home" className="hover:text-[#ea580c] transition-colors">Home</a>
            <a href="#features" className="hover:text-[#ea580c] transition-colors">Features</a>
            <a href="#price" className="hover:text-[#ea580c] transition-colors">Price</a>
          </div>
          <a href="/app.html#/home" className="px-5 py-2 bg-[#1d1d1f] text-white rounded-full hover:scale-105 active:scale-95 transition-all">
            Login
          </a>
        </div>
      </nav>

      {/* Hero Section */}
      <section id="home" className="pt-36 pb-20 px-6 flex flex-col items-center text-center min-h-screen">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="flex flex-col items-center"
        >
          <h2 className="text-xl md:text-3xl font-bold opacity-80 mb-1 tracking-wide">นวัตกรรม</h2>
          <h1 className="text-[5rem] md:text-[8rem] font-black tracking-tighter mb-4 leading-none">ใหม่</h1>
          <p className="text-lg md:text-xl font-medium opacity-60 mb-8 tracking-wide">เตรียมเด็กไทยสู่สนาม ADMISSION</p>
          <div className="w-12 h-2.5 bg-[#ea580c] rounded-full mb-16 shadow-[0_0_15px_rgba(234,88,12,0.4)]"></div>
        </motion.div>

        {/* App Mockup */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 40 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
          className="w-full max-w-5xl bg-white rounded-[2rem] md:rounded-[3rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] overflow-hidden border border-black/5 aspect-[16/9] flex items-center justify-center relative"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-gray-100 opacity-50 pointer-events-none"></div>
          <span className="text-2xl font-bold opacity-20 relative z-10 tracking-widest uppercase">ภาพหน้าจอจำลอง (Mockup)</span>
        </motion.div>
      </section>
    </div>
  );
}