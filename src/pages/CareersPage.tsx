import React, { useEffect } from 'react';
import { Header } from '../components/Header';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { cn, commonStyles } from '../styles/utils';
import { 
  Briefcase, 
  MapPin, 
  Clock, 
  Users, 
  Heart, 
  Zap, 
  Globe,
  Coffee,
  Laptop,
  GraduationCap,
  ExternalLink
} from 'lucide-react';

export const CareersPage: React.FC = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const benefits = [
    {
      icon: <Heart className="h-6 w-6" />,
      title: 'Health & Wellness',
      description: 'Comprehensive health insurance, mental health support, and wellness programs'
    },
    {
      icon: <Clock className="h-6 w-6" />,
      title: 'Flexible Schedule',
      description: 'Work-life balance with flexible hours and unlimited PTO policy'
    },
    {
      icon: <Laptop className="h-6 w-6" />,
      title: 'Remote-First',
      description: 'Work from anywhere with a $2000 home office setup budget'
    },
    {
      icon: <GraduationCap className="h-6 w-6" />,
      title: 'Learning Budget',
      description: '$3000 annual budget for courses, conferences, and professional development'
    },
    {
      icon: <Coffee className="h-6 w-6" />,
      title: 'Team Retreats',
      description: 'Quarterly team gatherings and annual company retreat'
    },
    {
      icon: <Zap className="h-6 w-6" />,
      title: 'Equity Package',
      description: 'Competitive equity compensation for all full-time employees'
    }
  ];

  const openPositions = [
    {
      id: 1,
      title: 'Senior AI Engineer',
      department: 'Engineering',
      location: 'Remote',
      type: 'Full-time',
      description: 'Lead the development of our next-generation AI tutoring models. Work with cutting-edge NLP and machine learning technologies.',
      requirements: ['5+ years ML/AI experience', 'Python, TensorFlow/PyTorch', 'NLP expertise', 'PhD preferred'],
      salary: '$180k - $250k'
    },
    {
      id: 2,
      title: 'Product Designer',
      department: 'Design',
      location: 'Remote',
      type: 'Full-time',
      description: 'Design intuitive and engaging learning experiences. Shape the future of AI-powered education through thoughtful UX/UI design.',
      requirements: ['4+ years product design', 'Figma expertise', 'EdTech experience', 'User research skills'],
      salary: '$130k - $180k'
    },
    {
      id: 3,
      title: 'Education Content Specialist',
      department: 'Content',
      location: 'Remote',
      type: 'Full-time',
      description: 'Develop curriculum and educational content for our AI tutors. Ensure pedagogical accuracy and effectiveness.',
      requirements: ['Teaching experience', 'Curriculum development', 'Subject matter expertise', 'Masters in Education preferred'],
      salary: '$90k - $130k'
    },
    {
      id: 4,
      title: 'DevOps Engineer',
      department: 'Engineering',
      location: 'Remote',
      type: 'Full-time',
      description: 'Build and maintain scalable infrastructure for our AI platform. Ensure high availability and performance.',
      requirements: ['3+ years DevOps', 'AWS/GCP experience', 'Kubernetes', 'CI/CD pipelines'],
      salary: '$140k - $190k'
    },
    {
      id: 5,
      title: 'Customer Success Manager',
      department: 'Customer Success',
      location: 'Remote',
      type: 'Full-time',
      description: 'Help educational institutions succeed with Brainbud. Drive adoption and ensure customer satisfaction.',
      requirements: ['3+ years customer success', 'EdTech experience', 'Strong communication', 'Data-driven approach'],
      salary: '$80k - $120k'
    },
    {
      id: 6,
      title: 'Marketing Manager',
      department: 'Marketing',
      location: 'Remote',
      type: 'Full-time',
      description: 'Lead our marketing efforts to reach students and educators worldwide. Drive growth through creative campaigns.',
      requirements: ['4+ years marketing', 'Digital marketing expertise', 'Content creation', 'Analytics skills'],
      salary: '$100k - $140k'
    }
  ];

  const values = [
    {
      icon: <Users className="h-8 w-8" />,
      title: 'Collaboration',
      description: 'We believe the best ideas come from diverse teams working together toward a common goal.'
    },
    {
      icon: <Zap className="h-8 w-8" />,
      title: 'Innovation',
      description: 'We\'re not afraid to challenge the status quo and push the boundaries of what\'s possible in education.'
    },
    {
      icon: <Heart className="h-8 w-8" />,
      title: 'Impact',
      description: 'Every day, we work to make quality education accessible to learners around the world.'
    },
    {
      icon: <Globe className="h-8 w-8" />,
      title: 'Inclusivity',
      description: 'We celebrate diversity and create an environment where everyone can thrive and be their authentic self.'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="py-16 px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="max-w-4xl mx-auto text-center mb-16">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-primary-100 rounded-full">
              <Briefcase className="h-12 w-12 text-primary-600" />
            </div>
          </div>
          <h1 className={cn(commonStyles.heading.h1, "mb-6")}>
            Join Our Mission
          </h1>
          <p className={cn(commonStyles.text.lg, "mb-8")}>
            Help us revolutionize education through AI. We're building the future of personalized learning, 
            and we want passionate people to join us on this journey.
          </p>
          <div className="flex justify-center space-x-4">
            <Button
              variant="primary"
              onClick={() => document.getElementById('open-positions')?.scrollIntoView({ behavior: 'smooth' })}
            >
              View Open Positions
            </Button>
            <Button
              variant="outline"
              onClick={() => window.location.href = '/contact'}
            >
              Get in Touch
            </Button>
          </div>
        </div>

        {/* Company Values */}
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

        {/* Benefits */}
        <div className="max-w-6xl mx-auto mb-16">
          <h2 className={cn(commonStyles.heading.h2, "mb-12 text-center")}>
            Why Work at Brainbud?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => (
              <Card key={index} variant="hover" className="p-6">
                <div className="flex items-start space-x-4">
                  <div className="p-2 bg-primary-100 rounded-lg text-primary-600 flex-shrink-0">
                    {benefit.icon}
                  </div>
                  <div>
                    <h3 className={cn(commonStyles.heading.h4, "mb-2")}>
                      {benefit.title}
                    </h3>
                    <p className={cn(commonStyles.text.base)}>
                      {benefit.description}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Open Positions */}
        <div id="open-positions" className="max-w-6xl mx-auto mb-16">
          <h2 className={cn(commonStyles.heading.h2, "mb-12 text-center")}>
            Open Positions
          </h2>
          <div className="space-y-6">
            {openPositions.map((position) => (
              <Card key={position.id} className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-4 mb-3">
                      <h3 className={cn(commonStyles.heading.h3)}>
                        {position.title}
                      </h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <div className="flex items-center space-x-1">
                          <Briefcase className="h-4 w-4" />
                          <span>{position.department}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <MapPin className="h-4 w-4" />
                          <span>{position.location}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="h-4 w-4" />
                          <span>{position.type}</span>
                        </div>
                      </div>
                    </div>
                    
                    <p className={cn(commonStyles.text.base, "mb-4")}>
                      {position.description}
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Requirements:</h4>
                        <ul className="text-sm text-gray-600 space-y-1">
                          {position.requirements.map((req, index) => (
                            <li key={index} className="flex items-start">
                              <span className="w-1.5 h-1.5 bg-primary-500 rounded-full mr-2 mt-2 flex-shrink-0"></span>
                              {req}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Salary Range:</h4>
                        <p className="text-lg font-semibold text-primary-600">{position.salary}</p>
                        <p className="text-sm text-gray-500">Plus equity and benefits</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="lg:ml-6 lg:flex-shrink-0">
                    <Button
                      variant="primary"
                      rightIcon={<ExternalLink className="h-4 w-4" />}
                      onClick={() => window.open(`mailto:careers@brainbud.com?subject=Application for ${position.title}`, '_blank')}
                    >
                      Apply Now
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Application Process */}
        <div className="max-w-4xl mx-auto mb-16">
          <Card className="p-8">
            <h2 className={cn(commonStyles.heading.h2, "mb-6 text-center")}>
              Our Hiring Process
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-primary-600 font-bold">1</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Application</h3>
                <p className="text-sm text-gray-600">Submit your application and we'll review it within 3 business days</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-primary-600 font-bold">2</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Phone Screen</h3>
                <p className="text-sm text-gray-600">30-minute call to discuss your background and the role</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-primary-600 font-bold">3</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Technical Interview</h3>
                <p className="text-sm text-gray-600">Role-specific assessment and team interviews</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-primary-600 font-bold">4</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Final Decision</h3>
                <p className="text-sm text-gray-600">Reference checks and offer within 1 week</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Call to Action */}
        <div className="max-w-4xl mx-auto">
          <Card className="p-8 bg-gradient-to-r from-primary-50 to-blue-50 border border-primary-200">
            <div className="text-center">
              <h2 className={cn(commonStyles.heading.h2, "mb-4")}>
                Don't See the Right Role?
              </h2>
              <p className={cn(commonStyles.text.lg, "mb-6")}>
                We're always looking for talented people who share our passion for education. 
                Send us your resume and tell us how you'd like to contribute to our mission.
              </p>
              <Button
                variant="primary"
                onClick={() => window.open('mailto:careers@brainbud.com?subject=General Application', '_blank')}
                rightIcon={<ExternalLink className="h-4 w-4" />}
              >
                Send Us Your Resume
              </Button>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default CareersPage;