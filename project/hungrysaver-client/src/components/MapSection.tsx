import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReviewsCarousel from './ReviewsCarousel';

interface CommunityMarker {
  id: number;
  name: string;
  avatar: string;
  feedback: string;
  helping: string;
  city: string;
  position: { top: string; left: string };
}

const MapSection = () => {
  const [selectedMarker, setSelectedMarker] = useState<CommunityMarker | null>(null);
  const [autoCycleIndex, setAutoCycleIndex] = useState(0);

  const communityMarkers: CommunityMarker[] = [
    {
      id: 1,
      name: "Priya Sharma",
      avatar: "/assets/images/h1.jpg",
      feedback: "HungrySaver has transformed how I help my community. The transparency and impact tracking make every donation meaningful.",
      helping: "Food Distribution",
      city: "Visakhapatnam",
      position: { top: "top-20", left: "left-20" }
    },
    {
      id: 2,
      name: "Amit Patel",
      avatar: "/assets/images/h2.jpg",
      feedback: "As a volunteer, I've seen firsthand how this platform connects resources with those who need them most.",
      helping: "Volunteer Coordination",
      city: "Vijayawada",
      position: { top: "top-32", left: "right-32" }
    },
    {
      id: 3,
      name: "Sneha Reddy",
      avatar: "/assets/images/h3.jpg",
      feedback: "The community support here is incredible. Every meal, every donation makes a real difference in someone's life.",
      helping: "Family Support",
      city: "Guntur",
      position: { top: "bottom-32", left: "left-32" }
    },
    {
      id: 4,
      name: "Karthik Singh",
      avatar: "/assets/images/h4.jpg",
      feedback: "HungrySaver doesn't just provide food, it provides hope. The volunteer network is truly inspiring.",
      helping: "Volunteer Network",
      city: "Tirupati",
      position: { top: "bottom-20", left: "right-20" }
    },
    {
      id: 5,
      name: "Anjali Desai",
      avatar: "/assets/images/h5.jpg",
      feedback: "This platform has made it so easy to contribute to my community. The impact is visible and measurable.",
      helping: "Community Impact",
      city: "Central Hub",
      position: { top: "top-1/2", left: "left-1/2" }
    }
  ];

  // Auto-cycle through markers every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setAutoCycleIndex((prevIndex) => (prevIndex + 1) % communityMarkers.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [communityMarkers.length]);

  // Update selected marker when auto-cycle changes
  useEffect(() => {
    setSelectedMarker(communityMarkers[autoCycleIndex]);
  }, [autoCycleIndex, communityMarkers]);

  const handleMarkerClick = (marker: CommunityMarker) => {
    if (selectedMarker?.id === marker.id) {
      setSelectedMarker(null);
      setAutoCycleIndex(0); // Reset auto-cycle when manually deselecting
    } else {
      setSelectedMarker(marker);
      // Find the index of clicked marker and set auto-cycle to continue from there
      const markerIndex = communityMarkers.findIndex(m => m.id === marker.id);
      setAutoCycleIndex(markerIndex);
    }
  };

  return (
    <section className="py-20 relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold mb-6 text-white">
            🌍 <span className="text-[#EAA640]">Global Community</span> Impact Map
          </h2>
          <p className="text-xl text-white/90 max-w-3xl mx-auto leading-relaxed">
            Explore our worldwide network of community support centers and see real-time impact
          </p>
        </div>

        {/* Full Background Image Container */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative rounded-3xl overflow-hidden shadow-2xl"
        >
          {/* Background Image */}
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: 'url(/assets/images/1a.jpeg)' }}
          >
            {/* Dark Overlay for Readability */}
            <div className="absolute inset-0 bg-black/40"></div>
          </div>

          {/* Content Grid */}
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 min-h-[700px]">
            {/* Left Side - Map Visualization */}
            <div className="relative p-6">
              <div className="relative h-full min-h-[600px]">
                {/* Community Location Markers */}
                {communityMarkers.map((marker) => (
                  <div key={marker.id} className={["absolute", marker.position.top, marker.position.left].join(' ')}>
                    <motion.div 
                      className="relative group cursor-pointer"
                      whileHover={{ 
                        scale: 1.15,
                        transition: { duration: 0.3 }
                      }}
                      animate={{ 
                        y: [-3, 3, -3],
                        rotate: selectedMarker?.id === marker.id ? [0, 3, 0] : 0
                      }}
                      transition={{ 
                        duration: 6,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                      onClick={() => handleMarkerClick(marker)}
                    >
                      {/* Blue Light Animation when selected */}
                      {selectedMarker?.id === marker.id && (
                        <motion.div
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ 
                            scale: [0, 1.8, 1.2],
                            opacity: [0, 0.4, 0.2]
                          }}
                          transition={{ 
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut"
                          }}
                          className="absolute inset-0 bg-blue-400 rounded-full blur-xl"
                        />
                      )}
                      
                      <div className="w-20 h-20 rounded-full border-4 border-white shadow-lg overflow-hidden relative">
                        <motion.img
                          src={marker.avatar}
                          alt={marker.name}
                          className="w-full h-full object-cover"
                          animate={{ 
                            scale: selectedMarker?.id === marker.id ? [1, 1.08, 1] : 1
                          }}
                          transition={{ 
                            duration: 2.5,
                            repeat: selectedMarker?.id === marker.id ? Infinity : 0,
                            ease: "easeInOut"
                          }}
                        />
                        <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
                          <motion.div 
                            className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center shadow-md"
                            animate={{
                              scale: selectedMarker?.id === marker.id ? [1, 1.2, 1] : 1,
                              boxShadow: selectedMarker?.id === marker.id 
                                ? ["0 0 0 rgba(59, 130, 246, 0.4)", "0 0 20px rgba(59, 130, 246, 0.8)", "0 0 0 rgba(59, 130, 246, 0.4)"]
                                : "0 4px 6px rgba(0, 0, 0, 0.1)"
                            }}
                            transition={{ 
                              duration: 2,
                              repeat: selectedMarker?.id === marker.id ? Infinity : 0
                            }}
                          >
                            <svg className="w-4 h-4 text-white fill-current" viewBox="0 0 20 20">
                              <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                            </svg>
                          </motion.div>
                        </div>
                      </div>

                      {/* Small Review Bubble - Appears next to selected marker */}
                      {selectedMarker?.id === marker.id && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.8, x: -20 }}
                          animate={{ opacity: 1, scale: 1, x: 0 }}
                          exit={{ opacity: 0, scale: 0.8, x: -20 }}
                          transition={{ duration: 0.3 }}
                          className="absolute left-full top-0 ml-3 w-48 bg-white rounded-lg p-3 shadow-lg border border-gray-200 z-50"
                          style={{
                            boxShadow: '0 4px 20px rgba(59, 130, 246, 0.3)',
                          }}
                        >
                          {/* Speech bubble tail */}
                          <div className="absolute left-0 top-4 transform -translate-x-1">
                            <div className="w-3 h-3 bg-white border-l border-b border-gray-200 transform rotate-45"></div>
                          </div>
                          
                          <div className="font-mono text-xs">
                            <div className="text-gray-800 mb-1">
                              <span className="text-blue-600 font-semibold">name:</span> 
                              <span className="text-gray-700"> '{marker.name}',</span>
                            </div>
                            <div className="text-gray-800 mb-1">
                              <span className="text-blue-600 font-semibold">rating:</span> 
                              <span className="text-gray-700"> 5,</span>
                            </div>
                            <div className="text-gray-800 mb-2">
                              <span className="text-blue-600 font-semibold">location:</span> 
                              <span className="text-gray-700"> '{marker.city}'</span>
                            </div>
                          </div>
                          
                          <p className="text-gray-700 text-xs italic leading-relaxed">
                            "{marker.feedback}"
                          </p>
                        </motion.div>
                      )}
                    </motion.div>
                  </div>
                ))}

                {/* Connection Lines */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none">
                  <path
                    d="M 20% 20% Q 50% 50% 80% 30%"
                    stroke="rgba(255, 255, 255, 0.3)"
                    strokeWidth="2"
                    fill="none"
                    strokeDasharray="5,5"
                  />
                  <path
                    d="M 30% 60% Q 50% 50% 70% 80%"
                    stroke="rgba(255, 255, 255, 0.3)"
                    strokeWidth="2"
                    fill="none"
                    strokeDasharray="5,5"
                  />
                </svg>
              </div>
            </div>

            {/* Right Side - Reviews and Feedback */}
            <div className="relative p-6">
              {/* Motivational Header */}
              <motion.div 
                className="mb-8 text-center"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
              >
                <motion.h3 
                  className="text-3xl font-bold text-white mb-3"
                  animate={{ 
                    textShadow: [
                      "0 0 5px rgba(59, 130, 246, 0.5)",
                      "0 0 20px rgba(59, 130, 246, 0.8)",
                      "0 0 5px rgba(59, 130, 246, 0.5)"
                    ]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  Donor Valuable Reviews
                </motion.h3>
                <motion.p 
                  className="text-white/90 text-lg"
                  animate={{ 
                    opacity: [0.7, 1, 0.7]
                  }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  Every review tells a story of hope and community impact
                </motion.p>
              </motion.div>

              {/* Reviews Carousel Component */}
              <div className="flex justify-center">
                <ReviewsCarousel />
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default MapSection;
