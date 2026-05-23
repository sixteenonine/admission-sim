import React, { useState, useEffect } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { ChevronLeft, Plus, Edit3, Trash2, X, BookOpen, User } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export default function SpeedReadLobby() {
  const themeVals = useOutletContext();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const isDark = themeVals.textMain === '#ffffff' || themeVals.textMain === '#FFFFFF';
  
  const [systemArticles, setSystemArticles] = useState([]);
  const [customArticles, setCustomArticles] = useState([]);
  
  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ title: '', content: '' });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchSystemArticles();
    if (currentUser) {
      fetchCustomArticles();
    }
  }, [currentUser]);

  const fetchSystemArticles = async () => {
    try {
      const res = await fetch('/api/stories/list');
      const data = await res.json();
      if (data.status === 'success') {
        // กรองเอาเฉพาะหมวด speedread
        setSystemArticles(data.stories.filter(s => s.type === 'speedread'));
      }
    } catch (err) {
      console.error("โหลดบทความระบบล้มเหลว");
    }
  };

  const fetchCustomArticles = async () => {
    try {
      const res = await fetch('/api/user/sync');
      const data = await res.json();
      if (data.status === 'success' && data.data?.custom_speedreads) {
        setCustomArticles(JSON.parse(data.data.custom_speedreads));
      }
    } catch (err) {
      console.error("โหลดบทความส่วนตัวล้มเหลว");
    }
  };

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
        setCustomArticles(newCustoms);
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
    setCustomArticles(newCustoms); // อัปเดต UI ทันทีเพื่อความลื่นไหล
    
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
    navigate('/speedread/play', { 
      state: { 
        id: article.id, 
        title: article.title, 
        content: article.content || null, 
        isSystem 
      } 
    });
  };

  return (
    <div className="flex flex-col items-center w-full max-w-[500px] mx-auto animate-in fade-in duration-300 px-4 pb-24 relative">
      {/* Header */}
      <div className="w-full flex items-center justify-between mb-8 mt-2">
        <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center rounded-full" style={{ background: isDark ? '#2C2C2E' : '#FFFFFF', border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`, color: '#8E8E93' }}>
          <ChevronLeft size={24} />
        </button>
        <span className="font-bold text-[1.1rem]" style={{ color: themeVals.textMain }}>ULTRA SPEED READ</span>
        <div className="w-10"></div>
      </div>

      <div className="w-full flex flex-col gap-8">
        {/* System Articles Section */}
        <div className="w-full">
          <div className="flex items-center gap-2 mb-4 px-2 opacity-80" style={{ color: themeVals.textMain }}>
            <BookOpen size={16} />
            <h2 className="text-sm font-bold tracking-wider uppercase">System Articles</h2>
          </div>
          <div className="grid grid-cols-1 gap-3 w-full">
            {systemArticles.length === 0 ? (
              <div className="text-center p-4 text-xs font-bold opacity-50" style={{ color: themeVals.textMain }}>ยังไม่มีบทความในระบบ</div>
            ) : (
              systemArticles.map((art) => (
                <div 
                  key={art.id} 
                  onClick={() => handlePlay(art, true)}
                  className="p-5 rounded-2xl cursor-pointer transition-transform active:scale-[0.98] flex items-center justify-between"
                  style={{ background: isDark ? '#1C1C1E' : '#FFFFFF', border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}` }}
                >
                  <div className="font-bold text-base line-clamp-1" style={{ color: themeVals.textMain }}>{art.title}</div>
                  {art.is_premium === 1 && <span className="text-[10px] font-black tracking-widest text-white bg-purple-500 px-2 py-0.5 rounded-full">PRO</span>}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Custom Articles Section */}
        <div className="w-full">
          <div className="flex items-center gap-2 mb-4 px-2 opacity-80" style={{ color: themeVals.textMain }}>
            <User size={16} />
            <h2 className="text-sm font-bold tracking-wider uppercase">My Articles</h2>
          </div>
          {!currentUser ? (
            <div className="text-center p-6 rounded-2xl border-dashed border-2 text-sm font-bold opacity-50" style={{ borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)', color: themeVals.textMain }}>
              กรุณาเข้าสู่ระบบเพื่อเพิ่มบทความของคุณ
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 w-full">
              {customArticles.length === 0 ? (
                <div className="text-center p-4 text-xs font-bold opacity-50" style={{ color: themeVals.textMain }}>คุณยังไม่ได้เพิ่มบทความส่วนตัว</div>
              ) : (
                customArticles.map((art) => (
                  <div 
                    key={art.id} 
                    onClick={() => handlePlay(art, false)}
                    className="p-5 rounded-2xl cursor-pointer transition-transform active:scale-[0.98] flex items-center justify-between group"
                    style={{ background: isDark ? '#1C1C1E' : '#FFFFFF', border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}` }}
                  >
                    <div className="font-bold text-base line-clamp-1 pr-4" style={{ color: themeVals.textMain }}>{art.title}</div>
                    <div className="flex items-center gap-2">
                      <button onClick={(e) => openEditModal(e, art)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-full transition-colors"><Edit3 size={16}/></button>
                      <button onClick={(e) => handleDeleteCustom(e, art.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors"><Trash2 size={16}/></button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Floating Add Button */}
      {currentUser && (
        <button 
          onClick={() => setShowModal(true)}
          className="fixed bottom-10 right-6 md:right-1/2 md:translate-x-[200px] w-14 h-14 rounded-full flex items-center justify-center text-white shadow-lg active:scale-90 transition-transform z-30" 
          style={{ background: '#FF9500' }}
        >
          <Plus size={30} />
        </button>
      )}

      {/* Add/Edit Modal */}
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
                  className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-bold text-gray-700 transition-all"
                  placeholder="ตั้งชื่อบทความของคุณ..."
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Content Text</label>
                <textarea 
                  value={formData.content} 
                  onChange={e => setFormData({...formData, content: e.target.value})}
                  className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-medium text-gray-700 min-h-[160px] resize-none transition-all"
                  placeholder="วางเนื้อหาบทความภาษาอังกฤษที่นี่..."
                />
              </div>
              <button 
                onClick={handleSaveCustom}
                disabled={isLoading}
                className="w-full mt-2 py-4 rounded-2xl font-black text-white shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                style={{ background: '#FF9500', opacity: isLoading ? 0.7 : 1 }}
              >
                {isLoading ? 'SAVING...' : (editingId ? 'UPDATE ARTICLE' : 'SAVE TO MY LIST')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}