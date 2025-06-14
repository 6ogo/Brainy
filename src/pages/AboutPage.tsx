import React, { useEffect } from 'react';
import { Header } from '../components/Header';
import { Card } from '../components/Card';
import { cn, commonStyles } from '../styles/utils';
import { Brain, Users, Target, Award, Heart, Lightbulb } from 'lucide-react';

export const AboutPage: React.FC = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const teamMembers = [
    {
      name: 'Dr. Sarah Chen',
      role: 'CEO & Co-Founder',
      bio: 'Former Stanford AI researcher with 15+ years in educational technology. PhD in Machine Learning.',
      image: 'https://images.pexels.com/photos/3760263/pexels-photo-3760263.jpeg'
    },
    {
      name: 'Michael Rodriguez',
      role: 'CTO & Co-Founder',
      bio: 'Ex-Google engineer specializing in conversational AI and natural language processing.',
      image: 'https://images.pexels.com/photos/2379005/pexels-photo-2379005.jpeg'
    },
    {
      name: 'Dr. Emily Watson',
      role: 'Head of Education',
      bio: 'Former Harvard professor with expertise in cognitive science and personalized learning.',
      image: 'https://images.pexels.com/photos/3796217/pexels-photo-3796217.jpeg'
    },
    {
      name: 'David Kim',
      role: 'Head of Product',
      bio: 'Product leader with experience at Duolingo and Khan Academy, passionate about accessible education.',
      image: 'https://images.pexels.com/photos/2182970/pexels-photo-2182970.jpeg'
    }
  ];

  const values = [
    {
      icon: <Brain className="h-8 w-8" />,
      title: 'Innovation',
      description: 'We push the boundaries of AI technology to create revolutionary learning experiences.'
    },
    {
      icon: <Users className="h-8 w-8" />,
      title: 'Accessibility',
      description: 'Quality education should be available to everyone, regardless of background or location.'
    },
    {
      icon: <Target className="h-8 w-8" />,
      title: 'Personalization',
      description: 'Every learner is unique, and our AI adapts to individual learning styles and needs.'
    },
    {
      icon: <Heart className="h-8 w-8" />,
      title: 'Empathy',
      description: 'We design with compassion, understanding the challenges and emotions of learning.'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="py-16 px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="max-w-4xl mx-auto text-center mb-16">
          <h1 className={cn(commonStyles.heading.h1, "mb-6")}>
            About Brainbud
          </h1>
          <p className={cn(commonStyles.text.lg, "mb-8")}>
            We're on a mission to revolutionize education through AI-powered personalized learning, 
            making quality tutoring accessible to students worldwide.
          </p>
          <div className="flex justify-center">
            <div className="p-4 bg-primary-100 rounded-full">
              <Brain className="h-16 w-16 text-primary-600" />
            </div>
          </div>
        </div>

        {/* Our Story */}
        <div className="max-w-6xl mx-auto mb-16">
          <Card className="p-8">
            <h2 className={cn(commonStyles.heading.h2, "mb-6 text-center")}>
              Our Story
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div>
                <p className={cn(commonStyles.text.base, "mb-4")}>
                  Brainbud was born from a simple observation: traditional education doesn't work for everyone. 
                  In 2023, our founders—AI researchers and education experts—came together with a shared vision 
                  of creating personalized learning experiences that adapt to each student's unique needs.
                </p>
                <p className={cn(commonStyles.text.base, "mb-4")}>
                  We've seen firsthand how students struggle with one-size-fits-all approaches. Some learn 
                  better through conversation, others through visual demonstrations. Some need encouragement, 
                  others thrive on challenges. Our AI tutors understand these differences and adapt accordingly.
                </p>
                <p className={cn(commonStyles.text.base)}>
                  Today, Brainbud serves thousands of students worldwide, helping them achieve their academic 
                  goals through personalized, engaging, and effective AI-powered tutoring.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-primary-50 rounded-lg">
                  <div className="text-3xl font-bold text-primary-600 mb-2">50K+</div>
                  <div className="text-sm text-gray-600">Students Helped</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-3xl font-bold text-green-600 mb-2">1M+</div>
                  <div className="text-sm text-gray-600">Learning Sessions</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-3xl font-bold text-purple-600 mb-2">95%</div>
                  <div className="text-sm text-gray-600">Satisfaction Rate</div>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <div className="text-3xl font-bold text-orange-600 mb-2">24/7</div>
                  <div className="text-sm text-gray-600">Available</div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Our Values */}
        <div className="max-w-6xl mx-auto mb-16">
          <h2 className={cn(commonStyles.heading.h2, "mb-12 text-center")}>
            Our Values
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <Card key={index} variant="hover" className="p-6 text-center">
                <div className="flex justify-center mb-4">
                  <div className="p-3 bg-primary-100 rounded-full text-primary-600">
                    {value.icon}
                  </div>
                </div>
                <h3 className={cn(commonStyles.heading.h3, "mb-3")}>
                  {value.title}
                </h3>
                <p className={cn(commonStyles.text.base)}>
                  {value.description}
                </p>
              </Card>
            ))}
          </div>
        </div>

        {/* Team Section */}
        <div className="max-w-6xl mx-auto mb-16">
          <h2 className={cn(commonStyles.heading.h2, "mb-12 text-center")}>
            Meet Our Team
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {teamMembers.map((member, index) => (
              <Card key={index} variant="hover" className="p-6 text-center">
                <div className="w-24 h-24 mx-auto mb-4 rounded-full overflow-hidden">
                  <img 
                    src={member.image} 
                    alt={member.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className={cn(commonStyles.heading.h4, "mb-1")}>
                  {member.name}
                </h3>
                <p className="text-primary-600 font-medium text-sm mb-3">
                  {member.role}
                </p>
                <p className={cn(commonStyles.text.sm)}>
                  {member.bio}
                </p>
              </Card>
            ))}
          </div>
        </div>

        {/* Mission Statement */}
        <div className="max-w-4xl mx-auto">
          <Card className="p-8 bg-gradient-to-r from-primary-50 to-blue-50 border border-primary-200">
            <div className="text-center">
              <div className="flex justify-center mb-6">
                <div className="p-4 bg-primary-100 rounded-full">
                  <Lightbulb className="h-12 w-12 text-primary-600" />
                </div>
              </div>
              <h2 className={cn(commonStyles.heading.h2, "mb-6")}>
                Our Mission
              </h2>
              <p className={cn(commonStyles.text.lg, "mb-6")}>
                To democratize access to high-quality, personalized education through AI technology, 
                empowering every student to reach their full potential regardless of their background, 
                location, or learning style.
              </p>
              <div className="flex justify-center">
                <Award className="h-8 w-8 text-primary-600" />
              </div>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default AboutPage;