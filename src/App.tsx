import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Login } from './pages/Login';
import { StudyPage } from './pages/StudyPage';
import HomePage from './pages/HomePage';

function App() {
  return (
    <>
      <Router>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/study" element={<StudyPage />} />
        </Routes>
      </Router>
      <div className="fixed bottom-4 right-4 z-50">
        <a href="https://bolt.new/">
        <img 
          src="/white_circle_360x360.png"
          alt="Powered by Bolt" 
          className="w-16 h-16 opacity-75 hover:opacity-100 transition-opacity"
        />
        </a>
      </div>
    </>
  );
}

export default App;