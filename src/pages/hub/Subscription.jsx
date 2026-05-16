import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Check, Plus, X, RefreshCw, Loader2 } from 'lucide-react';

export default function Subscription() {
  const contextVals = useOutletContext();
  const { currentUser: user, handleRefreshUser, ...themeVals } = contextVals;
  const [qrLoading, setQrLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [qrData, setQrData] = useState(null);

  const { bg, textMain, shadowPlateau, shadowOuter, shadowDeepInset } = themeVals;

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('th-TH', { year: '2-digit', month: '2-digit', day: '2-digit' });
  };

  const handleCreatePayment = async (tier, amount) => {
    if (!user?.id) {
      setError('กรุณาเข้าสู่ระบบก่อนทำการเลือกแพ็กเกจ');
      return;
    }
    setQrLoading(true); setError('');
    try {
      const res = await fetch('/api/payment/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, amount, planTier: tier })
      });
      const data = await res.json();
      if (data.status === 'success') {
        setQrData({ image: data.qrImage, amount, tier });
      } else {
        setError(data.message || 'สร้างรายการชำrateเงินไม่สำเร็จ');
      }
    } catch (err) {
      setError('เชื่อมต่อระบบชำระเงินล้มเหลว');
    } finally {
      setQrLoading(false);
    }
  };

  const handleCheckStatus = async () => {
    if (!user?.id) return;
    setQrLoading(true);
    const isSuccess = await handleRefreshUser();
    if (isSuccess) {
      setQrData(null);
      setSuccess('อัปเดตสถานะสมาชิกเรียบร้อยแล้ว!');
      setTimeout(() => setSuccess(''), 3000);
    }
    setQrLoading(false);
  };

  return (
    <div className="w-full max-w-5xl mx-auto animate-in fade-in duration-300">
      
      {/* QR Code Pop-up Overlay */}
      {qrData && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-sm rounded-[2rem] p-8 flex flex-col items-center text-center relative border border-white/20 shadow-2xl" style={{ background: bg }}>
            <button onClick={() => setQrData(null)} className="absolute top-5 right-5 w-8 h-8 rounded-full flex items-center justify-center bg-black/5 active:scale-95 transition-all" style={{ color: textMain }}>
              <X size={16} />
            </button>
            <h3 className="text-xl font-bold mb-1" style={{ color: textMain }}>ชำระเงินผ่าน PromptPay</h3>
            <p className="text-[13px] font-medium opacity-60 mb-6 uppercase tracking-widest" style={{ color: textMain }}>แพ็กเกจ {qrData.tier}</p>
            
            <div className="w-48 h-48 bg-white p-2 rounded-xl mb-6 shadow-md border border-gray-200">
              <img src={qrData.image} alt="PromptPay QR" className="w-full h-full object-contain" />
            </div>

            <div className="text-[14px] opacity-80 mb-1" style={{ color: textMain }}>ยอดที่ต้องชำระ</div>
            <div className="text-3xl font-black mb-8 text-[#3b82f6]">฿{qrData.amount}</div>

            <button onClick={handleCheckStatus} className="w-full py-4 rounded-xl font-bold text-[14px] text-white shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all" style={{ background: '#10b981' }}>
              <RefreshCw size={16} /> ตรวจสอบการชำระเงิน
            </button>
          </div>
        </div>
      )}

      {/* Header สถานะปัจจุบัน */}
      <div className="p-6 rounded-[2rem] border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-6 mb-12" style={{ background: bg, boxShadow: shadowDeepInset }}>
        <div>
          <span className="text-[12px] font-bold uppercase tracking-wider opacity-60 block mb-1" style={{ color: textMain }}>สิทธิ์การใช้งานของคุณ</span>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-black uppercase" style={{ color: textMain }}>{user?.plan_tier || 'COMMON'}</h2>
            {user?.plan_tier && user.plan_tier !== 'common' && <span className="bg-emerald-500 text-white text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">Active</span>}
          </div>
        </div>
        <div className="text-left sm:text-right">
          <span className="text-[12px] font-bold uppercase tracking-wider opacity-60 block mb-1" style={{ color: textMain }}>วันหมดอายุสมาชิก</span>
          <span className="text-lg font-bold" style={{ color: textMain }}>{user?.plan_expire_at ? formatDate(user.plan_expire_at) : 'ไม่มีวันหมดอายุ (ใช้งานฟรี)'}</span>
        </div>
      </div>

      {error && <div className="p-4 mb-8 text-[14px] text-red-500 bg-red-500/10 rounded-2xl border border-red-500/20 text-center font-bold">{error}</div>}
      {success && <div className="p-4 mb-8 text-[14px] text-emerald-500 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 text-center font-bold">{success}</div>}

      {/* Grid Layout สไตล์ทูโทนคล้ายตัวอย่าง */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* STANDARD CARD */}
        <div className="bg-white rounded-[2rem] border border-gray-100 overflow-hidden flex flex-col" style={{ boxShadow: shadowOuter }}>
          <div className="p-8 bg-gray-50/50 border-b border-gray-100 flex flex-col items-center text-center">
            <span className="text-xs font-black tracking-widest text-emerald-500 bg-emerald-50 px-3 py-1 rounded-full mb-4">STANDARD</span>
            <div className="flex items-baseline gap-1 mb-1">
              <span className="text-xs opacity-40 line-through font-bold">฿99</span>
              <span className="text-4xl font-black text-gray-800">฿69</span>
              <span className="text-xs opacity-50 font-bold">/เดือน</span>
            </div>
            <p className="text-[11px] text-emerald-600 font-bold mb-6">คุ้มค่าเริ่มต้นใช้งาน 30 วัน</p>
            <button disabled={qrLoading} onClick={() => handleCreatePayment('standard', 69)} className="w-full py-3.5 bg-gray-900 text-white rounded-xl text-xs font-bold transition-all active:scale-[0.98] disabled:opacity-50">Upgrade</button>
          </div>
          <div className="p-8 flex-1 bg-white">
            <ul className="space-y-4 text-[13px] font-medium text-gray-600">
              <li className="flex gap-2.5 items-start"><Check size={16} className="text-emerald-500 shrink-0 mt-0.5" /> <span>FLASHCARD 500 VOCAB</span></li>
              <li className="flex gap-2.5 items-start"><Check size={16} className="text-emerald-500 shrink-0 mt-0.5" /> <span>ULTRASPEEDREAD 1 บทความ<br/><span className="text-xs opacity-60">(เพิ่มเองได้ 3 บทความ)</span></span></li>
              <li className="flex gap-2.5 items-start"><Check size={16} className="text-emerald-500 shrink-0 mt-0.5" /> <span>STORYDIARY 5 เรื่อง</span></li>
              <li className="flex gap-2.5 items-start"><Check size={16} className="text-emerald-500 shrink-0 mt-0.5" /> <span>SIMULATOR</span></li>
              <li className="pt-2 text-xs font-bold text-gray-400 uppercase tracking-wider">ฟังก์ชันในอนาคต</li>
              <li className="flex gap-2.5 items-start text-gray-400"><Plus size={16} className="shrink-0 mt-0.5" /> <span>Spaced Repetition</span></li>
              <li className="flex gap-2.5 items-start text-gray-400"><Plus size={16} className="shrink-0 mt-0.5" /> <span>เครื่องมือแนะแนวให้รู้จักตัวเอง</span></li>
              <li className="flex gap-2.5 items-start text-gray-400"><Plus size={16} className="shrink-0 mt-0.5" /> <span>Gamification ในโหมดต่างๆ</span></li>
            </ul>
          </div>
        </div>

        {/* PRO CARD */}
        <div className="bg-white rounded-[2rem] border-2 border-blue-500 overflow-hidden flex flex-col relative" style={{ boxShadow: shadowOuter }}>
          <div className="absolute top-4 right-4 bg-blue-500 text-white text-[9px] font-black px-2.5 py-1 rounded-full tracking-widest">POPULAR</div>
          <div className="p-8 bg-blue-50/20 border-b border-gray-100 flex flex-col items-center text-center">
            <span className="text-xs font-black tracking-widest text-blue-600 bg-blue-50 px-3 py-1 rounded-full mb-4">PRO MEMBERSHIP</span>
            <div className="flex items-baseline gap-1 mb-1">
              <span className="text-xs opacity-40 line-through font-bold">฿399</span>
              <span className="text-4xl font-black text-gray-800">฿129</span>
              <span className="text-xs opacity-50 font-bold">/3 เดือน</span>
            </div>
            <p className="text-[11px] text-blue-600 font-bold mb-6">เฉลี่ยตกเพียงเดือนละ 43 บาท</p>
            <button disabled={qrLoading} onClick={() => handleCreatePayment('pro', 129)} className="w-full py-3.5 bg-blue-600 text-white rounded-xl text-xs font-bold transition-all active:scale-[0.98] disabled:opacity-50 shadow-md shadow-blue-500/20">Upgrade</button>
          </div>
          <div className="p-8 flex-1 bg-white">
            <ul className="space-y-4 text-[13px] font-medium text-gray-600">
              <li className="flex gap-2.5 items-start"><Check size={16} className="text-blue-500 shrink-0 mt-0.5" /> <span>FLASHCARD 1,000 VOCAB</span></li>
              <li className="flex gap-2.5 items-start"><Check size={16} className="text-blue-500 shrink-0 mt-0.5" /> <span>ULTRASPEEDREAD 5 บทความ<br/><span className="text-xs opacity-60">(เพิ่มเองได้ 5 บทความ)</span></span></li>
              <li className="flex gap-2.5 items-start"><Check size={16} className="text-blue-500 shrink-0 mt-0.5" /> <span>STORYDIARY 30 เรื่อง</span></li>
              <li className="flex gap-2.5 items-start"><Check size={16} className="text-blue-500 shrink-0 mt-0.5" /> <span>SIMULATOR หน้าเต็ม</span></li>
              <li className="flex gap-2.5 items-start"><Check size={16} className="text-blue-500 shrink-0 mt-0.5" /> <span>Custom จอ LCD และสี Timer</span></li>
              <li className="flex gap-2.5 items-start"><Check size={16} className="text-blue-500 shrink-0 mt-0.5" /> <span>Custom Exam sequence & Gameboy</span></li>
              <li className="flex gap-2.5 items-start"><Check size={16} className="text-blue-500 shrink-0 mt-0.5" /> <span>ระบบจับเวลาแยกพาร์ท</span></li>
              <li className="pt-2 text-xs font-bold text-gray-400 uppercase tracking-wider">ฟังก์ชันในอนาคต</li>
              <li className="flex gap-2.5 items-start text-gray-400"><Plus size={16} className="shrink-0 mt-0.5" /> <span>เครื่องมือแนะแนวศาสตร์ NLP</span></li>
              <li className="flex gap-2.5 items-start text-gray-400"><Plus size={16} className="shrink-0 mt-0.5" /> <span>ระบบจัดสอบจำลอง Mock Exam</span></li>
            </ul>
          </div>
        </div>

        {/* PREMIUM CARD */}
        <div className="bg-white rounded-[2rem] border border-gray-100 overflow-hidden flex flex-col" style={{ boxShadow: shadowOuter }}>
          <div className="p-8 bg-gray-50/50 border-b border-gray-100 flex flex-col items-center text-center">
            <span className="text-xs font-black tracking-widest text-purple-600 bg-purple-50 px-3 py-1 rounded-full mb-4">PREMIUM</span>
            <div className="flex items-baseline gap-1 mb-1">
              <span className="text-xs opacity-40 line-through font-bold">฿620</span>
              <span className="text-4xl font-black text-gray-800">฿419</span>
              <span className="text-xs opacity-50 font-bold">/12+1 เดือน</span>
            </div>
            <p className="text-[11px] text-purple-600 font-bold mb-6">เฉลี่ยตกเพียงเดือนละ 32 บาท</p>
            <button disabled={qrLoading} onClick={() => handleCreatePayment('premium', 419)} className="w-full py-3.5 bg-gray-900 text-white rounded-xl text-xs font-bold transition-all active:scale-[0.98] disabled:opacity-50">Upgrade</button>
          </div>
          <div className="p-8 flex-1 bg-white">
            <ul className="space-y-4 text-[13px] font-medium text-gray-600">
              <li className="flex gap-2.5 items-start"><Check size={16} className="text-purple-500 shrink-0 mt-0.5" /> <span>FLASHCARD 10,000 VOCAB</span></li>
              <li className="flex gap-2.5 items-start"><Check size={16} className="text-purple-500 shrink-0 mt-0.5" /> <span>ULTRASPEEDREAD 10 บทความ<br/><span className="text-xs opacity-60">(เพิ่มเองได้ 10 บทความ)</span></span></li>
              <li className="flex gap-2.5 items-start"><Check size={16} className="text-purple-500 shrink-0 mt-0.5" /> <span>STORYDIARY 150 เรื่อง</span></li>
              <li className="flex gap-2.5 items-start"><Check size={16} className="text-purple-500 shrink-0 mt-0.5" /> <span>ปลดล็อกฟีเจอร์ของ Pro ทั้งหมด</span></li>
              <li className="pt-2 text-xs font-bold text-gray-400 uppercase tracking-wider">ฟังก์ชันในอนาคต</li>
              <li className="flex gap-2.5 items-start text-gray-400"><Plus size={16} className="shrink-0 mt-0.5" /> <span>Spaced Repetition & NLP Guidance</span></li>
              <li className="flex gap-2.5 items-start text-gray-400"><Plus size={16} className="shrink-0 mt-0.5" /> <span>Mock Exam & Gamification ครบชุด</span></li>
            </ul>
          </div>
        </div>

      </div>
    </div>
  );
}