import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Compass, Clock, ZoomIn, Gamepad2, Calendar, Dices, Layers, Timer } from 'lucide-react';

export default function Roadmap() {
  const themeVals = useOutletContext();
  const [activeIndex, setActiveIndex] = useState(0);

  const features = [
    { id: 1, status: 'Coming Soon', color: '#ffffff', bgGradient: 'linear-gradient(135deg, #4B4B4B 0%, #050505 100%)', icon: <Compass size={24} />, title: 'Unfolder', desc: 'สำรวจศักยภาพและทลายความสับสนในการเลือกสายเรียน ด้วยเทคนิคจิตวิทยา NLP' },
    { id: 2, status: 'In Progress', color: '#ffffff', bgGradient: 'linear-gradient(135deg, #451C59 0%, #1E0B2D 100%)', icon: <Clock size={24} />, title: 'Admissim v2', desc: 'จำลองบรรยากาศและความกดดันสมจริงที่สุด ครบทุกวิชาหลัก ฝึกบริหารเวลาให้แม่นยำก่อนลงสนามจริง' },
    { id: 3, status: 'Planning', color: '#ffffff', bgGradient: 'linear-gradient(135deg, #0A4361 0%, #011423 100%)', icon: <ZoomIn size={24} />, title: 'GrammarZoom', desc: 'ระบบช่วยฝึกวิเคราะห์โครงสร้างภาษาอังกฤษเชิงลึก ซูมเจาะเฉพาะจุดสำคัญที่ออกสอบบ่อย มองทะลุทุกความซับซ้อนของ Grammar' },
    { id: 4, status: 'Idea', color: '#ffffff', bgGradient: 'linear-gradient(135deg, #5C1E3C 0%, #15030B 100%)', icon: <Gamepad2 size={24} />, title: 'GameMode', desc: 'เปลี่ยนการติวที่น่าเบื่อให้กลายเป็นความท้าทาย ฝึกทักษะผ่านเกมแนวใหม่ที่หลากหลาย สนุกจนลืมไปว่ากำลังเตรียมสอบ' },
    { id: 5, status: 'Planning', color: '#ffffff', bgGradient: 'linear-gradient(135deg, #3A3D42 0%, #0A0A0C 100%)', icon: <Calendar size={24} />, title: 'AdmissionPlanner', desc: 'ระบบวางแผนอ่านหนังสือเตรียมสอบอย่างเป็นระบบ จัดระเบียบตารางชีวิตให้ลงตัว' },
    { id: 6, status: 'In Progress', color: '#ffffff', bgGradient: 'linear-gradient(135deg, #390B35 0%, #0F0211 100%)', icon: <Dices size={24} />, title: 'GachaExam', desc: 'ระบบสุ่มโจทย์ ฝึกทำและสะสมโจทย์ใหม่ๆ ได้ทุกวัน' },
    { id: 7, status: 'Coming Soon', color: '#ffffff', bgGradient: 'linear-gradient(135deg, #3E2F5B 0%, #140E20 100%)', icon: <Layers size={24} />, title: 'Idioms Flashcards', desc: 'รวมสำนวนภาษาอังกฤษ (Idioms) ออกสอบบ่อย ทำให้การทำข้อสอบ Reading & Conversation เป็นเรื่องง่าย' },
    { id: 8, status: 'Idea', color: '#ffffff', bgGradient: 'linear-gradient(135deg, #1C304A 0%, #050A10 100%)', icon: <Timer size={24} />, title: 'Pomodoro', desc: 'เครื่องมือช่วยจัดการสมาธิแบบ Deep Work ช่วยให้จดจ่อกับการอ่านหนังสือได้นานขึ้น โดยไม่เกิดอาการสมองล้า' }
  ];

  

  return (
    <div className="flex flex-col items-center gap-0 animate-in fade-in duration-300 w-full max-w-[100vw] overflow-x-hidden pt-0 pb-0">
      
      {/* Header Text */}
      <div className="flex flex-col items-center text-center gap-2 px-4 mt-2 mb-0">
        <h1 className="text-3xl md:text-6xl font-medium font-black tracking-tight" style={{ color: themeVals.textMain }}>
          พบกันเร็วๆนี้
        </h1>
        <p className="text-sm md:text-base font-medium max-w-md leading-relaxed opacity-80" style={{ color: themeVals.textMain }}>
          เตรียมพบกับฟีเจอร์ ตัวช่วยการเรียนภาษาอังกฤษ และการเตรียมสอบที่กำลังจะมาในอนาคต
        </p>
      </div>

      {/* Center Dynamic Slider */}
      <div className="w-full relative flex justify-center items-center h-[520px]">
        <div 
          className="flex gap-3 transition-transform duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] will-change-transform"
          style={{
            transform: `translate3d(calc(50% - 150px - ${activeIndex * 332}px), 0, 0)`
            // 150px คือครึ่งหนึ่งของความกว้างการ์ด และ 332px คือความกว้างการ์ดรวมกับ Gap ระยะห่าง
          }}
        >
          {features.map((item, index) => {
            const isActive = index === activeIndex;
            return (
              <div
                key={item.id}
                onClick={() => setActiveIndex(index)}
                className={`relative rounded-[2.5rem] border border-white/30 h-[390px] w-[320px] shrink-0 transition-[transform,opacity,box-shadow,z-index] duration-700 cursor-pointer will-change-transform group ${
                  isActive ? 'scale-110 z-20 opacity-100' : 'scale-90 z-10 opacity-30'
                }`}
                style={{ 
                  padding: '10px',
                  background: themeVals.bg,
                  boxShadow: isActive ? `0 30px 60px -15px ${item.color}99` : themeVals.shadowPlateau
                }}
              >
                {/* กรอบด้านใน (Inner Container) */}
                <div 
                  className="w-full h-full rounded-[2rem] p-5 flex flex-col border relative overflow-hidden text-black"
                  style={{
                    background: `linear-gradient(145deg, ${item.color}ee 0%, ${item.color} 100%)`,
                    boxShadow: themeVals.shadowOuter,
                    borderColor: item.color
                  }}
                >
                  {/* จัด Layout ใหม่: ไอคอนอยู่บนสุดซ้าย */}
                  <div className="z-10 mb-auto">
                    <div className="w-full h-30 rounded-3xl flex items-center justify-center text-black shadow-lg bg-white/1 backdrop-blur-sm border border-black/1 shrink-0">
                      {item.icon}
                    </div>
                  </div>

                  {/* เนื้อหาข้อความอยู่ตรงกลางถึงล่าง ปรับสีขาวเด่น */}
                  <div className="z-10 mt-6">
                    <h3 className="text-3xl font-bold tracking-tight mb-2 text-black leading-tight">
                      {item.title}
                    </h3>
                    <p className="text-sm font-medium leading-relaxed text-black/90">
                      {item.desc}
                    </p>
                  </div>

                  {/* สถานะอยู่ด้านล่างขวา */}
                  <div className="z-10 mt-6 flex justify-end">
                    <span 
                      className="px-4 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-widest bg-black/100 backdrop-blur-sm border border-white/10 text-white shadow-lg"
                    >
                      {item.status}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      

    </div>
  );
}