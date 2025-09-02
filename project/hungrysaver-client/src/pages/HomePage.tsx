import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Heart, Users, BookOpen, Shield, Home, Zap, Building } from 'lucide-react';
import { LiveImpactDashboard } from '../components/ImpactCounter';
import SuccessStories from '../components/SuccessStories';
import ImpactSection from '../components/ImpactSection';
import MapSection from '../components/MapSection';
import '../index.css'; // Ensure global styles are loaded

const HomePage: React.FC = () => {
  const [visibleCards, setVisibleCards] = useState<number[]>([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const cardIndex = parseInt(entry.target.getAttribute('data-card') || '0');
            setVisibleCards(prev => [...new Set([...prev, cardIndex])]);
          }
        });
      },
      { threshold: 0.3 }
    );

    const cards = document.querySelectorAll('[data-card]');
    cards.forEach(card => observer.observe(card));

    return () => observer.disconnect();
  }, []);

  const initiatives = [
    {
      icon: Heart,
      title: "🍛 Annamitra Seva",
      description: "Connecting surplus food with hungry families. Every meal counts in our mission to eliminate hunger and food waste.",
      image: "/assets/images/annamitra4.png",
      impact: "2,847 meals served today",
      color: "from-green-500 to-green-600"
    },
    {
      icon: BookOpen,
      title: "📚 Vidya Jyothi",
      description: "Illuminating young minds through education support. Providing books, fees, and resources to deserving students.",
      image: "/assets/images/vidya4.png",
      impact: "156 students supported",
      color: "from-blue-500 to-blue-600"
    },
    {
      icon: Shield,
      title: "🛡️ Suraksha Setu",
      description: "Building bridges of safety for vulnerable communities. Emergency support when it matters most.",
      image: "/assets/images/suraksha3.png",
      impact: "89 families protected",
      color: "from-purple-500 to-purple-600"
    },
    {
      icon: Home,
      title: "🏠 PunarAsha",
      description: "Restoring hope through rehabilitation. Supporting families in rebuilding their lives with dignity.",
      image: "/assets/images/punar3.png",
      impact: "45 lives rebuilt",
      color: "from-pink-500 to-pink-600"
    },
    {
      icon: Zap,
      title: "⚡ Raksha Jyothi",
      description: "Emergency response for humans and animals. Rapid assistance during critical situations.",
      image: "/assets/images/raksha1.png",
      impact: "24/7 emergency response",
      color: "from-red-500 to-red-600"
    },
    {
      icon: Building,
      title: "🏛️ Jyothi Nilayam",
      description: "Creating sanctuaries of hope. Supporting shelters for both humans and animals in need.",
      image: "/assets/images/nilayam2.png",
      impact: "12 shelters supported",
      color: "from-orange-500 to-orange-600"
    }
  ];
  
  // Slider state for the hero-style initiatives showcase
  const [currentInitiative, setCurrentInitiative] = useState(0);
  const totalInitiatives = initiatives.length;

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentInitiative((prev) => (prev + 1) % totalInitiatives);
    }, 5000); // change every 5 seconds
    return () => clearInterval(interval);
  }, [totalInitiatives]);

  return (
    <div className="min-h-screen">
      {/* Entire Body */}
      <div className="relative bg-cover bg-center bg-no-repeat" style={{ backgroundImage: 'url(/assets/images/background1.jpg)' }}>
        <div className="absolute inset-0 bg-black/40"></div>
        
        {/* Hero Section */}
        <section id="home" className="relative min-h-screen flex items-center justify-center overflow-hidden px-4">
          {/* Hero Image */}
          <div className="absolute inset-0 z-0 flex items-center justify-center">
            <div className="relative" style={{ width: 'calc(100% - 2rem)', height: '100%', maxWidth: 'calc(100vw - 2rem)', maxHeight: '115vh' }}>
              <img src="/assets/images/Annamitra.png" alt="Community helping each other" className="w-full h-full object-cover rounded-lg border-4 border-white shadow-2xl" />
              <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-black/70 rounded-lg" />
            </div>
          </div>

          {/* Hero Content */}
          <div className="relative z-10 flex flex-col items-center justify-center w-full max-w-3xl mx-auto text-white py-12">
            <div className="relative flex items-center justify-center mb-6" style={{ minHeight: '320px' }}>
              <img src="/assets/images/circle_rotation-removebg-preview.png" alt="Rotating ring" className="w-64 h-64 animate-spin-slow" />
              <img src="/assets/images/logo.png" alt="Hungry Saver Logo" className="absolute left-1/2 top-1/2 w-60 h-60 -translate-x-1/2 -translate-y-1/2 rounded-full object-contain shadow-xl" />
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-white mb-8 leading-tight text-center">
              Connecting Surplus Resources with <span style={{ color: '#A16D28' }}>Those in Need</span>
            </h1>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center mb-8 w-full">
              <div className="bg-white/10 rounded-xl shadow-lg p-6">
                <p className="text-2xl font-bold text-[#EAA640]">2,847</p>
                <p className="text-sm">Lives Touched Today</p>
              </div>
              <div className="bg-white/10 rounded-xl shadow-lg p-6">
                <p className="text-2xl font-bold text-[#F9CB99]">156</p>
                <p className="text-sm">Families Helped</p>
              </div>
              <div className="bg-white/10 rounded-xl shadow-lg p-6">
                <p className="text-2xl font-bold text-[#BFA893]">89</p>
                <p className="text-sm">Active Volunteers</p>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
              <Link to="/register" className="bg-gradient-to-r from-[#C78A3B] to-[#EAA64D] text-white px-6 py-2 rounded-full font-semibold flex items-center justify-center">
                Join Our Mission <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <Link to="/login" className="border border-white text-white hover:bg-white hover:text-[#333] px-6 py-2 rounded-full font-semibold flex items-center justify-center">
                Already a Member? Login
              </Link>
            </div>
          </div>
        </section>

        {/* Existing motivational banner below stays; only images were updated in its component. */}

        {/* Impact Section */}
        <section className="py-12 relative z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <ImpactSection />
          </div>
        </section>

        {/* Live Impact */}
        <section className="py-12 relative z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">🌟 Live Impact Dashboard</h2>
              <p className="text-xl text-white/90">Real-time updates of our community's collective impact</p>
            </div>
            <LiveImpactDashboard />
          </div>
        </section>

        {/* Community Map */}
        <section className="py-12 relative z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <MapSection />
          </div>
        </section>

        {/* Success Stories */}
        <section className="py-12 relative z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <SuccessStories />
          </div>
        </section>

        {/* About Section ✅ FIXED */}
        <section id="about" className="py-20 relative z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl sm:text-5xl font-bold mb-6 text-white">
                Our <span className="text-[#EAA640]">Initiatives</span>
              </h2>
              <p className="text-xl text-white/90 max-w-3xl mx-auto leading-relaxed">
                Six powerful initiatives working together to create lasting change in communities across Andhra Pradesh.
              </p>
            </div>

            {/* Hero-style single image with two overlay cards */}
            <div className="relative h-[70vh] rounded-3xl overflow-hidden shadow-2xl">
              <AnimatePresence mode="sync">
                <motion.img
                  key={currentInitiative}
                  src={initiatives[currentInitiative].image}
                  alt={initiatives[currentInitiative].title}
                  className="absolute inset-0 w-full h-full object-cover"
                  initial={{ opacity: 0, scale: 1.05 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.05 }}
                  transition={{ duration: 0.9, ease: 'easeInOut' }}
                />
              </AnimatePresence>

              {/* subtle dark gradient for readability */}
              <div className="absolute inset-0 bg-gradient-to-tr from-black/40 via-black/10 to-black/40" />

              {/* Main title and stats (left) */}
              <div className="absolute left-6 top-6 md:left-10 md:top-10 text-white max-w-xl">
                <div className="text-4xl sm:text-5xl lg:text-6xl font-extrabold mb-3 leading-tight">
                  {initiatives[currentInitiative].title}
                </div>
                <div className="text-blue-300 text-xl md:text-2xl font-bold mb-4">
                  {initiatives[currentInitiative].impact}
                </div>
                <p className="text-white/95 text-base sm:text-lg lg:text-xl leading-relaxed">
                  {initiatives[currentInitiative].description} We coordinate volunteers, donors, and trusted community
                  partners to deliver timely support, expand access to essentials, and ensure every contribution creates
                  lasting change where it matters most.
                </p>
              </div>

              {/* Two overlay small cards aligned to the right-middle */}
              <div className="absolute right-6 top-1/2 -translate-y-1/2 flex gap-4">
                {[1,2].map((offset, idx) => {
                  const item = initiatives[(currentInitiative + offset) % totalInitiatives];
                  return (
                    <motion.div
                      key={item.title}
                      className="relative w-40 sm:w-52 h-28 sm:h-36 rounded-3xl shadow-lg hover:shadow-xl overflow-hidden"
                      initial={{ opacity: 0, y: 40, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ duration: 0.7, delay: idx === 0 ? 0.3 : 0.6, type: 'spring', damping: 20, stiffness: 120 }}
                      whileHover={{ scale: 1.05 }}
                    >
                      {/* Image only with subtle title label */}
                      <img src={item.image} alt={item.title} className="absolute inset-0 w-full h-full object-cover" />
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent px-3 py-2">
                        <div className="text-white text-xs font-semibold text-center truncate">
                          {item.title}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section id="contact" className="py-20 relative z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl sm:text-5xl font-bold mb-6 text-white">Ready to Make a <span className="text-[#EAA640]">Difference?</span></h2>
              <p className="text-xl text-white/90 mb-8 max-w-3xl mx-auto leading-relaxed">
                Whether you're a volunteer ready to serve, a donor wanting to give, or someone in need of support, 
                our platform connects you with the right resources in your city.
              </p>
            </div>

            {/* Contact Information */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 mb-12 border border-white/20">
              <div className="text-center">
                <h3 className="text-2xl font-bold text-white mb-6">📧 Get in Touch</h3>
                <p className="text-white/90 mb-6 text-lg">
                  Have questions or need assistance? We're here to help!
                </p>
                
                {/* Email Contact */}
                <div className="mb-8">
                  <p className="text-white/80 mb-3">If you have any queries, contact us at:</p>
                  <a 
                    href="mailto:hungrysaver198@gmail.com"
                    className="inline-flex items-center bg-gradient-to-r from-[#EAA640] to-[#EAA640] text-white px-6 py-3 rounded-full font-semibold text-lg hover:from-[#28A745] hover:to-[#EAA640] transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    📧 hungrysaver198@gmail.com
                  </a>
                  <p className="text-white/70 text-sm mt-2">Click to send us an email directly</p>
                </div>

                {/* Contact Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="bg-white/10 backdrop-blur-sm p-6 rounded-lg hover:bg-white/20 transition-colors border border-white/20">
                    <Users className="h-12 w-12 text-[#EAA640] mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-white mb-2">Volunteers</h3>
                    <p className="text-white/90">Join our network of dedicated volunteers making impact in their communities.</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm p-6 rounded-lg hover:bg-white/20 transition-colors border border-white/20">
                    <Heart className="h-12 w-12 text-[#EAA640] mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-white mb-2">Donors</h3>
                    <p className="text-white/90">Support initiatives that matter and see your contributions create real change.</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm p-6 rounded-lg hover:bg-white/20 transition-colors border border-white/20">
                    <Shield className="h-12 w-12 text-[#EAA640] mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-white mb-2">Community</h3>
                    <p className="text-white/90">Access support and resources when you need them most.</p>
                  </div>
                </div>

                {/* Call to Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
                  <Link
                    to="/register"
                    className="bg-gradient-to-r from-[#EAA640] to-[#EAA64D] hover:from-[#EAA64D] hover:to-[#EAA640] text-white px-8 py-3 rounded-full font-semibold transition-all duration-300 inline-flex items-center justify-center shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    Get Started Today
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                  <Link
                    to="/login"
                    className="border-2 border-white text-white hover:bg-white hover:text-[#333] px-8 py-3 rounded-full font-semibold transition-colors"
                  >
                    Already a Member? Login
                  </Link>
                </div>

                {/* Motivational Message */}
                <div className="bg-gradient-to-r from-[#EAA640]/20 to-[#F2EDD1]/20 backdrop-blur-sm rounded-xl border border-[#EAA640]/30 p-6">
                  <p className="text-[#EAA640] text-xl font-medium mb-3">
                    🧡 "This is not just a donation — it's a lifeline."
                  </p>
                  <p className="text-white/90 mb-4">
                    Join us in making a real difference in people's lives.
                  </p>
                  <p className="text-white/80 text-lg font-medium">
                    🌟 <strong>Thank you for being part of Hungry Saver!</strong> 🌟
                  </p>
                  <p className="text-white/70 mt-2">
                    Together, we're building bridges of hope across the world.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-8 relative z-10 border-t border-white/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <div className="bg-[#EAA640] p-2 rounded-lg"><Heart className="h-6 w-6 text-white" fill="currentColor" /></div>
              <span className="text-xl font-bold text-white">Hungry Saver</span>
            </div>
            <p className="text-white/70 mb-4">© 2025 Hungry Saver. Building bridges of hope.</p>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default HomePage;
