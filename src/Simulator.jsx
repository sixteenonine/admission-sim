import React, { useState, useEffect, useRef, useMemo, useCallback, memo } from 'react';
import { Play, Pause, Volume2, VolumeX, RefreshCcw, ChevronDown, Sun, Moon, Asterisk, ChevronUp, ChevronLeft, ChevronRight, GripVertical, X, Plus, Trash2, Edit, Gamepad2, ArrowLeft, FastForward, Award, Tag, MessageSquare, Clock, History, CalendarDays, CheckCircle, TrendingUp, Activity, BookOpen, AlertTriangle, TrendingDown, Settings, LogOut, CreditCard, UserCircle2 } from 'lucide-react';
import AuthModal from './components/AuthModal';
import ProfileModal from './components/ProfileModal';
import useExamAudio from './hooks/useExamAudio';
import TopBar from './components/layout/TopBar.jsx';

import { AVATARS, MODES, RECOMMENDED_SEQUENCE, EXAM_PARTS, FLAT_EXAM_SUBS, TECHNIQUE_GUIDES, PACING_RULES, UI_CFG } from './utils/constants';
import { calculateScores, calculateWinner, rgbToHex, getTipColor, getDifficultyColor, buildExamTimeline, calculateProgressState, generateReflectionPoints } from './utils/helpers';

import TimerDashboard from './components/widgets/TimerDashboard';
import RightPanelWidget from './components/widgets/RightPanelWidget';
import GameBoyWidget from './components/widgets/GameBoyWidget';
import SettingsModal from './components/modals/SettingsModal';
import ScoreModal from './components/modals/ScoreModal';
import { TechniqueHubView, TechniqueDetailView } from './pages/TechniqueHub';
import SkillProfileView from './pages/SkillProfile';
import ReflectionLobby from './pages/ReflectionLobby';
import { ReflectionView, ScoreEditView } from './pages/ReflectionDetail';

export default function App() {
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
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
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

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

  const [examCounter, setExamCounter] = useState(savedState.examCounter || 0);

  const [mode, setMode] = useState(savedState.mode || 'full');
  const initialTime = MODES[savedState.mode || 'full'].time;
  const [timeLeft, setTimeLeft] = useState(initialTime);
  const [isRunning, setIsRunning] = useState(false);
  const [ambientOn, setAmbientOn] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [marks, setMarks] = useState([]);
  const [sfxEnabled, setSfxEnabled] = useState(savedState.sfxEnabled ?? true);
  
  const [reflectionHistory, setReflectionHistory] = useState(savedState.reflectionHistory?.length > 0 ? savedState.reflectionHistory : []);
  const [activeSessionId, setActiveSessionId] = useState(null);
  
  const [draftSession, setDraftSession] = useState(null);

  const [countdown, setCountdown] = useState(null);
  const [finishTime, setFinishTime] = useState(null);

  const [lcdHue, setLcdHue] = useState(0);
  const [trackHue, setTrackHue] = useState(0);
  const [isAutoTrackHue, setIsAutoTrackHue] = useState(false);

  const [currentView, setCurrentView] = useState('timer');
  
  const [examSequence, setExamSequence] = useState(savedState.examSequence || [...RECOMMENDED_SEQUENCE]);
  const [customPresets, setCustomPresets] = useState(savedState.customPresets || []);
  const [activePresetId, setActivePresetId] = useState(savedState.activePresetId || 'recommend');
  const [editingPresetId, setEditingPresetId] = useState(null);
  const [isSettingOpen, setIsSettingOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('sim_user');
    return saved ? JSON.parse(saved) : null;
  });

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    localStorage.setItem('sim_user', JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('sim_user');
    setReflectionHistory([]);
  };

  useEffect(() => {
    if (currentUser?.id) {
      fetch(`/api/history?userId=${currentUser.id}`)
        .then(res => res.json())
        .then(data => {
          if (data.status === 'success') {
            setReflectionHistory(data.data);
          }
        })
        .catch(err => console.error("Failed to fetch history:", err));
    }
  }, [currentUser?.id]);


  const totalTime = useRef(initialTime);
  const [isScoreModalOpen, setIsScoreModalOpen] = useState(false);
  
  const [customTags, setCustomTags] = useState(savedState.customTags || ['#ลังเลศัพท์', '#ทำไม่ทัน', '#เดา']);
  const [targetScore, setTargetScore] = useState(savedState.targetScore || 80);

  const [activeTechniqueId, setActiveTechniqueId] = useState(null);
  const [techniquePrevView, setTechniquePrevView] = useState('timer');

  const cfg = UI_CFG;

  useExamAudio({
    timeLeft,
    totalTime: totalTime.current,
    isRunning,
    ambientOn,
    mode,
    sfxEnabled
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const trimmedHistory = reflectionHistory.slice(0, 30);
        const stateToSave = { 
          examCounter, mode, examSequence, customPresets, activePresetId, customTags, reflectionHistory: trimmedHistory, targetScore, sfxEnabled 
        };
        localStorage.setItem('bwYouExamState', JSON.stringify(stateToSave));
      } catch (e) {
        console.warn("Storage warning: Failed to save exam state", e);
      }
    }, 1500);
    return () => clearTimeout(timer);
  }, [examCounter, mode, examSequence, customPresets, activePresetId, customTags, reflectionHistory, targetScore, sfxEnabled]);

  const prevTimeRef = useRef(timeLeft);
  useEffect(() => {
    if (prevTimeRef.current > 0 && timeLeft === 0) {
      setIsRunning(false);
      setIsScoreModalOpen(true);
    }
    prevTimeRef.current = timeLeft;
  }, [timeLeft]);

  const timelineData = useMemo(() => buildExamTimeline(examSequence, mode), [examSequence, mode]);
  const progressState = useMemo(() => calculateProgressState(timeLeft, totalTime.current, timelineData, mode), [timeLeft, timelineData, mode]);

  const timeLeftRef = useRef(timeLeft);
  useEffect(() => { timeLeftRef.current = timeLeft; }, [timeLeft]);

  const isRunningRef = useRef(isRunning);
  useEffect(() => { isRunningRef.current = isRunning; }, [isRunning]);

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

  const handleFinishClick = useCallback(() => {
    if (!finishTime) {
      setFinishTime(totalTime.current - timeLeftRef.current);
    } else {
      setTimeLeft(0);
    }
  }, [finishTime]);

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
      pointsData: generateReflectionPoints(marks, totalTime.current, timelineData, mode)
    };
    
    setDraftSession(newSession);
    setCurrentView('reflection_draft');
    
    setIsRunning(false);
    setCountdown(null);
    setTimeLeft(totalTime.current);
    setMarks([]);
    setFinishTime(null);
  }, [marks, mode, examCounter, finishTime, timelineData]);

  const activeSession = useMemo(() => reflectionHistory.find(s => s.id === activeSessionId), [reflectionHistory, activeSessionId]);

  const updateSessionData = useCallback((sessionId, updates) => {
    if (draftSession && draftSession.id === sessionId) {
      setDraftSession(prev => ({ ...prev, ...updates }));
    } else {
      setReflectionHistory(prev => prev.map(s => s.id === sessionId ? { ...s, ...updates } : s));
    }
  }, [draftSession]);

  const updateSessionPoint = useCallback((sessionId, pointId, field, value) => {
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

  const handleSaveDraft = useCallback(async () => {
    if (draftSession) {
      setReflectionHistory(prev => [draftSession, ...prev]);
      
      if (currentUser) {
        try {
          await fetch('/api/history', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: currentUser.id,
              mode: draftSession.mode,
              score: draftSession.finalScore,
              reflectionData: draftSession
            })
          });
        } catch (error) {
          console.error("Failed to save history:", error);
        }
      }

      setDraftSession(null);
      setCurrentView('reflection_lobby');
    }
  }, [draftSession, currentUser]);

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
      
      <TopBar 
        themeVals={themeVals} 
        currentUser={currentUser} 
        setIsAuthModalOpen={setIsAuthModalOpen}
        setIsProfileModalOpen={setIsProfileModalOpen}
        setIsLogoutModalOpen={setIsLogoutModalOpen}
        isSimulator={true}
        simulatorProps={{ isRunning, isTimerStarted: isRunning && timeLeft < totalTime.current, mode, MODES, handleModeSelect, isDarkMode, setIsDarkMode }}
      />

      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
        onLoginSuccess={handleLoginSuccess}
        themeVals={themeVals}
      />
      <ProfileModal 
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        user={currentUser}
        themeVals={themeVals}
      />

      {currentView === 'timer' && (
        <div className="mt-16 flex flex-col lg:flex-row items-center justify-center gap-16 lg:gap-32 z-0 w-full max-w-6xl px-4 relative animate-in fade-in duration-300">
          <div className="flex flex-col items-center relative">
            <div onClick={() => { if (!isRunning && mode === 'full') setIsSettingOpen(true); }} className={`absolute z-10 flex items-center justify-center transition-all ${(isRunning || mode !== 'full') ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`} style={{ width: '100px', height: '100px', borderRadius: '24px', background: themeVals.raisedGradient, boxShadow: themeVals.shadowPlateau, transform: `scale(${cfg.settingBtnScale}) translate(${cfg.settingBtnX}px, ${cfg.settingBtnY}px)`, transformOrigin: 'center center' }} title={mode !== 'full' ? "Settings available in ALL PARTS mode only" : "Settings"}>
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

            <div onClick={() => { if (!isRunning) setCurrentView('tictactoe'); }} className={`absolute z-50 flex items-center justify-center transition-all ${isRunning ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`} style={{ width: '100px', height: '100px', borderRadius: '24px', background: themeVals.raisedGradient, boxShadow: themeVals.shadowPlateau, transform: `scale(${cfg.gameBtnScale}) translate(${cfg.gameBtnX}px, ${cfg.gameBtnY}px)`, transformOrigin: 'center center' }} title="Play Tic-Tac-Toe">
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
              className={`absolute z-50 flex items-center justify-center transition-all ${isRunning ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`} style={{ width: '100px', height: '100px', borderRadius: '24px', background: themeVals.raisedGradient, boxShadow: themeVals.shadowPlateau, transform: `scale(${cfg.refBtnScale}) translate(${cfg.refBtnX}px, ${cfg.refBtnY}px)`, transformOrigin: 'center center' }} title="Reflection History">
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
              className={`absolute z-50 flex items-center justify-center transition-all ${isRunning ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`} style={{ width: '100px', height: '100px', borderRadius: '24px', background: themeVals.raisedGradient, boxShadow: themeVals.shadowPlateau, transform: `scale(${cfg.techBtnScale}) translate(${cfg.techBtnX}px, ${cfg.techBtnY}px)`, transformOrigin: 'center center' }} title="Technique Hub (คัมภีร์เทคนิค)">
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

          <RightPanelWidget 
            cfg={cfg} 
            themeVals={themeVals} 
            part={progressState.part} 
            subPart={progressState.subPart} 
            qText={progressState.qText} 
            lcdHue={lcdHue} 
            setLcdHue={setLcdHue} 
            trackHue={trackHue} 
            setTrackHue={setTrackHue} 
            isAutoTrackHue={isAutoTrackHue} 
            setIsAutoTrackHue={setIsAutoTrackHue} 
            lcdBrightness={1.1} 
            lcdScrollSpeed={60.5} 
            lcdScrollGap={80} 
            addMark={addMark} 
            isRunning={isRunning} 
            finishTime={finishTime} 
            onFinishClick={handleFinishClick} 
          />
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

      {isSettingOpen && (
        <SettingsModal cfg={cfg} themeVals={themeVals} setIsSettingOpen={setIsSettingOpen} examSequence={examSequence} setExamSequence={setExamSequence} customPresets={customPresets} setCustomPresets={setCustomPresets} activePresetId={activePresetId} setActivePresetId={setActivePresetId} editingPresetId={editingPresetId} setEditingPresetId={setEditingPresetId} sfxEnabled={sfxEnabled} setSfxEnabled={setSfxEnabled} />
      )}

      {isScoreModalOpen && (
        <ScoreModal themeVals={themeVals} setIsScoreModalOpen={setIsScoreModalOpen} handleFinishExam={handleFinishExam} resetTimer={resetTimer} />
      )}
      
      {isLogoutModalOpen && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center bg-black/20 backdrop-blur-sm px-4 animate-in fade-in duration-300">
          <div className="w-full max-w-sm p-8 rounded-[2.5rem] text-center border border-white/10" style={{ background: themeVals.theme.bg, boxShadow: themeVals.shadowOuter }}>
            <div className="w-20 h-20 mx-auto mb-6 flex items-center justify-center rounded-full bg-red-500/10 text-red-500">
              <AlertTriangle size={40} />
            </div>
            <h3 className="text-xl font-bold mb-2" style={{ color: themeVals.theme.textMain }}>Log Out?</h3>
            <p className="text-sm mb-8 opacity-70" style={{ color: themeVals.theme.textSub }}>หนูต้องการออกจากระบบใช่หรือไม่?</p>
            
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => setIsLogoutModalOpen(false)}
                className="py-4 rounded-2xl font-bold text-[13px] uppercase tracking-widest transition-all active:scale-95"
                style={{ background: themeVals.indentedGradient, color: themeVals.theme.textMain, boxShadow: themeVals.shadowDeepInset }}
              >
                Cancel
              </button>
              <button 
                onClick={() => { handleLogout(); setIsLogoutModalOpen(false); }}
                className="py-4 rounded-2xl font-bold text-[13px] uppercase tracking-widest text-white transition-all active:scale-95 shadow-lg"
                style={{ background: 'linear-gradient(145deg, #ef4444, #dc2626)' }}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {countdown !== null && countdown > 0 && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-transparent backdrop-blur-md animate-in fade-in duration-300">
          <div key={countdown} className="text-[10rem] font-extralight animate-in zoom-in duration-500" style={{ fontFamily: "'Outfit', 'Prompt', sans-serif", color: themeVals.theme.textMain, textShadow: `0 0 40px ${themeVals.theme.textSub}` }}>{countdown}</div>
        </div>
      )}
    </div>
  );
}