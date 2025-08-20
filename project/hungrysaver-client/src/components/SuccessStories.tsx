import * as React from 'react';
import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Quote } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Story {
  id: number;
  image: string;
  quote: string;
  author: string;
  location: string;
  impact: string;
}

const stories: Story[] = [
  {
    id: 1,
    image: "/assets/images/s1.jpg",
    quote: "Thanks to Hungry Saver, my children didn't go to bed hungry. Now they smile every day and focus on their studies.",
    author: "Priya Sharma",
    location: "Vijayawada",
    impact: "Fed family of 4 for a week"
  },
  {
    id: 2,
    image: "/assets/images/s2.jpg",
    quote: "I can now focus on studies instead of worrying about school fees. My dreams are becoming reality!",
    author: "Ravi Kumar",
    location: "Guntur",
    impact: "Education support for 6 months"
  },
  {
    id: 3,
    image: "/assets/images/s3.jpg",
    quote: "The volunteers became like family to us. They didn't just bring food, they brought hope and dignity.",
    author: "Lakshmi Devi",
    location: "Visakhapatnam",
    impact: "Regular meal support for elderly couple"
  },
  {
    id: 4,
    image: "/assets/images/s4.jpg",
    quote: "After losing everything in floods, Hungry Saver helped us rebuild. Today, we have our own small business!",
    author: "Venkat Rao",
    location: "Kakinada",
    impact: "Complete rehabilitation support"
  },
  {
    id: 5,
    image: "/assets/images/s6.jpg",
    quote: "Hungry Saver didn't just provide meals, they gave us the strength to believe in a better tomorrow.",
    author: "Anjali Patel",
    location: "Rajahmundry",
    impact: "Nutrition and education support for 8 months"
  }
];

const SuccessStories = () => {
  const [currentStory, setCurrentStory] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      nextStory();
    }, 6000); // Increased to 6 seconds to allow animations to complete

    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const nextStory = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentStory((prev) => (prev + 1) % stories.length);
      setIsTransitioning(false);
    }, 1000);
  };

  const prevStory = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentStory((prev) => (prev - 1 + stories.length) % stories.length);
      setIsTransitioning(false);
    }, 1000);
  };

  const story = stories[currentStory];

  return (
    <div className="relative w-full h-[600px] overflow-hidden rounded-[40px]">
      {/* Background Image with Ken Burns Effect */}
      <div
        key={currentStory}
        className={[
          "absolute inset-0 w-full h-full transition-all duration-[6000ms] ease-out",
          isTransitioning ? 'scale-110' : 'scale-120'
        ].join(' ')}
      >
        <img
          src={story.image}
          alt={`${story.author} - Success Story`}
          className="w-full h-full object-cover object-center"
        />
      </div>

      {/* Dark Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/60 via-black/40 to-black/60"></div>

      {/* Navigation Controls */}
      <div className="absolute top-8 right-8 z-20 flex space-x-2">
        <button
          onClick={prevStory}
          disabled={isTransitioning}
          className="p-3 rounded-full bg-transparent hover:bg-black/20 transition-colors backdrop-blur-sm disabled:opacity-50"
        >
          <ChevronLeft className="h-6 w-6 text-white" />
        </button>
        <button
          onClick={nextStory}
          disabled={isTransitioning}
          className="p-3 rounded-full bg-transparent hover:bg-black/20 transition-colors backdrop-blur-sm disabled:opacity-50"
        >
          <ChevronRight className="h-6 w-6 text-white" />
        </button>
      </div>

      {/* Progress Indicators */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20 flex space-x-3">
        {stories.map((_, index) => (
          <button
            key={index}
            onClick={() => {
              if (!isTransitioning) {
                setIsTransitioning(true);
                setTimeout(() => {
                  setCurrentStory(index);
                  setIsTransitioning(false);
                }, 1000);
              }
            }}
            disabled={isTransitioning}
            className={[
              "h-3 rounded-full transition-all duration-300",
              index === currentStory ? 'w-12 bg-white/60' : 'w-3 bg-white/20',
              isTransitioning ? 'opacity-50' : ''
            ].join(' ')}
          />
        ))}
      </div>

      {/* Testimonial Content */}
      <div className="relative z-10 flex items-center justify-center h-full px-8">
        <div className="text-center max-w-4xl">
          <div
                    className={[
          "transition-all duration-1000 ease-out",
          isTransitioning ? 'opacity-0 translate-y-8' : 'opacity-100 translate-y-0'
        ].join(' ')}
          >
            {/* Main Quote */}
            <blockquote
              className={[
                "text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight transition-all duration-1000 ease-out delay-400 mb-12",
                isTransitioning ? 'opacity-0 translate-y-8' : 'opacity-100 translate-y-0'
              ].join(' ')}
            >
              "{story.quote}"
            </blockquote>

            {/* Author Information */}
            <div
              className={[
                "transition-all duration-800 ease-out delay-800 mb-8",
                isTransitioning ? 'opacity-0 translate-y-5' : 'opacity-100 translate-y-0'
              ].join(' ')}
            >
              <p className="text-2xl md:text-3xl font-semibold text-white mb-2">
                {story.author}
              </p>
              <p className="text-xl md:text-2xl text-white/90">
                {story.location}
              </p>
            </div>

            {/* Impact Line */}
            <div
              className={[
                "transition-all duration-800 ease-out delay-1200",
                isTransitioning ? 'opacity-0 translate-y-5' : 'opacity-100 translate-y-0'
              ].join(' ')}
            >
              <p className="text-lg md:text-xl text-white/80 italic">
                {story.impact}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuccessStories;