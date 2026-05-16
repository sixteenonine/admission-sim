import React, { useState, useEffect } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { BookOpen, Lock, ChevronRight, Loader2 } from 'lucide-react';

export default function StoryLobby() {
  const contextVals = useOutletContext();
  const { currentUser: user, ...themeVals } = contextVals;
  const { bg, textMain, shadowOuter, shadowPlateau, shadowDeepInset } = themeVals;

  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchStories() {
      try {
        const res = await fetch('/api/stories/list');
        const data = await res.json();
        if (data.status === 'success') {
          setStories(data.stories);
        } else {
          setError('ไม่สามารถโหลดรายการเรื่องสั้นได้');
        }
      } catch (err) {
        setError('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
      } finally {
        setLoading(false);
      }
    }
    fetchStories();
  }, []);

  return (
    <div className="w-full max-w-5xl mx-auto animate-in fade-in duration-300">
      
      {/* Header ของหน้า Lobby */}
      <div className="mb-10 px-2">
        <h2 className="text-3xl font-black mb-2" style={{ color: textMain }}>StoryDiary</h2>
        <p className="text-sm opacity-60 font-medium" style={{ color: textMain }}>ฝึกอ่านเรื่องสั้นระดับพรีเมียมและสะสมคลังคำศัพท์ประจำวัน</p>
      </div>

      {error && <div className="p-4 mb-8 text-[14px] text-red-500 bg-red-500/10 rounded-2xl border border-red-500/20 text-center font-bold">{error}</div>}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="animate-spin text-blue-500" size={32} />
          <span className="text-sm font-medium opacity-60" style={{ color: textMain }}>กำลังเตรียมคลังเรื่องสั้น...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {stories.length === 0 ? (
            <div className="col-span-full text-center py-16 rounded-[2rem] border border-dashed border-gray-200" style={{ background: bg }}>
              <BookOpen size={40} className="mx-auto mb-3 opacity-30" style={{ color: textMain }} />
              <p className="text-sm font-bold opacity-50" style={{ color: textMain }}>ยังไม่มีเรื่องสั้นในระบบขณะนี้</p>
            </div>
          ) : (
            stories.map((story) => {
              const isLocked = story.is_premium === 1 && user?.plan_tier !== 'pro' && user?.plan_tier !== 'premium';
              
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
                      <span className="absolute top-4 right-4 bg-purple-600 text-white text-[9px] font-black px-2.5 py-1 rounded-full tracking-widest shadow-md">PREMIUM</span>
                    )}
                  </div>

                  {/* รายละเอียดเรื่องสั้นครึ่งล่าง */}
                  <div className="p-6 flex flex-col flex-grow bg-white">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 line-clamp-1">{story.title}</h3>
                    
                    <div className="mt-auto flex items-center justify-between">
                      {isLocked ? (
                        <div className="flex items-center gap-2 text-purple-600 font-bold text-xs bg-purple-50 px-3 py-2 rounded-xl">
                          <Lock size={14} />
                          <span>เฉพาะสมาชิก Premium</span>
                        </div>
                      ) : (
                        <span className="text-xs text-emerald-600 bg-emerald-50 px-3 py-2 rounded-xl font-bold">พร้อมอ่าน</span>
                      )}

                      {isLocked ? (
                        <Link to="/subscription" className="flex items-center gap-1 text-xs font-bold text-gray-400 hover:text-purple-600 transition-colors">
                          <span>ปลดล็อก</span>
                          <ChevronRight size={14} />
                        </Link>
                      ) : (
                        <Link to={`/storydiary/play?id=${story.id}`} className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:gap-2 transition-all">
                          <span>เริ่มอ่านเรื่องสั้น</span>
                          <ChevronRight size={14} />
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}