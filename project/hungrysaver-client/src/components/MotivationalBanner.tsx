import React, { useState, useEffect } from 'react';
import { Heart, Users, Sparkles, ArrowRight } from 'lucide-react';

const motivationalMessages = [
  {
    icon: "🧡",
    title: "This is not just a donation — it's a lifeline.",
    subtitle: "Your participation changes lives.",
    description: "Even ₹1 can bring hope, hunger relief, and dignity to someone in need."
  },
  {
    icon: "🌟",
    title: "Helping one person might not change the whole world,",
    subtitle: "but it could change the world for one person.",
    description: "Your small step today can become someone's reason to survive tomorrow."
  },
  {
    icon: "💚",
    title: "Every meal shared is a story of hope written.",
    subtitle: "Every family helped is a community strengthened.",
    description: "Together, we're not just fighting hunger — we're building a compassionate world."
  },
  {
    icon: "✨",
    title: "In the act of giving, we receive the greatest gift:",
    subtitle: "the knowledge that we've made a difference.",
    description: "Your kindness today echoes through generations of grateful hearts."
  }
];

const MotivationalBanner: React.FC = () => {
  const [currentMessage, setCurrentMessage] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMessage((prev) => (prev + 1) % motivationalMessages.length);
    }, 6000);

    return () => clearInterval(interval);
  }, []);

  const message = motivationalMessages[currentMessage];

  if (!isVisible) return null;

  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-[#EAA640] via-[#F5E3C3] to-[#FAF9F6] rounded-2xl p-8 mb-8 shadow-2xl">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-4 -right-4 w-24 h-24 bg-[#EAA640]/10 rounded-full animate-pulse"></div>
        <div className="absolute top-1/2 -left-8 w-16 h-16 bg-[#EAA640]/5 rounded-full animate-bounce"></div>
        <div className="absolute bottom-4 right-1/3 w-12 h-12 bg-[#EAA640]/10 rounded-full animate-pulse delay-1000"></div>
      </div>

      {/* Content */}
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="text-4xl animate-bounce">{message.icon}</div>
            <div>
              <h2 className="text-white text-sm font-bold opacity-90" style={{ color: '#FFF' }}>
                Hungry Saver Mission
              </h2>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                <span className="text-xs font-bold" style={{ color: '#FFF' }}>Changing Lives Daily</span>
              </div>
            </div>
          </div>
          <button
            onClick={() => setIsVisible(false)}
            className="text-[#EAA640]/60 hover:text-[#EAA640]/80 transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="text-center space-y-4">
          <h3 className="text-2xl md:text-3xl font-bold" style={{ color: '#333', fontFamily: 'Inter, sans-serif' }}>
            {message.title}
          </h3>
          <p className="text-xl font-medium" style={{ color: '#EAA640' }}>
            {message.subtitle}
          </p>
          <p className="max-w-2xl mx-auto leading-relaxed" style={{ color: '#666' }}>
            {message.description}
          </p>
        </div>

        {/* Impact Stats */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <Heart className="h-6 w-6" style={{ color: '#EAA640' }} />
              <span className="text-2xl font-bold" style={{ color: '#333' }}>2,847</span>
            </div>
            <p className="text-sm" style={{ color: '#666' }}>Lives Touched Today</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <Users className="h-6 w-6" style={{ color: '#EAA640' }} />
              <span className="text-2xl font-bold" style={{ color: '#333' }}>156</span>
            </div>
            <p className="text-sm" style={{ color: '#666' }}>Families Helped This Week</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <Sparkles className="h-6 w-6" style={{ color: '#EAA640' }} />
              <span className="text-2xl font-bold" style={{ color: '#333' }}>89%</span>
            </div>
            <p className="text-sm" style={{ color: '#666' }}>Hunger Reduction Rate</p>
          </div>
        </div>

        {/* Call to Action */}
        <div className="mt-8 text-center">
          <div className="inline-flex items-center space-x-2 bg-[#EAA640]/90 hover:bg-[#EAA640] text-white rounded-full px-6 py-3 transition-all cursor-pointer group shadow-lg">
            <span className="font-medium">Join the Mission</span>
            <ArrowRight className="h-4 w-4 text-white group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Progress Indicators */}
        <div className="flex justify-center space-x-2 mt-6">
          {motivationalMessages.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentMessage(index)}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === currentMessage ? 'w-8 bg-[#EAA640]' : 'w-2 bg-[#BFA893]/40'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default MotivationalBanner;