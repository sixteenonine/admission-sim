import React, { useState, useEffect, useRef, useMemo, useCallback, memo } from 'react';
import { Play, Pause, Volume2, VolumeX, RefreshCcw, ChevronDown, Sun, Moon, Asterisk, ChevronUp, ChevronLeft, ChevronRight, GripVertical, X, Plus, Trash2, Edit, Gamepad2, ArrowLeft, FastForward, Award, Tag, MessageSquare, Clock, History, CalendarDays, CheckCircle, TrendingUp, Activity, BookOpen, AlertTriangle, TrendingDown } from 'lucide-react';
import useExamAudio from './hooks/useExamAudio';

// --- Constants & Helpers ---
const MODES = {
  full: { label: 'ALL PARTS (90m)', time: 90 * 60, partPrefix: 'all' },
  part1: { label: 'LISTENING (14m)', time: 14 * 60, partPrefix: 'I. Listening & Speaking' },
  part2: { label: 'READING (46m)', time: 46 * 60, partPrefix: 'II. Reading Skill' },
  part3: { label: 'WRITING (25m)', time: 25 * 60, partPrefix: 'III. Writing Skill' }
};

const RECOMMENDED_SEQUENCE = [
  { id: '1', part: 'I. Listening & Speaking', label: 'Short Conversation', difficulty: 'medium' },
  { id: '2', part: 'I. Listening & Speaking', label: 'Long Conversation', difficulty: 'medium' },
  { id: '3', part: 'II. Reading Skill', label: 'Advertisement', difficulty: 'easy' },
  { id: '6', part: 'II. Reading Skill', label: 'Visual (Graph/Chart)', difficulty: 'easy' },
  { id: '8', part: 'III. Writing Skill', label: 'Text Completion', difficulty: 'medium' },
  { id: '4', part: 'II. Reading Skill', label: 'Product/Service Review', difficulty: 'medium' },
  { id: '5', part: 'II. Reading Skill', label: 'News Report', difficulty: 'medium' },
  { id: '7', part: 'II. Reading Skill', label: 'General Articles', difficulty: 'hard' },
  { id: '9', part: 'III. Writing Skill', label: 'Paragraph Organization', difficulty: 'medium' },
];

const EXAM_PARTS = [
  {
    id: 'listening', label: 'Listening & Speaking', max: 20,
    subs: [
      { id: 's1', label: 'Short Conversation', max: 12, range: 'ข้อ 1 - 12' },
      { id: 's2', label: 'Long Conversation', max: 8, range: 'ข้อ 13 - 20' }
    ]
  },
  {
    id: 'reading', label: 'Reading Skill', max: 40,
    subs: [
      { id: 's3', label: 'Advertisement', max: 6, range: 'ข้อ 21 - 26' },
      { id: 's4', label: 'Product/Service Review', max: 6, range: 'ข้อ 27 - 32' },
      { id: 's5', label: 'News Report', max: 6, range: 'ข้อ 33 - 38' },
      { id: 's6', label: 'Visual (Graph/Chart)', max: 6, range: 'ข้อ 39 - 44' },
      { id: 's7', label: 'General Articles', max: 16, range: 'ข้อ 45 - 60' }
    ]
  },
  {
    id: 'writing', label: 'Writing Skill', max: 20,
    subs: [
      { id: 's8', label: 'Text Completion', max: 15, range: 'ข้อ 61 - 75' },
      { id: 's9', label: 'Paragraph Organization', max: 5, range: 'ข้อ 76 - 80' }
    ]
  }
];

const FLAT_EXAM_SUBS = EXAM_PARTS.flatMap(main => 
  main.subs.map(sub => ({ ...sub, mainLabel: main.label }))
);

const TECHNIQUE_GUIDES = {
  s1: {
    title: 'Short Conversation',
    tips: [
      'เน้นฟังหรืออ่านให้ออกว่า ใครคุยกับใคร ที่ไหน (Who, Where) เพื่อจับบริบท',
      'ระวัง Idioms (สำนวน) ช้อยส์ที่แปลตรงตัวเป๊ะๆ มักจะเป็นข้อหลอก',
      'คำตอบมักจะซ่อนอยู่ในประโยคตอบกลับ (ประโยคที่ 2) ของบทสนทนา'
    ]
  },
  s2: {
    title: 'Long Conversation',
    tips: [
      'กวาดสายตาอ่านคำถามและช้อยส์ล่วงหน้า (Skimming) เพื่อจับทางว่าเขาจะคุยเรื่องอะไร',
      'จับน้ำเสียง (Tone) และอารมณ์ของคนพูด ว่ากังวล ยินดี หรือกำลังมีปัญหา',
      'ข้อควรรู้: บทสนทนายาวมักจะเริ่มจากการทักทาย -> บอกปัญหา -> เสนอทางแก้ปัญหา'
    ]
  },
  s3: {
    title: 'Advertisement',
    tips: [
      'ห้ามอ่านทุกบรรทัด! ใช้เทคนิค Scanning หาเฉพาะสิ่งที่โจทย์ถาม (ราคา, วันที่, สถานที่)',
      'ระวังคำดอกจัน (*) หรือเงื่อนไขตัวเล็กจิ๋ว (Terms and Conditions) มักเป็นจุดหลอก',
      'โฆษณามักเล่นคำชวนเชื่อ ให้แยกให้ออกว่าอันไหนคือ Fact อันไหนคือการโฆษณาเกินจริง'
    ]
  },
  s4: {
    title: 'Product/Service Review',
    tips: [
      'หา Tone ของรีวิวให้เจอตั้งแต่ประโยคแรก ว่าเป็น Positive (บวก) หรือ Negative (ลบ)',
      'สังเกตคำคุณศัพท์ (Adjectives) ที่ผู้เขียนใช้บรรยายความรู้สึกต่อสินค้า',
      'จับประเด็นให้ได้ว่าผู้เขียน "แนะนำ" (Recommend) ให้ซื้อต่อหรือไม่'
    ]
  },
  s5: {
    title: 'News Report',
    tips: [
      'ใจความสำคัญ (Main Idea) จะอยู่ที่ย่อหน้าแรกเสมอ (Lead Paragraph) ให้อ่านจุดนี้ให้เคลียร์',
      'ใช้หลัก 5W1H (Who, What, Where, When, Why) ในการไล่ล่าหาคำตอบ',
      'ระวังการใช้คำพ้องความหมาย (Synonyms) ช้อยส์มักจะเปลี่ยนคำจากในเนื้อเรื่องเพื่อวัดคลังศัพท์'
    ]
  },
  s6: {
    title: 'Visual (Graph/Chart)',
    tips: [
      'เริ่มที่การอ่านชื่อกราฟ (Title) และป้ายกำกับแกน X, Y เสมอเพื่อเข้าใจภาพรวม',
      'เช็คหน่วย (Units) ให้ชัวร์ เช่น กราฟบอกเป็นหลักพัน (in thousands) หรือเป็น %',
      'ไฮไลต์คำบรรยายแนวโน้ม (Trends) ในโจทย์ เช่น increase (เพิ่ม), plummet (ตกฮวบ), fluctuate (ผันผวน)'
    ]
  },
  s7: {
    title: 'General Articles',
    tips: [
      'ใช้เทคนิค Skimming อ่านประโยคแรกและประโยคสุดท้ายของแต่ละย่อหน้า เพื่อเก็ท Main Idea ไวๆ',
      'ถ้าเจอศัพท์ที่ไม่รู้ ให้เดาความหมายจากบริบทแวดล้อม (Context Clues) อย่าเพิ่งสติแตก',
      'สังเกต Transition words (คำเชื่อม) เช่น However, Therefore มันคือตัวบอกทิศทางของเรื่อง'
    ]
  },
  s8: {
    title: 'Text Completion',
    tips: [
      'เช็ค Grammar บริเวณรอบๆ ช่องว่าง (หน้าและหลังช่องว่าง) เช่น Tense หรือ Subject-Verb Agreement',
      'ดู Part of Speech ให้ชัวร์ว่าจุดนั้นต้องการ Noun, Verb, Adjective หรือ Adverb',
      'สังเกตคำเชื่อม (and, but, or) เพื่อหาทิศทางของความหมาย (คล้อยตาม หรือ ขัดแย้ง)'
    ]
  },
  s9: {
    title: 'Paragraph Organization',
    tips: [
      'หา "ประโยคเปิด" ให้เจอ (ต้องเป็นประโยคใจความกว้างๆ ไม่มี Pronoun ลอยๆ หรือ Linker นำหน้า)',
      'จับคู่ลำดับเวลา (Time Order) และดูความสอดคล้องของคำเชื่อม (Connectors)',
      'เช็ค Pronoun Reference (เช่น He, This, These factors) ว่ามันกำลังอ้างอิงถึงคำนามในประโยคไหน'
    ]
  }
};

const calculateScores = (scores) => {
  let listening = 0, reading = 0, writing = 0;
  
  const hasInput = Object.keys(scores || {}).some(k => ['s1','s2','s3','s4','s5','s6','s7','s8','s9','part1','part2','part3'].includes(k) && scores[k] !== '');

  listening = (parseInt(scores.s1) || 0) + (parseInt(scores.s2) || 0);
  reading = (parseInt(scores.s3) || 0) + (parseInt(scores.s4) || 0) + (parseInt(scores.s5) || 0) + (parseInt(scores.s6) || 0) + (parseInt(scores.s7) || 0);
  writing = (parseInt(scores.s8) || 0) + (parseInt(scores.s9) || 0);
  
  if (listening === 0 && scores.part1) listening = parseInt(scores.part1) || 0;
  if (reading === 0 && scores.part2) reading = parseInt(scores.part2) || 0;
  if (writing === 0 && scores.part3) writing = parseInt(scores.part3) || 0;

  const totalCorrect = listening + reading + writing;
  return { listening, reading, writing, totalCorrect, finalScore: totalCorrect * 1.25, hasInput };
};

const calculateWinner = (squares) => {
  const lines = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
  ];
  for (let i = 0; i < lines.length; i++) {
    const [a, b, c] = lines[i];
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) return squares[a];
  }
  return null;
};

const rgbToHex = (r, g, b) => '#' + [r, g, b].map(x => {
  const hex = x.toString(16);
  return hex.length === 1 ? '0' + hex : hex;
}).join('');

const getTipColor = (percent) => {
  if (percent <= 40) return '#3b82f6'; 
  if (percent <= 75) { 
    const p = (percent - 40) / 35;
    return rgbToHex(Math.round(59 + p * (249 - 59)), Math.round(130 + p * (115 - 130)), Math.round(246 + p * (22 - 246)));
  }
  const p = (percent - 75) / 25;
  return rgbToHex(Math.round(249 + p * (239 - 249)), Math.round(115 + p * (68 - 115)), Math.round(22 + p * (68 - 22)));
};

const getDifficultyColor = (diff) => {
  if (diff === 'easy') return '#34d399'; 
  if (diff === 'hard') return '#f87171'; 
  return '#60a5fa'; 
};

const PACING_RULES = {
  'Short Conversation': { qCount: 12, mins: 8 },
  'Long Conversation': { qCount: 8, mins: 6 },
  'Advertisement': { qCount: 6, mins: 5 },
  'Product/Service Review': { qCount: 6, mins: 6 },
  'News Report': { qCount: 6, mins: 6 },
  'Visual (Graph/Chart)': { qCount: 6, mins: 5 },
  'General Articles': { qCount: 16, mins: 24 },
  'Text Completion': { qCount: 15, mins: 15 },
  'Paragraph Organization': { qCount: 5, mins: 10 },
};

const calculateProgressState = (timeLeft, totalTime, fullSequence, mode) => {
  const sequence = mode === 'full' 
    ? fullSequence 
    : fullSequence.filter(item => item.part === MODES[mode].partPrefix);

  if (sequence.length === 0) return { part: 'ERROR', subPart: 'No items', qText: '0/0' };

  const totalQInMode = sequence.reduce((sum, item) => sum + (PACING_RULES[item.label]?.qCount || 0), 0);

  if (timeLeft === totalTime) return { part: sequence[0].part, subPart: sequence[0].label, qText: `0/${totalQInMode}` };
  if (timeLeft <= 0) return { part: 'EXAM FINISHED', subPart: 'TIME UP', qText: `${totalQInMode}/${totalQInMode}` };
  
  const elapsedSeconds = Math.round(totalTime - timeLeft);
  let cumulativeSeconds = 0;
  let cumulativeQuestions = 0;

  for (let i = 0; i < sequence.length; i++) {
    const item = sequence[i];
    const rule = PACING_RULES[item.label] || { qCount: 8, mins: 10 }; 
    const ruleSeconds = rule.mins * 60;
    
    if (elapsedSeconds <= cumulativeSeconds + ruleSeconds) {
      const timeInPartSeconds = Math.max(0, elapsedSeconds - cumulativeSeconds);
      const currentQInPart = Math.floor((timeInPartSeconds * rule.qCount) / ruleSeconds);
      const currentGlobalQ = Math.min(totalQInMode, cumulativeQuestions + currentQInPart);
      
      return { part: item.part, subPart: item.label, qText: `${currentGlobalQ}/${totalQInMode}` };
    }
    cumulativeSeconds += ruleSeconds;
    cumulativeQuestions += rule.qCount;
  }
  
  return mode === 'full' 
    ? { part: 'IV. REVIEW & CHECK', subPart: 'Review Answers', qText: `${totalQInMode}/${totalQInMode}` }
    : { part: 'EXAM FINISHED', subPart: 'TIME UP', qText: `${totalQInMode}/${totalQInMode}` };
};

const generateReflectionPoints = (marks, totalTime, examSequence, mode) => {
  return marks.map((percent, index) => {
    const elapsedSeconds = (percent / 100) * totalTime;
    const mins = Math.floor(elapsedSeconds / 60).toString().padStart(2, '0');
    const secs = Math.floor(elapsedSeconds % 60).toString().padStart(2, '0');
    
    const simulatedTimeLeft = totalTime - elapsedSeconds;
    const exactState = calculateProgressState(simulatedTimeLeft, totalTime, examSequence, mode);

    return {
      id: index,
      timestamp: `${mins}:${secs}`,
      partName: exactState.subPart,
      qText: exactState.qText,
      tags: [],
      note: ""
    };
  });
};

// --- MOCK DATA FOR DEMO PURPOSES ---
const makeMockPoints = (count) => Array.from({length: count}).map((_, i) => ({
  id: `mock-pt-${i}`,
  timestamp: `0${Math.floor(i/2) + 1}:${(i*15)%60 === 0 ? '00' : (i*15)%60}`,
  partName: 'I. Listening & Speaking',
  qText: `${i+1}/80`,
  tags: ['#ลังเลศัพท์', '#เดา'],
  note: ''
}));

const MOCK_HISTORY = [
  {
    id: 'mock-5', sessionNumber: 5, date: '15 พ.ค. 2569, 10:00 น.', mode: 'full', totalTime: 5400, finishTime: 4500, // 75 mins
    finalScore: 85, scores: { s1: 10, s2: 7, s3: 6, s4: 6, s5: 5, s6: 6, s7: 12, s8: 12, s9: 4 }, // 68/80
    pointsData: makeMockPoints(3),
  },
  {
    id: 'mock-4', sessionNumber: 4, date: '12 พ.ค. 2569, 14:30 น.', mode: 'full', totalTime: 5400, finishTime: 4920, // 82 mins
    finalScore: 75, scores: { s1: 9, s2: 6, s3: 5, s4: 5, s5: 5, s6: 5, s7: 10, s8: 11, s9: 4 }, // 60/80
    pointsData: makeMockPoints(6),
  },
  {
    id: 'mock-3', sessionNumber: 3, date: '08 พ.ค. 2569, 09:15 น.', mode: 'full', totalTime: 5400, finishTime: 5100, // 85 mins
    finalScore: 62.5, scores: { s1: 8, s2: 5, s3: 4, s4: 5, s5: 4, s6: 5, s7: 8, s8: 8, s9: 3 }, // 50/80
    pointsData: makeMockPoints(10),
  },
  {
    id: 'mock-2', sessionNumber: 2, date: '05 พ.ค. 2569, 16:00 น.', mode: 'full', totalTime: 5400, finishTime: 5280, // 88 mins
    finalScore: 55, scores: { s1: 7, s2: 4, s3: 4, s4: 4, s5: 3, s6: 4, s7: 7, s8: 8, s9: 3 }, // 44/80
    pointsData: makeMockPoints(12),
  },
  {
    id: 'mock-1', sessionNumber: 1, date: '01 พ.ค. 2569, 10:30 น.', mode: 'full', totalTime: 5400, finishTime: null, // 90 mins
    finalScore: 45, scores: { s1: 6, s2: 4, s3: 3, s4: 3, s5: 3, s6: 3, s7: 5, s8: 7, s9: 2 }, // 36/80
    pointsData: makeMockPoints(18),
  }
];

// ==========================================
// COMPONENT: Shared UI Components
// ==========================================
const TopBarWidget = memo(({ cfg, themeVals, isDarkMode, setIsDarkMode, mode, handleModeSelect, isTimerStarted, isRunning }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const { theme, bg, shadowOuter, raisedGradient, shadowPlateau, shadowDeepInset } = themeVals;

  return (
    <div className="absolute top-8 w-full max-w-5xl flex justify-between items-center px-8 z-20">
      <h1 className="text-xl font-bold tracking-[0.2em]" style={{ color: theme.textMain }}>A-LEVEL</h1>
      
      <div className="flex gap-4 items-center">
        <button 
          onClick={() => { if (!isRunning) setIsDarkMode(!isDarkMode); }} 
          disabled={isRunning}
          className={`w-10 h-10 rounded-full flex items-center justify-center transition-all border border-white/10 ${isRunning ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'}`} 
          style={{ boxShadow: shadowOuter, background: raisedGradient, color: theme.textMain }}
        >
          {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
        </button>
        
        <div className="relative">
          {isDropdownOpen && <div className="fixed inset-0 z-40" onClick={() => setIsDropdownOpen(false)}></div>}
          <button 
            onClick={() => { if (!isTimerStarted) setIsDropdownOpen(!isDropdownOpen); }}
            disabled={isTimerStarted}
            className={`flex items-center gap-3 px-5 py-2.5 rounded-[1.25rem] transition-all border border-white/10 ${isTimerStarted ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'}`}
            style={{ boxShadow: shadowOuter, background: raisedGradient, color: theme.textSub }}
          >
            <span className="text-[11px] font-semibold uppercase tracking-wider">{MODES[mode].label}</span>
            <ChevronDown size={14} className={`transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          <div 
            className={`absolute right-0 top-full mt-3 w-[260px] rounded-[1.5rem] p-2.5 border border-white/20 transition-all duration-300 origin-top-right z-50 flex flex-col gap-1
              ${isDropdownOpen ? 'opacity-100 scale-100 pointer-events-auto translate-y-0' : 'opacity-0 scale-95 pointer-events-none -translate-y-2'}`}
            style={{ boxShadow: shadowPlateau, background: raisedGradient }}
          >
            {Object.entries(MODES).map(([key, { label }]) => {
              const isSelected = mode === key;
              return (
                <button key={key} onClick={() => { handleModeSelect(key); setIsDropdownOpen(false); }} className="w-full text-left px-5 py-3.5 text-[13px] font-medium tracking-wide transition-all flex items-center justify-between" style={{ borderRadius: `${cfg.dropRadius}px`, background: isSelected ? bg : 'transparent', boxShadow: isSelected ? shadowDeepInset : 'none', color: isSelected ? theme.textMain : theme.textSub }}>
                  <span>{label}</span>
                  <div className={`w-1.5 h-1.5 rounded-full transition-opacity ${isSelected ? 'bg-blue-400 opacity-100 shadow-[0_0_8px_#60a5fa]' : 'bg-transparent opacity-0'}`} />
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
});

const RightPanelWidget = memo(({ cfg, themeVals, progressState, lcdHue, setLcdHue, trackHue, setTrackHue, isAutoTrackHue, setIsAutoTrackHue, lcdBrightness, setLcdBrightness, lcdScrollSpeed, setLcdScrollSpeed, lcdScrollGap, setLcdScrollGap, addMark, isRunning, timeLeft, totalTime, finishTime, setFinishTime, setTimeLeft }) => {
  const [customLcdText, setCustomLcdText] = useState("CUSTOM");
  const [lcdDisplayMode, setLcdDisplayMode] = useState('exam');
  const [isLcdEditOpen, setIsLcdEditOpen] = useState(false);

  const { bg, theme, shadowPlateau, shadowOuter, raisedGradient, shadowDeepInset, shadowCap, shadowTrench } = themeVals;

  const displayedLcdText = lcdDisplayMode === 'exam' ? progressState.qText : customLcdText;
  
  const lcdText = '#4cfc23';
  const lcdTextGlow = "0 0 5px rgba(76,252,35,0.8), 0 0 15px rgba(76,252,35,0.4)";
  const lcdBg = theme.bg === "#1e2229" ? '#0f2b10' : '#1b3f1c';
  const lcdShadow = "inset 6px 6px 16px rgba(0,0,0,0.9), inset -6px -6px 16px rgba(255,255,255,0.05)";

  const marqueeElements = useMemo(() => {
    if (lcdDisplayMode === 'exam' || displayedLcdText.length <= 5) return null;
    return Array(10).fill(displayedLcdText).map((txt, i) => (
      <span key={i} className="tracking-widest leading-none whitespace-nowrap mt-2" style={{ fontSize: `${cfg.lcdFontSize}px`, fontFamily: "'Share Tech Mono', monospace", color: lcdText, textShadow: lcdTextGlow, marginRight: `${lcdScrollGap}px` }}>{txt}</span>
    ));
  }, [displayedLcdText, lcdDisplayMode, cfg.lcdFontSize, lcdText, lcdTextGlow, lcdScrollGap]);

  return (
    <div className="w-full flex flex-col items-center gap-5 transition-all relative z-[60] pointer-events-none" style={{ maxWidth: `${cfg.lcdWidth}px`, fontFamily: "'Outfit', 'Prompt', sans-serif" }}>
      <div className="relative z-20 flex flex-col items-center text-center gap-1 w-full px-4 pointer-events-auto" style={{ transform: `scale(${cfg.headerScale}) translate(${cfg.headerX}px, ${cfg.headerY}px)`, transformOrigin: 'center center', transition: 'transform 0.1s' }}>
        <span className="text-[11px] uppercase tracking-[0.2em] font-medium" style={{ color: theme.textSub }}>{progressState.part}</span>
        <h2 className="text-[36px] leading-[1.1] font-light tracking-wide whitespace-nowrap" style={{ color: theme.textMain }}>{progressState.subPart}</h2>
      </div>

      <div className="w-full rounded-[2.5rem] p-6 flex flex-col gap-6 border border-white/10 pointer-events-auto" style={{ boxShadow: shadowOuter, background: bg, transform: `scale(${cfg.rightPanelScale}) translate(${cfg.rightPanelX}px, ${cfg.rightPanelY}px)`, transformOrigin: 'top center', transition: 'transform 0.1s' }}>
        <div className="w-full rounded-[2rem] transition-colors duration-300 border border-white/30 relative" style={{ padding: `${cfg.lcdBezelPadding}px`, boxShadow: shadowPlateau, background: bg }}>
          <div onClick={() => setIsLcdEditOpen(!isLcdEditOpen)} className="w-full flex items-center overflow-hidden border border-black/5 transition-all duration-300 relative cursor-pointer" style={{ height: `${cfg.lcdHeight}px`, borderRadius: `${cfg.lcdRadiusInner}px`, boxShadow: lcdShadow, background: lcdBg, filter: `hue-rotate(${lcdHue}deg) brightness(${lcdBrightness})` }}>
            <div className="absolute inset-0 pointer-events-none rounded-[inherit]" style={{ background: 'linear-gradient(110deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.02) 30%, transparent 35%)' }}></div>
            <div className="absolute inset-0 pointer-events-none rounded-[inherit]" style={{ background: 'radial-gradient(circle at center, transparent 50%, rgba(0,0,0,0.4) 120%)' }}></div>
            {marqueeElements ? (
              <div className="flex animate-marquee z-10" style={{ animationDuration: `${lcdScrollSpeed * 2}s` }}>
                {marqueeElements}
              </div>
            ) : (
              <div className="w-full flex justify-center z-10 mt-2">
                <span className="tracking-widest leading-none whitespace-nowrap" style={{ fontSize: `${cfg.lcdFontSize}px`, fontFamily: "'Share Tech Mono', monospace", color: lcdText, textShadow: lcdTextGlow }}>{displayedLcdText}</span>
              </div>
            )}
            <div className="absolute inset-0 opacity-20 pointer-events-none z-20" style={{ backgroundImage: 'linear-gradient(rgba(0,0,0,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.8) 1px, transparent 1px)', backgroundSize: '3px 3px' }}></div>
          </div>

          {isLcdEditOpen && (
            <div className="absolute top-1/2 -translate-y-1/2 left-[calc(100%+16px)] w-[260px] rounded-[1.5rem] p-2.5 border border-white/20 z-[100] transition-all flex flex-col gap-1" style={{ background: raisedGradient, boxShadow: shadowPlateau }}>
                <button onClick={(e) => { e.stopPropagation(); setLcdDisplayMode('exam'); }} className="w-full text-left px-5 py-3.5 text-[13px] font-medium tracking-wide transition-all flex items-center justify-between" style={{ borderRadius: `${cfg.dropRadius}px`, background: lcdDisplayMode === 'exam' ? bg : 'transparent', boxShadow: lcdDisplayMode === 'exam' ? shadowDeepInset : 'none', color: lcdDisplayMode === 'exam' ? theme.textMain : theme.textSub }} >
                  <span>Exam Progress</span>
                  <div className={`w-1.5 h-1.5 rounded-full transition-opacity ${lcdDisplayMode === 'exam' ? 'bg-blue-400 opacity-100 shadow-[0_0_8px_#60a5fa]' : 'bg-transparent opacity-0'}`} />
                </button>
                <div className="w-full px-5 py-3.5 flex items-center justify-between transition-all cursor-text" style={{ borderRadius: `${cfg.dropRadius}px`, background: lcdDisplayMode === 'custom' ? bg : 'transparent', boxShadow: lcdDisplayMode === 'custom' ? shadowDeepInset : 'none' }} onClick={(e) => { e.stopPropagation(); setLcdDisplayMode('custom'); }}>
                  <input type="text" maxLength={25} value={customLcdText} onChange={(e) => { setCustomLcdText(e.target.value.toUpperCase()); setLcdDisplayMode('custom'); }} className="w-full bg-transparent outline-none text-[13px] font-medium tracking-wide placeholder:text-current/50" style={{ color: lcdDisplayMode === 'custom' ? theme.textMain : theme.textSub, fontFamily: "'Outfit', 'Prompt', sans-serif" }} placeholder="Custom" />
                  <div className={`w-1.5 h-1.5 rounded-full shrink-0 transition-opacity ${lcdDisplayMode === 'custom' ? 'bg-blue-400 opacity-100 shadow-[0_0_8px_#60a5fa]' : 'bg-transparent opacity-0'}`} />
                </div>
                <div className="w-full px-5 pt-3 pb-2 mt-1 flex flex-col gap-3 border-t border-white/5">
                  <div className="flex justify-between items-center"><span className="text-[10px] uppercase font-bold tracking-wider" style={{ color: theme.textSub }}>LCD Hue</span><span className="text-[10px] font-mono font-medium" style={{ color: theme.textSub }}>{lcdHue}°</span></div>
                  <input type="range" min="0" max="360" value={lcdHue} onChange={(e) => setLcdHue(e.target.value)} onClick={(e) => e.stopPropagation()} className="w-full h-1.5 rounded-full accent-[#10b981] bg-black/10 outline-none" style={{ boxShadow: shadowTrench }} />
                </div>
                <div className="w-full px-5 pt-2 pb-3 flex flex-col gap-3 border-t border-white/5">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] uppercase font-bold tracking-wider" style={{ color: theme.textSub }}>Track Hue</span>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={(e) => { e.stopPropagation(); setIsAutoTrackHue(!isAutoTrackHue); }}
                        className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase transition-colors ${isAutoTrackHue ? 'bg-blue-500 text-white shadow-[0_0_6px_#3b82f6]' : 'bg-black/10 text-current'}`}
                      >
                        Auto
                      </button>
                      <span className="text-[10px] font-mono font-medium" style={{ color: theme.textSub }}>{Math.round(trackHue)}°</span>
                    </div>
                  </div>
                  <input type="range" min="0" max="360" value={Math.round(trackHue)} onChange={(e) => { setTrackHue(Number(e.target.value)); setIsAutoTrackHue(false); }} onClick={(e) => e.stopPropagation()} className="w-full h-1.5 rounded-full accent-[#3b82f6] bg-black/10 outline-none" style={{ boxShadow: shadowTrench }} />
                </div>
            </div>
          )}
        </div>
        <div className="w-full flex gap-3">
          <button onClick={addMark} disabled={!isRunning} className="flex-1 flex flex-col items-center justify-center transition-all active:scale-[0.98] border border-white/30" style={{ height: `${cfg.btnHeight * 0.8}px`, borderRadius: `${cfg.btnRadius}px`, boxShadow: shadowPlateau, background: bg, opacity: isRunning ? 1 : 0.6 }}>
            <Asterisk size={cfg.btnIconSize * 0.5} strokeWidth={3} className="text-[#ea580c] mb-1" />
            <span className="font-semibold tracking-[0.15em] uppercase" style={{ fontSize: `${cfg.btnFontSize * 0.8}px`, color: theme.textSub }}>Mark</span>
          </button>
          <button onClick={() => {
            if (!finishTime) setFinishTime(totalTime - timeLeft);
            else setTimeLeft(0);
          }} disabled={!isRunning && !finishTime} className="flex-1 flex flex-col items-center justify-center transition-all active:scale-[0.98] border border-white/30" style={{ height: `${cfg.btnHeight * 0.8}px`, borderRadius: `${cfg.btnRadius}px`, boxShadow: shadowPlateau, background: finishTime ? '#10b981' : bg, color: finishTime ? '#ffffff' : theme.textSub, opacity: (isRunning || finishTime) ? 1 : 0.6 }}>
            {finishTime ? (
              <>
                <span className="font-bold uppercase opacity-90" style={{ fontSize: `${cfg.btnFontSize * 0.7}px` }}>Done in {Math.floor(finishTime/60)}:{(Math.floor(finishTime)%60).toString().padStart(2,'0')}</span>
                <span className="font-black tracking-[0.1em] uppercase mt-1 drop-shadow-md" style={{ fontSize: `${cfg.btnFontSize * 0.8}px` }}>End Exam</span>
              </>
            ) : (
              <>
                <CheckCircle size={cfg.btnIconSize * 0.5} strokeWidth={2.5} className="mb-1" />
                <span className="font-semibold tracking-[0.15em] uppercase" style={{ fontSize: `${cfg.btnFontSize * 0.8}px` }}>Finish</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
});

const StaticClockFace = memo(({ textSubColor }) => (
  <svg className="absolute inset-0 w-full h-full" viewBox="0 0 240 240">
    {[...Array(60)].map((_, i) => {
      const isHour = i % 5 === 0;
      return <line key={i} x1="120" y1={isHour ? "14" : "18"} x2="120" y2="24" stroke={textSubColor} strokeWidth={isHour ? "2" : "1"} transform={`rotate(${i * 6} 120 120)`} opacity={isHour ? 0.8 : 0.4} strokeLinecap="round" />;
    })}
  </svg>
));

const TimerDashboard = memo(({ cfg, themeVals, timeLeft, totalTime, isRunning, speed, marks, ambientOn, toggleAmbient, toggleTimer, skipTime, resetTimer, trackHue, countdown, isAutoTrackHue, mode }) => {
  const [isClockMode, setIsClockMode] = useState(false);
  const { bg, theme, raisedGradient, indentedGradient, shadowOuter, shadowCap, shadowPlateau, shadowTrench, shadowDimple } = themeVals;

  const isIdle = timeLeft === totalTime && !isRunning && countdown === null;
  
  let progressPercent;
  if (countdown !== null) {
    progressPercent = 0; 
  } else if (isIdle) {
    progressPercent = 100; 
  } else {
    progressPercent = ((totalTime - timeLeft) / totalTime) * 100; 
  }
  
  const trackSize = 340; 
  const circumference = 2 * Math.PI * cfg.trackRadius;
  const dashoffset = circumference - (progressPercent / 100) * circumference;
  const trackGlowColor = (isIdle || countdown !== null) ? '#3b82f6' : getTipColor(progressPercent);

  const currentTotalSeconds = (11 * 3600) + (totalTime - timeLeft);
  const hourDeg = (currentTotalSeconds / 43200) * 360;
  const minuteDeg = (currentTotalSeconds / 3600) * 360;
  const secondDeg = currentTotalSeconds * 6;

  return (
    <>
      <div 
        className="relative flex items-center justify-center w-[400px] h-[400px] rounded-full shrink-0"
        style={{ transform: `scale(${cfg.leftPanelScale}) translate(${cfg.leftPanelX}px, ${cfg.leftPanelY}px)`, transformOrigin: 'center center', transition: 'transform 0.1s' }}
      >
        <div className="absolute w-[340px] h-[340px] rounded-full flex items-center justify-center transition-shadow duration-100" style={{ boxShadow: shadowOuter, background: raisedGradient }}>
          <div className="absolute w-[290px] h-[290px] rounded-full flex items-center justify-center transition-shadow duration-100" style={{ background: indentedGradient, boxShadow: shadowTrench }}>
            <svg width={trackSize} height={trackSize} className="absolute transform rotate-90 pointer-events-none overflow-visible">
              <defs>
                <mask id="progressMask">
                  <circle cx={trackSize/2} cy={trackSize/2} r={cfg.trackRadius} fill="none" stroke="white" strokeWidth={cfg.trackStroke} strokeLinecap="butt" strokeDasharray={circumference} strokeDashoffset={dashoffset} style={{ transition: countdown !== null ? 'stroke-dashoffset 5s linear' : (isRunning ? 'stroke-dashoffset 1s linear' : 'stroke-dashoffset 0.5s ease') }} />
                </mask>
                <filter id="neonDrop" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#000000" floodOpacity="0.15" />
                  <feDropShadow dx="0" dy="0" stdDeviation="8" floodColor={trackGlowColor} floodOpacity="0.8" />
                </filter>
              </defs>
              <circle cx={trackSize/2} cy={trackSize/2} r={cfg.trackRadius} fill="none" stroke={theme.trackBg} strokeWidth={cfg.bgTrackStroke} />
              
              <g className={isAutoTrackHue ? "rgb-loop-anim" : ""} style={isAutoTrackHue ? undefined : { filter: `hue-rotate(${trackHue}deg)` }}>
                <g mask="url(#progressMask)" filter="url(#neonDrop)">
                  <foreignObject x="0" y="0" width={trackSize} height={trackSize}>
                    <div style={{ width: '100%', height: '100%', background: 'conic-gradient(from 90deg, #3b82f6 0%, #3b82f6 40%, #f97316 75%, #ef4444 100%)' }} />
                  </foreignObject>
                </g>
              </g>
              
              {marks.map((markPercent, i) => {
                const markAngleRad = ((markPercent / 100) * 360) * (Math.PI / 180);
                const cx = trackSize / 2, cy = trackSize / 2;
                const innerR = cfg.trackRadius - 10, outerR = cfg.trackRadius + 10;
                const x1 = cx + innerR * Math.cos(markAngleRad), y1 = cy + innerR * Math.sin(markAngleRad);
                const x2 = cx + outerR * Math.cos(markAngleRad), y2 = cy + outerR * Math.sin(markAngleRad);
                return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#ff0000" strokeWidth="3" strokeLinecap="round" className="drop-shadow-[0_0_4px_rgba(255,0,0,0.8)]" />;
              })}
            </svg>

            <div onClick={() => setIsClockMode(!isClockMode)} className="absolute w-[240px] h-[240px] rounded-full flex flex-col items-center justify-center border-[4px] transition-all duration-300 cursor-pointer overflow-hidden group" style={{ borderColor: theme.bg, boxShadow: shadowCap, background: raisedGradient }} title="Click to toggle Analog Clock">
              {isClockMode ? (
                <div className="relative w-full h-full rounded-full flex items-center justify-center" style={{ fontFamily: "'Outfit', 'Prompt', sans-serif" }}>
                  <StaticClockFace textSubColor={theme.textSub} />
                  <span className="absolute top-[32px] text-[18px] font-medium" style={{ color: theme.textMain }}>12</span>
                  <span className="absolute right-[34px] text-[18px] font-medium" style={{ color: theme.textMain }}>3</span>
                  <span className="absolute bottom-[32px] text-[18px] font-medium" style={{ color: theme.textMain }}>6</span>
                  <span className="absolute left-[34px] text-[18px] font-medium" style={{ color: theme.textMain }}>9</span>
                  <div className="absolute w-[4px] rounded-full origin-bottom z-10 drop-shadow-md" style={{ height: '55px', background: theme.textMain, bottom: '120px', transform: `rotate(${hourDeg}deg)`, transition: isRunning ? `transform ${1000/speed}ms linear` : 'transform 0.2s ease-out' }}></div>
                  <div className="absolute w-[3px] rounded-full origin-bottom z-10 drop-shadow-md" style={{ height: '80px', background: theme.textMain, bottom: '120px', transform: `rotate(${minuteDeg}deg)`, transition: isRunning ? `transform ${1000/speed}ms linear` : 'transform 0.2s ease-out' }}></div>
                  <div className="absolute w-[1.5px] z-20 drop-shadow-md" style={{ height: '110px', bottom: '100px', transformOrigin: 'center 90px', transform: `rotate(${secondDeg}deg)`, transition: isRunning ? `transform ${1000/speed}ms linear` : 'transform 0.2s ease-out' }}><div className="w-full h-full bg-[#ef4444] rounded-full"></div></div>
                  <div className="absolute w-3 h-3 rounded-full z-30" style={{ background: '#ef4444', border: `2px solid ${theme.bg}` }}></div>
                </div>
              ) : (
                <>
                  <div className="absolute inset-0 rounded-full">
                    <div className="absolute top-[16px] left-1/2 -translate-x-1/2 rounded-full flex items-center justify-center border-[2px] border-white/5 transition-all duration-100" style={{ width: cfg.dimpleSize, height: cfg.dimpleSize, boxShadow: shadowDimple, background: indentedGradient }}>
                      <div className={`w-2 h-2 rounded-full transition-colors duration-300 ${isRunning ? 'bg-red-500 shadow-[0_0_10px_#f87171,0_0_16px_#ef4444]' : 'bg-blue-400 shadow-[0_0_10px_#60a5fa,0_0_16px_#3b82f6]'}`}></div>
                    </div>
                  </div>
                  <div className="relative z-10 flex flex-col items-center pointer-events-none w-full" style={{ fontFamily: "'Outfit', 'Prompt', sans-serif" }}>
                    <div className="flex justify-center leading-none tracking-tight drop-shadow-[1px_1px_1px_rgba(255,255,255,0.05)]" style={{ color: theme.textHighlight, fontWeight: 200, fontSize: `${cfg.timeFontSize}rem`, transform: `translateY(${cfg.timeY}px)` }}>
                      <span className="w-[1.2em] text-right">{Math.floor(Math.ceil(timeLeft) / 60).toString().padStart(2, '0')}</span>
                      <span className="w-[0.3em] text-center">:</span>
                      <span className="w-[1.2em] text-left">{(Math.ceil(timeLeft) % 60).toString().padStart(2, '0')}</span>
                    </div>
                    <span className="tracking-[0.15em] uppercase" style={{ color: theme.textSub, fontWeight: 400, fontSize: `${cfg.labelFontSize}px`, transform: `translateY(${cfg.labelY}px)` }}>Minutes</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div 
        className="flex items-center justify-center gap-6 mt-6 z-10 w-full max-w-[340px]"
        style={{ transform: `scale(${cfg.controlPanelScale}) translate(${cfg.controlPanelX}px, ${cfg.controlPanelY}px)`, transformOrigin: 'center center', transition: 'transform 0.1s' }}
      >
        <button onClick={toggleAmbient} disabled={mode !== 'full'} className={`w-14 h-14 rounded-full flex items-center justify-center transition-all border border-white/5 ${mode !== 'full' ? 'opacity-30 cursor-not-allowed' : 'active:scale-[0.98]'}`} style={{ background: bg, color: ambientOn && mode === 'full' ? '#3b82f6' : theme.textMain, boxShadow: shadowPlateau }}>
  {ambientOn && mode === 'full' ? <Volume2 size={20} /> : <VolumeX size={20} />}
</button>
        <button onClick={toggleTimer} className="w-[84px] h-[84px] rounded-full flex items-center justify-center transition-all active:scale-[0.98] border border-white/5" style={{ background: bg, color: theme.textMain, boxShadow: shadowPlateau }}>
          {isRunning ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="ml-2" />}
        </button>
        <button onClick={skipTime} className="w-14 h-14 rounded-full flex items-center justify-center transition-all active:scale-[0.98] border border-white/5" style={{ background: bg, color: theme.textMain, boxShadow: shadowPlateau }} title="Skip 5 Minutes">
          <FastForward size={20} />
        </button>
        <button onClick={resetTimer} className="w-14 h-14 rounded-full flex items-center justify-center transition-all active:scale-[0.98] border border-white/5" style={{ background: bg, color: theme.textMain, boxShadow: shadowPlateau }}>
          <RefreshCcw size={20} />
        </button>
      </div>
    </>
  );
});

const GameBoyWidget = memo(({ cfg, themeVals, setCurrentView }) => {
  const { bg, theme, shadowOuter, shadowTrench, indentedGradient, raisedGradient, shadowDimple, shadowPlateau } = themeVals;
  const isDarkMode = theme.bg === "#1e2229";

  const [board, setBoard] = useState(Array(9).fill(null));
  const [xIsNext, setXIsNext] = useState(true);

  const winner = calculateWinner(board);
  const isDraw = !winner && board.every(Boolean);

  const handleCellClick = useCallback((index) => {
    if (board[index] || winner || !xIsNext) return;
    setBoard(prev => {
      const newBoard = [...prev];
      newBoard[index] = 'X';
      return newBoard;
    });
    setXIsNext(false);
  }, [board, winner, xIsNext]);

  const resetGame = useCallback(() => {
    setBoard(Array(9).fill(null));
    setXIsNext(true);
  }, []);

  useEffect(() => {
    let isActive = true;

    if (!xIsNext && !winner && !isDraw) {
      const timer = setTimeout(() => {
        if (!isActive) return; 

        const emptyIndices = board.map((val, idx) => val === null ? idx : null).filter(val => val !== null);
        if (emptyIndices.length === 0) return;
        
        let move = -1;
        const testWin = (player) => {
          for (let i of emptyIndices) {
            const newBoard = [...board];
            newBoard[i] = player;
            if (calculateWinner(newBoard) === player) return i;
          }
          return -1;
        };
        move = testWin('O');
        if (move === -1) move = testWin('X');
        if (move === -1 && board[4] === null) move = 4;
        if (move === -1) move = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
        
        setBoard(prev => {
          const newBoard = [...prev];
          newBoard[move] = 'O';
          return newBoard;
        });
        setXIsNext(true);
      }, 500);

      return () => {
        isActive = false;
        clearTimeout(timer);
      };
    }
    
    return () => { isActive = false; };
  }, [xIsNext, board, winner, isDraw]);

  return (
    <div className="mt-8 flex flex-col items-center relative z-10 w-full animate-in fade-in zoom-in duration-300 touch-none" style={{ transform: `scale(${cfg.gameboyScale}) translate(${cfg.gameboyX}px, ${cfg.gameboyY}px)`, transformOrigin: 'top center', transition: 'transform 0.1s' }}>
      <div className="relative rounded-t-[2.5rem] rounded-bl-[2.5rem] rounded-br-[5rem] flex flex-col items-center pt-8 pb-6 px-6 border border-white/5 transition-all duration-300" style={{ width: `${cfg.gbBodyWidth}px`, height: `${cfg.gbBodyHeight}px`, background: bg, boxShadow: shadowOuter }}>
        <div className="absolute top-1/4 left-1 w-1.5 h-20 rounded-full opacity-60" style={{ background: indentedGradient, boxShadow: shadowTrench }}></div>
        <div className="absolute top-1/4 right-1 w-1.5 h-20 rounded-full opacity-60" style={{ background: indentedGradient, boxShadow: shadowTrench }}></div>
        <div className="absolute top-[40%] left-1 w-1.5 h-20 rounded-full opacity-60" style={{ background: indentedGradient, boxShadow: shadowTrench }}></div>
        <div className="absolute top-[40%] right-1 w-1.5 h-20 rounded-full opacity-60" style={{ background: indentedGradient, boxShadow: shadowTrench }}></div>
        <div className="w-full rounded-t-[1.5rem] rounded-bl-[1.5rem] rounded-br-[3.5rem] p-5 flex flex-col items-center relative overflow-hidden transition-all duration-300" style={{ height: `${cfg.gbBezelHeight}px`, background: isDarkMode ? '#13161a' : '#1e293b', boxShadow: `inset 6px 6px 12px rgba(0,0,0,0.6), inset -4px -4px 10px rgba(255,255,255,0.05)` }}>
          <div className="absolute -top-[20%] -left-[20%] w-[150%] h-[150%] bg-gradient-to-br from-white/5 to-transparent rotate-12 pointer-events-none"></div>
          <div className="bg-[#8bac0f] flex flex-col items-center justify-center relative rounded-md overflow-hidden transition-all duration-300" style={{ width: `${cfg.gbScreenWidth}px`, height: `${cfg.gbScreenHeight}px`, boxShadow: `inset 4px 4px 8px rgba(0,0,0,0.4), inset -2px -2px 6px rgba(255,255,255,0.2)` }}>
            <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(0,0,0,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.8) 1px, transparent 1px)', backgroundSize: '3px 3px' }}></div>
            <div className="absolute top-1.5 w-full text-center gb-font text-[9px] text-[#0f380f] tracking-tighter">{winner ? `PLAYER ${winner} WINS!` : isDraw ? `DRAW GAME` : xIsNext ? `YOUR TURN (X)` : `BOT'S TURN (O)`}</div>
            <div className="grid grid-cols-3 gap-[2px] mt-4 p-[2px] bg-[#0f380f]/20 rounded-sm">
              {board.map((cell, idx) => (
                <button key={idx} onClick={() => handleCellClick(idx)} disabled={cell || winner || !xIsNext} className="w-12 h-12 sm:w-[52px] sm:h-[52px] flex items-center justify-center text-[32px] gb-font bg-[#9bbc0f] hover:bg-[#8bac0f] transition-colors disabled:cursor-default" style={{ color: '#0f380f' }}>{cell}</button>
              ))}
            </div>
          </div>
          <div className="absolute bottom-4 flex items-center gap-1.5 z-10" style={{ transform: `scale(${cfg.gbLogoScale}) translate(${cfg.gbLogoX}px, ${cfg.gbLogoY}px)` }}>
            <span className="text-white/60 font-bold text-[10px] tracking-widest italic">BearWith</span><span className="text-[#facc15] font-black text-xs drop-shadow-md">You</span>
          </div>
        </div>
        <div className="w-full flex-1 relative mt-8">
          <div className="absolute left-2 top-8 z-10" style={{ transform: `scale(${cfg.gbDpadScale}) translate(${cfg.gbDpadX}px, ${cfg.gbDpadY}px)` }}>
            <div className="w-[100px] h-[100px] rounded-full flex items-center justify-center" style={{ boxShadow: shadowDimple, background: indentedGradient }}>
              <div className="relative w-[70px] h-[70px] flex items-center justify-center">
                <div className="absolute w-[22px] h-[70px] rounded-sm flex flex-col justify-between" style={{ background: raisedGradient, boxShadow: shadowPlateau }}>
                  <div className="w-full h-[22px] flex items-center justify-center opacity-40"><ChevronUp size={12} color={theme.textMain} /></div>
                  <div className="w-full h-[22px] flex items-center justify-center opacity-40"><ChevronDown size={12} color={theme.textMain} /></div>
                </div>
                <div className="absolute w-[70px] h-[22px] rounded-sm flex justify-between items-center" style={{ background: raisedGradient, boxShadow: shadowPlateau }}>
                  <div className="w-[22px] h-full flex items-center justify-center opacity-40"><ChevronLeft size={12} color={theme.textMain} /></div>
                  <div className="w-[22px] h-full flex items-center justify-center opacity-40"><ChevronRight size={12} color={theme.textMain} /></div>
                </div>
                <div className="absolute w-4 h-4 rounded-full z-10" style={{ background: indentedGradient, boxShadow: shadowTrench }}></div>
              </div>
            </div>
          </div>
          <div className="absolute right-0 top-12 z-10" style={{ transform: `scale(${cfg.gbActionBtnScale}) translate(${cfg.gbActionBtnX}px, ${cfg.gbActionBtnY}px)` }}>
            <div className="flex gap-4 -rotate-[20deg] px-5 py-2.5 rounded-[2rem]" style={{ boxShadow: shadowDimple, background: indentedGradient }}>
              <div className="flex flex-col items-center gap-1.5 pt-4">
                <button onClick={resetGame} className="w-11 h-11 rounded-full active:scale-95 transition-all flex items-center justify-center border border-white/5" style={{ background: raisedGradient, boxShadow: shadowPlateau }}>
                  <RefreshCcw size={14} color={theme.textMain} className="opacity-50" />
                </button>
                <span className="text-[11px] font-black tracking-widest" style={{ color: theme.textSub }}>B</span>
              </div>
              <div className="flex flex-col items-center gap-1.5 pb-4">
                <button onClick={() => setCurrentView('timer')} className="w-11 h-11 rounded-full active:scale-95 transition-all flex items-center justify-center border border-white/5" style={{ background: 'linear-gradient(145deg, #fb923c, #ea580c)', boxShadow: shadowPlateau }}>
                  <ArrowLeft size={14} color="#ffffff" className="opacity-90" />
                </button>
                <span className="text-[11px] font-black tracking-widest" style={{ color: theme.textSub }}>A</span>
              </div>
            </div>
          </div>
          <div className="absolute bottom-6 left-1/2 z-10" style={{ transform: `scale(${cfg.gbSystemBtnScale}) translate(${cfg.gbSystemBtnX}px, ${cfg.gbSystemBtnY}px)` }}>
            <div className="-translate-x-[60%] flex gap-6 -rotate-[15deg]">
              <div className="flex flex-col items-center gap-2">
                <div className="p-1.5 rounded-full" style={{ boxShadow: shadowDimple, background: indentedGradient }}>
                  <button onClick={() => setCurrentView('timer')} className="w-12 h-3.5 rounded-full active:scale-95 transition-all border border-white/5" style={{ background: raisedGradient, boxShadow: shadowPlateau }}></button>
                </div>
                <span className="text-[9px] font-bold tracking-widest uppercase" style={{ color: theme.textSub }}>Select</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="p-1.5 rounded-full" style={{ boxShadow: shadowDimple, background: indentedGradient }}>
                  <button onClick={resetGame} className="w-12 h-3.5 rounded-full active:scale-95 transition-all border border-white/5" style={{ background: raisedGradient, boxShadow: shadowPlateau }}></button>
                </div>
                <span className="text-[9px] font-bold tracking-widest uppercase" style={{ color: theme.textSub }}>Start</span>
              </div>
            </div>
          </div>
          <div className="absolute bottom-4 right-4 z-10" style={{ transform: `scale(${cfg.gbSpeakerScale}) translate(${cfg.gbSpeakerX}px, ${cfg.gbSpeakerY}px)` }}>
            <div className="flex flex-col gap-2.5 w-16 -rotate-12 opacity-80">
              {[...Array(6)].map((_, rowIdx) => (
                <div key={rowIdx} className="flex gap-2.5 w-full justify-end">
                  {[...Array(4)].map((_, colIdx) => (
                    <div key={colIdx} className="w-2.5 h-2.5 rounded-full" style={{ background: indentedGradient, boxShadow: shadowTrench }}></div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="mt-8 flex items-center gap-3 text-sm font-medium px-5 py-2.5 rounded-full transition-colors border border-white/5" style={{ background: bg, boxShadow: shadowPlateau, color: theme.textSub }}>
        <span className="w-6 h-6 flex items-center justify-center rounded-full text-[10px] font-bold" style={{ background: indentedGradient, boxShadow: shadowTrench, color: '#ea580c' }}>A</span> / Exit 
        <span className="w-6 h-6 flex items-center justify-center rounded-full text-[10px] font-bold ml-3" style={{ background: indentedGradient, boxShadow: shadowTrench, color: theme.textMain }}>B</span> / Restart
      </div>
    </div>
  );
});

const SortableItem = memo(({ item, index, isEditable, isDraggingItem, isAnimatingDrop, offsetY, shiftOffset, handlePointerDown, themeVals, dotColor, isDropping }) => {
  const { bg, shadowPlateau, theme, shadowCap, raisedGradient } = themeVals;
  const isDarkMode = theme.bg === "#1e2229";

  let transformStyle = 'translateY(0px)';
  let zIndex = 1;
  let scale = 1;
  let shadow = shadowPlateau;
  let transitionStyle = 'transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)';

  if (isDropping) {
    transitionStyle = 'none'; 
  } else if (isDraggingItem) {
    transformStyle = `translateY(${offsetY}px)`;
    zIndex = 50;
    scale = isAnimatingDrop ? 1 : 1.02;
    shadow = isDarkMode ? `0 25px 30px -5px rgba(0,0,0,0.6), ${shadowPlateau}` : `0 20px 25px -5px rgba(0,0,0,0.2), ${shadowPlateau}`;
    if (!isAnimatingDrop) transitionStyle = 'none'; 
  } else if (shiftOffset !== 0) {
    transformStyle = `translateY(${shiftOffset}px)`;
  }

  return (
    <div className={`exam-item flex items-center justify-between p-5 rounded-2xl border relative ${isDraggingItem ? 'border-white/20' : 'border-white/5'} ${isEditable ? 'hover:border-white/10' : 'cursor-default'}`} style={{ background: bg, boxShadow: shadow, transform: `${transformStyle} scale(${scale})`, zIndex: zIndex, transition: transitionStyle }}>
      <div className="flex items-center gap-4">
        {isEditable && (
          <div 
            onPointerDown={(e) => handlePointerDown(e, index)} 
            className="cursor-grab active:cursor-grabbing p-2 -ml-2"
            style={{ touchAction: 'none' }} 
          >
            <GripVertical size={20} style={{ color: theme.textHighlight }} />
          </div>
        )}
        <div className="flex flex-col"><span className="text-[10px] uppercase tracking-wider font-bold" style={{ color: theme.textHighlight }}>{item.part}</span><span className="text-[14px] font-medium" style={{ color: theme.textMain }}>{item.label}</span></div>
      </div>
      <div className="flex items-center gap-3 px-3 py-1.5 rounded-full border border-white/10 shrink-0" style={{ background: raisedGradient, boxShadow: shadowCap }}><div className="w-2 h-2 rounded-full" style={{ backgroundColor: dotColor, boxShadow: `0 0 6px ${dotColor}` }} /><span className="text-[12px] font-bold w-4 text-center opacity-70" style={{ color: theme.textSub }}>{index + 1}</span></div>
    </div>
  );
});

const SettingsModal = memo(({ cfg, themeVals, setIsSettingOpen, examSequence, setExamSequence, customPresets, setCustomPresets, activePresetId, setActivePresetId, editingPresetId, setEditingPresetId }) => {
  const { bg, theme, shadowPlateau, shadowOuter, raisedGradient, shadowDeepInset, shadowCap } = themeVals;

  const isMounted = useRef(true);
  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  const [dragInfo, setDragInfo] = useState({
    isDragging: false, isAnimatingDrop: false, startIndex: null, hoverIndex: null, offsetY: 0
  });
  
  const dragConfigRef = useRef({ startY: 0, startScrollY: 0, itemHeight: 0, startIndex: null });
  const [isDropping, setIsDropping] = useState(false);
  const scrollContainerRef = useRef(null);
  const pointerY = useRef(0);
  const autoScrollFrame = useRef(null);

  const handlePointerDown = useCallback((e, index) => {
    if (activePresetId === 'recommend') return;
    e.stopPropagation();
    e.target.setPointerCapture(e.pointerId); 
    const itemEl = e.currentTarget.closest('.exam-item');
    const itemHeight = itemEl ? itemEl.getBoundingClientRect().height + 16 : 96; 
    const clientY = e.clientY; 
    const startScrollY = scrollContainerRef.current ? scrollContainerRef.current.scrollTop : 0;
    pointerY.current = clientY;
    
    dragConfigRef.current = { startY: clientY, startScrollY, itemHeight, startIndex: index };
    
    setDragInfo({
      isDragging: true, isAnimatingDrop: false, startIndex: index, hoverIndex: index, offsetY: 0
    });
  }, [activePresetId]);

  const handleAddPreset = useCallback(() => {
    const newId = `custom-${Date.now()}`;
    setCustomPresets(prev => [...prev, { id: newId, name: `Custom ${prev.length + 1}`, sequence: [...RECOMMENDED_SEQUENCE] }]);
    setActivePresetId(newId);
    setExamSequence([...RECOMMENDED_SEQUENCE]);
    setEditingPresetId(newId);
  }, [setCustomPresets, setActivePresetId, setExamSequence, setEditingPresetId]);

  const handleSelectPreset = useCallback((id) => {
    if (editingPresetId) return; 
    setActivePresetId(id);
    if (id === 'recommend') {
      setExamSequence([...RECOMMENDED_SEQUENCE]);
    } else {
      const preset = customPresets.find(p => p.id === id);
      if (preset) setExamSequence([...preset.sequence]);
    }
  }, [editingPresetId, customPresets, setActivePresetId, setExamSequence]);

  const handleUpdatePresetName = useCallback((id, newName) => {
    setCustomPresets(prev => prev.map(p => p.id === id ? { ...p, name: newName } : p));
  }, [setCustomPresets]);

  const handleDeletePreset = useCallback((e, id) => {
    e.stopPropagation();
    setCustomPresets(prev => prev.filter(p => p.id !== id));
    setActivePresetId(prevId => {
      if (prevId === id) {
        setExamSequence([...RECOMMENDED_SEQUENCE]);
        return 'recommend';
      }
      return prevId;
    });
  }, [setCustomPresets, setActivePresetId, setExamSequence]);

  useEffect(() => {
    if (!dragInfo.isDragging) return;
    
    const handleMove = (e) => {
      e.preventDefault(); 
      const clientY = e.clientY;
      if (!clientY) return;
      pointerY.current = clientY;
      const currentScrollY = scrollContainerRef.current ? scrollContainerRef.current.scrollTop : dragConfigRef.current.startScrollY;
      const newOffsetY = (clientY - dragConfigRef.current.startY) + (currentScrollY - dragConfigRef.current.startScrollY);
      const shift = Math.round(newOffsetY / dragConfigRef.current.itemHeight);
      const newHoverIndex = Math.max(0, Math.min(examSequence.length - 1, dragConfigRef.current.startIndex + shift));
      
      setDragInfo(prev => {
        if (prev.isAnimatingDrop) return prev;
        return { ...prev, offsetY: newOffsetY, hoverIndex: newHoverIndex };
      });
    };

    const handleUp = () => {
      cancelAnimationFrame(autoScrollFrame.current);
      
      setDragInfo(prev => {
        if (!prev.isDragging || prev.isAnimatingDrop) return prev;
        const targetOffsetY = (prev.hoverIndex - prev.startIndex) * dragConfigRef.current.itemHeight;
        
        setTimeout(() => {
          if (!isMounted.current) return;
          if (prev.startIndex !== prev.hoverIndex) {
            setExamSequence(currentSeq => {
               let _seq = [...currentSeq];
               const item = _seq.splice(prev.startIndex, 1)[0];
               _seq.splice(prev.hoverIndex, 0, item);
               setCustomPresets(presets => presets.map(p => p.id === activePresetId ? { ...p, sequence: _seq } : p));
               return _seq;
            });
          }
          setIsDropping(true);
          setDragInfo({ isDragging: false, isAnimatingDrop: false, startIndex: null, hoverIndex: null, offsetY: 0 });
          setTimeout(() => {
            if (isMounted.current) setIsDropping(false);
          }, 50); 
        }, 300);
        
        return { ...prev, isAnimatingDrop: true, offsetY: targetOffsetY };
      });
    };

    const scrollLoop = () => {
      if (scrollContainerRef.current && pointerY.current) {
         const rect = scrollContainerRef.current.getBoundingClientRect();
         const y = pointerY.current;
         const edgeSize = 60;
         let scrollAmount = 0;
         const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
         if (y < rect.top + edgeSize && scrollTop > 0) scrollAmount = -((rect.top + edgeSize - y) / 3); 
         else if (y > rect.bottom - edgeSize && scrollTop + clientHeight < scrollHeight) scrollAmount = ((y - (rect.bottom - edgeSize)) / 3);
         
         if (scrollAmount !== 0) {
           scrollContainerRef.current.scrollTop += scrollAmount;
           const currentScrollY = scrollContainerRef.current.scrollTop;
           
           setDragInfo(prev => {
              if (prev.isAnimatingDrop) return prev;
              const newOffsetY = (pointerY.current - dragConfigRef.current.startY) + (currentScrollY - dragConfigRef.current.startScrollY);
              const shift = Math.round(newOffsetY / dragConfigRef.current.itemHeight);
              const newHoverIndex = Math.max(0, Math.min(examSequence.length - 1, dragConfigRef.current.startIndex + shift));
              return { ...prev, offsetY: newOffsetY, hoverIndex: newHoverIndex };
           });
         }
      }
      autoScrollFrame.current = requestAnimationFrame(scrollLoop);
    };
    
    autoScrollFrame.current = requestAnimationFrame(scrollLoop);
    window.addEventListener('pointermove', handleMove, { passive: false });
    window.addEventListener('pointerup', handleUp);
    window.addEventListener('pointercancel', handleUp);

    return () => {
      cancelAnimationFrame(autoScrollFrame.current);
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
      window.removeEventListener('pointercancel', handleUp);
    };
  }, [dragInfo.isDragging, examSequence.length, activePresetId, setExamSequence, setCustomPresets]);

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-transparent backdrop-blur-md px-4">
      <div className="w-full max-w-3xl rounded-[2.5rem] border border-white/30 transition-all relative" style={{ padding: '9px', boxShadow: shadowPlateau, background: bg }}>
        <div className="w-full h-full rounded-[2rem] p-6 flex flex-col gap-4 border border-white/5" style={{ background: bg, boxShadow: shadowOuter }}>
          <div className="flex justify-between items-center px-2 mb-2">
            <div>
              <h3 className="text-lg font-bold tracking-wide" style={{ color: theme.textMain }}>Settings</h3>
              <p className="text-xs font-medium opacity-60" style={{ color: theme.textSub }}>Customize display & sequence</p>
            </div>
            <button onClick={() => setIsSettingOpen(false)} className="w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-95 border border-white/5" style={{ background: raisedGradient, boxShadow: shadowPlateau, color: theme.textMain }}><X size={18} /></button>
          </div>
          <div className="flex flex-col md:flex-row gap-6 mt-2">
            <div className="w-full md:w-1/3 flex flex-col gap-3 px-2">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] uppercase tracking-wider font-bold" style={{ color: theme.textHighlight }}>Sequence Presets</span>
                <button onClick={handleAddPreset} className="w-6 h-6 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95 border border-white/10" style={{ background: raisedGradient, boxShadow: shadowPlateau, color: theme.textMain }}><Plus size={12} strokeWidth={3} /></button>
              </div>
              <div onClick={() => handleSelectPreset('recommend')} className="w-full text-left px-5 py-4 text-[13px] font-medium tracking-wide transition-all flex items-center justify-between cursor-pointer" style={{ borderRadius: `${cfg.dropRadius}px`, background: activePresetId === 'recommend' ? bg : 'transparent', boxShadow: activePresetId === 'recommend' ? shadowDeepInset : 'none', color: activePresetId === 'recommend' ? theme.textMain : theme.textSub, border: '1px solid rgba(255,255,255,0.05)' }}>
                <div className="flex flex-col"><span>Recommend</span><span className="text-[10px] opacity-60 mt-0.5">Standard A-Level Order</span></div>
                <div className={`w-2 h-2 rounded-full transition-opacity ${activePresetId === 'recommend' ? 'bg-emerald-400 opacity-100 shadow-[0_0_8px_#34d399]' : 'bg-transparent opacity-0'}`} />
              </div>
              {customPresets.map((preset) => (
                <div key={preset.id} onClick={() => handleSelectPreset(preset.id)} className="w-full text-left px-5 py-4 text-[13px] font-medium tracking-wide transition-all flex items-center justify-between group cursor-pointer" style={{ borderRadius: `${cfg.dropRadius}px`, background: activePresetId === preset.id ? bg : 'transparent', boxShadow: activePresetId === preset.id ? shadowDeepInset : 'none', color: activePresetId === preset.id ? theme.textMain : theme.textSub, border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div className="flex flex-col w-full pr-4">
                    {editingPresetId === preset.id ? (
                      <input autoFocus value={preset.name} onChange={(e) => handleUpdatePresetName(preset.id, e.target.value)} onBlur={() => setEditingPresetId(null)} onKeyDown={(e) => e.key === 'Enter' && setEditingPresetId(null)} className="bg-transparent outline-none border-b border-blue-400 w-full text-blue-400 pb-0.5" onClick={(e) => e.stopPropagation()} />
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="truncate max-w-[120px]">{preset.name}</span>
                        {activePresetId === preset.id && (
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={(e) => { e.stopPropagation(); setEditingPresetId(preset.id); }} className="hover:text-blue-400 transition-colors"><Edit size={12} /></button>
                            <button onClick={(e) => handleDeletePreset(e, preset.id)} className="hover:text-red-400 transition-colors"><Trash2 size={12} /></button>
                          </div>
                        )}
                      </div>
                    )}
                    <span className="text-[10px] opacity-60 mt-0.5">Custom Sequence</span>
                  </div>
                  <div className={`w-2 h-2 rounded-full shrink-0 transition-opacity ${activePresetId === preset.id ? 'bg-blue-400 opacity-100 shadow-[0_0_8px_#60a5fa]' : 'bg-transparent opacity-0'}`} />
                </div>
              ))}
            </div>
            <div className="w-full md:w-2/3 flex flex-col h-full">
              <div className="mb-2 flex items-center justify-between px-6">
                <span className="text-[10px] uppercase tracking-wider font-bold" style={{ color: theme.textHighlight }}>Exam Sequence</span>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-[#34d399] shadow-[0_0_4px_#34d399]"></div><span className="text-[9px] uppercase font-bold" style={{ color: theme.textSub }}>ง่าย</span></div>
                  <div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-[#60a5fa] shadow-[0_0_4px_#60a5fa]"></div><span className="text-[9px] uppercase font-bold" style={{ color: theme.textSub }}>กลาง</span></div>
                  <div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-[#f87171] shadow-[0_0_4px_#f87171]"></div><span className="text-[9px] uppercase font-bold" style={{ color: theme.textSub }}>ยาก</span></div>
                </div>
              </div>
              <div ref={scrollContainerRef} className="flex flex-col gap-4 max-h-[55vh] overflow-y-auto no-scrollbar px-8 pb-12 pt-4 -mx-4">
                {examSequence.map((item, index) => {
                  const isEditable = activePresetId !== 'recommend';
                  const dotColor = getDifficultyColor(item.difficulty);
                  const isDraggingItem = dragInfo.isDragging && dragConfigRef.current.startIndex === index;
                  const isAnimatingDrop = dragInfo.isAnimatingDrop;
                  
                  let shiftOffset = 0;
                  if (dragInfo.isDragging && !isDraggingItem) {
                    const { startIndex } = dragConfigRef.current;
                    const hoverIndex = dragInfo.hoverIndex;
                    const itemHeight = dragConfigRef.current.itemHeight;
                    if (startIndex < hoverIndex && index > startIndex && index <= hoverIndex) {
                      shiftOffset = -itemHeight;
                    } else if (startIndex > hoverIndex && index >= hoverIndex && index < startIndex) {
                      shiftOffset = itemHeight;
                    }
                  }
                  
                  return (
                    <SortableItem 
                      key={item.id} 
                      item={item} 
                      index={index} 
                      isEditable={isEditable} 
                      isDraggingItem={isDraggingItem} 
                      isAnimatingDrop={isAnimatingDrop} 
                      offsetY={isDraggingItem ? dragInfo.offsetY : 0} 
                      shiftOffset={shiftOffset} 
                      handlePointerDown={handlePointerDown} 
                      themeVals={themeVals} 
                      dotColor={dotColor} 
                      isDropping={isDropping}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

function ScoreModal({ themeVals, setIsScoreModalOpen, handleFinishExam, resetTimer }) {
  const { bg, theme, shadowPlateau, shadowOuter, raisedGradient, shadowDeepInset, shadowCap } = themeVals;
  const [totalCorrect, setTotalCorrect] = useState('');

  const handleInput = (val) => {
    const num = parseInt(val.replace(/\D/g, ''), 10);
    setTotalCorrect(isNaN(num) ? '' : Math.min(num, 80));
  };

  const finalScore = totalCorrect === '' ? 0 : totalCorrect * 1.25;

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/20 backdrop-blur-md px-4 animate-in fade-in duration-300">
      <div className="w-full max-w-sm rounded-[2.5rem] border border-white/20 transition-all relative" style={{ padding: '9px', boxShadow: shadowPlateau, background: bg }}>
        <div className="w-full rounded-[2rem] p-8 flex flex-col gap-6 border border-white/5" style={{ background: bg, boxShadow: shadowOuter }}>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center border border-white/10" style={{ background: raisedGradient, boxShadow: shadowCap }}>
                <Award size={20} className="text-blue-500" />
              </div>
              <div>
                <h3 className="text-lg font-bold tracking-wide" style={{ color: theme.textMain }}>Score Entry</h3>
                <p className="text-[11px] font-medium opacity-60 uppercase tracking-wider" style={{ color: theme.textSub }}>Exam Completed</p>
              </div>
            </div>
            <button onClick={() => { setIsScoreModalOpen(false); resetTimer(); }} className="w-8 h-8 rounded-full flex items-center justify-center transition-all active:scale-95 border border-white/5" style={{ background: raisedGradient, boxShadow: shadowPlateau, color: theme.textMain }}><X size={14} /></button>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between p-5 rounded-2xl border border-white/5" style={{ background: raisedGradient, boxShadow: shadowPlateau }}>
              <div className="flex flex-col">
                <span className="text-[14px] font-semibold" style={{ color: theme.textMain }}>จำนวนข้อที่ทำถูก</span>
                <span className="text-[10px] font-medium opacity-50 mt-0.5" style={{ color: theme.textSub }}>คะแนนรวมจากทั้งหมด 80 ข้อ</span>
              </div>
              <div className="flex items-center gap-2">
                <input 
                  type="text" 
                  value={totalCorrect} 
                  onChange={(e) => handleInput(e.target.value)}
                  placeholder="0"
                  className="w-16 text-center bg-transparent outline-none font-black text-2xl border-b-2 transition-colors focus:border-blue-400 placeholder:opacity-30" 
                  style={{ color: theme.textMain, borderColor: theme.trackBg }} 
                />
                <span className="text-sm font-bold opacity-40" style={{ color: theme.textSub }}>/ 80</span>
              </div>
            </div>
          </div>

          <div className="mt-2 p-5 rounded-2xl border border-white/5 flex items-center justify-between" style={{ background: theme.bg === '#1e2229' ? '#13161a' : '#e2e8f0', boxShadow: shadowDeepInset }}>
            <span className="text-sm font-bold uppercase tracking-widest" style={{ color: theme.textMain }}>Total Score</span>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-black" style={{ color: finalScore >= 50 ? '#10b981' : (finalScore > 0 ? '#f87171' : theme.textMain) }}>{finalScore}</span>
              <span className="text-sm font-bold opacity-50" style={{ color: theme.textSub }}>/ 100</span>
            </div>
          </div>

          <button 
            onClick={() => { handleFinishExam(finalScore, {}); setIsScoreModalOpen(false); }}
            className="w-full mt-2 py-4 rounded-[1.25rem] font-bold tracking-widest text-[13px] uppercase transition-all active:scale-[0.98] border border-white/10"
            style={{ background: 'linear-gradient(145deg, #3b82f6, #2563eb)', color: '#ffffff', boxShadow: shadowPlateau }}
          >
            Continue to Reflection
          </button>
        </div>
      </div>
    </div>
  );
}

const LatestInsightWidget = memo(({ history, themeVals, cfg }) => {
  const { bg, theme, raisedGradient, shadowOuter } = themeVals;

  if (!history || history.length === 0) return null;

  const latest = history[0];
  const prev = history.length > 1 ? history[1] : null;

  const getInsight = (type) => {
    let val, prevVal, diff, isGood, label, unit, formatVal;

    if (type === 'score') {
      val = latest.finalScore || 0;
      prevVal = prev ? (prev.finalScore || 0) : null;
      diff = prev ? val - prevVal : null;
      isGood = diff >= 0; 
      label = 'คะแนน (SCORE)';
      unit = 'คะแนน';
      formatVal = val;
    } else if (type === 'time') {
      val = latest.finishTime ? latest.finishTime / 60 : latest.totalTime / 60;
      prevVal = prev ? (prev.finishTime ? prev.finishTime / 60 : prev.totalTime / 60) : null;
      diff = prev ? val - prevVal : null;
      isGood = diff <= 0; 
      label = 'เวลาที่ใช้ (TIME)';
      unit = 'นาที';
      formatVal = val.toFixed(1);
    } else if (type === 'marks') {
      val = latest.pointsData?.length || 0;
      prevVal = prev ? (prev.pointsData?.length || 0) : null;
      diff = prev ? val - prevVal : null;
      isGood = diff <= 0; 
      label = 'จุดลังเล (MARKS)';
      unit = 'จุด';
      formatVal = val;
    }

    return { val: formatVal, diff, isGood, label, unit };
  };

  const scoreData = getInsight('score');
  const timeData = getInsight('time');
  const marksData = getInsight('marks');

  const renderCard = (data) => {
    let diffColor = theme.textSub;
    let diffIcon = '';
    let diffText = '';
    let diffValStr = '';

    if (data.diff !== null) {
      if (data.diff === 0) {
         diffColor = theme.textSub;
         diffIcon = '-';
         diffText = 'เท่าเดิม';
         diffValStr = '(0)';
      } else {
         diffColor = data.isGood ? '#10b981' : '#ef4444'; 
         diffIcon = data.diff > 0 ? '▲' : '▼';
         diffText = data.isGood ? 'ดีขึ้น' : 'แย่ลง';
         diffValStr = `${data.diff > 0 ? '+' : ''}${typeof data.diff === 'number' && data.diff % 1 !== 0 ? data.diff.toFixed(1) : data.diff}`;
      }
    }

    return (
      <div className="flex-1 rounded-[2rem] border border-white/5 flex flex-col justify-between relative overflow-hidden" style={{ background: raisedGradient, boxShadow: shadowOuter, padding: `${cfg.spInsightPadding}px` }}>
         <div className="absolute -right-4 top-1/2 -translate-y-1/2 opacity-[0.03] pointer-events-none flex items-center justify-center text-current" style={{ color: theme.textMain }}>
            {data.label.includes('SCORE') ? (
               <div className="w-16 h-16 relative flex items-center justify-center">
                  <div className="w-full h-4 bg-current absolute rounded-full"></div>
                  <div className="w-4 h-full bg-current absolute rounded-full"></div>
               </div>
            ) : (
               <div className="w-12 h-4 bg-current rounded-full"></div>
            )}
         </div>

        <span className="font-bold opacity-60 mb-6 tracking-wide" style={{ color: theme.textSub, fontSize: `${cfg.spInsightLabelSize}px` }}>{data.label}</span>
        <div className="flex items-baseline gap-2 mb-8 z-10">
          <span className="font-black" style={{ color: theme.textMain, fontSize: `${cfg.spInsightValSize}px` }}>{data.val}</span>
          <span className="font-bold opacity-50" style={{ color: theme.textSub, fontSize: `${cfg.spInsightUnitSize}px` }}>{data.unit}</span>
        </div>
        <div className="flex items-center gap-1.5 z-10">
          {data.diff !== null ? (
            <div className="flex items-center gap-1.5 font-bold" style={{ color: diffColor }}>
              <span style={{ fontSize: `${cfg.spInsightDiffSize}px` }}>{diffIcon} {diffText}</span>
              <span style={{ fontSize: `${cfg.spInsightDiffSize}px` }}>({diffValStr})</span>
            </div>
          ) : (
            <span className="font-bold opacity-40 tracking-widest" style={{ color: theme.textSub, fontSize: `${cfg.spInsightDiffSize}px` }}>ไม่มีข้อมูลเปรียบเทียบ</span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full flex flex-col gap-6 relative z-10" style={{ width: cfg.spInsightW > 0 ? `${cfg.spInsightW}px` : '100%', height: cfg.spInsightH > 0 ? `${cfg.spInsightH}px` : 'auto', transform: `translate(${cfg.spInsightX}px, ${cfg.spInsightY}px)` }}>
       <div className="flex flex-col relative z-10">
         <h3 className="font-bold tracking-wide" style={{ color: theme.textMain, transform: `translate(${cfg.spInsightTitleX}px, ${cfg.spInsightTitleY}px)`, fontSize: `${cfg.spInsightTitleSize}px` }}>สรุปผลงานล่าสุด (Latest Insight)</h3>
         <p className="font-medium opacity-60 mt-1" style={{ color: theme.textSub, transform: `translate(${cfg.spInsightSubX}px, ${cfg.spInsightSubY}px)`, fontSize: `${cfg.spInsightSubSize}px` }}>เทียบการสอบรอบล่าสุด กับรอบก่อนหน้า</p>
       </div>
       <div className="flex flex-col md:flex-row gap-6 w-full relative z-10" style={{ transform: `translate(${cfg.spInsightCardsX}px, ${cfg.spInsightCardsY}px)` }}>
          {renderCard(scoreData)}
          {renderCard(timeData)}
          {renderCard(marksData)}
       </div>
    </div>
  );
});

const RecentScoreChartWidget = memo(({ history, themeVals, targetScore, setTargetScore, cfg }) => {
  const { bg, theme, raisedGradient, shadowOuter, shadowDeepInset } = themeVals;

  const chartData = useMemo(() => {
    if (!history || history.length === 0) return [];
    return history.slice(0, 5).reverse().map((s, idx) => {
       return {
         label: `รอบ ${s.sessionNumber || idx + 1}`,
         score: s.finalScore || 0,
         time: s.finishTime ? s.finishTime / 60 : s.totalTime / 60,
       };
    });
  }, [history]);

  if (chartData.length < 2) return null;

  const width = cfg.spTrendWidth;
  const height = cfg.spTrendHeight;
  const padX = cfg.spTrendPadX;
  const padY = cfg.spTrendPadY;
  const innerW = width - padX * 2;
  const innerH = height - padY * 2;

  const step = innerW / Math.max(1, chartData.length - 1);
  
  const points = chartData.map((d, i) => {
     const x = padX + i * step;
     const scoreY = height - padY - (d.score / 100) * innerH;
     const timeY = height - padY - (d.time / 90) * innerH; // Max time is 90 mins
     return { x, scoreY, timeY, score: d.score, time: d.time, label: d.label };
  });

  const scoreLinePath = `M ${points.map(p => `${p.x},${p.scoreY}`).join(' L ')}`;
  const timeLinePath = `M ${points.map(p => `${p.x},${p.timeY}`).join(' L ')}`;
  const areaPath = points.length > 0 
    ? `${scoreLinePath} L ${points[points.length - 1].x},${height - padY} L ${points[0].x},${height - padY} Z` 
    : '';
  
  const targetY = height - padY - ((Number(targetScore) || 0) / 100) * innerH;

  return (
    <div className="w-full p-6 lg:p-8 rounded-[2.5rem] border border-white/5 flex flex-col gap-6 relative" style={{ background: raisedGradient, boxShadow: shadowOuter, width: cfg.spTrendContainerW > 0 ? `${cfg.spTrendContainerW}px` : '100%', height: cfg.spTrendContainerH > 0 ? `${cfg.spTrendContainerH}px` : 'auto', transform: `translate(${cfg.spTrendX}px, ${cfg.spTrendY}px)` }}>
       <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4 w-full relative z-10">
         <div className="flex flex-col">
           <h3 className="font-bold tracking-wide" style={{ color: theme.textMain, transform: `translate(${cfg.spTrendTitleX}px, ${cfg.spTrendTitleY}px)`, fontSize: `${cfg.spTrendTitleSize}px` }}>Score Trend</h3>
           <p className="font-medium opacity-60 uppercase tracking-widest mt-1" style={{ color: theme.textSub, transform: `translate(${cfg.spTrendSubX}px, ${cfg.spTrendSubY}px)`, fontSize: `${cfg.spTrendSubSize}px` }}>สถิติคะแนนและเวลาที่ใช้เทียบกับเป้าหมาย</p>
         </div>
         
         <div className="flex items-center gap-4 sm:gap-6 shrink-0 flex-wrap justify-end relative z-10" style={{ transform: `translate(${cfg.spTrendInputX}px, ${cfg.spTrendInputY}px)` }}>
            {/* Legend */}
            <div className="flex items-center gap-3 hidden sm:flex">
               <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-0.5 rounded-full" style={{ background: '#b46bcf' }}></div>
                  <span className="text-[9px] font-bold uppercase tracking-widest opacity-80" style={{ color: theme.textSub }}>Score</span>
               </div>
               <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-0.5 rounded-full border-t-2 border-dashed" style={{ borderColor: '#3b82f6' }}></div>
                  <span className="text-[9px] font-bold uppercase tracking-widest opacity-80" style={{ color: theme.textSub }}>Time (m)</span>
               </div>
            </div>

            <div className="flex items-center gap-3 px-4 py-2 rounded-2xl border border-white/5 shrink-0" style={{ background: shadowDeepInset ? 'transparent' : bg, boxShadow: shadowDeepInset }}>
               <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-0.5 rounded-full" style={{ background: '#10b981' }}></div>
                  <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: theme.textSub }}>Target</span>
               </div>
               <input 
                 type="number" 
                 min="0" 
                 max="100" 
                 value={targetScore} 
                 onChange={(e) => setTargetScore(e.target.value === '' ? '' : Math.min(100, Math.max(0, Number(e.target.value))))} 
                 className="w-14 bg-transparent text-right outline-none font-black text-xl transition-colors focus:text-emerald-400"
                 style={{ color: '#10b981' }}
                 placeholder="80"
               />
            </div>
         </div>
       </div>
       
       <div className="w-full overflow-x-auto no-scrollbar relative z-10" style={{ transform: `translate(${cfg.spTrendSvgX}px, ${cfg.spTrendSvgY}px)` }}>
          <div className="min-w-[500px]">
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
              <defs>
                <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#b46bcf" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#b46bcf" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              {[0, 25, 50, 75, 100].map(v => {
                const y = height - padY - (v/100) * innerH;
                return (
                  <g key={v}>
                    <text x={padX - 15} y={y + 4} textAnchor="end" fill={theme.textSub} fontSize="10" opacity="0.6" className="font-mono">{v}</text>
                    <line x1={padX} y1={y} x2={width-padX} y2={y} stroke={theme.textMain} strokeOpacity={v===0?0.2:0.05} strokeWidth="1" strokeDasharray={v===0?"none":"4 4"} />
                  </g>
                )
              })}

              {/* Target Score Line */}
              {Number(targetScore) > 0 && (
                <line x1={padX} y1={targetY} x2={width-padX} y2={targetY} stroke="#10b981" strokeOpacity="0.5" strokeWidth="1.5" />
              )}

              {points.length > 0 && (
                <path d={areaPath} fill="url(#trendGradient)" />
              )}

              {/* Time Line (Dashed) */}
              <path d={timeLinePath} fill="none" stroke="#3b82f6" strokeWidth={cfg.spTrendStroke * 0.8} strokeLinecap="round" strokeLinejoin="round" strokeDasharray="6 6" style={{ filter: 'drop-shadow(0 4px 6px rgba(59,130,246,0.3))' }} />

              {/* Score Line (Solid) */}
              <path d={scoreLinePath} fill="none" stroke="#b46bcf" strokeWidth={cfg.spTrendStroke} strokeLinecap="round" strokeLinejoin="round" style={{ filter: 'drop-shadow(0 4px 6px rgba(180,107,207,0.3))' }} />

              {points.map((p, i) => {
                const isScoreAbove = p.scoreY <= p.timeY;
                return (
                  <g key={`pt-${i}`}>
                    {i === points.length - 1 && (
                      <rect x={p.x - 20} y={padY/2} width="40" height={height - padY} fill="#b46bcf" opacity="0.05" rx="8" />
                    )}
                    
                    {/* Time Dot & Text */}
                    <circle cx={p.x} cy={p.timeY} r={cfg.spTrendDotR * 0.8} fill={theme.bg} stroke="#3b82f6" strokeWidth="2" />
                    <text 
                      x={p.x} 
                      y={isScoreAbove ? p.timeY + 16 : p.timeY - 10} 
                      textAnchor="middle" 
                      fill="#3b82f6" 
                      fontSize={cfg.spTrendValSize * 0.85} 
                      fontWeight="bold"
                    >
                      {p.time.toFixed(1)}
                    </text>

                    {/* Score Dot & Text */}
                    <circle cx={p.x} cy={p.scoreY} r={cfg.spTrendDotR} fill={theme.bg} stroke="#b46bcf" strokeWidth="2.5" />
                    <text 
                      x={p.x} 
                      y={isScoreAbove ? p.scoreY - 12 : p.scoreY + 18} 
                      textAnchor="middle" 
                      fill={theme.textMain} 
                      fontSize={cfg.spTrendValSize} 
                      fontWeight="bold"
                    >
                      {p.score}
                    </text>
                    
                    <text x={p.x} y={height - 10} textAnchor="middle" fill={theme.textSub} fontSize={cfg.spTrendLblSize} fontWeight="bold" className="uppercase tracking-wider">{p.label}</text>
                  </g>
                );
              })}
            </svg>
          </div>
       </div>
    </div>
  );
});

const SHORT_LABELS = {
  s1: 'Short Conv', s2: 'Long Conv', s3: 'Ads', s4: 'Review',
  s5: 'News', s6: 'Graph', s7: 'Article', s8: 'Text Comp', s9: 'Para Org'
};

const TopTagsWidget = memo(({ history, themeVals, cfg }) => {
  const { theme, raisedGradient, shadowOuter, indentedGradient, shadowDeepInset } = themeVals;

  const topTags = useMemo(() => {
    if (!history || history.length === 0) return [];
    const counts = {};
    history.forEach(session => {
      if (session.pointsData) {
        session.pointsData.forEach(point => {
          if (point.tags) {
            point.tags.forEach(tag => {
              counts[tag] = (counts[tag] || 0) + 1;
            });
          }
        });
      }
    });
    return Object.entries(counts)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);
  }, [history]);

  if (history.length < 1) return null;

  return (
    <div className="w-full p-6 lg:p-8 rounded-[2.5rem] border border-white/5 flex flex-col gap-6 relative" style={{ background: raisedGradient, boxShadow: shadowOuter, width: cfg.spBarContainerW > 0 ? `${cfg.spBarContainerW}px` : '100%', height: cfg.spBarContainerH > 0 ? `${cfg.spBarContainerH}px` : 'auto', transform: `translate(${cfg.spBarX}px, ${cfg.spBarY}px)` }}>
       <div className="flex flex-col border-b border-white/10 pb-4 relative z-10">
         <h3 className="font-bold tracking-wide" style={{ color: theme.textMain, transform: `translate(${cfg.spBarTitleX}px, ${cfg.spBarTitleY}px)`, fontSize: `${cfg.spBarTitleSize}px` }}>Top 3 Marked Tags</h3>
         <p className="font-medium opacity-60 uppercase tracking-widest mt-1" style={{ color: theme.textSub, transform: `translate(${cfg.spBarSubX}px, ${cfg.spBarSubY}px)`, fontSize: `${cfg.spBarSubSize}px` }}>3 อันดับจุดลังเลที่ถูกบันทึกบ่อยที่สุด</p>
       </div>

       <div className="w-full flex-1 flex flex-col justify-center relative z-10" style={{ transform: `translate(${cfg.spBarSvgX}px, ${cfg.spBarSvgY}px)` }}>
         {topTags.length === 0 ? (
           <div className="w-full h-full flex flex-col items-center justify-center opacity-40 font-medium pb-4" style={{ color: theme.textSub }}>
             <Tag size={32} className="mb-2 opacity-50" />
             <span>ยังไม่มีการบันทึกแท็กในประวัติ</span>
           </div>
         ) : (
           <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
             {topTags.map((t, i) => {
                const colors = ['#f59e0b', '#94a3b8', '#d97706'];
                const rankColor = colors[i] || theme.textHighlight;
                return (
                   <div key={t.tag} className="flex-1 rounded-[1.5rem] border border-white/5 p-5 lg:p-6 flex flex-col items-center justify-center relative overflow-hidden" style={{ background: indentedGradient, boxShadow: shadowDeepInset }}>
                     <div className="absolute top-0 right-0 w-16 h-16 rounded-bl-full opacity-10 pointer-events-none" style={{ background: rankColor }}></div>
                     <div className="flex items-center gap-2 mb-3">
                       <Award size={24} color={rankColor} className="drop-shadow-md" />
                       <span className="text-xl font-black drop-shadow-sm" style={{ color: rankColor }}>อันดับ {i+1}</span>
                     </div>
                     <span className="font-bold text-lg mb-1 truncate w-full text-center" style={{ color: theme.textMain }}>{t.tag}</span>
                     <span className="text-[11px] font-bold uppercase tracking-widest opacity-60" style={{ color: theme.textSub }}>{t.count} ครั้ง</span>
                   </div>
                )
             })}
           </div>
         )}
       </div>
    </div>
  );
});

const TopMarkedPartsWidget = memo(({ history, themeVals, cfg }) => {
  const { theme, raisedGradient, shadowOuter, indentedGradient, shadowDeepInset } = themeVals;

  const topParts = useMemo(() => {
    if (!history || history.length === 0) return [];
    const counts = {};
    history.forEach(session => {
      if (session.pointsData) {
        session.pointsData.forEach(point => {
          if (point.partName) {
            counts[point.partName] = (counts[point.partName] || 0) + 1;
          }
        });
      }
    });
    return Object.entries(counts)
      .map(([part, count]) => ({ part, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);
  }, [history]);

  if (history.length < 1) return null;

  return (
    <div className="w-full p-6 lg:p-8 rounded-[2.5rem] border border-white/5 flex flex-col gap-6 relative" style={{ background: raisedGradient, boxShadow: shadowOuter, width: cfg.spBarContainerW > 0 ? `${cfg.spBarContainerW}px` : '100%', height: cfg.spBarContainerH > 0 ? `${cfg.spBarContainerH}px` : 'auto', transform: `translate(${cfg.spBarX}px, ${cfg.spBarY}px)` }}>
       <div className="flex flex-col border-b border-white/10 pb-4 relative z-10">
         <h3 className="font-bold tracking-wide" style={{ color: theme.textMain, transform: `translate(${cfg.spBarTitleX}px, ${cfg.spBarTitleY}px)`, fontSize: `${cfg.spBarTitleSize}px` }}>Top 3 Marked Sections</h3>
         <p className="font-medium opacity-60 uppercase tracking-widest mt-1" style={{ color: theme.textSub, transform: `translate(${cfg.spBarSubX}px, ${cfg.spBarSubY}px)`, fontSize: `${cfg.spBarSubSize}px` }}>3 อันดับพาร์ทย่อยที่ถูกกดลังเลและ Mark บ่อยที่สุด</p>
       </div>

       <div className="w-full flex-1 flex flex-col justify-center relative z-10" style={{ transform: `translate(${cfg.spBarSvgX}px, ${cfg.spBarSvgY}px)` }}>
         {topParts.length === 0 ? (
           <div className="w-full h-full flex flex-col items-center justify-center opacity-40 font-medium pb-4" style={{ color: theme.textSub }}>
             <Asterisk size={32} className="mb-2 opacity-50" />
             <span>ยังไม่มีการ Mark ในประวัติ</span>
           </div>
         ) : (
           <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
             {topParts.map((t, i) => {
                const colors = ['#ef4444', '#f43f5e', '#fb7185'];
                const rankColor = colors[i] || theme.textHighlight;
                return (
                   <div key={t.part} className="flex-1 rounded-[1.5rem] border border-white/5 p-5 lg:p-6 flex flex-col items-center justify-center relative overflow-hidden" style={{ background: indentedGradient, boxShadow: shadowDeepInset }}>
                     <div className="absolute top-0 right-0 w-16 h-16 rounded-bl-full opacity-10 pointer-events-none" style={{ background: rankColor }}></div>
                     <div className="flex items-center gap-2 mb-3">
                       <Asterisk size={24} color={rankColor} className="drop-shadow-md" />
                       <span className="text-xl font-black drop-shadow-sm" style={{ color: rankColor }}>อันดับ {i+1}</span>
                     </div>
                     <span className="font-bold text-[13px] md:text-[14px] mb-1 truncate w-full text-center" style={{ color: theme.textMain }}>{t.part}</span>
                     <span className="text-[11px] font-bold uppercase tracking-widest opacity-60" style={{ color: theme.textSub }}>{t.count} ครั้ง</span>
                   </div>
                )
             })}
           </div>
         )}
       </div>
    </div>
  );
});

const SubPartHeatmapWidget = memo(({ history, themeVals, cfg, onPartClick }) => {
  const { bg, theme, raisedGradient, shadowOuter } = themeVals;
  const isDarkMode = theme.bg === "#1e2229";

  const sessions = useMemo(() => {
    if (!history || history.length === 0) return [];
    return history.slice(0, 5).reverse();
  }, [history]);

  const getHeatmapColor = (percent) => {
    if (percent === null || percent === undefined || isNaN(percent)) return isDarkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)';
    if (percent >= 75) return '#10b981'; // ดีเยี่ยม (เขียว)
    if (percent >= 50) return '#f59e0b'; // พอได้ (ส้ม)
    return '#ef4444'; // ปรับปรุง (แดง)
  };

  if (sessions.length < 1) return null;

  return (
    <div className="w-full p-6 lg:p-8 rounded-[2.5rem] border border-white/5 flex flex-col gap-6 relative" style={{ background: raisedGradient, boxShadow: shadowOuter, width: cfg.spHeatContainerW > 0 ? `${cfg.spHeatContainerW}px` : '100%', height: cfg.spHeatContainerH > 0 ? `${cfg.spHeatContainerH}px` : 'auto', transform: `translate(${cfg.spHeatX}px, ${cfg.spHeatY}px)` }}>
       <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 z-10 border-b border-white/10 pb-4 relative">
         <div className="flex flex-col">
           <h3 className="font-bold tracking-wide" style={{ color: theme.textMain, transform: `translate(${cfg.spHeatTitleX}px, ${cfg.spHeatTitleY}px)`, fontSize: `${cfg.spHeatTitleSize}px` }}>Performance Heatmap</h3>
           <p className="font-medium opacity-60 uppercase tracking-widest mt-1" style={{ color: theme.textSub, transform: `translate(${cfg.spHeatSubX}px, ${cfg.spHeatSubY}px)`, fontSize: `${cfg.spHeatSubSize}px` }}>คลิกที่ชื่อพาร์ทเพื่อดูคัมภีร์เทคนิคการทำข้อสอบ</p>
         </div>
         <div className="flex flex-col items-start lg:items-end gap-1.5" style={{ transform: `translate(${cfg.spHeatLegX}px, ${cfg.spHeatLegY}px)` }}>
            <div className="flex items-center gap-2">
               <div className="flex flex-col items-center gap-1"><span className="text-[9px] font-mono opacity-60" style={{ color: theme.textMain }}>ปรับปรุง</span><div className="w-8 h-3 rounded-sm bg-[#ef4444]"></div></div>
               <div className="flex flex-col items-center gap-1"><span className="text-[9px] font-mono opacity-60" style={{ color: theme.textMain }}>พอได้</span><div className="w-8 h-3 rounded-sm bg-[#f59e0b]"></div></div>
               <div className="flex flex-col items-center gap-1"><span className="text-[9px] font-mono opacity-60" style={{ color: theme.textMain }}>ดีเยี่ยม</span><div className="w-8 h-3 rounded-sm bg-[#10b981]"></div></div>
            </div>
         </div>
       </div>

       <div className="w-full overflow-x-auto no-scrollbar relative z-10" style={{ transform: `translate(${cfg.spHeatSvgX}px, ${cfg.spHeatSvgY}px)` }}>
          <div className="min-w-[400px]">
             <div className="flex gap-2 mb-2">
                <div className="shrink-0" style={{ width: `${cfg.spHeatLblW}px` }}></div>
                {sessions.map(s => (
                   <div key={s.id} className="flex-1 text-center flex flex-col justify-end pb-1">
                      <span className="font-bold uppercase tracking-wider" style={{ color: theme.textMain, fontSize: `${cfg.spHeatLblSize}px` }}>รอบ {s.sessionNumber}</span>
                   </div>
                ))}
             </div>
             
             <div className="flex flex-col gap-2">
                 {FLAT_EXAM_SUBS.map(sub => (
                    <div key={sub.id} className="flex gap-2 items-center group cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 rounded-xl p-1 -ml-1 transition-colors" onClick={() => onPartClick(sub.id)}>
                       <div className="shrink-0 font-bold uppercase tracking-wider text-right pr-1 leading-tight group-hover:text-blue-500 transition-colors" style={{ color: theme.textSub, width: `${cfg.spHeatLblW}px`, fontSize: `${cfg.spHeatLblSize}px` }} title={`คลิกเพื่อดูเทคนิคทำพาร์ท ${sub.label}`}>
                          {SHORT_LABELS[sub.id]}
                       </div>
                       {sessions.map(s => {
                          const scoreRaw = s.scores?.[sub.id];
                          const percent = (scoreRaw !== '' && scoreRaw !== undefined) ? (Number(scoreRaw) / sub.max) * 100 : null;
                          return (
                             <div 
                               key={`${sub.id}-${s.id}`} 
                               className="flex-1 rounded-[6px] sm:rounded-lg flex items-center justify-center"
                               style={{ backgroundColor: getHeatmapColor(percent), height: `${cfg.spHeatBoxH}px` }}
                             >
                                {percent !== null && (
                                   <span className="font-bold text-white drop-shadow-md" style={{ fontSize: `${cfg.spHeatValSize}px` }}>
                                      {scoreRaw}/{sub.max}
                                   </span>
                                )}
                             </div>
                          )
                       })}
                    </div>
                 ))}
             </div>
          </div>
       </div>
    </div>
  );
});

function TechniqueHubView({ themeVals, setCurrentView, history, cfg, onPartClick }) {
  const { bg, theme, shadowPlateau, shadowOuter, raisedGradient, indentedGradient, shadowDeepInset, shadowCap, shadowTrench } = themeVals;

  // คำนวณคะแนนเฉลี่ยแต่ละพาร์ทจาก History
  const averages = useMemo(() => {
    const result = {};
    FLAT_EXAM_SUBS.forEach(sub => {
      let totalRaw = 0;
      let validCount = 0;
      history.forEach(s => {
        const scoreRaw = s.scores?.[sub.id];
        if (scoreRaw !== '' && scoreRaw !== undefined && scoreRaw !== null) {
          totalRaw += Number(scoreRaw);
          validCount++;
        }
      });
      if (validCount > 0) {
        result[sub.id] = (totalRaw / validCount) / sub.max * 100;
      } else {
        result[sub.id] = null;
      }
    });
    return result;
  }, [history]);

  return (
    <div className="mt-24 mb-10 w-full px-4 flex flex-col z-10 animate-in fade-in slide-in-from-bottom-8 duration-300 mx-auto max-w-6xl gap-8">
      <div className="flex justify-between items-center bg-white/5 p-6 rounded-3xl border border-white/10" style={{ background: raisedGradient, boxShadow: shadowPlateau }}>
        <div className="flex items-center gap-4">
          <button onClick={() => setCurrentView('timer')} className="w-12 h-12 rounded-full flex items-center justify-center transition-all active:scale-95 border border-white/5 shrink-0" style={{ background: bg, boxShadow: shadowOuter, color: theme.textMain }}>
            <ArrowLeft size={18} />
          </button>
          <div className="flex flex-col min-w-0">
            <h2 className="text-xl font-bold tracking-wide truncate" style={{ color: theme.textMain }}>Technique Hub</h2>
            <p className="text-xs font-medium opacity-60 uppercase tracking-widest mt-1 truncate" style={{ color: theme.textSub }}>คัมภีร์เทคนิคการทำข้อสอบ 9 พาร์ท</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {FLAT_EXAM_SUBS.map(sub => {
          const percent = averages[sub.id];
          const needsImprovement = percent !== null && percent < 50;
          const isExcellent = percent !== null && percent >= 75;
          
          let statusColor = theme.textHighlight;
          let statusText = "ไม่มีประวัติคะแนน";
          let shadowStyle = shadowOuter;
          let bgStyle = raisedGradient;
          let StatusIcon = BookOpen;

          if (needsImprovement) {
            statusColor = '#ef4444';
            statusText = "ต้องปรับปรุง (Score < 50%)";
            StatusIcon = TrendingDown;
          } else if (isExcellent) {
            statusColor = '#10b981';
            statusText = "ทำได้ดีเยี่ยม (Score ≥ 75%)";
            StatusIcon = Award;
          } else if (percent !== null) {
            statusColor = '#f59e0b';
            statusText = "พอใช้ (Score 50-74%)";
            StatusIcon = Activity;
          }

          return (
            <div key={sub.id} onClick={() => onPartClick(sub.id)} className="p-6 rounded-[2rem] border border-white/5 flex flex-col gap-4 cursor-pointer hover:scale-[1.02] transition-transform relative overflow-hidden group" style={{ background: bgStyle, boxShadow: shadowStyle }}>
              {needsImprovement && (
                <div className="absolute top-0 right-0 w-24 h-24 rounded-bl-full opacity-[0.05] pointer-events-none" style={{ background: statusColor }}></div>
              )}
              <div className="flex justify-between items-start relative z-10">
                 <div className="w-12 h-12 rounded-full flex items-center justify-center border border-white/10 shrink-0 group-hover:scale-110 transition-transform" style={{ background: indentedGradient, boxShadow: shadowTrench, color: statusColor }}>
                    <StatusIcon size={20} />
                 </div>
                 <span className="text-[10px] font-bold px-2 py-1 rounded-full border border-white/5" style={{ background: indentedGradient, color: theme.textSub, boxShadow: shadowDeepInset }}>{sub.range}</span>
              </div>
              <div className="flex flex-col relative z-10">
                <span className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-1 truncate" style={{ color: theme.textMain }}>{sub.mainLabel}</span>
                <span className="text-lg font-bold leading-tight" style={{ color: theme.textMain }}>{sub.label}</span>
              </div>
              <div className="mt-auto pt-4 border-t border-black/5 dark:border-white/5 flex items-center gap-2 relative z-10">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: statusColor, boxShadow: `0 0 6px ${statusColor}` }}></div>
                <span className="text-[11px] font-bold tracking-wider" style={{ color: statusColor }}>{statusText}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TechniqueDetailView({ themeVals, partId, onBack, cfg }) {
  const { bg, theme, shadowPlateau, shadowOuter, raisedGradient, shadowCap, indentedGradient, shadowDeepInset } = themeVals;
  const guide = TECHNIQUE_GUIDES[partId];
  if (!guide) return null;

  return (
    <div className="mt-24 mb-10 w-full px-4 flex flex-col z-10 animate-in fade-in slide-in-from-right-8 duration-300 mx-auto max-w-4xl gap-6">
      <div className="flex justify-between items-center bg-white/5 p-6 rounded-3xl border border-white/10" style={{ background: raisedGradient, boxShadow: shadowPlateau }}>
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="w-12 h-12 rounded-full flex items-center justify-center transition-all active:scale-95 border border-white/5 shrink-0" style={{ background: bg, boxShadow: shadowOuter, color: theme.textMain }}>
            <ArrowLeft size={18} />
          </button>
          <div className="flex flex-col min-w-0">
            <h2 className="text-xl font-bold tracking-wide truncate" style={{ color: theme.textMain }}>{guide.title}</h2>
            <p className="text-xs font-medium opacity-60 uppercase tracking-widest mt-1 truncate" style={{ color: theme.textSub }}>คัมภีร์เทคนิคสอบ</p>
          </div>
        </div>
      </div>

      <div className="w-full p-6 lg:p-10 rounded-[2.5rem] border border-white/5 flex flex-col gap-6" style={{ background: bg, boxShadow: shadowOuter }}>
         <div className="flex items-center gap-4 mb-2">
            <div className="w-14 h-14 rounded-full flex items-center justify-center border border-white/10 shrink-0" style={{ background: raisedGradient, boxShadow: shadowCap }}>
              <BookOpen size={28} className="text-emerald-500 drop-shadow-md" />
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-black leading-tight" style={{ color: theme.textMain }}>Techniques & Tips</span>
              <span className="text-sm font-bold opacity-50 uppercase tracking-widest mt-1" style={{ color: theme.textSub }}>เทคนิคการทำโจทย์</span>
            </div>
         </div>

         <div className="flex flex-col gap-4 mt-2">
            {guide.tips.map((tip, idx) => (
              <div key={idx} className="flex gap-4 p-5 md:p-6 rounded-[2rem] border border-white/5 items-start" style={{ background: indentedGradient, boxShadow: shadowDeepInset }}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-sm font-black mt-0.5" style={{ background: raisedGradient, color: '#10b981', boxShadow: shadowPlateau }}>
                  {idx + 1}
                </div>
                <p className="text-base md:text-lg font-medium leading-relaxed" style={{ color: theme.textMain }}>
                  {tip}
                </p>
              </div>
            ))}
         </div>
      </div>
    </div>
  );
}

function SkillProfileView({ themeVals, setCurrentView, history, targetScore, setTargetScore, cfg, onPartClick }) {
  const { bg, theme, shadowPlateau, shadowOuter, raisedGradient } = themeVals;

  return (
    <div className="mt-24 mb-10 w-full px-4 flex flex-col z-10 animate-in fade-in duration-300 mx-auto max-w-6xl gap-8">
      <div className="flex justify-between items-center bg-white/5 p-6 rounded-3xl border border-white/10" style={{ background: raisedGradient, boxShadow: shadowPlateau }}>
        <div className="flex items-center gap-4">
          <button onClick={() => setCurrentView('timer')} className="w-12 h-12 rounded-full flex items-center justify-center transition-all active:scale-95 border border-white/5 shrink-0" style={{ background: bg, boxShadow: shadowOuter, color: theme.textMain }}>
            <ArrowLeft size={18} />
          </button>
          <div className="flex flex-col min-w-0" style={{ transform: `translate(${cfg.spMainTitleGrpX}px, ${cfg.spMainTitleGrpY}px)` }}>
            <h2 className="font-bold tracking-wide truncate" style={{ color: theme.textMain, fontSize: `${cfg.spMainTitleSize}px` }}>Growth Trend & Profile</h2>
            <p className="font-medium opacity-60 uppercase tracking-widest mt-1 truncate" style={{ color: theme.textSub, fontSize: `${cfg.spMainSubSize}px` }}>สรุปและวิเคราะห์ผลการสอบ</p>
          </div>
        </div>
        <button 
          onClick={() => setCurrentView('reflection_lobby')}
          className="hidden md:flex px-6 py-3.5 rounded-full font-bold tracking-widest text-[11px] uppercase items-center gap-2 border border-white/10 transition-transform active:scale-95"
          style={{ background: raisedGradient, boxShadow: shadowOuter, color: theme.textMain }}
        >
          <History size={14} className="text-blue-500" />
          <span>History Lobby</span>
        </button>
      </div>

      <LatestInsightWidget history={history} themeVals={themeVals} cfg={cfg} />

      <RecentScoreChartWidget history={history} themeVals={themeVals} targetScore={targetScore} setTargetScore={setTargetScore} cfg={cfg} />

      {history.length < 2 && (
         <div className="w-full p-8 rounded-[2rem] border border-white/5 opacity-70 flex flex-col items-center justify-center text-center mt-4" style={{ background: raisedGradient, boxShadow: shadowPlateau, color: theme.textSub }}>
            <TrendingUp size={48} className="mb-4 opacity-20" />
            <span className="text-lg font-bold" style={{ color: theme.textMain }}>ข้อมูลยังไม่เพียงพอสำหรับการเปรียบเทียบ</span>
            <span className="text-xs mt-2 uppercase tracking-widest">ต้องมีการทำข้อสอบอย่างน้อย 2 รอบเพื่อดูความเปลี่ยนแปลง</span>
         </div>
      )}

      {history.length >= 2 && (
         <div className="w-full flex flex-col gap-6">
           <TopTagsWidget history={history} themeVals={themeVals} cfg={cfg} />
           <TopMarkedPartsWidget history={history} themeVals={themeVals} cfg={cfg} />
           <SubPartHeatmapWidget history={history} themeVals={themeVals} cfg={cfg} onPartClick={onPartClick} />
         </div>
      )}

      <button 
        onClick={() => setCurrentView('reflection_lobby')}
        className="md:hidden w-full py-5 rounded-[2rem] font-bold tracking-[0.15em] text-[13px] uppercase flex justify-center items-center gap-3 border border-white/10 transition-transform active:scale-[0.98]"
        style={{ background: raisedGradient, boxShadow: shadowOuter, color: theme.textMain }}
      >
        <History size={18} className="text-blue-500" />
        <span>View History Lobby</span>
      </button>
    </div>
  );
}

function ReflectionLobby({ themeVals, setCurrentView, reflectionHistory, setActiveSessionId, deleteHistory }) {
  const { bg, theme, shadowPlateau, shadowOuter, raisedGradient, shadowDeepInset, shadowCap, indentedGradient } = themeVals;
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  return (
    <div className="mt-24 mb-10 w-full px-4 flex flex-col z-10 animate-in fade-in slide-in-from-right-8 duration-300 mx-auto max-w-5xl gap-6">
      
      <div className="flex justify-between items-center bg-white/5 p-6 rounded-3xl border border-white/10" style={{ background: raisedGradient, boxShadow: shadowPlateau }}>
        <div className="flex items-center gap-4">
          <button onClick={() => setCurrentView('skill_profile')} className="w-12 h-12 rounded-full flex items-center justify-center transition-all active:scale-95 border border-white/5 shrink-0" style={{ background: bg, boxShadow: shadowOuter, color: theme.textMain }}>
            <ArrowLeft size={18} />
          </button>
          <div className="flex flex-col min-w-0">
            <h2 className="text-xl font-bold tracking-wide truncate" style={{ color: theme.textMain }}>Reflection History</h2>
            <p className="text-xs font-medium opacity-60 uppercase tracking-widest mt-1 truncate" style={{ color: theme.textSub }}>ประวัติการทบทวนกลยุทธ์สอบ</p>
          </div>
        </div>
      </div>

      {reflectionHistory.length === 0 ? (
        <div className="w-full flex flex-col items-center justify-center p-16 rounded-[2.5rem] border border-white/5 opacity-50" style={{ background: raisedGradient, boxShadow: shadowPlateau, color: theme.textSub }}>
          <History size={64} className="mb-4 opacity-20" />
          <p className="font-medium text-lg">ยังไม่มีประวัติการสอบ</p>
          <p className="text-sm mt-1">ข้อมูลจะถูกบันทึกเมื่อคุณทำข้อสอบจนเวลาหมดและกรอกคะแนน</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6 auto-rows-max">
          {reflectionHistory.map(session => (
            <div key={session.id} className="relative group p-4 lg:p-6 rounded-[2rem] lg:rounded-[2.5rem] border border-white/5 flex flex-col justify-between transition-all hover:scale-[1.02] cursor-pointer aspect-square" style={{ background: raisedGradient, boxShadow: shadowOuter }} onClick={() => { setActiveSessionId(session.id); setCurrentView('reflection'); }}>
              
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2 lg:gap-3 overflow-hidden">
                  <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-full shrink-0 flex items-center justify-center border border-white/10" style={{ background: bg, boxShadow: shadowCap, color: theme.textMain }}>
                    <CalendarDays size={18} />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="font-bold text-xs lg:text-sm truncate" style={{ color: theme.textMain }}>รอบ {session.sessionNumber || '?'}</span>
                    <span className="text-[8px] lg:text-[10px] font-bold uppercase tracking-wider opacity-60 truncate" style={{ color: theme.textSub }}>{session.date}</span>
                    <span className="text-[8px] font-bold uppercase opacity-40 truncate mt-0.5" style={{ color: theme.textSub }}>{MODES[session.mode]?.label || session.mode}</span>
                  </div>
                </div>
                <button onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(session.id); }} className="w-8 h-8 shrink-0 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 hover:text-red-500 transition-all border border-white/5" style={{ background: bg, boxShadow: shadowPlateau, color: theme.textSub }}>
                  <Trash2 size={14} />
                </button>
              </div>

              <div className="flex flex-col gap-2 mt-auto">
                <div className="px-3 py-2 lg:px-4 lg:py-3 rounded-2xl flex items-center justify-between gap-1 border border-white/5" style={{ background: shadowDeepInset ? 'transparent' : bg, boxShadow: shadowDeepInset }}>
                  <span className="text-[9px] lg:text-[10px] uppercase font-bold tracking-widest opacity-60" style={{ color: theme.textSub }}>Score</span>
                  <span className="text-lg lg:text-2xl font-black" style={{ color: session.finalScore >= 50 ? '#10b981' : (session.finalScore > 0 ? '#f87171' : theme.textMain) }}>{session.finalScore > 0 ? session.finalScore : '-'}</span>
                </div>
                <div className="px-3 py-2 lg:px-4 lg:py-3 rounded-2xl flex items-center justify-between gap-1 border border-white/5" style={{ background: shadowDeepInset ? 'transparent' : bg, boxShadow: shadowDeepInset }}>
                  <span className="text-[9px] lg:text-[10px] uppercase font-bold tracking-widest opacity-60" style={{ color: theme.textSub }}>Marks</span>
                  <span className="text-lg lg:text-2xl font-black" style={{ color: '#ea580c' }}>{session.pointsData?.length || 0}</span>
                </div>
              </div>

            </div>
          ))}
        </div>
      )}

      {confirmDeleteId && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/20 backdrop-blur-md px-4 animate-in fade-in duration-200">
          <div className="p-6 rounded-[2rem] max-w-sm w-full border border-white/10 flex flex-col items-center text-center animate-in zoom-in-95 duration-200" style={{ background: bg, boxShadow: shadowOuter }}>
             <h3 className="text-lg font-bold mb-2" style={{color: theme.textMain}}>ลบประวัติการสอบ?</h3>
             <p className="text-sm mb-6 opacity-70" style={{color: theme.textSub}}>ประวัติการสอบและบันทึก Reflection ในรอบนี้จะถูกลบถาวร ไม่สามารถกู้คืนได้</p>
             <div className="flex w-full gap-3">
                <button onClick={() => setConfirmDeleteId(null)} className="flex-1 py-3.5 rounded-2xl font-bold opacity-70 border border-white/10 hover:opacity-100 transition-opacity" style={{color: theme.textMain, background: indentedGradient}}>ยกเลิก</button>
                <button onClick={() => { deleteHistory(confirmDeleteId); setConfirmDeleteId(null); }} className="flex-1 py-3.5 rounded-2xl font-bold text-white shadow-lg transition-transform active:scale-95" style={{background: '#ef4444'}}>ยืนยันลบ</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}

function NoteInputArea({ initialNote, onSave, onClose, themeVals, cfg }) {
  const [val, setVal] = useState(initialNote || '');
  const { bg, theme, shadowDeepInset } = themeVals;

  const handleBlur = () => {
      onSave(val);
  };

  return (
      <div className="animate-in fade-in slide-in-from-top-2 duration-300 w-full mt-2">
          <textarea
              value={val}
              onChange={e => setVal(e.target.value)}
              onBlur={handleBlur}
              placeholder="บันทึกข้อผิดพลาด หรือความคิดในตอนนั้น..."
              className="w-full rounded-2xl outline-none resize-none placeholder:opacity-30 border transition-colors focus:border-blue-400/50"
              style={{ fontSize: `${cfg.refNoteSize}px`, padding: `${cfg.refNoteSize}px`, height: `${cfg.refNoteSize * 6}px`, background: bg, color: theme.textMain, borderColor: theme.trackBg, boxShadow: shadowDeepInset }}
              autoFocus
          />
          <div className="flex justify-end mt-2">
              <button onClick={onClose} className="font-bold uppercase tracking-wider opacity-60 transition-opacity" style={{ fontSize: `${cfg.refNoteSize - 2}px`, color: theme.textSub }}>ปิดช่องบันทึก</button>
          </div>
      </div>
  )
}

function ManageTagsPanel({ customTags, setCustomTags, themeVals, cfg, isManageTagsOpen }) {
  const [newTagInput, setNewTagInput] = useState('');
  const { bg, theme, shadowPlateau, shadowOuter, raisedGradient, shadowDeepInset, indentedGradient, shadowTrench } = themeVals;

  if (!isManageTagsOpen) return null;

  const handleAddCustomTag = (e) => {
    e.preventDefault();
    const trimmed = newTagInput.trim();
    if (!trimmed) return;
    const finalTag = trimmed.startsWith('#') ? trimmed : `#${trimmed}`;
    if (!customTags.includes(finalTag)) setCustomTags([...customTags, finalTag]);
    setNewTagInput('');
  };

  const handleDeleteTag = (tagToDelete) => {
    setCustomTags(customTags.filter(t => t !== tagToDelete));
  };

  const tagShadow = `inset 2px 2px ${cfg.refTagShadow}px ${theme.shadowDark}, inset -2px -2px ${cfg.refTagShadow}px ${theme.shadowLight}`;
  
  const renderTag = (tag, onClick) => (
    <button
      key={tag}
      onClick={onClick}
      className="font-bold flex items-center justify-center border border-white/5 opacity-60 transition-opacity hover:opacity-100"
      style={{ 
        fontSize: `${cfg.refTagSize}px`,
        padding: `${cfg.refTagSize/2}px ${cfg.refTagSize}px`,
        color: theme.textMain, 
        background: indentedGradient,
        boxShadow: tagShadow,
        borderRadius: `${cfg.dropRadius}px`
      }}
    >
      {tag}
      <X size={cfg.refTagSize * 0.8} className="ml-1.5 opacity-50" />
    </button>
  );

  return (
    <div className="p-6 rounded-3xl border border-white/5 flex flex-col gap-4 animate-in slide-in-from-top-4 fade-in duration-300 w-full" style={{ background: raisedGradient, boxShadow: shadowPlateau }}>
      <span className="text-[10px] uppercase font-bold tracking-widest" style={{ color: theme.textHighlight }}>Manage Custom Tags</span>
      <form onSubmit={handleAddCustomTag} className="flex gap-2">
        <input 
          type="text" 
          value={newTagInput} 
          onChange={(e) => setNewTagInput(e.target.value)} 
          placeholder="พิมพ์แท็กใหม่แล้วกด Enter..." 
          className="flex-1 rounded-xl px-4 py-2.5 text-xs font-medium outline-none placeholder:opacity-30 border transition-colors focus:border-blue-400/50"
          style={{ background: bg, color: theme.textMain, borderColor: theme.trackBg, boxShadow: shadowDeepInset }}
        />
        <button type="submit" className="w-10 h-10 shrink-0 rounded-xl flex items-center justify-center border border-white/10 transition-transform active:scale-95" style={{ background: bg, boxShadow: shadowOuter, color: theme.textMain }}>
          <Plus size={16} />
        </button>
      </form>
      <div className="flex flex-wrap" style={{ gap: `${cfg.refItemGap}px` }}>
        {customTags.map(tag => renderTag(tag, () => handleDeleteTag(tag)))}
      </div>
    </div>
  );
}

function ReflectionCardItem({ point, index, customTags, themeVals, cfg, onUpdatePoint, sessionId }) {
  const [isNoteExpanded, setIsNoteExpanded] = useState(false);
  const { bg, theme, shadowPlateau, raisedGradient, shadowDeepInset, indentedGradient, shadowTrench } = themeVals;

  const [qCurr, qTot] = point.qText.split('/');
  const rightColShadow = `inset 4px 4px ${cfg.refRightColShadow}px ${theme.shadowDark}, inset -4px -4px ${cfg.refRightColShadow}px ${theme.shadowLight}`;
  const tagShadow = `inset 2px 2px ${cfg.refTagShadow}px ${theme.shadowDark}, inset -2px -2px ${cfg.refTagShadow}px ${theme.shadowLight}`;

  const handleTagClick = useCallback((tag) => {
      const isActive = point.tags.includes(tag);
      const newTags = isActive ? point.tags.filter(t => t !== tag) : [...point.tags, tag];
      onUpdatePoint(sessionId, point.id, 'tags', newTags);
  }, [point.tags, point.id, sessionId, onUpdatePoint]);

  const renderTag = (tag, isActive, onClick) => (
    <button
      key={tag}
      onClick={onClick}
      className={`font-bold flex items-center justify-center border border-white/5 transition-opacity ${isActive ? 'opacity-100' : 'opacity-60 hover:opacity-100'}`}
      style={{ 
        fontSize: `${cfg.refTagSize}px`,
        padding: `${cfg.refTagSize/2}px ${cfg.refTagSize}px`,
        color: theme.textMain, 
        background: indentedGradient,
        boxShadow: isActive ? shadowTrench : tagShadow,
        borderRadius: `${cfg.dropRadius}px`
      }}
    >
      {tag}
    </button>
  );

  return (
    <div className="w-full flex rounded-[2rem] border border-white/5 overflow-hidden relative z-10" style={{ background: raisedGradient, boxShadow: shadowPlateau, height: cfg.refCardHeight > 0 ? `${cfg.refCardHeight}px` : 'auto' }}>
      <div className="flex-1 flex flex-col border-r border-black/5" style={{ padding: `${cfg.refCardPadding}px`, gap: `${cfg.refItemGap}px`, borderColor: theme.bg === "#1e2229" ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.05)', lineHeight: cfg.refLineHeight }}>
        
        <div className="flex justify-between items-center w-full" style={{ fontFamily: "'Outfit', 'Prompt', sans-serif" }}>
          <div className="flex items-center opacity-50" style={{ color: theme.textMain, gap: `${cfg.refItemGap/2}px`, transform: `translate(${cfg.refTimeX}px, ${cfg.refTimeY}px)` }}>
            <Clock size={cfg.refIconSize} />
            <span style={{ fontSize: `${cfg.refTimeSize}px`, fontWeight: 'bold', letterSpacing: '0.05em' }}>{point.timestamp}</span>
          </div>
          {qCurr && qTot && (
            <div style={{ color: theme.textMain, fontSize: `${cfg.refQTextSize}px`, fontWeight: 900, transform: `translate(${cfg.refQTextX}px, ${cfg.refQTextY}px)` }}>
              {qCurr}<span style={{ fontSize: `${cfg.refQTextSize * 0.6}px`, opacity: 0.5, fontWeight: 'bold' }}>/{qTot}</span>
            </div>
          )}
        </div>

        <h3 style={{ color: theme.textMain, fontSize: `${cfg.refPartSize}px`, fontWeight: 'bold', letterSpacing: '0.025em', transform: `translate(${cfg.refPartX}px, ${cfg.refPartY}px)` }}>
          {point.partName}
        </h3>

        <div className="w-full h-[1px] opacity-10" style={{ background: theme.textMain }} />

        <div className="flex flex-wrap" style={{ gap: `${cfg.refItemGap}px`, transform: `translate(${cfg.refTagX}px, ${cfg.refTagY}px)` }}>
          {customTags.map(tag => renderTag(tag, point.tags.includes(tag), () => handleTagClick(tag)))}
        </div>

        <div style={{ transform: `translate(${cfg.refNoteX}px, ${cfg.refNoteY}px)` }}>
          {isNoteExpanded ? (
            <NoteInputArea initialNote={point.note} onSave={(val) => onUpdatePoint(sessionId, point.id, 'note', val)} onClose={() => setIsNoteExpanded(false)} themeVals={themeVals} cfg={cfg} />
          ) : (
            <div className="flex flex-col items-start" style={{ gap: `${cfg.refItemGap/2}px` }}>
              <button 
                onClick={() => setIsNoteExpanded(true)} 
                className="font-bold flex items-center opacity-60 hover:opacity-100 transition-opacity"
                style={{ fontSize: `${cfg.refNoteSize}px`, gap: `${cfg.refItemGap/2}px`, color: point.note ? '#3b82f6' : theme.textMain }}
              >
                <MessageSquare size={cfg.refIconSize * 0.7} /> {point.note ? 'แก้ไขบันทึกย่อ' : 'เพิ่มบันทึกย่อ'}
              </button>
              {point.note && (
                <p className="opacity-70 italic border-l-2 border-blue-500/30 pl-2 ml-1 mt-1" style={{ fontSize: `${cfg.refNoteSize}px`, color: theme.textSub }}>
                  "{point.note.length > 60 ? point.note.substring(0, 60) + '...' : point.note}"
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="shrink-0 flex flex-col items-center justify-center relative border-l border-white/5" style={{ width: `${cfg.refRightColWidth}px`, gap: `${cfg.refItemGap}px`, background: indentedGradient, boxShadow: rightColShadow }}>
        <Asterisk size={cfg.refAsteriskSize} strokeWidth={2.5} className="text-[#ea580c] relative z-10 drop-shadow-md" style={{ transform: `translate(${cfg.refAsteriskX}px, ${cfg.refAsteriskY}px)` }} />
        <span className="font-black uppercase tracking-widest opacity-40 relative z-10" style={{ color: theme.textMain, fontSize: `${cfg.refMarkSize}px`, fontFamily: "'Outfit', 'Prompt', sans-serif", transform: `translate(${cfg.refMarkX}px, ${cfg.refMarkY}px)` }}>Mark {index + 1}</span>
      </div>
    </div>
  );
}

function ScoreEditView({ themeVals, sessionData, onSave, onCancel, cfg }) {
  const { bg, theme, shadowPlateau, shadowOuter, raisedGradient, shadowDeepInset, indentedGradient, shadowCap } = themeVals;
  const [editScoresState, setEditScoresState] = useState(sessionData?.scores || {});

  const handleEditScoreChange = useCallback((partId, val, max) => {
    const num = parseInt(val.replace(/\D/g, ''), 10);
    setEditScoresState(p => ({ ...p, [partId]: isNaN(num) ? '' : Math.min(num, max) }));
  }, []);

  const handleSaveEditedScores = () => {
    const { finalScore } = calculateScores(editScoresState);
    onSave(editScoresState, finalScore);
  };

  return (
    <div className="mt-24 mb-10 w-full px-4 flex flex-col z-10 animate-in fade-in duration-300 mx-auto max-w-4xl gap-6">
      <div className="flex justify-between items-center bg-white/5 p-6 rounded-3xl border border-white/10" style={{ background: raisedGradient, boxShadow: shadowPlateau }}>
        <div className="flex items-center gap-4">
          <button onClick={onCancel} className="w-12 h-12 rounded-full flex items-center justify-center transition-all active:scale-95 border border-white/5 shrink-0" style={{ background: bg, boxShadow: shadowOuter, color: theme.textMain }}>
            <ArrowLeft size={18} />
          </button>
          <div>
            <h2 className="text-xl font-bold tracking-wide" style={{ color: theme.textMain }}>Score Breakdown</h2>
            <p className="text-xs font-medium opacity-60 uppercase tracking-widest mt-1" style={{ color: theme.textSub }}>กรอกคะแนนรายพาร์ทย่อย 9 อัน</p>
          </div>
        </div>
      </div>

      <div className="w-full p-6 lg:p-8 rounded-[2.5rem] border border-white/5 flex flex-col gap-6" style={{ background: bg, boxShadow: shadowOuter }}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FLAT_EXAM_SUBS.map(sub => (
            <div key={sub.id} className="p-5 rounded-[1.5rem] border border-white/5 transition-colors flex flex-col justify-between" style={{ background: indentedGradient, boxShadow: shadowDeepInset }}>
              <div className="flex flex-col mb-4">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[9px] font-black uppercase tracking-widest opacity-40 truncate pr-2" style={{ color: theme.textHighlight }}>{sub.mainLabel}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border border-white/5 shrink-0" style={{ background: raisedGradient, color: theme.textSub, boxShadow: shadowPlateau }}>{sub.range}</span>
                </div>
                <span className="text-[14px] font-bold leading-snug" style={{ color: theme.textMain }}>{sub.label}</span>
              </div>
              <div className="flex items-center justify-between mt-auto pt-3 border-t border-black/5 dark:border-white/5">
                <span className="text-[10px] font-bold uppercase tracking-widest opacity-50" style={{ color: theme.textSub }}>Correct</span>
                <div className="flex items-baseline gap-1.5 shrink-0">
                  <input 
                    type="text" 
                    value={editScoresState[sub.id] ?? ''} 
                    onChange={(e) => handleEditScoreChange(sub.id, e.target.value, sub.max)}
                    placeholder="0"
                    className="w-12 text-center bg-transparent outline-none font-black text-xl border-b-2 transition-colors focus:border-blue-400 placeholder:opacity-20" 
                    style={{ color: theme.textMain, borderColor: 'transparent' }} 
                  />
                  <span className="text-[12px] font-bold opacity-40" style={{ color: theme.textSub }}>/ {sub.max}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <button 
          onClick={handleSaveEditedScores}
          className="w-full shrink-0 py-4 mt-2 rounded-[1.5rem] font-bold tracking-widest text-[13px] uppercase transition-all active:scale-[0.98] border border-white/10 shadow-lg"
          style={{ background: 'linear-gradient(145deg, #3b82f6, #2563eb)', color: '#ffffff', boxShadow: shadowPlateau }}
        >
          บันทึกการแก้ไข
        </button>
      </div>
    </div>
  );
}

function ReflectionView({ themeVals, setCurrentView, sessionData, isDraftMode, onUpdatePoint, onUpdateSessionData, onSaveDraft, onDiscardDraft, customTags, setCustomTags, cfg, onOpenScoreEdit }) {
  const { bg, theme, shadowPlateau, shadowOuter, raisedGradient, shadowDeepInset, indentedGradient, shadowTrench, shadowCap } = themeVals;
  const [isManageTagsOpen, setIsManageTagsOpen] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  if (!sessionData) return null;
  const pointsData = sessionData.pointsData || [];
  const currentCalculatedScores = calculateScores(sessionData.scores || {});

  return (
    <div className="mt-24 mb-10 w-full px-4 flex flex-col z-10 animate-in fade-in slide-in-from-bottom-8 duration-500 mx-auto" style={{ maxWidth: `${cfg.refCardMaxWidth}px`, gap: `${cfg.refCardGap}px` }}>
      
      <div className="flex justify-between items-center bg-white/5 p-6 rounded-3xl border border-white/10" style={{ background: raisedGradient, boxShadow: shadowPlateau }}>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => {
              if (isDraftMode) setShowDiscardConfirm(true);
              else setCurrentView('reflection_lobby');
            }} 
            className="w-12 h-12 rounded-full flex items-center justify-center border border-white/5 shrink-0" 
            style={{ background: bg, boxShadow: shadowOuter, color: theme.textMain }}
          >
            <ArrowLeft size={18} />
          </button>
          <div className="flex flex-col min-w-0">
            <h2 className="text-xl font-bold tracking-wide truncate" style={{ color: theme.textMain }}>
              Time Reflection รอบ {sessionData.sessionNumber || '?'}
            </h2>
            <div className="flex items-center gap-2 mt-1 text-xs font-medium opacity-80 uppercase tracking-widest truncate" style={{ color: theme.textSub }}>
              <span className="truncate">{sessionData.date}</span>
              <span className="w-1 h-1 rounded-full bg-current shrink-0"></span>
              <span className="font-bold shrink-0" style={{ color: sessionData.finalScore >= 50 ? '#10b981' : '#f87171' }}>
                SCORE: {sessionData.finalScore}/100
              </span>
              {sessionData.finishTime && (
                <>
                  <span className="w-1 h-1 rounded-full bg-current shrink-0"></span>
                  <span className="font-bold shrink-0 text-blue-400">
                    TIME: {Math.floor(sessionData.finishTime/60)}:{(Math.floor(sessionData.finishTime)%60).toString().padStart(2,'0')} M
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button 
            onClick={() => setIsManageTagsOpen(!isManageTagsOpen)}
            className={`px-4 py-2.5 rounded-full flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider border ${isManageTagsOpen ? 'border-white/20 opacity-100' : 'border-white/5 opacity-70'}`}
            style={{ background: isManageTagsOpen ? indentedGradient : bg, boxShadow: shadowOuter, color: theme.textMain }}
          >
            <Tag size={14} /> แท็ก
          </button>
        </div>
      </div>

      <div className="w-full p-6 rounded-[2rem] border border-white/5 flex flex-col gap-5 z-10 relative" style={{ background: raisedGradient, boxShadow: shadowPlateau }}>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Award size={16} className="text-blue-500" />
            <span className="text-[11px] uppercase font-bold tracking-widest" style={{ color: theme.textHighlight }}>Score Breakdown</span>
          </div>
          <button onClick={onOpenScoreEdit} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/5" style={{ background: indentedGradient, boxShadow: shadowDeepInset, color: theme.textMain }}>
            <span className="text-[9px] font-bold uppercase tracking-wider">แก้ไขคะแนนรายหัวข้อ</span>
            <ChevronRight size={12} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {EXAM_PARTS.map(part => (
            <div key={part.id} className="p-4 rounded-[1.25rem] border border-white/5 flex flex-col gap-1" style={{ background: indentedGradient, boxShadow: shadowDeepInset }}>
              <span className="text-[10px] font-bold opacity-50 uppercase tracking-widest truncate" style={{ color: theme.textSub }} title={part.label}>{part.label}</span>
              <div className="flex items-baseline gap-1 mt-1">
                 <span className="text-2xl font-black" style={{ color: theme.textMain }}>
                   {currentCalculatedScores.hasInput ? currentCalculatedScores[part.id] : '-'}
                 </span>
                 <span className="text-xs font-bold opacity-40" style={{ color: theme.textSub }}>/ {part.max}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showDiscardConfirm && (
        <div className="fixed inset-0 z-[350] flex items-center justify-center bg-black/20 backdrop-blur-md px-4 animate-in fade-in duration-200">
          <div className="p-6 rounded-[2rem] max-w-sm w-full border border-white/10 flex flex-col items-center text-center animate-in zoom-in-95 duration-200" style={{ background: bg, boxShadow: shadowOuter }}>
             <h3 className="text-lg font-bold mb-2" style={{color: theme.textMain}}>ละทิ้งบันทึกนี้?</h3>
             <p className="text-sm mb-6 opacity-70" style={{color: theme.textSub}}>หากกดละทิ้ง ข้อมูล Reflection ครั้งนี้จะไม่ถูกบันทึกลงใน History Lobby</p>
             <div className="flex w-full gap-3">
                <button onClick={() => setShowDiscardConfirm(false)} className="flex-1 py-3.5 rounded-2xl font-bold opacity-70 border border-white/10" style={{color: theme.textMain, background: indentedGradient}}>ยกเลิก</button>
                <button onClick={() => { setShowDiscardConfirm(false); onDiscardDraft(); }} className="flex-1 py-3.5 rounded-2xl font-bold text-white shadow-lg" style={{background: '#f87171'}}>ยืนยันละทิ้ง</button>
             </div>
          </div>
        </div>
      )}

      <ManageTagsPanel customTags={customTags} setCustomTags={setCustomTags} themeVals={themeVals} cfg={cfg} isManageTagsOpen={isManageTagsOpen} />

      <div className="w-full flex flex-col relative mt-4" style={{ gap: `${cfg.refCardGap}px` }}>
        {pointsData.length === 0 ? (
          <div className="text-center p-12 rounded-3xl border border-white/5 opacity-50 font-medium" style={{ color: theme.textSub, background: raisedGradient, boxShadow: shadowPlateau }}>
            ไม่มีบันทึกเวลา (Mark Point) ในรอบนี้
          </div>
        ) : (
          pointsData.map((point, index) => (
             <ReflectionCardItem 
                key={point.id} 
                point={point} 
                index={index} 
                customTags={customTags} 
                themeVals={themeVals} 
                cfg={cfg} 
                onUpdatePoint={onUpdatePoint} 
                sessionId={sessionData.id} 
             />
          ))
        )}

        {isDraftMode && (
          <button 
            onClick={onSaveDraft}
            className="w-full mt-4 mb-8 py-5 rounded-[2rem] font-bold tracking-[0.15em] text-[13px] uppercase flex justify-center items-center gap-3 border border-white/5"
            style={{ background: raisedGradient, boxShadow: shadowPlateau, color: theme.textMain }}
          >
            <History size={18} className="text-emerald-500" />
            <span>บันทึก Reflection ลงใน Lobby</span>
          </button>
        )}

      </div>
    </div>
  );
}

function DevAdjustPanel({ cfg, updateCfg, showTempDev, setShowTempDev, lcdHue, setLcdHue, trackHue, setTrackHue, lcdBrightness, setLcdBrightness, lcdScrollSpeed, setLcdScrollSpeed, lcdScrollGap, setLcdScrollGap }) {
  const renderS1 = (l, k, min, max, step=1) => (
    <div key={k} className="flex justify-between items-center">
      <label className="text-[10px] font-mono">{l}</label>
      <div className="flex items-center gap-2 w-2/3">
        <input type="range" min={min} max={max} step={step} value={cfg[k]} onChange={e=>updateCfg(k, e.target.value)} className="w-full h-1 accent-emerald-500"/>
        <span className="text-[9px] font-mono w-8 text-right">{cfg[k]}</span>
      </div>
    </div>
  );
  
  const renderS2 = (title, x, y, min="-500", max="500", step="1") => (
    <div key={title} className="flex flex-col gap-1">
      <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-1">{title} (X / Y)</span>
      <div className="flex gap-2">
        <div className="flex flex-col w-1/2 gap-1"><span className="text-[9px] font-mono text-center">{cfg[x]}px</span><input type="range" min={min} max={max} step={step} value={cfg[x]} onChange={e=>updateCfg(x, e.target.value)} className="w-full h-1 accent-orange-500"/></div>
        <div className="flex flex-col w-1/2 gap-1"><span className="text-[9px] font-mono text-center">{cfg[y]}px</span><input type="range" min={min} max={max} step={step} value={cfg[y]} onChange={e=>updateCfg(y, e.target.value)} className="w-full h-1 accent-orange-500"/></div>
      </div>
    </div>
  );

  const renderS3 = (title, s, x, y, minS=10, maxS=60, stepS=1) => (
    <div key={title} className="flex flex-col gap-1">
      <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-1">{title}</span>
      <div className="flex gap-2">
        <div className="flex flex-col w-1/3 gap-1"><span className="text-[9px] font-mono text-center">{cfg[s]}</span><input type="range" min={minS} max={maxS} step={stepS} value={cfg[s]} onChange={e=>updateCfg(s, e.target.value)} className="w-full h-1 accent-orange-500"/></div>
        <div className="flex flex-col w-1/3 gap-1"><span className="text-[9px] font-mono text-center">{cfg[x]}px</span><input type="range" min="-500" max="500" step="1" value={cfg[x]} onChange={e=>updateCfg(x, e.target.value)} className="w-full h-1 accent-orange-500"/></div>
        <div className="flex flex-col w-1/3 gap-1"><span className="text-[9px] font-mono text-center">{cfg[y]}px</span><input type="range" min="-500" max="500" step="1" value={cfg[y]} onChange={e=>updateCfg(y, e.target.value)} className="w-full h-1 accent-orange-500"/></div>
      </div>
    </div>
  );

  return (
    <div className="fixed bottom-4 left-4 z-[100] bg-slate-800 text-white p-4 rounded-xl shadow-2xl opacity-95 border border-slate-600 w-72 max-h-[85vh] overflow-y-auto no-scrollbar">
      <div className="flex justify-between items-center mb-4 border-b border-slate-600 pb-2 sticky top-0 bg-slate-800 z-10">
        <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">Dev Adjust</span>
        <button onClick={() => setShowTempDev(!showTempDev)} className="text-xs bg-slate-600 hover:bg-slate-500 px-2 py-1 rounded transition-colors">Toggle</button>
      </div>
      {showTempDev && (
        <div className="flex flex-col gap-5 mt-2">
          <div className="text-[10px] text-orange-400 font-bold border-b border-slate-600 pb-1 -mb-3">REFLECTION PAGE (Layout & Box)</div>
          <div className="flex flex-col gap-2">
            {renderS1("Card Max Width", "refCardMaxWidth", "300", "1200", "10")}
            {renderS1("Card Height", "refCardHeight", "0", "400", "10")}
            {renderS1("Right Col Width", "refRightColWidth", "50", "300", "5")}
            {renderS1("Card Padding", "refCardPadding", "0", "60", "2")}
            {renderS1("Card Gap", "refCardGap", "0", "100", "2")}
            {renderS1("Item Gap", "refItemGap", "0", "60", "1")}
            {renderS1("Line Height", "refLineHeight", "1", "3", "0.1")}
            {renderS1("Icons Base Size", "refIconSize", "10", "60", "1")}
            {renderS1("Right Col Blur", "refRightColShadow", "0", "100", "1")}
            {renderS1("Tag Blur", "refTagShadow", "0", "50", "1")}
          </div>

          <div className="text-[10px] text-orange-400 font-bold border-b border-slate-600 pb-1 -mb-3 mt-2">REFLECTION PAGE (Typography)</div>
          <div className="flex flex-col gap-2">
            {renderS3("Time (Left)", "refTimeSize", "refTimeX", "refTimeY")}
            {renderS3("Question (Right)", "refQTextSize", "refQTextX", "refQTextY")}
            {renderS3("Part Name", "refPartSize", "refPartX", "refPartY")}
            {renderS3("Tags", "refTagSize", "refTagX", "refTagY", "8", "24")}
            {renderS3("Note Editor", "refNoteSize", "refNoteX", "refNoteY", "8", "24")}
            {renderS3("Asterisk Icon", "refAsteriskSize", "refAsteriskX", "refAsteriskY", "20", "120")}
            {renderS3("Mark Text", "refMarkSize", "refMarkX", "refMarkY", "8", "24")}
          </div>

          <div className="w-full h-px bg-slate-600 mt-2"></div>
          <div className="flex flex-col gap-2"><span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mt-2">Growth Trend: Header</span>
            {renderS2("Group Pos", "spMainTitleGrpX", "spMainTitleGrpY")}
            {renderS1("Title Size", "spMainTitleSize", "10", "40")}
            {renderS1("Sub Size", "spMainSubSize", "8", "30")}
          </div>
          <div className="flex flex-col gap-2"><span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mt-2">Growth Trend: Insight</span>
            {renderS1("Box Max Width", "spInsightW", "0", "1200", "10")}
            {renderS1("Box Max Height", "spInsightH", "0", "800", "10")}
            {renderS2("Position", "spInsightX", "spInsightY")}
            {renderS2("Title Pos", "spInsightTitleX", "spInsightTitleY")}
            {renderS1("Title Size", "spInsightTitleSize", "10", "40")}
            {renderS2("Sub Pos", "spInsightSubX", "spInsightSubY")}
            {renderS1("Sub Size", "spInsightSubSize", "8", "30")}
            {renderS2("Cards Pos", "spInsightCardsX", "spInsightCardsY")}
            {renderS1("Card Padding", "spInsightPadding", "10", "50")}
            {renderS1("Label Size", "spInsightLabelSize", "8", "24")}
            {renderS1("Value Size", "spInsightValSize", "20", "80")}
            {renderS1("Unit Size", "spInsightUnitSize", "8", "24")}
            {renderS1("Diff Size", "spInsightDiffSize", "8", "20")}
          </div>
          <div className="flex flex-col gap-2"><span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mt-2">Growth Trend: Score Chart</span>
            {renderS1("Box Max Width", "spTrendContainerW", "0", "1200", "10")}
            {renderS1("Box Height", "spTrendContainerH", "0", "800", "10")}
            {renderS2("Position", "spTrendX", "spTrendY")}
            {renderS2("Title Pos", "spTrendTitleX", "spTrendTitleY")}
            {renderS1("Title Size", "spTrendTitleSize", "10", "40")}
            {renderS2("Sub Pos", "spTrendSubX", "spTrendSubY")}
            {renderS1("Sub Size", "spTrendSubSize", "8", "30")}
            {renderS2("Input Pos", "spTrendInputX", "spTrendInputY")}
            {renderS2("SVG Pos", "spTrendSvgX", "spTrendSvgY")}
            {renderS1("SVG Width", "spTrendWidth", "300", "1000", "10")}
            {renderS1("SVG Height", "spTrendHeight", "100", "500", "10")}
            {renderS1("Pad X", "spTrendPadX", "10", "100")}
            {renderS1("Pad Y", "spTrendPadY", "10", "100")}
            {renderS1("Line Stroke", "spTrendStroke", "1", "10", "0.5")}
            {renderS1("Dot Radius", "spTrendDotR", "1", "15", "0.5")}
            {renderS1("Value Text Size", "spTrendValSize", "8", "24")}
            {renderS1("Label Text Size", "spTrendLblSize", "6", "20")}
          </div>
          <div className="flex flex-col gap-2"><span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mt-2">Growth Trend: Bar Chart</span>
            {renderS1("Box Max Width", "spBarContainerW", "0", "1200", "10")}
            {renderS1("Box Height", "spBarContainerH", "0", "800", "10")}
            {renderS2("Position", "spBarX", "spBarY")}
            {renderS2("Title Pos", "spBarTitleX", "spBarTitleY")}
            {renderS1("Title Size", "spBarTitleSize", "10", "40")}
            {renderS2("Sub Pos", "spBarSubX", "spBarSubY")}
            {renderS1("Sub Size", "spBarSubSize", "8", "30")}
            {renderS2("SVG Pos", "spBarSvgX", "spBarSvgY")}
            {renderS1("SVG Width", "spBarWidth", "300", "1000", "10")}
            {renderS1("SVG Height", "spBarHeight", "100", "400", "10")}
            {renderS1("Pad Left", "spBarPadLeft", "10", "150")}
            {renderS1("Pad Right", "spBarPadRight", "10", "100")}
            {renderS1("Pad Top", "spBarPadTop", "10", "100")}
            {renderS1("Pad Bottom", "spBarPadBot", "10", "100")}
            {renderS1("Bar Height", "spBarHeightVal", "5", "50")}
            {renderS1("Label Size", "spBarLblSize", "8", "24")}
            {renderS1("Value Size", "spBarValSize", "8", "24")}
          </div>
          <div className="flex flex-col gap-2"><span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mt-2">Growth Trend: Heatmap</span>
            {renderS1("Box Max Width", "spHeatContainerW", "0", "1200", "10")}
            {renderS1("Box Height", "spHeatContainerH", "0", "800", "10")}
            {renderS2("Position", "spHeatX", "spHeatY")}
            {renderS2("Title Pos", "spHeatTitleX", "spHeatTitleY")}
            {renderS1("Title Size", "spHeatTitleSize", "10", "40")}
            {renderS2("Sub Pos", "spHeatSubX", "spHeatSubY")}
            {renderS1("Sub Size", "spHeatSubSize", "8", "30")}
            {renderS2("Legend Pos", "spHeatLegX", "spHeatLegY")}
            {renderS2("SVG Pos", "spHeatSvgX", "spHeatSvgY")}
            {renderS1("Box Height", "spHeatBoxH", "10", "80")}
            {renderS1("Label Width", "spHeatLblW", "50", "200")}
            {renderS1("Label Size", "spHeatLblSize", "6", "20")}
            {renderS1("Value Size", "spHeatValSize", "6", "20")}
          </div>

          <div className="w-full h-px bg-slate-600 mt-2"></div>
          <div className="flex flex-col gap-2"><span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Dropdown Focus</span>
            {renderS1("Corner Radius", "dropRadius", "0", "40")}
            {renderS1("Shadow Blur", "dropShadowBlur", "0", "40")}
            {renderS1("Shadow Spread", "dropShadowSpread", "-10", "20")}
          </div>

          <div className="w-full h-px bg-slate-600"></div>
          <div className="flex flex-col gap-2"><span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">UI Positions (Scale / X / Y)</span>
            {renderS3("Dial Panel (Left)", "leftPanelScale", "leftPanelX", "leftPanelY", "0.5", "2", "0.05")}
            {renderS3("Play Controls", "controlPanelScale", "controlPanelX", "controlPanelY", "0.5", "2", "0.05")}
            {renderS3("Setting Button", "settingBtnScale", "settingBtnX", "settingBtnY", "0.5", "2", "0.05")}
            {renderS3("Game Button", "gameBtnScale", "gameBtnX", "gameBtnY", "0.5", "2", "0.05")}
            {renderS3("Reflection Button", "refBtnScale", "refBtnX", "refBtnY", "0.5", "2", "0.05")}
            {renderS3("Tech Button", "techBtnScale", "techBtnX", "techBtnY", "0.5", "2", "0.05")}
            {renderS3("Header Text", "headerScale", "headerX", "headerY", "0.5", "2", "0.05")}
          </div>

          <div className="w-full h-px bg-slate-600"></div>
          <div className="flex flex-col gap-2"><span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">LCD & Track Color</span>
            <div><label className="text-[10px] flex justify-between font-mono"><span>LCD Hue</span><span>{lcdHue}°</span></label><input type="range" min="0" max="360" value={lcdHue} onChange={(e) => setLcdHue(e.target.value)} className="w-full h-1 accent-emerald-500" /></div>
            <div><label className="text-[10px] flex justify-between font-mono"><span>Track Hue</span><span>{trackHue}°</span></label><input type="range" min="0" max="360" value={trackHue} onChange={(e) => setTrackHue(e.target.value)} className="w-full h-1 accent-emerald-500" /></div>
            <div><label className="text-[10px] flex justify-between font-mono"><span>Brightness</span><span>{Math.round(lcdBrightness * 100)}%</span></label><input type="range" min="0.5" max="2" step="0.1" value={lcdBrightness} onChange={(e) => setLcdBrightness(e.target.value)} className="w-full h-1 accent-emerald-500" /></div>
            <div><label className="text-[10px] flex justify-between font-mono"><span>Scroll Speed</span><span>{lcdScrollSpeed}s</span></label><input type="range" min="1" max="100" step="0.5" value={lcdScrollSpeed} onChange={(e) => setLcdScrollSpeed(e.target.value)} className="w-full h-1 accent-emerald-500" /></div>
            <div><label className="text-[10px] flex justify-between font-mono"><span>Scroll Gap</span><span>{lcdScrollGap}px</span></label><input type="range" min="-1000" max="1000" step="10" value={lcdScrollGap} onChange={(e) => setLcdScrollGap(e.target.value)} className="w-full h-1 accent-emerald-500" /></div>
          </div>

          <div className="w-full h-px bg-slate-600"></div>
          <div className="flex flex-col gap-2"><span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Game Boy Elements</span>
            {renderS3("Game Boy Console", "gameboyScale", "gameboyX", "gameboyY", "0.5", "2", "0.05")}
            {renderS1("Bezel Height", "gbBezelHeight", "100", "400")}
            {renderS1("Screen Width", "gbScreenWidth", "100", "300")}
            {renderS1("Screen Height", "gbScreenHeight", "50", "400")}
            {renderS1("Body Width", "gbBodyWidth", "200", "600")}
            {renderS1("Body Height", "gbBodyHeight", "300", "1000")}
            {renderS3("D-Pad", "gbDpadScale", "gbDpadX", "gbDpadY", "0.5", "2", "0.05")}
            {renderS3("A/B Buttons", "gbActionBtnScale", "gbActionBtnX", "gbActionBtnY", "0.5", "2", "0.05")}
            {renderS3("Select/Start", "gbSystemBtnScale", "gbSystemBtnX", "gbSystemBtnY", "0.5", "2", "0.05")}
            {renderS3("Speaker", "gbSpeakerScale", "gbSpeakerX", "gbSpeakerY", "0.5", "2", "0.05")}
            {renderS3("Logo", "gbLogoScale", "gbLogoX", "gbLogoY", "0.5", "2", "0.05")}
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Synchronous Lazy Initialization
  const savedState = useMemo(() => {
    try {
      const data = localStorage.getItem('bwYouExamState');
      if (data) return JSON.parse(data);
    } catch (e) {
      console.error("Failed to parse saved exam state", e);
    }
    return {};
  }, []);

  const [examCounter, setExamCounter] = useState(savedState.examCounter || MOCK_HISTORY.length);

  const [mode, setMode] = useState(savedState.mode || 'full');
  const [timeLeft, setTimeLeft] = useState(savedState.timeLeft ?? 90 * 60); 
  const [isRunning, setIsRunning] = useState(false);
  const [ambientOn, setAmbientOn] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [marks, setMarks] = useState(savedState.marks || []);
  
  const [reflectionHistory, setReflectionHistory] = useState(savedState.reflectionHistory?.length > 0 ? savedState.reflectionHistory : MOCK_HISTORY);
  const [activeSessionId, setActiveSessionId] = useState(null);
  
  // สถานะสำหรับ Draft Session (ข้อมูลที่เพิ่งกรอกเสร็จ แต่ยังไม่กดเซฟลง Lobby)
  const [draftSession, setDraftSession] = useState(null);

  const [showTempDev, setShowTempDev] = useState(true);

  const [countdown, setCountdown] = useState(null);
  const [finishTime, setFinishTime] = useState(null);

  const [lcdHue, setLcdHue] = useState(0);
  const [trackHue, setTrackHue] = useState(0);
  const [isAutoTrackHue, setIsAutoTrackHue] = useState(false);
  
  const [lcdBrightness, setLcdBrightness] = useState(1.1);
  const [lcdScrollSpeed, setLcdScrollSpeed] = useState(60.5);
  const [lcdScrollGap, setLcdScrollGap] = useState(80);

  const [currentView, setCurrentView] = useState('timer'); // 'timer' | 'tictactoe' | 'skill_profile' | 'reflection_lobby' | 'reflection' | 'reflection_draft' | 'score_edit' | 'technique_hub' | 'technique_detail'
  
  const [examSequence, setExamSequence] = useState(savedState.examSequence || [...RECOMMENDED_SEQUENCE]);
  const [customPresets, setCustomPresets] = useState(savedState.customPresets || []);
  const [activePresetId, setActivePresetId] = useState(savedState.activePresetId || 'recommend');
  const [editingPresetId, setEditingPresetId] = useState(null);
  const [isSettingOpen, setIsSettingOpen] = useState(false);

  const totalTime = useRef(savedState.totalTime ?? 90 * 60);
  const [isScoreModalOpen, setIsScoreModalOpen] = useState(false);
  
  const [customTags, setCustomTags] = useState(savedState.customTags || ['#ลังเลศัพท์', '#ทำไม่ทัน', '#เดา']);
  const [targetScore, setTargetScore] = useState(savedState.targetScore || 80);

  const [activeTechniqueId, setActiveTechniqueId] = useState(null);
  const [techniquePrevView, setTechniquePrevView] = useState('timer');

  const [cfg, setCfg] = useState({
    scale: 1, trackRadius: 129, trackStroke: 14, bgTrackStroke: 26,
    depthOuter: 18, depthTrench: 9, depthCap: 9, depthDimple: 3, dimpleSize: 47,
    timeFontSize: 4.6, timeY: 5, labelFontSize: 14, labelY: 6,
    lcdWidth: 304, lcdBezelPadding: 9, lcdHeight: 72, lcdRadiusInner: 20, lcdFontSize: 41,
    btnHeight: 120, btnRadius: 24, btnIconSize: 64, btnFontSize: 13, btnSlopeBlur: 30, btnEdgeBlur: 0,   
    settingBtnScale: 0.5, settingBtnX: -305, settingBtnY: 236,
    gameBtnScale: 0.5, gameBtnX: 1194, gameBtnY: 236,
    refBtnScale: 0.5, refBtnX: 1194, refBtnY: 90,
    techBtnScale: 0.5, techBtnX: -305, techBtnY: 90,
    leftPanelScale: 0.8, leftPanelX: 67, leftPanelY: -41,
    controlPanelScale: 1.05, controlPanelX: 197, controlPanelY: -19,
    rightPanelScale: 0.85, rightPanelX: -112, rightPanelY: -116,
    headerScale: 1, headerX: -269, headerY: 257,
    gameboyScale: 0.75, gameboyX: -17, gameboyY: 130,
    gbBodyWidth: 321, gbBodyHeight: 665, gbBezelHeight: 358, gbScreenWidth: 255, gbScreenHeight: 300,
    gbDpadScale: 1.15, gbDpadX: 6, gbDpadY: 42, gbActionBtnScale: 0.85, gbActionBtnX: 0, gbActionBtnY: -65,
    gbSystemBtnScale: 0.7, gbSystemBtnX: -120, gbSystemBtnY: -200, gbSpeakerScale: 0.75, gbSpeakerX: -25, gbSpeakerY: 11,
    gbLogoScale: 1, gbLogoX: 0, gbLogoY: 0,
    dropRadius: 11, dropShadowBlur: 11, dropShadowSpread: -10,
    
    refCardMaxWidth: 540, refCardHeight: 0, refRightColWidth: 155, refCardPadding: 24, refCardGap: 12, refItemGap: 11, refLineHeight: 1.1, refIconSize: 17,
    refRightColShadow: 50, refTagShadow: 0,
    refTimeSize: 24, refTimeX: 0, refTimeY: 0,
    refQTextSize: 24, refQTextX: 0, refQTextY: 0,
    refPartSize: 18, refPartX: 0, refPartY: 0,
    refTagSize: 13, refTagX: 0, refTagY: 0,
    refNoteSize: 14, refNoteX: 0, refNoteY: 0,
    refAsteriskSize: 89, refAsteriskX: 0, refAsteriskY: 7,
    refMarkSize: 15, refMarkX: 0, refMarkY: -12,
    
    spMainTitleGrpX: 0, spMainTitleGrpY: 0, spMainTitleSize: 20, spMainSubSize: 12,
    spInsightTitleX: 0, spInsightTitleY: 0, spInsightTitleSize: 24, spInsightSubX: 0, spInsightSubY: 0, spInsightSubSize: 14, spInsightCardsX: 0, spInsightCardsY: 0,
    spTrendTitleX: 0, spTrendTitleY: 0, spTrendTitleSize: 18, spTrendSubX: 0, spTrendSubY: 0, spTrendSubSize: 11, spTrendInputX: 0, spTrendInputY: 0, spTrendSvgX: 0, spTrendSvgY: 0,
    spBarTitleX: 0, spBarTitleY: 0, spBarTitleSize: 18, spBarSubX: 0, spBarSubY: 0, spBarSubSize: 11, spBarSvgX: 0, spBarSvgY: 0,
    spHeatTitleX: 0, spHeatTitleY: 0, spHeatTitleSize: 18, spHeatSubX: 0, spHeatSubY: 0, spHeatSubSize: 11, spHeatLegX: 0, spHeatLegY: 0, spHeatSvgX: 0, spHeatSvgY: 0,
    
    spInsightW: 0, spInsightH: 0, spInsightX: 0, spInsightY: 0,
    spInsightPadding: 24, spInsightLabelSize: 13, spInsightValSize: 48, spInsightUnitSize: 14, spInsightDiffSize: 12,
    spTrendContainerW: 0, spTrendContainerH: 0, spTrendX: 0, spTrendY: 0,
    spTrendWidth: 600, spTrendHeight: 240, spTrendPadX: 50, spTrendPadY: 40, spTrendStroke: 3, spTrendDotR: 5, spTrendValSize: 11, spTrendLblSize: 9,
    spBarContainerW: 0, spBarContainerH: 0, spBarX: 0, spBarY: 0,
    spBarWidth: 500, spBarHeight: 140, spBarPadLeft: 75, spBarPadRight: 50, spBarPadTop: 25, spBarPadBot: 15, spBarHeightVal: 22, spBarLblSize: 11, spBarValSize: 11,
    spHeatContainerW: 0, spHeatContainerH: 0, spHeatX: 0, spHeatY: 0,
    spHeatBoxH: 40, spHeatLblW: 110, spHeatLblSize: 10, spHeatValSize: 11,
  });

  const updateCfg = useCallback((key, val) => setCfg(p => ({ ...p, [key]: Number(val) })), []);
  
  useExamAudio({
    timeLeft,
    totalTime: totalTime.current,
    isRunning,
    ambientOn,
    mode
  });

  useEffect(() => {
    // ใช้ Debounce หน่วงเวลาเซฟ 1.5 วินาที เพื่อไม่ให้ดิสก์ทำงานหนัก และป้องกันแอปหน่วง
    const timer = setTimeout(() => {
      try {
        // จำกัดประวัติไว้ที่ 30 รอบล่าสุด ป้องกัน LocalStorage ล้นจนแอปแครชจอขาว
        const trimmedHistory = reflectionHistory.slice(0, 30);
        const stateToSave = { 
          examCounter, timeLeft, mode, examSequence, customPresets, activePresetId, marks, totalTime: totalTime.current, customTags, reflectionHistory: trimmedHistory, targetScore 
        };
        localStorage.setItem('bwYouExamState', JSON.stringify(stateToSave));
      } catch (e) {
        console.warn("Storage warning: Failed to save exam state", e);
      }
    }, 1500);
    return () => clearTimeout(timer);
  }, [examCounter, timeLeft, mode, examSequence, customPresets, activePresetId, marks, customTags, reflectionHistory, targetScore]);

  const prevTimeRef = useRef(timeLeft);
  useEffect(() => {
    if (prevTimeRef.current > 0 && timeLeft === 0) {
      setIsRunning(false);
      setIsScoreModalOpen(true);
    }
    prevTimeRef.current = timeLeft;
  }, [timeLeft]);

  const progressState = useMemo(() => calculateProgressState(timeLeft, totalTime.current, examSequence, mode), [timeLeft, examSequence, mode]);

  const timeLeftRef = useRef(timeLeft);
  // Animation loop for Auto Track Hue removed; handled entirely by CSS class "rgb-loop-anim"
  useEffect(() => { timeLeftRef.current = timeLeft; }, [timeLeft]);

  const isRunningRef = useRef(isRunning);
  useEffect(() => { isRunningRef.current = isRunning; }, [isRunning]);

  // --- Core Timer Logic ---
  useEffect(() => {
    if (countdown === null) return;
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setIsRunning(true);
      setCountdown(null);
    }
  }, [countdown]);

  useEffect(() => {
    let interval;
    if (isRunning && timeLeft > 0) {
      let lastTick = Date.now();
      interval = setInterval(() => {
        const now = Date.now();
        const deltaSeconds = ((now - lastTick) / 1000) * speed;
        lastTick = now;
        setTimeLeft((prev) => {
          const nextTime = prev - deltaSeconds;
          if (nextTime <= 0) { setIsRunning(false); return 0; }
          return nextTime;
        });
      }, 1000 / speed);
    } else if (timeLeft <= 0 && isRunning) {
      setIsRunning(false);
    }
    return () => clearInterval(interval);
  }, [isRunning, speed]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (currentView === 'tictactoe' && (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'ArrowDown')) e.preventDefault(); 
    };
    window.addEventListener('keydown', handleKeyDown, { passive: false });
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentView]);

  const handleModeSelect = useCallback((selectedKey) => {
    setMode(selectedKey);
    const newTime = MODES[selectedKey].time;
    totalTime.current = newTime;
    setTimeLeft(newTime);
    setIsRunning(false);
    setCountdown(null);
    setMarks([]);
    setFinishTime(null);
    if (selectedKey !== 'full') setAmbientOn(false);
  }, []);

  const themeVals = useMemo(() => {
    const t = isDarkMode ? {
      bg: "#1e2229", raised1: "#23272f", raised2: "#191c23", shadowDark: "#13161a", shadowLight: "#292e38",
      trackBg: "#2a2f38", textMain: "#e2e8f0", textSub: "#94a3b8", textHighlight: "#64748b"
    } : {
      bg: "#eef2f6", raised1: "#ffffff", raised2: "#dce3ec", shadowDark: "#c8d4e2", shadowLight: "#ffffff",
      trackBg: "#d8e1ec", textMain: "#475569", textSub: "#94a3b8", textHighlight: "#64748b"
    };
    
    return {
      theme: t, bg: t.bg,
      raisedGradient: `linear-gradient(145deg, ${t.raised1}, ${t.raised2})`,
      indentedGradient: `linear-gradient(145deg, ${t.raised2}, ${t.raised1})`,
      shadowOuter: `${cfg.depthOuter}px ${cfg.depthOuter}px ${cfg.depthOuter*2}px ${t.shadowDark}, -${cfg.depthOuter}px -${cfg.depthOuter}px ${cfg.depthOuter*2}px ${t.shadowLight}, inset 1px 1px 2px rgba(255,255,255,0.4), inset -1px -1px 2px rgba(0,0,0,0.02)`,
      shadowCap: `${cfg.depthCap}px ${cfg.depthCap}px ${cfg.depthCap*2}px ${t.shadowDark}, -${cfg.depthCap}px -${cfg.depthCap}px ${cfg.depthCap*2}px ${t.shadowLight}, inset 2px 2px 4px rgba(255,255,255,0.4), inset -2px -2px 4px rgba(0,0,0,0.02)`,
      shadowPlateau: isDarkMode ? `${cfg.depthOuter}px ${cfg.depthOuter}px ${cfg.btnSlopeBlur}px ${t.shadowDark}, -${cfg.depthOuter}px -${cfg.depthOuter}px ${cfg.btnSlopeBlur}px ${t.shadowLight}, inset 2px 2px ${cfg.btnEdgeBlur}px rgba(255,255,255,0.03), inset -2px -2px ${cfg.btnEdgeBlur}px rgba(0,0,0,0.2)` : `${cfg.depthOuter}px ${cfg.depthOuter}px ${cfg.btnSlopeBlur}px ${t.shadowDark}, -${cfg.depthOuter}px -${cfg.depthOuter}px ${cfg.btnSlopeBlur}px ${t.shadowLight}, inset 2px 2px ${cfg.btnEdgeBlur}px rgba(255,255,255,0.9), inset -2px -2px ${cfg.btnEdgeBlur}px rgba(0,0,0,0.02)`,
      shadowTrench: `inset ${cfg.depthTrench}px ${cfg.depthTrench}px ${cfg.depthTrench*2}px ${t.shadowDark}, inset -${cfg.depthTrench}px -${cfg.depthTrench}px ${cfg.depthTrench*2}px ${t.shadowLight}, 1px 1px 2px rgba(255,255,255,0.4)`,
      shadowDimple: `inset ${cfg.depthDimple}px ${cfg.depthDimple}px ${cfg.depthDimple*2}px ${t.shadowDark}, inset -${cfg.depthDimple}px -${cfg.depthDimple}px ${cfg.depthDimple*2}px ${t.shadowLight}`,
      shadowDeepInset: `inset 8px 8px ${cfg.dropShadowBlur}px ${cfg.dropShadowSpread}px ${t.shadowDark}, inset -8px -8px ${cfg.dropShadowBlur}px ${cfg.dropShadowSpread}px ${t.shadowLight}`
    };
  }, [isDarkMode, cfg.depthOuter, cfg.depthCap, cfg.btnSlopeBlur, cfg.btnEdgeBlur, cfg.depthTrench, cfg.depthDimple, cfg.dropShadowBlur, cfg.dropShadowSpread]);

  const toggleTimer = useCallback(() => {
    setIsRunning(prev => {
      if (!prev && timeLeftRef.current > 0) {
        if (timeLeftRef.current === totalTime.current) { setCountdown(5); return false; }
        return true;
      }
      setCountdown(null);
      return false;
    });
  }, []);

  const toggleAmbient = useCallback(() => setAmbientOn(p => !p), []);
  const resetTimer = useCallback(() => { setIsRunning(false); setCountdown(null); setTimeLeft(totalTime.current); setMarks([]); setFinishTime(null); setCurrentView('timer'); }, []);
  const skipTime = useCallback(() => setTimeLeft(prev => Math.max(0, prev - 300)), []);
  
  const addMark = useCallback(() => {
    if (!isRunningRef.current) return;
    setMarks(prev => {
      const newPercent = ((totalTime.current - timeLeftRef.current) / totalTime.current) * 100;
      if (prev.length > 0 && prev[prev.length - 1] === newPercent) return prev;
      return [...prev, newPercent];
    });
  }, []);

  const handleFinishExam = useCallback((finalScore, scores) => {
    const newExamNum = examCounter + 1;
    setExamCounter(newExamNum);

    const newSessionId = Date.now().toString();
    const newSession = {
      id: newSessionId,
      sessionNumber: newExamNum,
      date: new Date().toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' }),
      mode: mode,
      totalTime: totalTime.current,
      finishTime: finishTime,
      finalScore: finalScore,
      scores: scores || { s1: '', s2: '', s3: '', s4: '', s5: '', s6: '', s7: '', s8: '', s9: '' },
      pointsData: generateReflectionPoints(marks, totalTime.current, examSequence, mode)
    };
    
    setDraftSession(newSession);
    setCurrentView('reflection_draft');
    
    setIsRunning(false);
    setCountdown(null);
    setTimeLeft(totalTime.current);
    setMarks([]);
    setFinishTime(null);
  }, [marks, mode, examSequence, examCounter, finishTime]);

  const activeSession = useMemo(() => reflectionHistory.find(s => s.id === activeSessionId), [reflectionHistory, activeSessionId]);

  const updateSessionData = useCallback((sessionId, updates) => {
    if (draftSession && draftSession.id === sessionId) {
      setDraftSession(prev => ({ ...prev, ...updates }));
    } else {
      setReflectionHistory(prev => prev.map(s => s.id === sessionId ? { ...s, ...updates } : s));
    }
  }, [draftSession]);

  const updateSessionPoint = useCallback((sessionId, pointId, field, value) => {
    // รวมตรรกะการอัปเดตให้อยู่ในฟังก์ชันเดียว ตัดปัญหา React สับสนเงื่อนไข Draft
    setDraftSession(prevDraft => {
      if (prevDraft && prevDraft.id === sessionId) {
        const updatedPoints = prevDraft.pointsData.map(p => p.id === pointId ? { ...p, [field]: value } : p);
        return { ...prevDraft, pointsData: updatedPoints };
      }
      return prevDraft;
    });
    setReflectionHistory(prev => prev.map(session => {
      if (session.id !== sessionId) return session;
      const updatedPoints = session.pointsData.map(p => p.id === pointId ? { ...p, [field]: value } : p);
      return { ...session, pointsData: updatedPoints };
    }));
  }, []);

  const handleSaveDraft = useCallback(() => {
    if (draftSession) {
      setReflectionHistory(prev => [draftSession, ...prev]);
      setDraftSession(null);
      setCurrentView('reflection_lobby');
    }
  }, [draftSession]);

  const handleDiscardDraft = useCallback(() => {
    setDraftSession(null);
    resetTimer(); 
  }, [resetTimer]);

  const deleteHistory = useCallback((idToDelete) => {
    setReflectionHistory(prev => prev.filter(s => s.id !== idToDelete));
    if (activeSessionId === idToDelete) setActiveSessionId(null);
  }, [activeSessionId]);

  return (
    <div className={`fixed inset-0 w-full h-full flex flex-col items-center ${currentView.includes('reflection') || currentView === 'score_edit' || currentView === 'skill_profile' || currentView === 'technique_hub' || currentView === 'technique_detail' ? 'justify-start overflow-y-auto' : 'justify-center overflow-hidden'} p-6 select-none transition-colors duration-300`} style={{ backgroundColor: themeVals.bg, fontFamily: "'Outfit', 'Prompt', sans-serif" }}>
      <div dangerouslySetInnerHTML={{ __html: `
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@200;300;400;500;600&family=Prompt:wght@200;300;400;500;600&display=swap');
          @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap');
          @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
          .no-scrollbar::-webkit-scrollbar { display: none; }
          .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
          @keyframes marquee { 0% { transform: translate3d(0, 0, 0); } 100% { transform: translate3d(-50%, 0, 0); } }
          .animate-marquee { animation: marquee linear infinite; will-change: transform; width: max-content; }
          .gb-font { font-family: 'Press Start 2P', monospace; }
          @keyframes rgbLoop { 0% { filter: hue-rotate(0deg); } 100% { filter: hue-rotate(360deg); } }
          .rgb-loop-anim { animation: rgbLoop 8s linear infinite; }
        </style>
      `}} />
      
      {currentView === 'timer' && (
        <TopBarWidget cfg={cfg} themeVals={themeVals} isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} mode={mode} handleModeSelect={handleModeSelect} isTimerStarted={isRunning && timeLeft < totalTime.current} isRunning={isRunning} />
      )}

      {currentView === 'timer' && (
        <div className="mt-16 flex flex-col lg:flex-row items-center justify-center gap-16 lg:gap-32 z-0 w-full max-w-6xl px-4 relative animate-in fade-in duration-300">
          <div className="flex flex-col items-center relative">
            <div onClick={() => { if (!isRunning && mode === 'full') setIsSettingOpen(true); }} className={`absolute z-10 flex items-center justify-center transition-all ${(isRunning || mode !== 'full') ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-105 active:scale-95'}`} style={{ width: '100px', height: '100px', borderRadius: '24px', background: themeVals.raisedGradient, boxShadow: themeVals.shadowPlateau, transform: `scale(${cfg.settingBtnScale}) translate(${cfg.settingBtnX}px, ${cfg.settingBtnY}px)`, transformOrigin: 'center center' }} title={mode !== 'full' ? "Settings available in ALL PARTS mode only" : "Settings"}>
              <div className="w-[64px] h-[64px] rounded-full flex items-center justify-center border border-black/5" style={{ background: themeVals.indentedGradient, boxShadow: themeVals.shadowTrench }}>
                <div className="w-[46px] h-[46px] rounded-full flex items-center justify-center" style={{ background: themeVals.bg, boxShadow: themeVals.shadowOuter }}>
                  <div className="w-[30px] h-[30px] rounded-full flex items-center justify-center relative border border-white/10" style={{ background: themeVals.raisedGradient, boxShadow: themeVals.shadowCap }}>
                    <ChevronUp className="absolute top-[2px] opacity-40" size={10} strokeWidth={4} />
                    <ChevronDown className="absolute bottom-[2px] opacity-40" size={10} strokeWidth={4} />
                    <ChevronLeft className="absolute left-[2px] opacity-40" size={10} strokeWidth={4} />
                    <ChevronRight className="absolute right-[2px] opacity-40" size={10} strokeWidth={4} />
                  </div>
                </div>
              </div>
            </div>

            <div onClick={() => { if (!isRunning) setCurrentView('tictactoe'); }} className={`absolute z-50 flex items-center justify-center transition-all ${isRunning ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-105 active:scale-95'}`} style={{ width: '100px', height: '100px', borderRadius: '24px', background: themeVals.raisedGradient, boxShadow: themeVals.shadowPlateau, transform: `scale(${cfg.gameBtnScale}) translate(${cfg.gameBtnX}px, ${cfg.gameBtnY}px)`, transformOrigin: 'center center' }} title="Play Tic-Tac-Toe">
              <div className="w-[64px] h-[64px] rounded-full flex items-center justify-center border border-black/5" style={{ background: themeVals.indentedGradient, boxShadow: themeVals.shadowTrench }}>
                <div className="w-[46px] h-[46px] rounded-full flex items-center justify-center" style={{ background: themeVals.bg, boxShadow: themeVals.shadowOuter }}>
                  <div className="w-[30px] h-[30px] rounded-full flex items-center justify-center relative border border-white/10 group" style={{ background: themeVals.raisedGradient, boxShadow: themeVals.shadowCap }}>
                    <Gamepad2 size={14} className="opacity-60 group-hover:text-blue-400 group-hover:opacity-100 transition-colors" color={themeVals.theme.textMain} />
                  </div>
                </div>
              </div>
            </div>

            <div onClick={() => { 
                if (!isRunning) { 
                  setDraftSession(null); 
                  setCurrentView('skill_profile'); 
                }
              }} 
              className={`absolute z-50 flex items-center justify-center transition-all ${isRunning ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-105 active:scale-95'}`} style={{ width: '100px', height: '100px', borderRadius: '24px', background: themeVals.raisedGradient, boxShadow: themeVals.shadowPlateau, transform: `scale(${cfg.refBtnScale}) translate(${cfg.refBtnX}px, ${cfg.refBtnY}px)`, transformOrigin: 'center center' }} title="Reflection History">
              <div className="w-[64px] h-[64px] rounded-full flex items-center justify-center border border-black/5" style={{ background: themeVals.indentedGradient, boxShadow: themeVals.shadowTrench }}>
                <div className="w-[46px] h-[46px] rounded-full flex items-center justify-center" style={{ background: themeVals.bg, boxShadow: themeVals.shadowOuter }}>
                  <div className="w-[30px] h-[30px] rounded-full flex items-center justify-center relative border border-white/10 group" style={{ background: themeVals.raisedGradient, boxShadow: themeVals.shadowCap }}>
                    <Clock size={14} className="opacity-60 group-hover:text-blue-400 group-hover:opacity-100 transition-colors" color={themeVals.theme.textMain} />
                  </div>
                </div>
              </div>
            </div>

            <div onClick={() => { 
                if (!isRunning) { 
                  setDraftSession(null); 
                  setCurrentView('technique_hub'); 
                }
              }} 
              className={`absolute z-50 flex items-center justify-center transition-all ${isRunning ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-105 active:scale-95'}`} style={{ width: '100px', height: '100px', borderRadius: '24px', background: themeVals.raisedGradient, boxShadow: themeVals.shadowPlateau, transform: `scale(${cfg.techBtnScale}) translate(${cfg.techBtnX}px, ${cfg.techBtnY}px)`, transformOrigin: 'center center' }} title="Technique Hub (คัมภีร์เทคนิค)">
              <div className="w-[64px] h-[64px] rounded-full flex items-center justify-center border border-black/5" style={{ background: themeVals.indentedGradient, boxShadow: themeVals.shadowTrench }}>
                <div className="w-[46px] h-[46px] rounded-full flex items-center justify-center" style={{ background: themeVals.bg, boxShadow: themeVals.shadowOuter }}>
                  <div className="w-[30px] h-[30px] rounded-full flex items-center justify-center relative border border-white/10 group" style={{ background: themeVals.raisedGradient, boxShadow: themeVals.shadowCap }}>
                    <BookOpen size={14} className="opacity-60 group-hover:text-emerald-400 group-hover:opacity-100 transition-colors" color={themeVals.theme.textMain} />
                  </div>
                </div>
              </div>
            </div>
        
            <TimerDashboard cfg={cfg} themeVals={themeVals} timeLeft={timeLeft} totalTime={totalTime.current} isRunning={isRunning} speed={speed} marks={marks} ambientOn={ambientOn} toggleAmbient={toggleAmbient} toggleTimer={toggleTimer} skipTime={skipTime} resetTimer={resetTimer} trackHue={trackHue} countdown={countdown} isAutoTrackHue={isAutoTrackHue} mode={mode} />
          </div>

          <RightPanelWidget cfg={cfg} themeVals={themeVals} progressState={progressState} lcdHue={lcdHue} setLcdHue={setLcdHue} trackHue={trackHue} setTrackHue={setTrackHue} isAutoTrackHue={isAutoTrackHue} setIsAutoTrackHue={setIsAutoTrackHue} lcdBrightness={lcdBrightness} setLcdBrightness={setLcdBrightness} lcdScrollSpeed={lcdScrollSpeed} setLcdScrollSpeed={setLcdScrollSpeed} lcdScrollGap={lcdScrollGap} setLcdScrollGap={setLcdScrollGap} addMark={addMark} isRunning={isRunning} timeLeft={timeLeft} totalTime={totalTime.current} finishTime={finishTime} setFinishTime={setFinishTime} setTimeLeft={setTimeLeft} />
        </div>
      )}

      {currentView === 'tictactoe' && (
        <GameBoyWidget cfg={cfg} themeVals={themeVals} setCurrentView={setCurrentView} />
      )}

      {currentView === 'technique_hub' && (
        <TechniqueHubView 
          themeVals={themeVals} 
          setCurrentView={setCurrentView} 
          history={reflectionHistory} 
          cfg={cfg} 
          onPartClick={(id) => { 
            setActiveTechniqueId(id); 
            setTechniquePrevView('technique_hub'); 
            setCurrentView('technique_detail'); 
          }} 
        />
      )}

      {currentView === 'technique_detail' && (
        <TechniqueDetailView 
          themeVals={themeVals} 
          partId={activeTechniqueId} 
          onBack={() => setCurrentView(techniquePrevView)} 
          cfg={cfg} 
        />
      )}

      {currentView === 'skill_profile' && (
        <SkillProfileView 
          themeVals={themeVals} 
          setCurrentView={setCurrentView} 
          history={reflectionHistory} 
          targetScore={targetScore} 
          setTargetScore={setTargetScore} 
          cfg={cfg} 
          onPartClick={(id) => { 
            setActiveTechniqueId(id); 
            setTechniquePrevView('skill_profile'); 
            setCurrentView('technique_detail'); 
          }} 
        />
      )}

      {currentView === 'reflection_lobby' && (
        <ReflectionLobby themeVals={themeVals} setCurrentView={setCurrentView} reflectionHistory={reflectionHistory} setActiveSessionId={setActiveSessionId} deleteHistory={deleteHistory} />
      )}

      {(currentView === 'reflection' || currentView === 'reflection_draft') && (
        <ReflectionView 
          themeVals={themeVals} 
          setCurrentView={setCurrentView} 
          sessionData={currentView === 'reflection_draft' ? draftSession : activeSession} 
          isDraftMode={currentView === 'reflection_draft'}
          onUpdatePoint={updateSessionPoint}
          onUpdateSessionData={updateSessionData}
          onSaveDraft={handleSaveDraft}
          onDiscardDraft={handleDiscardDraft}
          customTags={customTags} 
          setCustomTags={setCustomTags} 
          cfg={cfg} 
          onOpenScoreEdit={() => setCurrentView('score_edit')}
        />
      )}

      {currentView === 'score_edit' && (
        <ScoreEditView 
          themeVals={themeVals} 
          sessionData={draftSession || activeSession} 
          onSave={(newScores, newFinalScore) => {
            updateSessionData((draftSession || activeSession).id, { scores: newScores, finalScore: newFinalScore });
            setCurrentView(draftSession ? 'reflection_draft' : 'reflection');
          }} 
          onCancel={() => setCurrentView(draftSession ? 'reflection_draft' : 'reflection')} 
          cfg={cfg} 
        />
      )}

      {(currentView.includes('reflection') || currentView === 'timer' || currentView === 'skill_profile' || currentView === 'technique_hub' || currentView === 'technique_detail') && (
        <DevAdjustPanel cfg={cfg} updateCfg={updateCfg} showTempDev={showTempDev} setShowTempDev={setShowTempDev} lcdHue={lcdHue} setLcdHue={setLcdHue} trackHue={trackHue} setTrackHue={setTrackHue} lcdBrightness={lcdBrightness} setLcdBrightness={setLcdBrightness} lcdScrollSpeed={lcdScrollSpeed} setLcdScrollSpeed={setLcdScrollSpeed} lcdScrollGap={lcdScrollGap} setLcdScrollGap={setLcdScrollGap} />
      )}

      {isSettingOpen && (
        <SettingsModal cfg={cfg} themeVals={themeVals} setIsSettingOpen={setIsSettingOpen} examSequence={examSequence} setExamSequence={setExamSequence} customPresets={customPresets} setCustomPresets={setCustomPresets} activePresetId={activePresetId} setActivePresetId={setActivePresetId} editingPresetId={editingPresetId} setEditingPresetId={setEditingPresetId} />
      )}

      {isScoreModalOpen && (
        <ScoreModal themeVals={themeVals} setIsScoreModalOpen={setIsScoreModalOpen} handleFinishExam={handleFinishExam} resetTimer={resetTimer} />
      )}

      {countdown !== null && countdown > 0 && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-transparent backdrop-blur-md animate-in fade-in duration-300">
          <div key={countdown} className="text-[10rem] font-extralight animate-in zoom-in duration-500" style={{ fontFamily: "'Outfit', 'Prompt', sans-serif", color: themeVals.theme.textMain, textShadow: `0 0 40px ${themeVals.theme.textSub}` }}>{countdown}</div>
        </div>
      )}
    </div>
  );
}