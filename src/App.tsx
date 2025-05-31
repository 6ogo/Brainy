import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './pages/Login';
import { StudyPage } from './pages/StudyPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login\" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/study" element={<StudyPage />} />
      </Routes>
    </Router>
  );
}

export default App;