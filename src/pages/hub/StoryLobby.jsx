import React, { useState, useEffect } from 'react';
import { useOutletContext, Link, useLocation } from 'react-router-dom';
import { BookOpen, Lock, ChevronRight, Loader2, Star } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

export default function StoryLobby() {
  const contextVals = useOutletContext();
  const { currentUser: user, ...themeVals } = contextVals;
  const { bg, textMain, shadowOuter } = themeVals;

  const [activeTab, setActiveTab] = useState('ALL');
  const [favoriteIds, setFavoriteIds] = useState([]);

  const location = useLocation();

  useEffect(() => {
    if (location.state?.toggledStoryId) {
      const { toggledStoryId, toggledStatus } = location.state;
      setFavoriteIds(prev => {
        if (toggledStatus && !prev.includes(toggledStoryId)) return [...prev, toggledStoryId];
        if (!toggledStatus) return prev.filter(id => id !== toggledStoryId);
        return prev;
      });
    }
  }, [location.state]);

  useEffect(() => {
    if (user?.id) {
      fetch(`/api/user/sync?userId=${encodeURIComponent(user.id)}`)
        .then(res => res.json())
        .then(data => {
          if (data.status === 'success' && data.data?.favorites) {
            const favs = JSON.parse(data.data.favorites);
            let storiesList = favs.stories || [];
            
            if (location.state?.toggledStoryId) {
              const { toggledStoryId, toggledStatus } = location.state;
              if (toggledStatus && !storiesList.includes(toggledStoryId)) {
                storiesList.push(toggledStoryId);
              } else if (!toggledStatus) {
                storiesList = storiesList.filter(id => id !== toggledStoryId);
              }
            }
            setFavoriteIds(storiesList);
          }
        }).catch(console.error);
    }
  }, [user?.id, location.state]);

  const { data: stories = [], isLoading: loading, isError: error } = useQuery({
    queryKey: ['storiesList'],
    queryFn: async () => {
      const res = await fetch('/api/stories/list');
      const data = await res.json();
      if (data.status !== 'success') throw new Error('ไม่สามารถโหลดรายการเรื่องสั้นได้');
      // กรองเอาเฉพาะหมวด StoryDiary (ซ่อน Speedread)
      return data.stories.filter(story => !story.type || story.type === 'story');
    },
      staleTime: 1000 * 60 * 60,
      refetchOnWindowFocus: false
    
  });

  return (
    <div className="w-full max-w-5xl mx-auto animate-in fade-in duration-300">
      
      {/* Header ของหน้า Lobby */}
      <div className="mb-10 px-2">
        <h2 className="text-3xl font-black mb-2" style={{ color: textMain }}>StoryDiary</h2>
        <p className="text-sm opacity-60 font-prompt font-normal" style={{ color: textMain }}>ฝึกอ่านเรื่องสั้นระดับพรีเมียมและสะสมคลังคำศัพท์ประจำวัน</p>
      </div>

      {/* แท็บตัวเลือกหมวดหมู่ */}
      <div className="flex gap-3 mb-6 px-2">
        <button 
          onClick={() => setActiveTab('ALL')}
          className={`px-5 py-2.5 rounded-2xl font-bold text-sm transition-all duration-300 flex items-center gap-2 ${activeTab === 'ALL' ? 'bg-blue-600 text-white shadow-[0_4px_12px_rgba(37,99,235,0.3)]' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
        >
          <BookOpen size={16} /> <span className="font-prompt font-normal">ทั้งหมด</span>
        </button>
        <button 
          onClick={() => setActiveTab('FAVORITE')}
          className={`px-5 py-2.5 rounded-2xl font-bold text-sm transition-all duration-300 flex items-center gap-2 ${activeTab === 'FAVORITE' ? 'bg-[#FFD700] text-gray-900 shadow-[0_4px_12px_rgba(255,215,0,0.3)]' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
        >
          <Star size={16} fill={activeTab === 'FAVORITE' ? "currentColor" : "none"} /> <span className="font-prompt font-normal">ที่ถูกใจ</span>
        </button>
      </div>

      {error && <div className="p-4 mb-8 text-[14px] text-red-500 bg-red-500/10 rounded-2xl border border-red-500/20 text-center font-prompt font-normal">เชื่อมต่อเซิร์ฟเวอร์ล้มเหลว</div>}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="animate-spin text-blue-500" size={32} />
          <span className="text-sm opacity-60 font-prompt font-normal" style={{ color: textMain }}>กำลังเตรียมคลังเรื่องสั้น...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {(() => {
            const displayStories = activeTab === 'FAVORITE' 
              ? stories.filter(story => favoriteIds.includes(story.id))
              : stories;

            if (displayStories.length === 0) {
              return (
                <div className="col-span-full text-center py-16 rounded-[2rem] border border-dashed border-gray-200" style={{ background: bg }}>
                  {activeTab === 'FAVORITE' ? (
                    <Star size={40} className="mx-auto mb-3 opacity-30" style={{ color: textMain }} />
                  ) : (
                    <BookOpen size={40} className="mx-auto mb-3 opacity-30" style={{ color: textMain }} />
                  )}
                  <p className="text-sm opacity-50 font-prompt font-normal" style={{ color: textMain }}>
                    {activeTab === 'FAVORITE' ? 'คุณยังไม่ได้กดถูกใจเรื่องสั้นใดเลย' : 'ยังไม่มีเรื่องสั้นในระบบขณะนี้'}
                  </p>
                </div>
              );
            }

            return displayStories.map((story) => {
              const isLocked = false;
              const isFav = favoriteIds.includes(story.id);
              
              return (
                <div 
                  key={story.id} 
                  className="bg-white rounded-[2rem] border border-gray-100 overflow-hidden flex flex-col relative group transition-all duration-300 hover:-translate-y-1"
                  style={{ boxShadow: shadowOuter }}
                >
                  {/* รูปภาพหน้าปกครึ่งบน */}
                  <div className="h-[180px] w-full bg-gray-100 relative overflow-hidden">
                    {story.image_url ? (
                      <img src={story.image_url} alt={story.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-50">
                        <BookOpen size={36} className="text-gray-300" />
                      </div>
                    )}
                    {story.is_premium === 1 && (
                      <span className="absolute top-4 right-4 bg-purple-600 text-white text-[9px] font-black px-2.5 py-1 rounded-full tracking-widest shadow-md z-10">PREMIUM</span>
                    )}
                    {isFav && (
                       <span className="absolute top-4 left-4 bg-white/80 backdrop-blur-sm text-[#FFD700] p-1.5 rounded-full shadow-sm z-10">
                          <Star size={16} fill="currentColor" />
                       </span>
                    )}
                  </div>

                  {/* รายละเอียดเรื่องสั้นครึ่งล่าง */}
                  <div className="p-6 flex flex-col flex-grow bg-white">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 line-clamp-1">{story.title}</h3>
                    
                    <div className="mt-auto flex items-center justify-between">
                      {isLocked ? (
                        <div className="flex items-center gap-2 text-purple-600 text-xs bg-purple-50 px-3 py-2 rounded-xl">
                          <Lock size={14} />
                          <span className="font-prompt font-normal">เฉพาะสมาชิก Premium</span>
                        </div>
                      ) : (
                        <span className="text-xs text-emerald-600 bg-emerald-50 px-3 py-2 rounded-xl font-prompt font-normal">พร้อมอ่าน</span>
                      )}

                      {isLocked ? (
                        <Link to="/subscription" className="flex items-center gap-1 text-xs text-gray-400 hover:text-purple-600 transition-colors">
                          <span className="font-prompt font-normal">ปลดล็อก</span>
                          <ChevronRight size={14} />
                        </Link>
                      ) : (
                        <Link to={`/storydiary/play?id=${story.id}`} className="flex items-center gap-1 text-xs text-blue-600 hover:gap-2 transition-all">
                          <span className="font-prompt font-normal">เริ่มอ่านเรื่องสั้น</span>
                          <ChevronRight size={14} />
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            });
          })()}
        </div>
      )}
    </div>
  );
}