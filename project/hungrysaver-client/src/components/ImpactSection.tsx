import * as React from 'react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ImpactSlide {
  id: number;
  image: string;
  title: string;
  subtitle: string;
  badge: string;
}

const impactSlides: ImpactSlide[] = [
  {
    id: 1,
    image: "/assets/images/download.jpg",
    title: "Family Support",
    subtitle: "Supporting families through challenging times with comprehensive aid programs. Building stronger communities one family at a time.",
    badge: "156 Families Helped This Week"
  },
  {
    id: 2,
    image: "/assets/images/nilayam2.png",
    title: "Hunger Relief",
    subtitle: "Providing immediate food assistance to families facing food insecurity. Every meal delivered brings hope and nourishment.",
    badge: "2,847 Lives Touched Today"
  },
  {
    id: 3,
    image: "/assets/images/suraksha1.png",
    title: "Community Growth",
    subtitle: "Fostering sustainable community development through collaborative initiatives. Empowering neighborhoods to thrive together.",
    badge: "89% Community Engagement Rate"
  },
  {
    id: 4,
    image: "/assets/images/suraksha3.png",
    title: "Nutrition Aid",
    subtitle: "Ensuring access to healthy, nutritious meals for children and families. Promoting wellness and long-term health outcomes.",
    badge: "1,200+ Meals Served Daily"
  },
  {
    id: 5,
    image: "/assets/images/vidya2.png",
    title: "Volunteer Impact",
    subtitle: "Celebrating the incredible dedication of our volunteers who make everything possible. Their compassion drives our mission forward.",
    badge: "450+ Active Volunteers"
  }
];

const ImpactSection = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isTransitioning, setTransitioning] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setTransitioning(true);
      setTimeout(() => {
        setCurrentSlide((prev) => (prev + 1) % impactSlides.length);
        setTransitioning(false);
      }, 1200); // Match the image transition duration
    }, 8000); // Total cycle time: 8 seconds

    return () => clearInterval(interval);
  }, []);

  const slide = impactSlides[currentSlide];

  return (
    <section className="relative w-full h-[80vh] overflow-hidden rounded-[40px]">
      {/* Background Image with Animation */}
      <AnimatePresence mode="sync">
        <motion.div
          key={currentSlide}
          className="absolute inset-0 w-full h-full"
          initial={{ opacity: 0, scale: 1 }}
          animate={{ 
            opacity: 1, 
            scale: [1, 1.05]
          }}
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{ 
            duration: 1.2,
            ease: "easeInOut"
          }}
        >
          <img
            src={slide.image}
            alt={`${slide.title} - Impact Story`}
            className="w-full h-full object-cover object-center"
          />
        </motion.div>
      </AnimatePresence>

      {/* Content Container - Left Aligned */}
      <div className="relative z-10 h-full flex items-center">
        <div className="max-w-2xl px-8 md:px-16 lg:px-24">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ 
              opacity: isTransitioning ? 0 : 1, 
              x: isTransitioning ? -30 : 0 
            }}
            transition={{ 
              duration: 1,
              delay: 1,
              ease: "easeOut"
            }}
            className="space-y-6"
          >
            {/* Title */}
            <motion.h2 
              className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight"
              initial={{ opacity: 0, y: 20 }}
              animate={{ 
                opacity: isTransitioning ? 0 : 1, 
                y: isTransitioning ? 20 : 0 
              }}
              transition={{ 
                duration: 0.8,
                delay: 1.2,
                ease: "easeOut"
              }}
            >
              {slide.title}
            </motion.h2>

            {/* Subtitle */}
            <motion.p 
              className="text-lg md:text-xl text-white leading-relaxed max-w-lg"
              initial={{ opacity: 0, y: 20 }}
              animate={{ 
                opacity: isTransitioning ? 0 : 1, 
                y: isTransitioning ? 20 : 0 
              }}
              transition={{ 
                duration: 0.8,
                delay: 1.4,
                ease: "easeOut"
              }}
            >
              {slide.subtitle}
            </motion.p>

            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ 
                opacity: isTransitioning ? 0 : 1, 
                y: isTransitioning ? 20 : 0 
              }}
              transition={{ 
                duration: 0.8,
                delay: 1.6,
                ease: "easeOut"
              }}
            >
              <span className="inline-block bg-amber-50 px-6 py-3 rounded-full text-gray-800 font-semibold text-lg border-2 border-amber-200">
                {slide.badge}
              </span>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Join the Mission Button - Bottom Middle */}
      <div className="absolute bottom-24 left-1/2 transform -translate-x-1/2 z-20">
        <Link to="/login" className="block">
          <motion.button
            className="bg-[#EAA640] text-white px-8 py-4 rounded-full font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300 flex items-center space-x-2"
            whileHover={{ scale: 1.05 }}
            animate={{
              scale: [1, 1.05, 1]
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 3
            }}
          >
            <span>Join the Mission</span>
            <ArrowRight className="h-5 w-5" />
          </motion.button>
        </Link>
      </div>

      {/* Progress Indicators */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20 flex space-x-3">
        {impactSlides.map((_, index) => (
          <button
            key={index}
            onClick={() => {
              setTransitioning(true);
              setTimeout(() => {
                setCurrentSlide(index);
                setTransitioning(false);
              }, 1200); // Match the new transition duration
            }}
            disabled={isTransitioning}
            className={[
              "h-3 rounded-full transition-all duration-300",
              index === currentSlide ? 'w-12 bg-[#EAA640]' : 'w-3 bg-gray-400/60',
              isTransitioning ? 'opacity-50' : ''
            ].join(' ')}
          />
        ))}
      </div>

      {/* Mobile Responsive - Center Aligned on Small Screens */}
      <div className="md:hidden relative z-10 h-full flex items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ 
            opacity: isTransitioning ? 0 : 1, 
            y: isTransitioning ? 20 : 0 
          }}
          transition={{ 
            duration: 1,
            delay: 1,
            ease: "easeOut"
          }}
          className="text-center space-y-6 max-w-md"
        >
          <motion.h2 
            className="text-3xl font-bold text-white leading-tight"
            initial={{ opacity: 0, y: 20 }}
            animate={{ 
              opacity: isTransitioning ? 0 : 1, 
              y: isTransitioning ? 20 : 0 
            }}
            transition={{ 
              duration: 0.8,
              delay: 1.2,
              ease: "easeOut"
            }}
          >
            {slide.title}
          </motion.h2>

          <motion.p 
            className="text-base text-white leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ 
              opacity: isTransitioning ? 0 : 1, 
              y: isTransitioning ? 20 : 0 
            }}
            transition={{ 
              duration: 0.8,
              delay: 1.4,
              ease: "easeOut"
            }}
          >
            {slide.subtitle}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ 
              opacity: isTransitioning ? 0 : 1, 
              y: isTransitioning ? 20 : 0 
            }}
            transition={{ 
              duration: 0.8,
              delay: 1.6,
              ease: "easeOut"
            }}
          >
            <span className="inline-block bg-amber-50 px-4 py-2 rounded-full text-gray-800 font-semibold text-sm border-2 border-amber-200">
              {slide.badge}
            </span>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default ImpactSection;
