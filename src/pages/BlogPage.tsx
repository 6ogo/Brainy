import React, { useEffect, useState } from 'react';
import { Header } from '../components/Header';
import { Card } from '../components/Card';
import { cn, commonStyles } from '../styles/utils';
import { 
  Calendar, 
  User, 
  Clock, 
  ArrowRight,
  Search,
  Tag,
  BookOpen,
  Brain,
  Lightbulb,
  TrendingUp
} from 'lucide-react';

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  date: string;
  readTime: string;
  category: string;
  tags: string[];
  image: string;
  featured: boolean;
}

export const BlogPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const categories = [
    { id: 'all', name: 'All Posts', icon: <BookOpen className="h-4 w-4" /> },
    { id: 'ai-education', name: 'AI in Education', icon: <Brain className="h-4 w-4" /> },
    { id: 'learning-tips', name: 'Learning Tips', icon: <Lightbulb className="h-4 w-4" /> },
    { id: 'product-updates', name: 'Product Updates', icon: <TrendingUp className="h-4 w-4" /> },
    { id: 'success-stories', name: 'Success Stories', icon: <User className="h-4 w-4" /> }
  ];

  const blogPosts: BlogPost[] = [
    {
      id: '1',
      title: 'The Future of Personalized Learning: How AI is Transforming Education',
      excerpt: 'Explore how artificial intelligence is revolutionizing the way we learn, making education more personalized, accessible, and effective than ever before.',
      content: `Artificial Intelligence is fundamentally changing how we approach education. Traditional one-size-fits-all teaching methods are giving way to personalized learning experiences that adapt to each student's unique needs, learning style, and pace.

At Brainbud, we've seen firsthand how AI can transform the learning experience. Our AI tutors don't just provide answers—they understand context, remember previous conversations, and adapt their teaching style based on how each student learns best.

The key benefits of AI-powered personalized learning include:

**Adaptive Learning Paths**: AI can identify knowledge gaps and create customized learning paths that address each student's specific needs.

**Real-time Feedback**: Instead of waiting for graded assignments, students receive immediate feedback that helps them correct mistakes and reinforce learning.

**24/7 Availability**: AI tutors are available whenever students need help, breaking down barriers of time and location.

**Emotional Intelligence**: Advanced AI can recognize frustration or confusion and adjust its approach accordingly, providing encouragement when needed.

The future of education is not about replacing human teachers, but about augmenting their capabilities with AI tools that can provide personalized support to every student. This hybrid approach combines the best of both worlds: the empathy and creativity of human educators with the scalability and consistency of AI.

As we continue to develop these technologies, we're seeing remarkable improvements in student engagement, retention, and academic outcomes. The future of learning is here, and it's more personalized than ever.`,
      author: 'Dr. Sarah Chen',
      date: '2024-12-10',
      readTime: '8 min read',
      category: 'ai-education',
      tags: ['AI', 'Personalized Learning', 'Education Technology', 'Future of Learning'],
      image: 'https://images.pexels.com/photos/8386440/pexels-photo-8386440.jpeg',
      featured: true
    },
    {
      id: '2',
      title: '10 Proven Study Techniques That Actually Work',
      excerpt: 'Discover evidence-based study methods that can dramatically improve your learning efficiency and retention rates.',
      content: `Effective studying isn't about spending more hours with your books—it's about using proven techniques that maximize your learning efficiency. Here are 10 research-backed study methods that can transform your academic performance:

**1. The Pomodoro Technique**: Study in focused 25-minute intervals followed by 5-minute breaks. This helps maintain concentration and prevents mental fatigue.

**2. Active Recall**: Instead of just re-reading notes, actively test yourself on the material. This strengthens memory pathways and improves retention.

**3. Spaced Repetition**: Review material at increasing intervals. This technique leverages the psychological spacing effect to move information into long-term memory.

**4. The Feynman Technique**: Explain concepts in simple terms as if teaching someone else. This reveals gaps in understanding and deepens comprehension.

**5. Interleaving**: Mix different types of problems or subjects in a single study session. This improves problem-solving skills and prevents overconfidence.

**6. Elaborative Interrogation**: Ask yourself "why" and "how" questions about the material. This creates meaningful connections and improves understanding.

**7. Dual Coding**: Combine verbal and visual information. Use diagrams, mind maps, and other visual aids alongside text-based learning.

**8. Testing Effect**: Take practice tests regularly. Retrieval practice is one of the most effective ways to strengthen memory.

**9. Distributed Practice**: Spread learning sessions over time rather than cramming. This leads to better long-term retention.

**10. Metacognitive Strategies**: Think about your thinking. Monitor your understanding and adjust your study strategies accordingly.

Remember, different techniques work better for different people and subjects. Experiment with these methods to find what works best for you, and don't be afraid to combine multiple techniques for maximum effectiveness.`,
      author: 'Michael Rodriguez',
      date: '2024-12-08',
      readTime: '6 min read',
      category: 'learning-tips',
      tags: ['Study Tips', 'Learning Strategies', 'Academic Success', 'Productivity'],
      image: 'https://images.pexels.com/photos/4144923/pexels-photo-4144923.jpeg',
      featured: false
    },
    {
      id: '3',
      title: 'Introducing Voice-Powered Learning: A New Era of Interactive Education',
      excerpt: 'Learn about our latest feature that brings natural conversation to AI tutoring, making learning more engaging and accessible.',
      content: `We're excited to announce the launch of our voice-powered learning feature, a groundbreaking addition to the Brainbud platform that makes AI tutoring more natural and engaging than ever before.

**What's New?**

Our new voice feature allows students to have natural conversations with their AI tutors, just like talking to a human teacher. This isn't just speech-to-text—it's a sophisticated system that understands context, tone, and intent.

**Key Features:**

- **Natural Conversation Flow**: Our AI understands interruptions, clarifications, and follow-up questions
- **Emotional Recognition**: The system can detect frustration or confusion and adjust its response accordingly
- **Multi-language Support**: Available in English, Spanish, French, and Mandarin
- **Accessibility**: Perfect for students with learning differences or visual impairments

**The Science Behind Voice Learning**

Research shows that verbal interaction activates different parts of the brain compared to text-based learning. When students speak their questions and hear explanations, they engage multiple sensory channels, leading to:

- Improved retention rates (up to 65% better than text-only)
- Enhanced comprehension through auditory processing
- Better pronunciation and language skills
- Increased engagement and motivation

**Real-World Impact**

Since launching the beta version, we've seen remarkable results:
- 40% increase in session duration
- 60% improvement in student satisfaction scores
- 25% better learning outcomes in standardized assessments

**Getting Started**

Voice-powered learning is available to all Premium and Ultimate subscribers. Simply click the microphone icon during any tutoring session and start talking naturally with your AI tutor.

This feature represents our commitment to making learning more accessible, engaging, and effective for students worldwide. We believe that the future of education is conversational, and we're proud to be leading this transformation.`,
      author: 'David Kim',
      date: '2024-12-05',
      readTime: '5 min read',
      category: 'product-updates',
      tags: ['Voice Learning', 'Product Update', 'AI Technology', 'Accessibility'],
      image: 'https://images.pexels.com/photos/7092613/pexels-photo-7092613.jpeg',
      featured: true
    },
    {
      id: '4',
      title: 'From Struggling to Thriving: Maria\'s Journey with AI Tutoring',
      excerpt: 'Read how one student overcame math anxiety and improved her grades by 40% using personalized AI tutoring.',
      content: `Maria Gonzalez was struggling with algebra. Despite spending hours studying and attending extra help sessions, she couldn't grasp the fundamental concepts. Her grades were suffering, and more importantly, her confidence was plummeting.

"I thought I was just bad at math," Maria recalls. "Every time I looked at an equation, I felt overwhelmed and anxious."

**The Turning Point**

Everything changed when Maria discovered Brainbud. Unlike traditional tutoring, the AI tutor was available 24/7 and never made her feel judged for asking the same question multiple times.

"The AI tutor was so patient," Maria explains. "It would explain the same concept in different ways until I understood. And it never got frustrated with me."

**Personalized Learning in Action**

The AI quickly identified that Maria was a visual learner who needed step-by-step breakdowns. It adapted its teaching style to include:

- Visual representations of algebraic concepts
- Real-world examples that related to Maria's interests
- Bite-sized lessons that built confidence gradually
- Immediate feedback that prevented misconceptions from taking root

**Remarkable Results**

Within three months of using Brainbud:
- Maria's math grade improved from a D+ to a B+
- Her confidence in problem-solving increased dramatically
- She began helping classmates with their math homework
- Her overall academic performance improved across all subjects

**The Ripple Effect**

"The confidence I gained in math spread to other areas," Maria notes. "I realized that I wasn't 'bad' at learning—I just needed the right approach."

Maria's story isn't unique. We've seen thousands of students overcome learning challenges through personalized AI tutoring. The key is meeting students where they are and adapting to their unique learning needs.

**Looking Forward**

Maria is now considering a career in engineering, something she never thought possible before. "Brainbud didn't just help me with math," she reflects. "It helped me believe in myself."

Her journey demonstrates the transformative power of personalized learning and the importance of never giving up on any student's potential.`,
      author: 'Dr. Emily Watson',
      date: '2024-12-03',
      readTime: '4 min read',
      category: 'success-stories',
      tags: ['Student Success', 'Math Learning', 'Confidence Building', 'Case Study'],
      image: 'https://images.pexels.com/photos/5212345/pexels-photo-5212345.jpeg',
      featured: false
    },
    {
      id: '5',
      title: 'The Science of Spaced Repetition: Why Timing Matters in Learning',
      excerpt: 'Understand the cognitive science behind spaced repetition and how it can dramatically improve your long-term retention.',
      content: `Spaced repetition is one of the most powerful learning techniques backed by cognitive science, yet it's often misunderstood or incorrectly applied. Let's dive into the science behind this method and how you can use it effectively.

**What is Spaced Repetition?**

Spaced repetition involves reviewing information at increasing intervals over time. Instead of cramming all at once, you spread out your study sessions, with longer gaps between each review as the material becomes more familiar.

**The Forgetting Curve**

German psychologist Hermann Ebbinghaus discovered that we forget information exponentially over time. Without reinforcement, we lose about 50% of new information within an hour and up to 90% within a week.

However, each time we review the material, the forgetting curve becomes less steep. Eventually, the information moves into long-term memory where it's retained much longer.

**The Optimal Spacing Schedule**

Research suggests the following intervals for maximum effectiveness:
- First review: 1 day after initial learning
- Second review: 3 days later
- Third review: 1 week later
- Fourth review: 2 weeks later
- Fifth review: 1 month later

**Why It Works**

Spaced repetition leverages several cognitive principles:

1. **Desirable Difficulty**: The slight challenge of recalling information strengthens memory pathways
2. **Consolidation**: Time between reviews allows the brain to consolidate memories
3. **Retrieval Practice**: Active recall during reviews strengthens neural connections

**Implementing Spaced Repetition**

Modern tools make spaced repetition easier than ever:
- Digital flashcard apps with built-in algorithms
- AI tutors that automatically schedule review sessions
- Learning management systems that track your progress

**Beyond Flashcards**

While flashcards are the most common application, spaced repetition works for:
- Problem-solving practice
- Essay writing skills
- Language learning
- Complex concept understanding

**The Brainbud Advantage**

Our AI tutors automatically implement spaced repetition by:
- Tracking which concepts you've mastered
- Scheduling review sessions at optimal intervals
- Adapting the difficulty based on your performance
- Providing varied practice to prevent rote memorization

The key to successful spaced repetition is consistency and trust in the process. It may feel slower initially, but the long-term retention benefits are extraordinary.`,
      author: 'Dr. Sarah Chen',
      date: '2024-12-01',
      readTime: '7 min read',
      category: 'learning-tips',
      tags: ['Spaced Repetition', 'Memory', 'Cognitive Science', 'Study Techniques'],
      image: 'https://images.pexels.com/photos/8471970/pexels-photo-8471970.jpeg',
      featured: false
    }
  ];

  const filteredPosts = blogPosts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.excerpt.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || post.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const featuredPosts = blogPosts.filter(post => post.featured);

  if (selectedPost) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <button
              onClick={() => setSelectedPost(null)}
              className="flex items-center text-primary-600 hover:text-primary-700 mb-8"
            >
              <ArrowRight className="h-4 w-4 mr-2 rotate-180" />
              Back to Blog
            </button>
            
            <Card className="overflow-hidden">
              <img 
                src={selectedPost.image} 
                alt={selectedPost.title}
                className="w-full h-64 object-cover"
              />
              <div className="p-8">
                <div className="flex items-center space-x-4 text-sm text-gray-500 mb-4">
                  <div className="flex items-center space-x-1">
                    <User className="h-4 w-4" />
                    <span>{selectedPost.author}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-4 w-4" />
                    <span>{new Date(selectedPost.date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock className="h-4 w-4" />
                    <span>{selectedPost.readTime}</span>
                  </div>
                </div>
                
                <h1 className={cn(commonStyles.heading.h1, "mb-6")}>
                  {selectedPost.title}
                </h1>
                
                <div className="prose prose-lg max-w-none">
                  {selectedPost.content.split('\n\n').map((paragraph, index) => {
                    if (paragraph.startsWith('**') && paragraph.endsWith('**')) {
                      return (
                        <h3 key={index} className="text-xl font-semibold text-gray-900 mt-8 mb-4">
                          {paragraph.slice(2, -2)}
                        </h3>
                      );
                    }
                    return (
                      <p key={index} className="text-gray-700 mb-4 leading-relaxed">
                        {paragraph}
                      </p>
                    );
                  })}
                </div>
                
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <div className="flex flex-wrap gap-2">
                    {selectedPost.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-primary-100 text-primary-700"
                      >
                        <Tag className="h-3 w-3 mr-1" />
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="py-16 px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="max-w-4xl mx-auto text-center mb-16">
          <h1 className={cn(commonStyles.heading.h1, "mb-6")}>
            Brainbud Blog
          </h1>
          <p className={cn(commonStyles.text.lg)}>
            Insights, tips, and stories about the future of AI-powered education
          </p>
        </div>

        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar */}
            <div className="lg:col-span-1">
              <Card className="p-6 sticky top-8">
                {/* Search */}
                <div className="mb-6">
                  <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
                    Search Posts
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      id="search"
                      type="text"
                      placeholder="Search..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                </div>

                {/* Categories */}
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Categories</h3>
                  <div className="space-y-1">
                    {categories.map((category) => (
                      <button
                        key={category.id}
                        onClick={() => setSelectedCategory(category.id)}
                        className={cn(
                          "w-full flex items-center space-x-2 px-3 py-2 text-sm rounded-md transition-colors",
                          selectedCategory === category.id
                            ? "bg-primary-100 text-primary-700 font-medium"
                            : "text-gray-600 hover:bg-gray-100"
                        )}
                      >
                        {category.icon}
                        <span>{category.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </Card>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3">
              {/* Featured Posts */}
              {selectedCategory === 'all' && !searchTerm && (
                <div className="mb-12">
                  <h2 className={cn(commonStyles.heading.h2, "mb-6")}>
                    Featured Posts
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {featuredPosts.map((post) => (
                      <Card key={post.id} variant="hover" className="overflow-hidden cursor-pointer" onClick={() => setSelectedPost(post)}>
                        <img 
                          src={post.image} 
                          alt={post.title}
                          className="w-full h-48 object-cover"
                        />
                        <div className="p-6">
                          <div className="flex items-center space-x-2 text-sm text-gray-500 mb-3">
                            <Calendar className="h-4 w-4" />
                            <span>{new Date(post.date).toLocaleDateString()}</span>
                            <span>•</span>
                            <Clock className="h-4 w-4" />
                            <span>{post.readTime}</span>
                          </div>
                          <h3 className={cn(commonStyles.heading.h3, "mb-3")}>
                            {post.title}
                          </h3>
                          <p className={cn(commonStyles.text.base, "mb-4")}>
                            {post.excerpt}
                          </p>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">{post.author}</span>
                            <ArrowRight className="h-4 w-4 text-primary-600" />
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* All Posts */}
              <div>
                <h2 className={cn(commonStyles.heading.h2, "mb-6")}>
                  {selectedCategory === 'all' ? 'All Posts' : categories.find(c => c.id === selectedCategory)?.name}
                </h2>
                
                {filteredPosts.length === 0 ? (
                  <Card className="p-8 text-center">
                    <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className={cn(commonStyles.heading.h3, "mb-2")}>
                      No posts found
                    </h3>
                    <p className={cn(commonStyles.text.base)}>
                      Try adjusting your search terms or selecting a different category.
                    </p>
                  </Card>
                ) : (
                  <div className="space-y-6">
                    {filteredPosts.map((post) => (
                      <Card key={post.id} variant="hover" className="p-6 cursor-pointer" onClick={() => setSelectedPost(post)}>
                        <div className="flex flex-col md:flex-row gap-6">
                          <img 
                            src={post.image} 
                            alt={post.title}
                            className="w-full md:w-48 h-32 object-cover rounded-lg"
                          />
                          <div className="flex-1">
                            <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                              <div className="flex items-center space-x-1">
                                <User className="h-4 w-4" />
                                <span>{post.author}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Calendar className="h-4 w-4" />
                                <span>{new Date(post.date).toLocaleDateString()}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Clock className="h-4 w-4" />
                                <span>{post.readTime}</span>
                              </div>
                            </div>
                            <h3 className={cn(commonStyles.heading.h3, "mb-3")}>
                              {post.title}
                            </h3>
                            <p className={cn(commonStyles.text.base, "mb-4")}>
                              {post.excerpt}
                            </p>
                            <div className="flex items-center justify-between">
                              <div className="flex flex-wrap gap-2">
                                {post.tags.slice(0, 2).map((tag) => (
                                  <span
                                    key={tag}
                                    className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-600"
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                              <ArrowRight className="h-4 w-4 text-primary-600" />
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default BlogPage;