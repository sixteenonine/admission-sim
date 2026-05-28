import React, { useState, useEffect, useRef, useMemo, useCallback, memo } from 'react';
import { Play, Pause, Volume2, VolumeX, RefreshCcw, ChevronDown, Sun, Moon, Asterisk, ChevronUp, ChevronLeft, ChevronRight, GripVertical, X, Plus, Trash2, Edit, Gamepad2, ArrowLeft, FastForward, Award, Tag, MessageSquare, Clock, History, CalendarDays, CheckCircle, TrendingUp, Activity, BookOpen, AlertTriangle, TrendingDown, Settings, LogOut, CreditCard, UserCircle2 } from 'lucide-react';
import AuthModal from './components/AuthModal';
import ProfileModal from './components/ProfileModal';
import useExamAudio from './hooks/useExamAudio';
import TopBar from './components/layout/TopBar.jsx';
import { useAuth } from './contexts/AuthContext.jsx';
import { useTheme } from './contexts/ThemeContext.jsx';

import { AVATARS, MODES, RECOMMENDED_SEQUENCE, EXAM_PARTS, FLAT_EXAM_SUBS, TECHNIQUE_GUIDES, PACING_RULES, UI_CFG } from './utils/constants';
import { calculateScores, calculateWinner, rgbToHex, getTipColor, getDifficultyColor, buildExamTimeline, calculateProgressState, generateReflectionPoints } from './utils/helpers';
import { db } from './utils/db';
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

  const { isDarkMode, themeVals } = useTheme();

  // Synchronous Lazy Initialization (Safe from React re-renders)
  const [savedState] = useState(() => {
    try {
      const data = localStorage.getItem('bwYouExamState');
      if (data) return JSON.parse(data);
    } catch (e) {
      console.error("Failed to parse saved exam state", e);
    }
    return {};
  });

  const [examCounter, setExamCounter] = useState(savedState.examCounter || 0);

  const [mode, setMode] = useState(savedState.mode || 'full');
  const initialTime = MODES[savedState.mode || 'full'].time;
  const totalTime = useRef(initialTime);
  const [timeLeft, setTimeLeft] = useState(initialTime);
  const timeLeftRef = useRef(initialTime);

  const [isRunning, setIsRunning] = useState(false);
  const [ambientOn, setAmbientOn] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [marks, setMarks] = useState([]);
  const [sfxEnabled, setSfxEnabled] = useState(savedState.sfxEnabled ?? true);
  
  const [reflectionHistory, setReflectionHistory] = useState([]);
  const [isHistoryLoaded, setIsHistoryLoaded] = useState(false);

  useEffect(() => {
    db.app_state.get('reflectionHistory').then(record => {
      if (record && record.value) {
        setReflectionHistory(record.value);
      } else if (savedState.reflectionHistory?.length > 0) {
        setReflectionHistory(savedState.reflectionHistory);
      }
      setIsHistoryLoaded(true);
    }).catch(err => {
      console.error("Failed to load history from DB", err);
      setIsHistoryLoaded(true);
    });
  }, [savedState.reflectionHistory]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  
  const [draftSession, setDraftSession] = useState(null);

  const [countdown, setCountdown] = useState(null);
  const pendingSyncsRef = useRef(new Map());

  useEffect(() => {
    const flushPendingSyncs = async () => {
      const currentQueue = JSON.parse(localStorage.getItem('bwSyncQueue') || '[]');
      
      if (pendingSyncsRef.current.size > 0) {
        pendingSyncsRef.current.forEach((payload, timeoutId) => {
          clearTimeout(timeoutId);
          currentQueue.push(payload);
        });
        pendingSyncsRef.current.clear();
      }

      if (currentQueue.length > 0 && navigator.onLine) {
        const requests = currentQueue.map(payload => 
          fetch('/api/history', { 
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' }, 
            keepalive: true, 
            body: JSON.stringify(payload) 
          }).then(res => {
            if (!res.ok && res.status >= 500) throw new Error('Server Down');
            return true;
          })
        );

        const results = await Promise.allSettled(requests);
        const remainingQueue = currentQueue.filter((_, index) => results[index].status === 'rejected');
        localStorage.setItem('bwSyncQueue', JSON.stringify(remainingQueue));
      } else if (currentQueue.length > 0) {
        localStorage.setItem('bwSyncQueue', JSON.stringify(currentQueue));
      }
    };
    
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') flushPendingSyncs();
    };

    window.addEventListener('beforeunload', flushPendingSyncs);
    window.addEventListener('online', flushPendingSyncs);
    document.addEventListener('visibilitychange', handleVisibility);
    
    return () => {
      window.removeEventListener('beforeunload', flushPendingSyncs);
      window.removeEventListener('online', flushPendingSyncs);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);
  const [finishTime, setFinishTime] = useState(null);

  const [lcdHue, setLcdHue] = useState(0);
  const [trackHue, setTrackHue] = useState(0);
  const [isAutoTrackHue, setIsAutoTrackHue] = useState(false);

  const [currentView, setCurrentView] = useState('timer');
  const [customLcdText, setCustomLcdText] = useState("CUSTOM");
  const [lcdDisplayMode, setLcdDisplayMode] = useState('exam');
  const [isLcdEditOpen, setIsLcdEditOpen] = useState(false);
  
  const [examSequence, setExamSequence] = useState(savedState.examSequence || [...RECOMMENDED_SEQUENCE]);
  const [customPresets, setCustomPresets] = useState(savedState.customPresets || []);
  const [activePresetId, setActivePresetId] = useState(savedState.activePresetId || 'recommend');
  const [editingPresetId, setEditingPresetId] = useState(null);
  const [isSettingOpen, setIsSettingOpen] = useState(false);
  useEffect(() => {
    db.app_state.get('examSequence').then(record => {
      if (record && record.value) setExamSequence(record.value);
    }).catch(() => {});
    
    db.app_state.get('customPresets').then(record => {
      if (record && record.value) setCustomPresets(record.value);
    }).catch(() => {});
  }, []);
  const [isModeDropdownOpen, setIsModeDropdownOpen] = useState(false);
  const isTimerStarted = isRunning && timeLeft < totalTime.current;
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  
  const { currentUser, isAuthChecking, handleLoginSuccess, handleLogout, handleRefreshUser } = useAuth();

  const handleLogoutLocal = async () => {
    setReflectionHistory([]);
    await handleLogout();
  };

  useEffect(() => {
    if (currentUser?.id) {
      fetch(`/api/history?userId=${currentUser.id}`)
        .then(res => res.json())
        .then(data => {
          if (data.status === 'success' && Array.isArray(data.data)) {
            setReflectionHistory(prev => {
              const historyMap = new Map();
              prev.forEach(item => historyMap.set(item.id, item));
              data.data.forEach(item => historyMap.set(item.id, item));
              
              return Array.from(historyMap.values()).sort((a, b) => {
                return (parseInt(b.id) || 0) - (parseInt(a.id) || 0);
              });
            });
          }
        })
        .catch(err => console.error("Failed to fetch history:", err));
    }
  }, [currentUser?.id]);

  const [isScoreModalOpen, setIsScoreModalOpen] = useState(false);
  
  const [customTags, setCustomTags] = useState(savedState.customTags || ['#ลังเลศัพท์', '#ทำไม่ทัน', '#เดา']);
  const [targetScore, setTargetScore] = useState(() => {
    if (typeof savedState.targetScore === 'object' && savedState.targetScore !== null) {
      return savedState.targetScore;
    }
    const legacyScore = typeof savedState.targetScore === 'number' ? savedState.targetScore : 80;
    return { 
      full: legacyScore, 
      part1: MODES.part1?.maxScore || 25, 
      part2: MODES.part2?.maxScore || 50, 
      part3: MODES.part3?.maxScore || 25 
    };
  });

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

  // Save Settings to LocalStorage แบบไม่บล็อก Main Thread
  useEffect(() => {
    const timer = setTimeout(() => {
      const saveTask = () => {
        try {
          const lightStateToSave = { examCounter, mode, activePresetId, customTags, targetScore, sfxEnabled };
          localStorage.setItem('bwYouExamState', JSON.stringify(lightStateToSave));
          
          db.app_state.bulkPut([
            { key: 'examSequence', value: examSequence },
            { key: 'customPresets', value: customPresets }
          ]).catch(e => console.warn("IDB Save warning", e));
        } catch (e) {
          console.warn("Storage warning: Failed to save exam settings", e);
        }
      };
      if (window.requestIdleCallback) window.requestIdleCallback(saveTask);
      else saveTask();
    }, 1500);
    return () => clearTimeout(timer);
  }, [examCounter, mode, examSequence, customPresets, activePresetId, customTags, targetScore, sfxEnabled]);

  // Save History to IndexedDB (หนัก แต่ทำงานเบื้องหลัง)
  useEffect(() => {
    if (!isHistoryLoaded) return;
    db.app_state.put({ key: 'reflectionHistory', value: reflectionHistory.slice(0, 30) })
      .catch(e => console.error("IndexedDB warning: Failed to save history", e));
  }, [reflectionHistory, isHistoryLoaded]);

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

  const handleTimeUp = useCallback(() => {
    setIsRunning(false);
    setFinishTime(totalTime.current);
    setTimeLeft(0);
    if (marks.length === 0) setMarks([{ part: 'End', time: 0, marker: true }]);
    if (navigator.vibrate) navigator.vibrate([300, 100, 300, 100, 500]);
    setIsScoreModalOpen(true);
  }, [marks.length]);

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
    timeLeftRef.current = newTime;
    setTimeLeft(newTime);
    setIsRunning(false);
    setCountdown(null);
    setMarks([]);
    setFinishTime(null);
    if (selectedKey !== 'full') setAmbientOn(false);
  }, []);

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
  
  const resetTimer = useCallback(() => { 
    setIsRunning(false); 
    setCountdown(null); 
    timeLeftRef.current = totalTime.current;
    setTimeLeft(totalTime.current); 
    setMarks([]); 
    setFinishTime(null); 
    setCurrentView('timer'); 
  }, []);
  
  const skipTime = useCallback(() => {
    const newTime = Math.max(0, timeLeftRef.current - 300);
    timeLeftRef.current = newTime;
    setTimeLeft(newTime);
  }, []);
  
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
      timeLeftRef.current = 0;
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
    timeLeftRef.current = totalTime.current;
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

  const handleSaveDraft = useCallback(() => {
    if (draftSession) {
      setReflectionHistory(prev => [draftSession, ...prev]);
      
      if (currentUser) {
        const jitterMs = Math.floor(Math.random() * (45000 - 5000 + 1) + 5000);
        const payload = {
          userId: currentUser.id,
          mode: draftSession.mode,
          score: draftSession.finalScore,
          reflectionData: draftSession,
          timestamp: Date.now()
        };

        const timeoutId = setTimeout(() => {
          fetch('/api/history', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            keepalive: true,
            body: JSON.stringify(payload)
          }).catch(error => {
            console.warn("Background sync failed, queueing", error);
            const q = JSON.parse(localStorage.getItem('bwSyncQueue') || '[]');
            q.push(payload);
            localStorage.setItem('bwSyncQueue', JSON.stringify(q));
          }).finally(() => {
             pendingSyncsRef.current.delete(timeoutId);
          });
        }, jitterMs);
        
        pendingSyncsRef.current.set(timeoutId, payload);
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
  
  const [isPortrait, setIsPortrait] = useState(window.innerWidth < 1024);
  const [showRotateWarning, setShowRotateWarning] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      // ใช้ความกว้างหน้าจอเพื่อบล็อกบั๊กคีย์บอร์ดเด้ง
      const isMobileDevice = Math.min(window.screen.width, window.screen.height) < 768 || window.innerWidth < 1024;
      setIsPortrait(isMobileDevice); 
      
      if (isMobileDevice) {
        // ตรวจจับองศาเครื่องจริงๆ เพื่อแสดง Soft Lock
        const isLandscape = window.screen?.orientation?.type?.startsWith('landscape') || Math.abs(window.orientation) === 90;
        setShowRotateWarning(isLandscape);
      } else {
        setShowRotateWarning(false);
      }
    };
    let resizeTimer;
    const debouncedResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(handleResize, 100);
    };

    handleResize();
    window.addEventListener('resize', debouncedResize);
    window.addEventListener('orientationchange', debouncedResize);
    return () => {
      clearTimeout(resizeTimer);
      window.removeEventListener('resize', debouncedResize);
      window.removeEventListener('orientationchange', debouncedResize);
    };
  }, []);

  const portraitCfg = useMemo(() => ({
    headerScale: 1.0,         
    headerX: 0,               
    headerY: 30,               
    lcdWidth: "70%",         
    lcdHeight: "120%",  
    lcdScale: 1.0,            
    lcdX: 0,                  
    lcdY: 25,                  
    dialScale: 0.75,          
    dialX: 0,                 
    dialY: 20,                 
    controlScale: 0.85,      
    controlX: 0,              
    controlY: -80,              
    featuresScale: 1.5,       
    featuresX: 0,             
    featuresY: 60,             
    actionScale: 1.1,         
    actionX: 0,               
    actionY: -80,               
  }), [cfg]);

  const mobileCfg = useMemo(() => ({
    ...cfg,
    leftPanelScale: portraitCfg.dialScale,
    leftPanelX: portraitCfg.dialX,
    leftPanelY: portraitCfg.dialY,
    controlPanelScale: portraitCfg.controlScale,
    controlPanelX: portraitCfg.controlX,
    controlPanelY: portraitCfg.controlY
  }), [cfg, portraitCfg]);

  if (isAuthChecking) {
    return (
      <div className="fixed inset-0 w-full h-full flex items-center justify-center transition-colors duration-300" style={{ backgroundColor: themeVals.bg }}>
        <div className="w-10 h-10 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className={`fixed inset-0 w-full h-full flex flex-col items-center ${currentView.includes('reflection') || currentView === 'score_edit' || currentView === 'skill_profile' || currentView === 'technique_hub' || currentView === 'technique_detail' || (currentView === 'timer' && isPortrait) ? 'justify-start overflow-y-auto no-scrollbar pb-12' : 'justify-center overflow-hidden'} p-20 select-none transition-colors duration-300`} style={{ backgroundColor: themeVals.bg, fontFamily: "'Outfit', 'Prompt', sans-serif" }}>
      
            
      {currentView === 'timer' && (
        isPortrait ? (
          /* --- True Portrait Mode UI (Vertical Layout) --- */
          <div className="flex flex-col items-center justify-start w-full max-w-[340px] mx-auto relative z-0 animate-in fade-in duration-300 gap-5 overflow-visible">
            {/* Header */}
            <div className="flex flex-col items-center text-center gap-1 w-full mt-2" style={{ transform: `scale(${portraitCfg.headerScale}) translate(${portraitCfg.headerX}px, ${portraitCfg.headerY}px)`, transformOrigin: 'center center' }}>
              <span className="text-[11px] uppercase tracking-[0.2em] font-medium" style={{ color: themeVals.textSub }}>{progressState.part}</span>
              <h2 className="text-[26px] leading-[1.1] font-light tracking-wide whitespace-nowrap" style={{ color: themeVals.textMain }}>{progressState.subPart}</h2>
            </div>

            {/* Desktop-Style LCD Screen with Interactive Dropdown Settings */}
            <div className="relative w-full z-[100]" style={{ width: portraitCfg.lcdWidth, transform: `scale(${portraitCfg.lcdScale}) translate(${portraitCfg.lcdX}px, ${portraitCfg.lcdY}px)`, transformOrigin: 'center center' }}>
              <div onClick={() => setIsLcdEditOpen(!isLcdEditOpen)} className="w-full flex items-center overflow-hidden border border-black/5 transition-all duration-300 relative cursor-pointer" style={{ height: typeof portraitCfg.lcdHeight === 'number' ? `${portraitCfg.lcdHeight}px` : portraitCfg.lcdHeight, borderRadius: `${cfg.lcdRadiusInner}px`, boxShadow: "inset 6px 6px 16px rgba(0,0,0,0.9), inset -6px -6px 16px rgba(255,255,255,0.05)", background: themeVals.bg === "#1e2229" ? '#0f2b10' : '#1b3f1c', filter: `hue-rotate(${lcdHue}deg) brightness(1.1)` }}>
                <div className="absolute inset-0 pointer-events-none rounded-[inherit]" style={{ background: 'linear-gradient(110deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.02) 30%, transparent 35%)' }}></div>
                <div className="absolute inset-0 pointer-events-none rounded-[inherit]" style={{ background: 'radial-gradient(circle at center, transparent 50%, rgba(0,0,0,0.4) 120%)' }}></div>
                {lcdDisplayMode === 'exam' || (lcdDisplayMode === 'custom' && customLcdText.length <= 5) ? (
                  <div className="w-full flex justify-center z-10 mt-2">
                    <span className="tracking-widest leading-none whitespace-nowrap" style={{ fontSize: `${cfg.lcdFontSize}px`, fontFamily: "'Share Tech Mono', monospace", color: '#4cfc23', textShadow: "0 0 5px rgba(76,252,35,0.8), 0 0 15px rgba(76,252,35,0.4)" }}>
                      {lcdDisplayMode === 'exam' ? progressState.qText : customLcdText}
                    </span>
                  </div>
                ) : (
                  <div className="flex animate-marquee z-10" style={{ animationDuration: '12s' }}>
                    {Array(8).fill(customLcdText).map((txt, i) => (
                      <span key={i} className="tracking-widest leading-none whitespace-nowrap mt-2" style={{ fontSize: `${cfg.lcdFontSize}px`, fontFamily: "'Share Tech Mono', monospace", color: '#4cfc23', textShadow: "0 0 5px rgba(76,252,35,0.8), 0 0 15px rgba(76,252,35,0.4)", marginRight: '60px' }}>{txt}</span>
                    ))}
                  </div>
                )}
                <div className="absolute inset-0 opacity-20 pointer-events-none z-20" style={{ backgroundImage: 'linear-gradient(rgba(0,0,0,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.8) 1px, transparent 1px)', backgroundSize: '3px 3px' }}></div>
              </div>

              {isLcdEditOpen && (
                 <div className="absolute top-full left-0 right-0 mt-2 w-full rounded-[1.5rem] p-2.5 border border-white/20 z-[100] transition-all flex flex-col gap-1" style={{ background: themeVals.raisedGradient, boxShadow: themeVals.shadowPlateau }}>
                    <button onClick={(e) => { e.stopPropagation(); setLcdDisplayMode('exam'); }} className="w-full text-left px-5 py-3.5 text-[13px] font-medium tracking-wide transition-all flex items-center justify-between" style={{ borderRadius: `${cfg.dropRadius}px`, background: lcdDisplayMode === 'exam' ? themeVals.bg : 'transparent', boxShadow: lcdDisplayMode === 'exam' ? themeVals.shadowDeepInset : 'none', color: lcdDisplayMode === 'exam' ? themeVals.theme?.textMain : themeVals.theme?.textSub }} >
                      <span>Exam Progress</span>
                      <div className={`w-1.5 h-1.5 rounded-full transition-opacity ${lcdDisplayMode === 'exam' ? 'bg-blue-400 opacity-100 shadow-[0_0_8px_#60a5fa]' : 'bg-transparent opacity-0'}`} />
                    </button>
                    <div className="w-full px-5 py-3.5 flex items-center justify-between transition-all cursor-text" style={{ borderRadius: `${cfg.dropRadius}px`, background: lcdDisplayMode === 'custom' ? themeVals.bg : 'transparent', boxShadow: lcdDisplayMode === 'custom' ? themeVals.shadowDeepInset : 'none' }} onClick={(e) => { e.stopPropagation(); setLcdDisplayMode('custom'); }}>
                      <input type="text" maxLength={25} value={customLcdText} onChange={(e) => { setCustomLcdText(e.target.value.toUpperCase()); setLcdDisplayMode('custom'); }} className="w-full bg-transparent outline-none text-[13px] font-medium tracking-wide placeholder:text-current/50" style={{ color: lcdDisplayMode === 'custom' ? themeVals.theme?.textMain : themeVals.theme?.textSub, fontFamily: "'Outfit', 'Prompt', sans-serif" }} placeholder="Custom" />
                      <div className={`w-1.5 h-1.5 rounded-full shrink-0 transition-opacity ${lcdDisplayMode === 'custom' ? 'bg-blue-400 opacity-100 shadow-[0_0_8px_#60a5fa]' : 'bg-transparent opacity-0'}`} />
                    </div>
                    <div className="w-full px-5 pt-3 pb-2 mt-1 flex flex-col gap-3 border-t border-white/5">
                      <div className="flex justify-between items-center"><span className="text-[10px] uppercase font-bold tracking-wider" style={{ color: themeVals.theme?.textSub }}>LCD Hue</span><span className="text-[10px] font-mono font-medium" style={{ color: themeVals.theme?.textSub }}>{lcdHue}°</span></div>
                      <input type="range" min="0" max="360" value={lcdHue} onChange={(e) => setLcdHue(e.target.value)} onTouchStart={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()} className="w-full h-1.5 rounded-full accent-[#10b981] bg-black/10 outline-none" style={{ boxShadow: themeVals.shadowTrench }} />
                    </div>
                    <div className="w-full px-5 pt-2 pb-3 flex flex-col gap-3 border-t border-white/5">
                      <div className="flex justify-between items-center"><span className="text-[10px] uppercase font-bold tracking-wider" style={{ color: themeVals.theme?.textSub }}>Track Hue</span><span className="text-[10px] font-mono font-medium" style={{ color: themeVals.theme?.textSub }}>{Math.round(trackHue)}°</span></div>
                      <input type="range" min="0" max="360" value={trackHue} onChange={(e) => setTrackHue(e.target.value)} onTouchStart={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()} className="w-full h-1.5 rounded-full accent-[#3b82f6] bg-black/10 outline-none" style={{ boxShadow: themeVals.shadowTrench }} />
                    </div>
                </div>
              )}
            </div>

            {/* Main Timer Dial & Controls from Desktop Component */}
            <div className="relative flex flex-col items-center justify-center w-full scale-130 min-h-[380px] overflow-visible select-none">
              <TimerDashboard 
                cfg={mobileCfg} 
                themeVals={themeVals} 
                timeLeft={timeLeft} 
                totalTime={totalTime.current} 
                isRunning={isRunning} 
                speed={speed} 
                marks={marks} 
                ambientOn={ambientOn} 
                toggleAmbient={toggleAmbient} 
                toggleTimer={toggleTimer} 
                skipTime={skipTime} 
                resetTimer={resetTimer} 
                trackHue={trackHue} 
                countdown={countdown} 
                isAutoTrackHue={isAutoTrackHue} 
                mode={mode} 
                onTimeUp={handleTimeUp}
                timeLeftRef={timeLeftRef}
                setTimeLeft={setTimeLeft}
              />
            </div>

            {/* Features Menu */}
            <div className="flex items-center justify-center gap-4 w-full mt-1" style={{ transform: `scale(${portraitCfg.featuresScale}) translate(${portraitCfg.featuresX}px, ${portraitCfg.featuresY}px)`, transformOrigin: 'center center' }}>
              <button onClick={() => { if (!isRunning) setCurrentView('tictactoe'); }} disabled={isRunning} className="w-12 h-12 rounded-2xl flex items-center justify-center border border-white/5 transition-transform active:scale-95 disabled:opacity-50" style={{ background: themeVals.raisedGradient, boxShadow: themeVals.shadowPlateau, color: themeVals.textMain }}>
                 <Gamepad2 size={18} className="text-blue-400 opacity-80" />
              </button>
              <button onClick={() => { if (!isRunning) { setDraftSession(null); setCurrentView('skill_profile'); } }} disabled={isRunning} className="w-12 h-12 rounded-2xl flex items-center justify-center border border-white/5 transition-transform active:scale-95 disabled:opacity-50" style={{ background: themeVals.raisedGradient, boxShadow: themeVals.shadowPlateau, color: themeVals.textMain }}>
                 <Clock size={18} className="text-blue-400 opacity-80" />
              </button>
              <button onClick={() => { if (!isRunning) { setDraftSession(null); setCurrentView('technique_hub'); } }} disabled={isRunning} className="w-12 h-12 rounded-2xl flex items-center justify-center border border-white/5 transition-transform active:scale-95 disabled:opacity-50" style={{ background: themeVals.raisedGradient, boxShadow: themeVals.shadowPlateau, color: themeVals.textMain }}>
                 <BookOpen size={18} className="text-emerald-400 opacity-80" />
              </button>
              <button onClick={() => { if (!isRunning) setIsSettingOpen(true); }} disabled={isRunning} className="w-12 h-12 rounded-2xl flex items-center justify-center border border-white/5 transition-transform active:scale-95 disabled:opacity-50" style={{ background: themeVals.raisedGradient, boxShadow: themeVals.shadowPlateau, color: themeVals.textMain }}>
                 <Settings size={18} className="opacity-80" />
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 w-full mt-1 pb-6" style={{ transform: `scale(${portraitCfg.actionScale}) translate(${portraitCfg.actionX}px, ${portraitCfg.actionY}px)`, transformOrigin: 'center center' }}>
               <button onClick={addMark} disabled={!isRunning} className="flex-1 h-16 rounded-[1.25rem] flex items-center justify-center gap-2 border border-white/10 transition-transform active:scale-95 disabled:opacity-50" style={{ background: themeVals.bg, boxShadow: themeVals.shadowPlateau, color: themeVals.textSub }}>
                  <Asterisk size={18} className="text-[#ea580c] mb-0.5" strokeWidth={3} />
                  <span className="font-bold tracking-widest uppercase text-[13px]">Mark</span>
               </button>
               <button onClick={handleFinishClick} disabled={!isRunning && !finishTime} className="flex-1 h-16 rounded-[1.25rem] flex flex-col items-center justify-center border border-white/10 transition-transform active:scale-95 disabled:opacity-50" style={{ background: finishTime ? '#10b981' : themeVals.bg, boxShadow: themeVals.shadowPlateau, color: finishTime ? '#fff' : themeVals.textSub }}>
                  {finishTime ? (
                    <>
                      <span className="font-bold uppercase opacity-90 text-[9px]">Done in {Math.floor(finishTime/60)}:{(Math.floor(finishTime)%60).toString().padStart(2,'0')}</span>
                      <span className="font-black tracking-[0.1em] uppercase mt-0.5 text-[13px]">End Exam</span>
                    </>
                  ) : (
                    <div className="flex items-center gap-2">
                      <CheckCircle size={18} strokeWidth={2.5} />
                      <span className="font-bold tracking-widest uppercase text-[13px]">Finish</span>
                    </div>
                  )}
               </button>
            </div>
          </div>
        ) : (
          /* --- Desktop View (Horizontal Layout) --- */
          <div className="mt-16 flex flex-col lg:flex-row items-center justify-center gap-16 lg:gap-32 z-0 w-full max-w-6xl px-4 relative animate-in fade-in duration-300">
          {/* สวิตช์เลือกโหมด (ย้ายมาไว้ตรงกลางจอด้านบนสุด) */}
            <div className="absolute top-[-60px] left-1/2 -translate-x-1/2 z-[100] flex justify-center w-full">
              <div className="relative">
                {isModeDropdownOpen && <div className="fixed inset-0 z-40" onClick={() => setIsModeDropdownOpen(false)}></div>}
                <button 
                  onClick={() => !isTimerStarted && setIsModeDropdownOpen(!isModeDropdownOpen)}
                  disabled={isTimerStarted}
                  className={`flex items-center gap-3 px-5 py-2.5 rounded-[1rem] transition-all border border-white/10 ${isTimerStarted ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'}`}
                  style={{ boxShadow: themeVals.shadowOuter, background: themeVals.raisedGradient, color: themeVals.textSub }}
                >
                  <span className="text-[11px] font-semibold uppercase tracking-wider">{MODES?.[mode]?.label}</span>
                  <ChevronDown size={14} className={`transition-transform duration-300 ${isModeDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                <div 
                  className={`absolute left-1/2 -translate-x-1/2 top-full mt-3 w-[260px] rounded-[1.5rem] p-2.5 border border-white/20 transition-all duration-300 origin-top z-50 flex flex-col gap-1
                    ${isModeDropdownOpen ? 'opacity-100 scale-100 pointer-events-auto translate-y-0' : 'opacity-0 scale-95 pointer-events-none -translate-y-2'}`}
                  style={{ boxShadow: themeVals.shadowPlateau, background: themeVals.raisedGradient }}
                >
                  {MODES && Object.entries(MODES).map(([key, { label }]) => {
                    const isSelected = mode === key;
                    return (
                      <button key={key} onClick={() => { handleModeSelect(key); setIsModeDropdownOpen(false); }} className="w-full text-left px-5 py-3.5 text-[13px] font-medium tracking-wide transition-all flex items-center justify-between rounded-[1rem]" style={{ background: isSelected ? themeVals.bg : 'transparent', boxShadow: isSelected ? themeVals.shadowDeepInset : 'none', color: isSelected ? themeVals.textMain : themeVals.textSub }}>
                        <span>{label}</span>
                        <div className={`w-1.5 h-1.5 rounded-full transition-opacity ${isSelected ? 'bg-blue-400 opacity-100 shadow-[0_0_8px_#60a5fa]' : 'bg-transparent opacity-0'}`} />
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center relative">
            <div onClick={() => { if (!isRunning) setIsSettingOpen(true); }} className={`absolute z-10 flex items-center justify-center transition-all ${isRunning ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`} style={{ width: '100px', height: '100px', borderRadius: '24px', background: themeVals.raisedGradient, boxShadow: themeVals.shadowPlateau, transform: `scale(${cfg.settingBtnScale}) translate(${cfg.settingBtnX}px, ${cfg.settingBtnY}px)`, transformOrigin: 'center center' }} title="Settings">
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
                    <Gamepad2 size={14} className="opacity-60 group-hover:text-blue-400 group-hover:opacity-100 transition-colors" color={themeVals.textMain} />
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
                    <Clock size={14} className="opacity-60 group-hover:text-blue-400 group-hover:opacity-100 transition-colors" color={themeVals.textMain} />
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
                    <BookOpen size={14} className="opacity-60 group-hover:text-emerald-400 group-hover:opacity-100 transition-colors" color={themeVals.textMain} />
                  </div>
                </div>
              </div>
            </div>
        
            <TimerDashboard 
              cfg={cfg} 
              themeVals={themeVals} 
              timeLeft={timeLeft} 
              totalTime={totalTime.current} 
              isRunning={isRunning} 
              speed={speed} 
              marks={marks} 
              ambientOn={ambientOn} 
              toggleAmbient={toggleAmbient} 
              toggleTimer={toggleTimer} 
              skipTime={skipTime} 
              resetTimer={resetTimer} 
              trackHue={trackHue} 
              countdown={countdown} 
              isAutoTrackHue={isAutoTrackHue} 
              mode={mode} 
              onTimeUp={handleTimeUp}
              timeLeftRef={timeLeftRef}
              setTimeLeft={setTimeLeft}
            />
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
            customLcdText={customLcdText}
            setCustomLcdText={setCustomLcdText}
            lcdDisplayMode={lcdDisplayMode}
            setLcdDisplayMode={setLcdDisplayMode}
            isLcdEditOpen={isLcdEditOpen}
            setIsLcdEditOpen={setIsLcdEditOpen}
          />          
        </div>
        )    
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
          targetScore={typeof targetScore === 'object' ? (targetScore[mode] ?? MODES[mode]?.maxScore ?? 100) : targetScore} 
          setTargetScore={(val) => setTargetScore(prev => typeof prev === 'object' ? { ...prev, [mode]: val } : val)} 
          cfg={cfg} 
          mode={mode}
          onModeSelect={handleModeSelect}
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
        <SettingsModal cfg={cfg} themeVals={themeVals} setIsSettingOpen={setIsSettingOpen} examSequence={examSequence} setExamSequence={setExamSequence} customPresets={customPresets} setCustomPresets={setCustomPresets} activePresetId={activePresetId} setActivePresetId={setActivePresetId} editingPresetId={editingPresetId} setEditingPresetId={setEditingPresetId} sfxEnabled={sfxEnabled} setSfxEnabled={setSfxEnabled} mode={mode} onModeSelect={handleModeSelect} isTimerStarted={isTimerStarted} />
      )}

      {isScoreModalOpen && (
        <ScoreModal themeVals={themeVals} setIsScoreModalOpen={setIsScoreModalOpen} handleFinishExam={handleFinishExam} resetTimer={resetTimer} mode={mode} />
      )}
      
      {isLogoutModalOpen && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center bg-transparent backdrop-blur-sm px-4 animate-in fade-in duration-300">
          <div className="w-full max-w-sm p-8 rounded-[2.5rem] text-center border border-white/10" style={{ background: themeVals.bg, boxShadow: themeVals.shadowOuter }}>
            <div className="w-20 h-20 mx-auto mb-6 flex items-center justify-center rounded-full bg-red-500/10 text-red-500">
              <AlertTriangle size={40} />
            </div>
            <h3 className="text-xl font-bold mb-2" style={{ color: themeVals.textMain }}>Log Out?</h3>
            <p className="text-sm mb-8 opacity-70" style={{ color: themeVals.textSub }}>หนูต้องการออกจากระบบใช่หรือไม่?</p>
            
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => setIsLogoutModalOpen(false)}
                className="py-4 rounded-2xl font-bold text-[13px] uppercase tracking-widest transition-all active:scale-95"
                style={{ background: themeVals.indentedGradient, color: themeVals.textMain, boxShadow: themeVals.shadowDeepInset }}
              >
                Cancel
              </button>
              <button 
                onClick={() => { handleLogoutLocal(); setIsLogoutModalOpen(false); }}
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
          <div key={countdown} className="text-[10rem] font-extralight animate-in zoom-in duration-500" style={{ fontFamily: "'Outfit', 'Prompt', sans-serif", color: themeVals.textMain, textShadow: `0 0 40px ${themeVals.textSub}` }}>{countdown}</div>
        </div>
      )}
    </div>
  );
}