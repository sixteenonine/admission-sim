import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import HubLayout from './components/layout/HubLayout.jsx';
import { HubHome, HubFlashcards, HubSpeedRead } from './pages/hub/HubViews.jsx';
import Simulator from './Simulator.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/home" replace />} />
      
      <Route element={<HubLayout />}>
        <Route path="/home" element={<HubHome />} />
        <Route path="/vocab" element={<HubFlashcards />} />
        <Route path="/hub" element={<HubSpeedRead />} />
      </Route>

      <Route path="/admissim" element={<Simulator />} />
    </Routes>
  );
}