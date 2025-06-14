import { useNavigate } from 'react-router-dom';
import { cn, commonStyles } from '../styles/utils';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Brain } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Header } from '../components/Header';

const HomePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const scrollToFeatures = () => {
    const featuresSection = document.getElementById('features');
    featuresSection?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleGetStarted = () => {
    if (user) {
      navigate('/subjects');
    } else {
      navigate('/signup');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-primary-100">
      <Header />
      
      {/* Hero Section */}
      <div className="pt-20 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center">
          <div className="flex justify-center mb-8">
            <div className="rounded-full bg-primary-600 p-4">
              <Brain className="h-12 w-12 text-white" />
            </div>
          </div>
          <h1 className={cn(commonStyles.heading.h1, "tracking-tight sm:text-6xl md:text-7xl")}>
            <span className="block text-primary-600 font-sans">Brainbud</span>
          </h1>
          <p className={cn(commonStyles.text.lg, "mt-6 max-w-2xl mx-auto")}>
            Transform any subject into an engaging conversation with your personal AI tutor 
            who adapts to your learning style and makes studying addictive.
          </p>
          <div className="mt-10 flex justify-center gap-5">
            <Button
              variant="primary"
              size="lg"
              onClick={handleGetStarted}
              className="shadow-lg hover:shadow-xl"
            >
              Get Started
            </Button>
            <Button
              variant="secondary"
              size="lg"
              onClick={scrollToFeatures}
              className="shadow-lg hover:shadow-xl"
            >
              Learn More
            </Button>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div id="features" className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className={cn(commonStyles.heading.h2, "font-sans")}>
            Revolutionary Learning Experience
          </h2>
          <p className={cn(commonStyles.text.lg, "mt-4")}>
            Brainbud combines cutting-edge AI technology to create the most engaging learning experience possible.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {/* Feature 1 */}
          <Card variant="hover" className="p-8">
            <div className="h-12 w-12 bg-primary-100 rounded-full flex items-center justify-center mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className={cn(commonStyles.heading.h3, "mb-3")}>Realistic Video Avatars</h3>
            <p className={cn(commonStyles.text.base)}>
              Interact with lifelike AI tutors who adapt their personality, teaching style, and expressions to match your learning preferences.
            </p>
          </Card>

          {/* Feature 2 */}
          <Card variant="hover" className="p-8">
            <div className="h-12 w-12 bg-primary-100 rounded-full flex items-center justify-center mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </div>
            <h3 className={cn(commonStyles.heading.h3, "mb-3")}>Natural Voice Conversations</h3>
            <p className={cn(commonStyles.text.base)}>
              Enjoy real-time, context-aware conversations with AI tutors who remember your discussion history and adapt to your needs.
            </p>
          </Card>

          {/* Feature 3 */}
          <Card variant="hover" className="p-8">
            <div className="h-12 w-12 bg-primary-100 rounded-full flex items-center justify-center mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h3 className={cn(commonStyles.heading.h3, "mb-3")}>Adaptive Learning</h3>
            <p className={cn(commonStyles.text.base)}>
              Experience personalized education that adapts to your learning style, identifies knowledge gaps, and creates custom study plans.
            </p>
          </Card>

          {/* Feature 4 */}
          <Card variant="hover" className="p-8">
            <div className="h-12 w-12 bg-primary-100 rounded-full flex items-center justify-center mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h3 className={cn(commonStyles.heading.h3, "mb-3")}>Diverse Subject Expertise</h3>
            <p className={cn(commonStyles.text.base)}>
              Access comprehensive knowledge across Math, Science, English, History, Languages, and more, with difficulty levels from elementary to graduate.
            </p>
          </Card>

          {/* Feature 5 */}
          <Card variant="hover" className="p-8">
            <div className="h-12 w-12 bg-primary-100 rounded-full flex items-center justify-center mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className={cn(commonStyles.heading.h3, "mb-3")}>Social Learning</h3>
            <p className={cn(commonStyles.text.base)}>
              Share learning moments, challenge friends, and engage in group study sessions for a more interactive educational experience.
            </p>
          </Card>

          {/* Feature 6 */}
          <Card variant="hover" className="p-8">
            <div className="h-12 w-12 bg-primary-100 rounded-full flex items-center justify-center mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className={cn(commonStyles.heading.h3, "mb-3")}>Learning Analytics</h3>
            <p className={cn(commonStyles.text.base)}>
              Track your progress with detailed analytics that provide insights into your learning patterns and help you achieve your academic goals.
            </p>
          </Card>
        </div>
      </div>

      {/* Target Users Section */}
      <div className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto my-16">
        <Card className="p-8">
          <div className="text-center mb-16">
            <h2 className={cn(commonStyles.heading.h2, "font-sans")}>Who Can Benefit</h2>
            <p className={cn(commonStyles.text.lg, "mt-4")}>
              Brainbud is designed to help learners of all types achieve their educational goals.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {/* Persona 1 */}
            <Card variant="hover" className="p-8 bg-gradient-to-br from-primary-50 to-primary-100">
              <h3 className={cn(commonStyles.heading.h3, "mb-3")}>High School Students</h3>
              <p className={cn(commonStyles.text.base, "mb-4")}>
                Make studying engaging and understand complex topics through conversations with AI tutors 
                that explain concepts in simple terms.
              </p>
              <ul className="text-gray-600 space-y-2">
                <li className="flex items-center">
                  <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  Practice language conversations
                </li>
                <li className="flex items-center">
                  <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  Get help with essay writing
                </li>
                <li className="flex items-center">
                  <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  Prepare for standardized tests
                </li>
              </ul>
            </Card>

            {/* Persona 2 */}
            <Card variant="hover" className="p-8 bg-gradient-to-br from-primary-50 to-primary-100">
              <h3 className={cn(commonStyles.heading.h3, "mb-3")}>College Students</h3>
              <p className={cn(commonStyles.text.base, "mb-4")}>
                Dive deeper into complex topics and prepare for exams and interviews with advanced 
                AI tutors specialized in your field of study.
              </p>
              <ul className="text-gray-600 space-y-2">
                <li className="flex items-center">
                  <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  Deep-dive into complex concepts
                </li>
                <li className="flex items-center">
                  <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  Practice for technical interviews
                </li>
                <li className="flex items-center">
                  <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  Research paper assistance
                </li>
              </ul>
            </Card>

            {/* Persona 3 */}
            <Card variant="hover" className="p-8 bg-gradient-to-br from-primary-50 to-primary-100">
              <h3 className={cn(commonStyles.heading.h3, "mb-3")}>Professionals</h3>
              <p className={cn(commonStyles.text.base, "mb-4")}>
                Upskill efficiently with limited time by learning through conversation during 
                commutes or breaks, focusing on practical application.
              </p>
              <ul className="text-gray-600 space-y-2">
                <li className="flex items-center">
                  <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  Learn during your commute
                </li>
                <li className="flex items-center">
                  <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  Practical skill application
                </li>
                <li className="flex items-center">
                  <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  Industry-specific knowledge
                </li>
              </ul>
            </Card>
          </div>
        </Card>
      </div>

      {/* CTA Section */}
      <div className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
        <h2 className={cn(commonStyles.heading.h2, "font-sans mb-8")}>Ready to Transform Your Learning Experience?</h2>
        <p className={cn(commonStyles.text.lg, "mb-10 max-w-3xl mx-auto")}>
          Join thousands of students who have already discovered the power of conversational learning with Brainbud.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Button
            variant="primary"
            size="lg"
            onClick={() => navigate('/signup')}
            className="shadow-lg hover:shadow-xl"
          >
            Start Free Trial
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={() => navigate('/pricing')}
            className="shadow-lg hover:shadow-xl"
          >
            View Pricing
          </Button>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white py-12 px-4 border-t border-gray-200">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase mb-4">Product</h3>
              <ul className="space-y-4">
                <li><a href="/pricing" className="text-base text-gray-600 hover:text-primary-600">Pricing</a></li>
                <li><a href="/faq" className="text-base text-gray-600 hover:text-primary-600">FAQ</a></li>
                <li><a href="/help" className="text-base text-gray-600 hover:text-primary-600">Help Center</a></li>
                <li><a href="/blog" className="text-base text-gray-600 hover:text-primary-600">Blog</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase mb-4">Company</h3>
              <ul className="space-y-4">
                <li><a href="/about" className="text-base text-gray-600 hover:text-primary-600">About Us</a></li>
                <li><a href="/careers" className="text-base text-gray-600 hover:text-primary-600">Careers</a></li>
                <li><a href="/contact" className="text-base text-gray-600 hover:text-primary-600">Contact</a></li>
                <li><a href="/blog" className="text-base text-gray-600 hover:text-primary-600">News</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase mb-4">Resources</h3>
              <ul className="space-y-4">
                <li><a href="/help" className="text-base text-gray-600 hover:text-primary-600">Help Center</a></li>
                <li><a href="/contact" className="text-base text-gray-600 hover:text-primary-600">Support</a></li>
                <li><a href="/blog" className="text-base text-gray-600 hover:text-primary-600">Learning Tips</a></li>
                <li><a href="/contact" className="text-base text-gray-600 hover:text-primary-600">Partners</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase mb-4">Legal</h3>
              <ul className="space-y-4">
                <li><a href="/privacy" className="text-base text-gray-600 hover:text-primary-600">Privacy</a></li>
                <li><a href="/terms" className="text-base text-gray-600 hover:text-primary-600">Terms</a></li>
                <li><a href="/privacy" className="text-base text-gray-600 hover:text-primary-600">Cookie Policy</a></li>
                <li><a href="/terms" className="text-base text-gray-600 hover:text-primary-600">Licenses</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-gray-200">
            <p className="text-base text-gray-400 text-center">
              &copy; {new Date().getFullYear()} Brainbud Education, Inc. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;