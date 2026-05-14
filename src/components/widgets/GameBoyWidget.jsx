import React, { useState, useEffect, useCallback, memo } from 'react';
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight, RefreshCcw, ArrowLeft } from 'lucide-react';
import { calculateWinner } from '../../utils/helpers';

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

export default GameBoyWidget;