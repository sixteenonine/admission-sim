import React, { useState, useEffect } from 'react';
import { useOutletContext, useNavigate, Link } from 'react-router-dom';
import { Plus, Edit3, Trash2, X, BookOpen, User, ChevronRight, Lock } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';

export default function SpeedReadLobby() {
  const themeVals = useOutletContext();
  const { bg, textMain, shadowOuter } = themeVals;
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const isDark = textMain === '#ffffff' || textMain === '#FFFFFF';
  
  const [activeTab, setActiveTab] = useState('SYSTEM');
  const queryClient = useQueryClient();

  const { data: systemArticles = [] } = useQuery({
    queryKey: ['speedreadSystemList'],
    queryFn: async () => {
      const res = await fetch('/api/stories/list');
      const data = await res.json();
      return data.status === 'success' ? data.stories.filter(s => s.type === 'speedread') : [];
    }
  });

  const { data: customArticles = [] } = useQuery({
    queryKey: ['speedreadCustomList', currentUser?.id],
    queryFn: async () => {
      if (!currentUser?.id) return [];
      const res = await fetch(`/api/user/sync?userId=${currentUser.id}`);
      const data = await res.json();
      if (data.status === 'success' && data.data?.custom_speedreads) {
        return JSON.parse(data.data.custom_speedreads);
      }
      return [];
    },
    enabled: !!currentUser?.id
  });
  
  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ title: '', content: '' });
  const [isLoading, setIsLoading] = useState(false);

  const handleSaveCustom = async () => {
    if (!formData.title.trim() || !formData.content.trim()) return alert("กรุณากรอกชื่อและเนื้อหาให้ครบ");
    if (!currentUser) return alert("กรุณาเข้าสู่ระบบเพื่อบันทึกบทความส่วนตัว");

    setIsLoading(true);
    let newCustoms = [...customArticles];
    
    if (editingId) {
      newCustoms = newCustoms.map(a => a.id === editingId ? { ...a, title: formData.title, content: formData.content } : a);
    } else {
      newCustoms.push({
        id: 'custom-' + Date.now(),
        title: formData.title,
        content: formData.content,
        created_at: new Date().toISOString()
      });
    }

    try {
      const res = await fetch('/api/user/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ custom_speedreads: newCustoms })
      });
      const data = await res.json();
      if (data.status === 'success') {
        queryClient.setQueryData(['speedreadCustomList', currentUser?.id], newCustoms);
        closeModal();
      }
    } catch (err) {
      alert("บันทึกข้อมูลล้มเหลว");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCustom = async (e, id) => {
    e.stopPropagation();
    if (!confirm("ลบบทความนี้ใช่หรือไม่?")) return;
    
    const newCustoms = customArticles.filter(a => a.id !== id);
    queryClient.setQueryData(['speedreadCustomList', currentUser?.id], newCustoms); // อัปเดต UI ทันทีเพื่อความลื่นไหล
    
    try {
      await fetch('/api/user/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ custom_speedreads: newCustoms })
      });
    } catch (err) {
      console.error("ลบข้อมูลล้มเหลว");
    }
  };

  const openEditModal = (e, article) => {
    e.stopPropagation();
    setEditingId(article.id);
    setFormData({ title: article.title, content: article.content });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData({ title: '', content: '' });
  };

  const handlePlay = (article, isSystem = true) => {
    navigate(`/speedread/play?id=${article.id}&source=${isSystem ? 'system' : 'custom'}`);
  };

  return (
    <div className="w-full max-w-5xl mx-auto animate-in fade-in duration-300">
      
      <div className="mb-10 px-2">
        <h2 className="text-3xl font-black mb-2" style={{ color: textMain }}>Ultra Speed Read</h2>
        <p className="text-sm opacity-60 font-prompt font-normal" style={{ color: textMain }}>ฝึกฝนทักษะการอ่านเร็วและทดสอบความเข้าใจ</p>
      </div>

      <div className="flex gap-3 mb-6 px-2">
        <button 
          onClick={() => setActiveTab('SYSTEM')}
          className={`px-5 py-2.5 rounded-2xl font-bold text-sm transition-all duration-300 flex items-center gap-2 ${activeTab === 'SYSTEM' ? 'bg-blue-600 text-white shadow-[0_4px_12px_rgba(37,99,235,0.3)]' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
        >
          <BookOpen size={16} /> <span className="font-prompt font-normal">บทความระบบ</span>
        </button>
        <button 
          onClick={() => setActiveTab('CUSTOM')}
          className={`px-5 py-2.5 rounded-2xl font-bold text-sm transition-all duration-300 flex items-center gap-2 ${activeTab === 'CUSTOM' ? 'bg-[#FF9500] text-white shadow-[0_4px_12px_rgba(255,149,0,0.3)]' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
        >
          <User size={16} /> <span className="font-prompt font-normal">บทความส่วนตัว</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {(() => {
          if (activeTab === 'SYSTEM') {
            if (systemArticles.length === 0) {
              return (
                <div className="col-span-full text-center py-16 rounded-[2rem] border border-dashed border-gray-200" style={{ background: bg }}>
                  <BookOpen size={40} className="mx-auto mb-3 opacity-30" style={{ color: textMain }} />
                  <p className="text-sm opacity-50 font-prompt font-normal" style={{ color: textMain }}>ยังไม่มีบทความในระบบ</p>
                </div>
              );
            }
            return systemArticles.map(art => {
              const isLocked = art.is_premium === 1 && currentUser?.plan_tier !== 'pro' && currentUser?.plan_tier !== 'premium';
              return (
                <div 
                  key={art.id} 
                  className="bg-white rounded-[2rem] border border-gray-100 overflow-hidden flex flex-col relative group transition-all duration-300 hover:-translate-y-1 cursor-pointer"
                  style={{ boxShadow: shadowOuter }}
                  onClick={() => !isLocked && handlePlay(art, true)}
                >
                  <div className="h-[180px] w-full bg-blue-50 relative overflow-hidden flex items-center justify-center text-blue-300 transition-colors group-hover:bg-blue-100">
                    <BookOpen size={48} className="transition-transform duration-500 group-hover:scale-110" />
                    {art.is_premium === 1 && (
                      <span className="absolute top-4 right-4 bg-purple-600 text-white text-[9px] font-black px-2.5 py-1 rounded-full tracking-widest shadow-md z-10">PRO</span>
                    )}
                  </div>
                  <div className="p-6 flex flex-col flex-grow bg-white">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 line-clamp-2">{art.title}</h3>
                    <div className="mt-auto flex items-center justify-between">
                      {isLocked ? (
                        <div className="flex items-center gap-2 text-purple-600 text-xs bg-purple-50 px-3 py-2 rounded-xl">
                          <Lock size={14} />
                          <span className="font-prompt font-normal">เฉพาะสมาชิก</span>
                        </div>
                      ) : (
                        <span className="text-xs text-emerald-600 bg-emerald-50 px-3 py-2 rounded-xl font-prompt font-normal">พร้อมอ่าน</span>
                      )}
                      
                      {isLocked ? (
                        <Link to="/subscription" onClick={e => e.stopPropagation()} className="flex items-center gap-1 text-xs text-gray-400 hover:text-purple-600 transition-colors">
                          <span className="font-prompt font-normal">ปลดล็อก</span>
                          <ChevronRight size={14} />
                        </Link>
                      ) : (
                        <div className="flex items-center gap-1 text-xs text-blue-600 hover:gap-2 transition-all font-prompt font-normal">
                          <span>เริ่มอ่าน</span>
                          <ChevronRight size={14} />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            });
          } else {
            if (!currentUser) {
              return (
                <div className="col-span-full text-center py-16 rounded-[2rem] border border-dashed border-gray-200" style={{ background: bg }}>
                  <User size={40} className="mx-auto mb-3 opacity-30" style={{ color: textMain }} />
                  <p className="text-sm opacity-50 font-prompt font-normal" style={{ color: textMain }}>กรุณาเข้าสู่ระบบเพื่อเพิ่มบทความ</p>
                </div>
              );
            }
            if (customArticles.length === 0) {
              return (
                <div className="col-span-full text-center py-16 rounded-[2rem] border border-dashed border-gray-200" style={{ background: bg }}>
                  <User size={40} className="mx-auto mb-3 opacity-30" style={{ color: textMain }} />
                  <p className="text-sm opacity-50 font-prompt font-normal" style={{ color: textMain }}>คุณยังไม่ได้เพิ่มบทความส่วนตัว</p>
                </div>
              );
            }
            return customArticles.map(art => (
              <div 
                key={art.id} 
                className="bg-white rounded-[2rem] border border-gray-100 overflow-hidden flex flex-col relative group transition-all duration-300 hover:-translate-y-1 cursor-pointer"
                style={{ boxShadow: shadowOuter }}
                onClick={() => handlePlay(art, false)}
              >
                <div className="h-[180px] w-full bg-orange-50 relative overflow-hidden flex items-center justify-center text-orange-300 transition-colors group-hover:bg-orange-100">
                  <User size={48} className="transition-transform duration-500 group-hover:scale-110" />
                  <div className="absolute top-4 right-4 flex gap-2 z-10">
                    <button onClick={(e) => { e.stopPropagation(); openEditModal(e, art); }} className="p-2 bg-white/80 hover:bg-white text-blue-500 rounded-full shadow-sm backdrop-blur-sm transition-colors"><Edit3 size={14}/></button>
                    <button onClick={(e) => { e.stopPropagation(); handleDeleteCustom(e, art.id); }} className="p-2 bg-white/80 hover:bg-white text-red-500 rounded-full shadow-sm backdrop-blur-sm transition-colors"><Trash2 size={14}/></button>
                  </div>
                </div>
                <div className="p-6 flex flex-col flex-grow bg-white">
                  <h3 className="text-lg font-bold text-gray-800 mb-4 line-clamp-2">{art.title}</h3>
                  <div className="mt-auto flex items-center justify-between">
                    <span className="text-xs text-orange-600 bg-orange-50 px-3 py-2 rounded-xl font-prompt font-normal">บทความส่วนตัว</span>
                    <div className="flex items-center gap-1 text-xs text-blue-600 hover:gap-2 transition-all font-prompt font-normal">
                      <span>เริ่มอ่าน</span>
                      <ChevronRight size={14} />
                    </div>
                  </div>
                </div>
              </div>
            ));
          }
        })()}
      </div>

      {currentUser && activeTab === 'CUSTOM' && (
        <button 
          onClick={() => setShowModal(true)}
          className="fixed bottom-10 right-6 md:right-10 w-14 h-14 rounded-full flex items-center justify-center text-white shadow-lg active:scale-90 transition-transform z-30" 
          style={{ background: '#FF9500' }}
        >
          <Plus size={30} />
        </button>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-transparent backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-[400px] bg-white rounded-[32px] overflow-hidden shadow-2xl flex flex-col transform transition-all">
            <div className="px-6 py-4 flex items-center justify-between border-b border-gray-100">
              <span className="font-black text-gray-800 tracking-wide">{editingId ? 'EDIT ARTICLE' : 'ADD NEW ARTICLE'}</span>
              <button onClick={closeModal} className="p-2 bg-gray-100 text-gray-500 rounded-full active:scale-90"><X size={18}/></button>
            </div>
            <div className="p-6 flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Title</label>
                <input 
                  value={formData.title} 
                  onChange={e => setFormData({...formData, title: e.target.value})}
                  className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-prompt font-normal text-gray-700 transition-all"
                  placeholder="ตั้งชื่อบทความของคุณ..."
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Content Text</label>
                <textarea 
                  value={formData.content} 
                  onChange={e => setFormData({...formData, content: e.target.value})}
                  className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-prompt font-normal text-gray-700 min-h-[160px] resize-none transition-all"
                  placeholder="วางเนื้อหาบทความภาษาอังกฤษที่นี่..."
                />
              </div>
              <button 
                onClick={handleSaveCustom}
                disabled={isLoading}
                className="w-full mt-2 py-4 rounded-2xl font-black text-white shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                style={{ background: '#FF9500', opacity: isLoading ? 0.7 : 1 }}
              >
                <span className="font-prompt font-normal">{isLoading ? 'กำลังบันทึก...' : (editingId ? 'อัปเดตบทความ' : 'บันทึกลงคลังส่วนตัว')}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}