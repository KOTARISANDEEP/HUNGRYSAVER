import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Review {
  id: number;
  name: string;
  avatar: string;
  text: string;
  rating: number;
  location: string;
}

interface ReviewsCarouselProps {
  reviews?: Review[];
  autoScrollInterval?: number;
  className?: string;
}

const ReviewsCarousel = ({ 
  reviews: customReviews, 
  autoScrollInterval = 3000,
  className = ""
}: ReviewsCarouselProps) => {
  const defaultReviews: Review[] = [
    {
      id: 1,
      name: "Priya Sharma",
      avatar: "/assets/images/h1.jpg",
      text: "HungrySaver has transformed how I help my community. The transparency and impact tracking make every donation meaningful.",
      rating: 5,
      location: "Visakhapatnam"
    },
    {
      id: 2,
      name: "Amit Patel",
      avatar: "/assets/images/h2.jpg",
      text: "As a volunteer, I've seen firsthand how this platform connects resources with those who need them most.",
      rating: 5,
      location: "Vijayawada"
    },
    {
      id: 3,
      name: "Sneha Reddy",
      avatar: "/assets/images/h3.jpg",
      text: "The community support here is incredible. Every meal, every donation makes a real difference in someone's life.",
      rating: 4.5,
      location: "Guntur"
    },
    {
      id: 4,
      name: "Karthik Singh",
      avatar: "/assets/images/h4.jpg",
      text: "HungrySaver doesn't just provide food, it provides hope. The volunteer network is truly inspiring.",
      rating: 5,
      location: "Tirupati"
    },
    {
      id: 5,
      name: "Anjali Desai",
      avatar: "/assets/images/h6.jpg",
      text: "This platform has made it so easy to contribute to my community. The impact is visible and measurable.",
      rating: 4.5,
      location: "Rajahmundry"
    },
    {
      id: 6,
      name: "Rahul Verma",
      avatar: "/assets/images/h1.jpg",
      text: "The dedication of volunteers and the efficiency of food distribution here is remarkable. Highly recommend!",
      rating: 5,
      location: "Hyderabad"
    },
    {
      id: 7,
      name: "Meera Bai",
      avatar: "/assets/images/h2.jpg",
      text: "HungrySaver has been a lifeline for many families in our area. The community spirit is amazing.",
      rating: 5,
      location: "Warangal"
    }
  ];

  const reviews = customReviews || defaultReviews;
  const [currentIndex, setCurrentIndex] = useState(0);
  const visibleCount = 3; // Show 3 reviews at a time

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % reviews.length);
    }, autoScrollInterval);

    return () => clearInterval(interval);
  }, [reviews.length, autoScrollInterval]);

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <svg
        key={i}
        className={[
          "w-4 h-4",
          i < Math.floor(rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'
        ].join(' ')}
        viewBox="0 0 20 20"
      >
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ));
  };

  // Create a circular array for smooth infinite scrolling
  const getVisibleReviews = () => {
    const result = [];
    
    for (let i = 0; i < visibleCount; i++) {
      const index = (currentIndex + i) % reviews.length;
      result.push(reviews[index]);
    }
    
    return result;
  };

  return (
    <div className={["relative w-full max-w-md mx-auto", className].join(' ')}>
      {/* Container with fixed height and overflow hidden */}
      <div className="relative h-80 overflow-hidden">
        {/* Reviews Container */}
        <div className="relative h-full">
          <AnimatePresence mode="wait">
            {getVisibleReviews().map((review, index) => (
              <motion.div
                key={`${review.id}-${currentIndex + index}`}
                initial={{ 
                  opacity: 0, 
                  y: 100,
                  scale: 0.95
                }}
                animate={{ 
                  opacity: 1, 
                  y: index * 80, // Stack reviews vertically with spacing
                  scale: 1
                }}
                exit={{ 
                  opacity: 0, 
                  y: -100,
                  scale: 0.95
                }}
                transition={{ 
                  duration: 0.8,
                  ease: "easeInOut",
                  delay: index * 0.1
                }}
                className="absolute left-0 right-0"
                style={{
                  top: 0,
                  zIndex: visibleCount - index
                }}
              >
                {/* Review Card */}
                <div className="bg-white rounded-xl p-4 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                  {/* Avatar and Header */}
                  <div className="flex items-center mb-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-gray-200 shadow-sm mr-3">
                      <img
                        src={review.avatar}
                        alt={review.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800 text-sm">{review.name}</h3>
                      <p className="text-gray-500 text-xs">{review.location}</p>
                    </div>
                    <div className="flex items-center">
                      {renderStars(review.rating)}
                      <span className="ml-2 text-xs text-gray-600 font-medium">
                        {review.rating}/5
                      </span>
                    </div>
                  </div>

                  {/* Review Text */}
                  <p className="text-gray-700 text-sm leading-relaxed italic">
                    "{review.text}"
                  </p>

                  {/* Decorative Element */}
                  <div className="mt-3 flex justify-end">
                    <div className="w-6 h-0.5 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full"></div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default ReviewsCarousel;
