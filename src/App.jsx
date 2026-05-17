import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import HubLayout from './components/layout/HubLayout.jsx';
import { HubHome, HubFlashcards, HubSpeedRead } from './pages/hub/HubViews.jsx';
import FlashcardPlayer from './pages/hub/FlashcardPlayer.jsx';
import Simulator from './Simulator.jsx';
import SpeedReadLobby from './pages/hub/SpeedReadLobby.jsx';
import SpeedRead from './pages/hub/SpeedRead.jsx';
import Subscription from './pages/hub/Subscription.jsx';
import StoryLobby from './pages/hub/StoryLobby.jsx';
import StoryReader from './pages/hub/StoryReader.jsx';
import StoryAdmin from './pages/admin/StoryAdmin.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/admin/storydiary" element={<StoryAdmin />} />
      <Route path="/" element={<Navigate to="/home" replace />} />
      
      <Route element={<HubLayout />}>
        <Route path="/home" element={<HubHome />} />
        <Route path="/vocab" element={<HubFlashcards />} />
        {/* เพิ่มหน้าเล่น Flashcard เข้าไปในระบบ */}
        <Route path="/vocab/play" element={<FlashcardPlayer />} />
        <Route path="/hub" element={<HubSpeedRead />} />
        <Route path="speedread" element={<SpeedReadLobby />} />
        <Route path="speedread/play" element={<SpeedRead />} />
        <Route path="/subscription" element={<Subscription />} />
        <Route path="/storydiary" element={<StoryLobby />} />
        <Route path="/storydiary/play" element={<StoryReader />} />
      </Route>

      <Route path="/admissim" element={<Simulator />} />
    </Routes>
  );
}