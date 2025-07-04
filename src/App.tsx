import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './pages/Login';
import { SignUp } from './pages/SignUp';
import { ForgotPassword } from './pages/ForgotPassword';
import { ResetPassword } from './pages/ResetPassword';
import { StudyPage } from './pages/StudyPage';
import { SubjectSelection } from './pages/SubjectSelection';
import { TeacherSelection } from './pages/TeacherSelection';
import { LearningModeSelection } from './pages/LearningModeSelection';
import { LearningAnalytics } from './pages/LearningAnalytics';
import { Onboarding } from './pages/Onboarding';
import { StudyAdvisorPage } from './pages/StudyAdvisorPage';
import HomePage from './pages/HomePage';
import PricingPage from './pages/PricingPage';
import SuccessPage from './pages/SuccessPage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import PrivacyPage from './pages/PrivacyPage';
import TermsPage from './pages/TermsPage';
import FAQPage from './pages/FAQPage';
import CareersPage from './pages/CareersPage';
import BlogPage from './pages/BlogPage';
import HelpPage from './pages/HelpPage';
import NotFound from './pages/NotFound';
import { AuthProvider } from './contexts/AuthContext';
import { SecurityProvider } from './components/SecurityProvider';
import { Toaster } from 'react-hot-toast';
import { PrivateRoute } from './components/PrivateRoute';
import BoltOverlay from './components/BoltOverlay';

function App() {
  return (
    <Router>
      <SecurityProvider>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/auth/callback" element={<ResetPassword />} />
            <Route path="/pricing" element={<PricingPage />} />
            <Route path="/success" element={<PrivateRoute><SuccessPage /></PrivateRoute>} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/faq" element={<FAQPage />} />
            <Route path="/careers" element={<CareersPage />} />
            <Route path="/blog" element={<BlogPage />} />
            <Route path="/help" element={<HelpPage />} />
            <Route path="/onboarding" element={<PrivateRoute><Onboarding /></PrivateRoute>} />
            <Route path="/subjects" element={<PrivateRoute><SubjectSelection /></PrivateRoute>} />
            <Route path="/teachers" element={<PrivateRoute><TeacherSelection /></PrivateRoute>} />
            <Route path="/learning-mode" element={<PrivateRoute><LearningModeSelection /></PrivateRoute>} />
            <Route path="/study" element={<PrivateRoute><StudyPage /></PrivateRoute>} />
            <Route path="/study-advisor" element={<PrivateRoute><StudyAdvisorPage /></PrivateRoute>} />
            <Route path="/analytics" element={<PrivateRoute><LearningAnalytics /></PrivateRoute>} />
            <Route path="/404" element={<NotFound />} />
            <Route path="*" element={<Navigate to="/404" replace />} />
          </Routes>
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                maxWidth: '500px',
              },
            }}
          />
        </AuthProvider>
      </SecurityProvider>
      {/* Bolt Overlay: persistent bottom-right link */}
      <BoltOverlay />
    </Router>
  );
}

export default App;