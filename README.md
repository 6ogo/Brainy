# Brainbud - Your Personal AI Tutor

Brainbud is an advanced AI-powered educational platform that provides personalized tutoring through interactive conversations and video interactions. The application adapts to individual learning styles, tracks progress, and offers detailed analytics to enhance the learning experience.

## Features

### Core Learning Experience
- **AI Tutoring**: Engage with AI tutors through text or voice conversations
- **Multiple Subjects**: Access tutoring in Math, Science, English, History, Languages, and Test Prep
- **Difficulty Levels**: Choose from Elementary, High School, College, or Advanced difficulty
- **Teacher Personalities**: Select from different AI tutor personalities to match your learning style
- **Voice Conversations**: Natural voice interaction with AI tutors using speech recognition
- **Video Learning**: Visual learning experience with AI tutors in various virtual environments

### Analytics & Progress Tracking
- **Learning Analytics Dashboard**: Track your progress with detailed metrics and visualizations
- **Learning Style Detection**: Identifies your learning style (visual, auditory, kinesthetic, reading/writing)
- **Performance Metrics**: Monitors learning velocity, engagement score, consistency rating, and progress trends
- **Subject Distribution**: Visualizes your focus across different subjects
- **Skills Analysis**: Radar chart showing strengths in different cognitive skills

### Gamification & Motivation
- **Level System**: Earn XP and level up as you learn
- **Achievement System**: Unlock achievements for reaching milestones and completing challenges
- **Streaks**: Maintain daily learning streaks for consistency
- **Social Sharing**: Share your progress on social media platforms

### Study Advisor
- **Personalized Recommendations**: Get tailored study advice based on your learning patterns
- **Video Advisor**: Receive personalized video messages with study tips
- **Learning Insights**: View insights about your optimal study times and learning style
- **Study Patterns Analysis**: Identifies when and how you learn most effectively

### Subscription System
- **Tiered Plans**: Free, Premium, and Ultimate subscription options
- **Stripe Integration**: Secure payment processing
- **Usage Limits**: Different conversation time and feature limits based on subscription level

## Technology Stack

### Frontend
- **React**: UI library for building the user interface
- **TypeScript**: Type-safe JavaScript for better development experience
- **Tailwind CSS**: Utility-first CSS framework for styling
- **Framer Motion**: Animation library for smooth transitions
- **Recharts/Chart.js**: Data visualization libraries for analytics
- **React Router**: Client-side routing
- **Zustand**: State management
- **React Speech Recognition**: Voice recognition for speech-to-text functionality

### Backend
- **Supabase**: Backend-as-a-Service for authentication, database, and storage
- **PostgreSQL**: Relational database for data storage
- **Supabase Edge Functions**: Serverless functions for backend logic
- **Stripe**: Payment processing for subscriptions

### AI & Voice Services
- **Groq**: AI model for generating responses
- **ElevenLabs**: Text-to-speech service for AI voice responses
- **Tavus**: Personalized video generation for study advisor

## Architecture

### Database Schema
- **Users**: User accounts and authentication
- **Conversations**: Stores chat history between users and AI tutors
- **User Usage**: Tracks daily usage metrics
- **Subscription Management**: Handles subscription levels and limits
- **Achievements**: Tracks user achievements and progress
- **Analytics**: Stores learning metrics and insights

### Core Components
- **Authentication System**: Secure login, signup, and password management
- **Conversation Engine**: Processes user messages and generates AI responses
- **Voice Processing**: Handles speech recognition and text-to-speech
- **Analytics Engine**: Processes learning data to generate insights
- **Subscription Management**: Handles payment processing and access control

## Getting Started

### Prerequisites
- Node.js (v16+)
- npm or yarn
- Supabase account
- Stripe account (for payment processing)
- ElevenLabs API key (for voice features)
- Groq API key (for AI responses)
- Tavus API key and replica ID (for video advisor)

### Environment Setup
Create a `.env` file with the following variables:
```
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_STRIPE_PUBLISHABLE_KEY=your-stripe-key
VITE_ELEVENLABS_API_KEY=your-elevenlabs-key
VITE_GROQ_API_KEY=your-groq-key
VITE_TAVUS_API_KEY=your-tavus-key
VITE_TAVUS_REPLICA_ID=your-tavus-replica-id
```

### Installation
1. Clone the repository
2. Install dependencies: `npm install`
3. Start the development server: `npm run dev`

## Deployment
The application can be deployed to Netlify or any other static site hosting service. The backend is handled by Supabase, so no additional server setup is required.

## License
This project is licensed under the MIT License - see the LICENSE file for details.