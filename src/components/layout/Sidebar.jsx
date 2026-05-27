import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Clock, Zap, CreditCard, Book, X, Map } from 'lucide-react';

const MENU_ITEMS = [
  { path: '/home', label: 'Home', icon: Home },
  { path: '/roadmap', label: 'Roadmap', icon: Map },
  { path: '/admissim', label: 'ADMiSSIM', icon: Clock },
  { path: '/speedread', label: 'UltraSpeedReed', icon: Zap },
  { path: '/vocab', label: 'Flashcards', icon: CreditCard },
  { path: '/storydiary', label: 'StoryDiary', icon: Book }
];

export default function Sidebar({ isOpen, onClose, themeVals }) {
  const location = useLocation();

  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  return (
    <>
      {/* Backdrop แบบลอยทับ */}
      <div 
        onClick={onClose}
        className={`fixed inset-0 bg-transparent backdrop-blur-sm z-[200] transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
      />
      
      {/* Sidebar Panel */}
      <div 
        className={`fixed top-0 left-0 h-full w-[280px] z-[210] flex flex-col transition-transform duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
        style={{ backgroundColor: themeVals.bg, boxShadow: isOpen ? '20px 0 40px rgba(0,0,0,0.1)' : 'none' }}
      >
        <div className="h-[100px] flex items-center justify-between px-6 border-b border-white/10 pt-6">
          <div className="flex items-center gap-3">
            <img src="/favicon.png" alt="Logo" className="w-8 h-8 object-contain drop-shadow-md" />
            <span className="text-xl font-bold tracking-[0.2em]" style={{ color: themeVals.textMain }}>
              ADMiSSIM
            </span>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl transition-all active:scale-95 hover:bg-transparent" style={{ color: themeVals.textSub }}>
            <X size={20} />
          </button>
        </div>

        <div className="flex flex-col gap-2 p-6 flex-1 overflow-y-auto">
          {MENU_ITEMS.map((item) => {
            const isActive = location.pathname.includes(item.path);
            const Icon = item.icon;
            return (
              <Link 
                key={item.path} 
                to={item.path} 
                onClick={onClose}
                className="flex items-center gap-4 px-5 py-4 rounded-2xl transition-all font-semibold"
                style={{ 
                  background: isActive ? themeVals.indentedGradient : 'transparent', 
                  boxShadow: isActive ? themeVals.shadowDeepInset : 'none', 
                  color: isActive ? '#3b82f6' : themeVals.textSub 
                }}
              >
                <Icon size={20} className={isActive ? 'text-blue-500' : ''} />
                <span className="text-[15px] tracking-wide">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}