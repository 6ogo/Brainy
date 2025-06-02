import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Brain, Home } from 'lucide-react';
import { Button } from '../components/Button';
import { cn, commonStyles } from '../styles/utils';

export const NotFound: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 px-4">
      <div className="text-center">
        <div className="flex justify-center mb-8">
          <div className="rounded-full bg-primary-600 p-6">
            <Brain className="h-12 w-12 text-white" />
          </div>
        </div>
        <h1 className={cn(commonStyles.heading.h1, "mb-4")}>
          404 - Page Not Found
        </h1>
        <p className={cn(commonStyles.text.lg, "mb-8")}>
          Oops! The page you're looking for doesn't exist.
        </p>
        <Button
          variant="primary"
          size="lg"
          onClick={() => navigate('/')}
          leftIcon={<Home className="h-5 w-5" />}
        >
          Back to Home
        </Button>
      </div>
    </div>
  );
};

export default NotFound;