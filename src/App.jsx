import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import HubLayout from './components/layout/HubLayout.jsx';
import { HubHome, HubFlashcards, HubFlashcardDecks, HubSpeedRead } from './pages/hub/HubViews.jsx';
import { Suspense, lazy } from 'react';

// Code Splitting - หั่นไฟล์และโหลดเฉพาะหน้าที่ผู้ใช้กดเข้าดู
const FlashcardPlayer = lazy(() => import('./pages/hub/FlashcardPlayer.jsx'));
const Simulator = lazy(() => import('./Simulator.jsx'));
const SpeedReadLobby = lazy(() => import('./pages/hub/SpeedReadLobby.jsx'));
const SpeedRead = lazy(() => import('./pages/hub/SpeedRead.jsx'));
const Subscription = lazy(() => import('./pages/hub/Subscription.jsx'));
const StoryLobby = lazy(() => import('./pages/hub/StoryLobby.jsx'));
const StoryReader = lazy(() => import('./pages/hub/StoryReader.jsx'));
const StoryAdmin = lazy(() => import('./pages/admin/StoryAdmin.jsx'));
const LandingApp = lazy(() => import('./LandingApp.jsx'));
const Roadmap = lazy(() => import('./pages/hub/Roadmap.jsx'));
import { AuthProvider } from './contexts/AuthContext.jsx';
import { ThemeProvider } from './contexts/ThemeContext.jsx';

export default function App() {
  const location = useLocation();

  return (
    <AuthProvider>
      <ThemeProvider>
        <div className="w-full h-full">
        <Suspense fallback={
            <div className="flex items-center justify-center w-full h-screen bg-gray-50">
              <div className="flex flex-col items-center opacity-50">
                <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-gray-500 font-medium tracking-widest">LOADING...</p>
              </div>
            </div>
          }>
          <Routes>
            <Route path="/admin/storydiary" element={<StoryAdmin />} />
            <Route path="/" element={<LandingApp />} />
            
            <Route element={<HubLayout />}>
              <Route path="/home" element={<HubHome />} />
              <Route path="/vocab" element={<HubFlashcards />} />
              <Route path="/vocab/decks" element={<HubFlashcardDecks />} />
              <Route path="/vocab/play" element={<FlashcardPlayer />} />
              <Route path="/hub" element={<HubSpeedRead />} />
              <Route path="speedread" element={<SpeedReadLobby />} />
              <Route path="speedread/play" element={<SpeedRead />} />
              <Route path="/subscription" element={<Subscription />} />
              <Route path="/storydiary" element={<StoryLobby />} />
              <Route path="/storydiary/play" element={<StoryReader />} />
              <Route path="/roadmap" element={<Roadmap />} />
              <Route path="decks" element={<HubFlashcardDecks />} />
              <Route path="/admissim" element={<Simulator />} />
            </Route>
          </Routes>
          </Suspense>
        </div>
      </ThemeProvider>
    </AuthProvider>
  );
}