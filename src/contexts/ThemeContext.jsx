import React, { createContext, useContext, useState, useMemo, useEffect, useLayoutEffect } from 'react';
import { UI_CFG } from '../utils/constants';

const ThemeContext = createContext();

export function useTheme() {
  return useContext(ThemeContext);
}

const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

export function ThemeProvider({ children }) {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('bwTheme') === 'dark';
  });

  useIsomorphicLayoutEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('bwTheme', isDarkMode ? 'dark' : 'light');
      document.body.style.backgroundColor = isDarkMode ? '#1e2229' : '#eef2f6';
    }
  }, [isDarkMode]);

  const themeVals = useMemo(() => {
    const cfg = UI_CFG || { depthOuter: 18, depthCap: 4, btnSlopeBlur: 20, btnEdgeBlur: 2, depthTrench: 4, depthDimple: 2, dropShadowBlur: 11, dropShadowSpread: -10 };
    const t = isDarkMode ? {
      bg: "#1e2229", raised1: "#23272f", raised2: "#191c23", shadowDark: "#13161a", shadowLight: "#292e38",
      trackBg: "#2a2f38", textMain: "#e2e8f0", textSub: "#94a3b8", textHighlight: "#64748b"
    } : {
      bg: "#eef2f6", raised1: "#ffffff", raised2: "#dce3ec", shadowDark: "#c8d4e2", shadowLight: "#ffffff",
      trackBg: "#d8e1ec", textMain: "#475569", textSub: "#94a3b8", textHighlight: "#64748b"
    };
    
    return {
      theme: t, bg: t.bg, textMain: t.textMain, textSub: t.textSub,
      raisedGradient: `linear-gradient(145deg, ${t.raised1}, ${t.raised2})`,
      indentedGradient: `linear-gradient(145deg, ${t.raised2}, ${t.raised1})`,
      shadowOuter: `${cfg.depthOuter}px ${cfg.depthOuter}px ${cfg.depthOuter*2}px ${t.shadowDark}, -${cfg.depthOuter}px -${cfg.depthOuter}px ${cfg.depthOuter*2}px ${t.shadowLight}, inset 1px 1px 2px rgba(255,255,255,0.4), inset -1px -1px 2px rgba(0,0,0,0.02)`,
      shadowCap: `${cfg.depthCap}px ${cfg.depthCap}px ${cfg.depthCap*2}px ${t.shadowDark}, -${cfg.depthCap}px -${cfg.depthCap}px ${cfg.depthCap*2}px ${t.shadowLight}, inset 2px 2px 4px rgba(255,255,255,0.4), inset -2px -2px 4px rgba(0,0,0,0.02)`,
      shadowPlateau: isDarkMode ? `${cfg.depthOuter}px ${cfg.depthOuter}px ${cfg.btnSlopeBlur}px ${t.shadowDark}, -${cfg.depthOuter}px -${cfg.depthOuter}px ${cfg.btnSlopeBlur}px ${t.shadowLight}, inset 2px 2px ${cfg.btnEdgeBlur}px rgba(255,255,255,0.03), inset -2px -2px ${cfg.btnEdgeBlur}px rgba(0,0,0,0.2)` : `${cfg.depthOuter}px ${cfg.depthOuter}px ${cfg.btnSlopeBlur}px ${t.shadowDark}, -${cfg.depthOuter}px -${cfg.depthOuter}px ${cfg.btnSlopeBlur}px ${t.shadowLight}, inset 2px 2px ${cfg.btnEdgeBlur}px rgba(255,255,255,0.9), inset -2px -2px ${cfg.btnEdgeBlur}px rgba(0,0,0,0.02)`,
      shadowTrench: `inset ${cfg.depthTrench}px ${cfg.depthTrench}px ${cfg.depthTrench*2}px ${t.shadowDark}, inset -${cfg.depthTrench}px -${cfg.depthTrench}px ${cfg.depthTrench*2}px ${t.shadowLight}, 1px 1px 2px rgba(255,255,255,0.4)`,
      shadowDimple: `inset ${cfg.depthDimple}px ${cfg.depthDimple}px ${cfg.depthDimple*2}px ${t.shadowDark}, inset -${cfg.depthDimple}px -${cfg.depthDimple}px ${cfg.depthDimple*2}px ${t.shadowLight}`,
      shadowDeepInset: `inset 8px 8px ${cfg.dropShadowBlur}px ${cfg.dropShadowSpread}px ${t.shadowDark}, inset -8px -8px ${cfg.dropShadowBlur}px ${cfg.dropShadowSpread}px ${t.shadowLight}`
    };
  }, [isDarkMode]);

  return (
    <ThemeContext.Provider value={{ isDarkMode, setIsDarkMode, themeVals }}>
      {children}
    </ThemeContext.Provider>
  );
}