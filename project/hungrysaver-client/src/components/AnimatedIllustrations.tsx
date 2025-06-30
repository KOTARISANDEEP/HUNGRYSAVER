import React, { useState, useEffect } from 'react';
import { Heart, Users, Package, Smile, ArrowRight } from 'lucide-react';

interface AnimatedEmptyStateProps {
  type: 'donations' | 'requests' | 'volunteers' | 'general';
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
}

const AnimatedEmptyState: React.FC<AnimatedEmptyStateProps> = ({
  type,
  title,
  description,
  actionText,
  onAction
}) => {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 1000);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const getIllustration = () => {
    switch (type) {
      case 'donations':
        return (
          <div className="relative">
            <div className={`transition-transform duration-1000 ${isAnimating ? 'scale-110' : 'scale-100'}`}>
              <div className="w-32 h-32 mx-auto mb-6 relative">
                <div className="absolute inset-0 bg-gradient-to-br from-green-400 to-green-600 rounded-full opacity-20 animate-pulse"></div>
                <div className="absolute inset-4 bg-gradient-to-br from-green-500 to-green-700 rounded-full flex items-center justify-center">
                  <Heart className="h-12 w-12 text-white" fill="currentColor" />
                </div>
                {/* Floating hearts */}
                <div className="absolute -top-2 -right-2 text-red-400 animate-bounce delay-300">💝</div>
                <div className="absolute -bottom-2 -left-2 text-pink-400 animate-bounce delay-700">💖</div>
              </div>
            </div>
          </div>
        );
      
      case 'requests':
        return (
          <div className="relative">
            <div className={`transition-transform duration-1000 ${isAnimating ? 'scale-110' : 'scale-100'}`}>
              <div className="w-32 h-32 mx-auto mb-6 relative">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full opacity-20 animate-pulse"></div>
                <div className="absolute inset-4 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center">
                  <Users className="h-12 w-12 text-white" />
                </div>
                {/* Floating help icons */}
                <div className="absolute -top-2 -right-2 text-yellow-400 animate-bounce delay-300">🆘</div>
                <div className="absolute -bottom-2 -left-2 text-orange-400 animate-bounce delay-700">🤝</div>
              </div>
            </div>
          </div>
        );
      
      case 'volunteers':
        return (
          <div className="relative">
            <div className={`transition-transform duration-1000 ${isAnimating ? 'scale-110' : 'scale-100'}`}>
              <div className="w-32 h-32 mx-auto mb-6 relative">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full opacity-20 animate-pulse"></div>
                <div className="absolute inset-4 bg-gradient-to-br from-purple-500 to-purple-700 rounded-full flex items-center justify-center">
                  <Package className="h-12 w-12 text-white" />
                </div>
                {/* Floating volunteer icons */}
                <div className="absolute -top-2 -right-2 text-green-400 animate-bounce delay-300">👥</div>
                <div className="absolute -bottom-2 -left-2 text-blue-400 animate-bounce delay-700">🌟</div>
              </div>
            </div>
          </div>
        );
      
      default:
        return (
          <div className="relative">
            <div className={`transition-transform duration-1000 ${isAnimating ? 'scale-110' : 'scale-100'}`}>
              <div className="w-32 h-32 mx-auto mb-6 relative">
                <div className="absolute inset-0 bg-gradient-to-br from-green-400 to-blue-600 rounded-full opacity-20 animate-pulse"></div>
                <div className="absolute inset-4 bg-gradient-to-br from-green-500 to-blue-700 rounded-full flex items-center justify-center">
                  <Smile className="h-12 w-12 text-white" />
                </div>
                {/* Floating positive icons */}
                <div className="absolute -top-2 -right-2 text-yellow-400 animate-bounce delay-300">✨</div>
                <div className="absolute -bottom-2 -left-2 text-pink-400 animate-bounce delay-700">🌈</div>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="text-center py-12 px-6">
      {getIllustration()}
      
      <h3 className="text-xl font-semibold text-white mb-3">{title}</h3>
      <p className="text-gray-400 max-w-md mx-auto leading-relaxed mb-6">{description}</p>
      
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="inline-flex items-center space-x-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-6 py-3 rounded-lg font-medium transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
        >
          <span>{actionText}</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      )}
      
      {/* Motivational quote */}
      <div className="mt-8 p-4 bg-gradient-to-r from-green-500/10 to-blue-500/10 rounded-lg border border-green-500/20">
        <p className="text-green-300 text-sm italic">
          "Every great journey begins with a single step. Your community impact starts here! 🌟"
        </p>
      </div>
    </div>
  );
};

export const LoadingAnimation: React.FC<{ message?: string }> = ({ message = "Loading..." }) => {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="relative">
        {/* Spinning circles */}
        <div className="w-16 h-16 border-4 border-green-200 border-t-green-600 rounded-full animate-spin"></div>
        <div className="absolute inset-2 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin animate-reverse"></div>
        
        {/* Center heart */}
        <div className="absolute inset-0 flex items-center justify-center">
          <Heart className="h-6 w-6 text-green-600 animate-pulse" fill="currentColor" />
        </div>
      </div>
      
      <p className="text-white font-medium mt-4">{message}</p>
      <p className="text-gray-400 text-sm mt-1">Building a hunger-free community...</p>
    </div>
  );
};

export default AnimatedEmptyState;