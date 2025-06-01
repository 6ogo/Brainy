import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Login } from './pages/Login';
import { SignUp } from './pages/SignUp';
import { ForgotPassword } from './pages/ForgotPassword';
import { StudyPage } from './pages/StudyPage';
import { SubjectSelection } from './pages/SubjectSelection';
import { TeacherSelection } from './pages/TeacherSelection';
import { LearningModeSelection } from './pages/LearningModeSelection';
import { LearningAnalytics } from './pages/LearningAnalytics';
import { Onboarding } from './pages/Onboarding';
import HomePage from './pages/HomePage';
import { AuthProvider } from './contexts/AuthContext';
import { Toaster } from 'react-hot-toast';
import { PrivateRoute } from './components/PrivateRoute';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/onboarding" element={<PrivateRoute><Onboarding /></PrivateRoute>} />
          <Route path="/subjects" element={<PrivateRoute><SubjectSelection /></PrivateRoute>} />
          <Route path="/teachers" element={<PrivateRoute><TeacherSelection /></PrivateRoute>} />
          <Route path="/learning-mode" element={<PrivateRoute><LearningModeSelection /></PrivateRoute>} />
          <Route path="/study" element={<PrivateRoute><StudyPage /></PrivateRoute>} />
          <Route path="/analytics" element={<PrivateRoute><LearningAnalytics /></PrivateRoute>} />
        </Routes>
        <Toaster position="top-right" />
      </AuthProvider>
    </Router>
  );
}

export default App;