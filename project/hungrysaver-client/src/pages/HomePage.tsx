import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Heart, Users, BookOpen, Shield, Home, Zap, Building } from 'lucide-react';
import { LiveImpactDashboard } from '../components/ImpactCounter';
import SuccessStories from '../components/SuccessStories';
import MotivationalBanner from '../components/MotivationalBanner';
import CommunityMap from '../components/CommunityMap';
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
      image: "/assets/images/Annamitra.png",
      impact: "2,847 meals served today",
      color: "from-green-500 to-green-600"
    },
    {
      icon: BookOpen,
      title: "📚 Vidya Jyothi",
      description: "Illuminating young minds through education support. Providing books, fees, and resources to deserving students.",
      image: "/assets/images/VidyaJyothi.png",
      impact: "156 students supported",
      color: "from-blue-500 to-blue-600"
    },
    {
      icon: Shield,
      title: "🛡️ Suraksha Setu",
      description: "Building bridges of safety for vulnerable communities. Emergency support when it matters most.",
      image: "/assets/images/surakshasethu.png",
      impact: "89 families protected",
      color: "from-purple-500 to-purple-600"
    },
    {
      icon: Home,
      title: "🏠 PunarAsha",
      description: "Restoring hope through rehabilitation. Supporting families in rebuilding their lives with dignity.",
      image: "/assets/images/punarasha1.png",
      impact: "45 lives rebuilt",
      color: "from-pink-500 to-pink-600"
    },
    {
      icon: Zap,
      title: "⚡ Raksha Jyothi",
      description: "Emergency response for humans and animals. Rapid assistance during critical situations.",
      image: "/assets/images/RakshaJyothi.png",
      impact: "24/7 emergency response",
      color: "from-red-500 to-red-600"
    },
    {
      icon: Building,
      title: "🏛️ Jyothi Nilayam",
      description: "Creating sanctuaries of hope. Supporting shelters for both humans and animals in need.",
      image: "/assets/images/Jyothi Nilayam.png",
      impact: "12 shelters supported",
      color: "from-orange-500 to-orange-600"
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section id="home" className="relative min-h-screen flex items-center justify-center overflow-hidden px-4">
        {/* Background with overlay */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.pexels.com/photos/6646917/pexels-photo-6646917.jpeg"
            alt="Community helping each other"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-black/70" />
        </div>

        {/* Centered Hero Content: rotation+logo, then headline, then stats, then buttons */}
        <div className="relative z-10 flex flex-col items-center justify-center w-full max-w-3xl mx-auto text-white py-12">
          {/* Rotating ring with logo overlay */}
          <div className="relative flex items-center justify-center mb-6" style={{ minHeight: '320px' }}>
            <img
              src="/assets/images/circle_rotation-removebg-preview.png"
              alt="Rotating ring"
              className="w-64 h-64 animate-spin-slow select-none pointer-events-none"
              style={{ zIndex: 1 }}
            />
            <img
              src="/assets/images/logo.png"
              alt="Hungry Saver Logo"
              className="absolute left-1/2 top-1/2 w-60 h-60 -translate-x-1/2 -translate-y-1/2 rounded-full object-contain shadow-xl"
              style={{ zIndex: 2 }}
            />
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-white mb-8 leading-tight text-center">
            Connecting Surplus Resources with{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-400">
              Those in Need
            </span>
          </h1>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center mb-8 w-full">
            <div className="bg-white/10 backdrop-blur-md rounded-xl shadow-lg p-6">
              <p className="text-2xl font-bold text-green-400">2,847</p>
              <p className="text-sm">Lives Touched Today</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-xl shadow-lg p-6">
              <p className="text-2xl font-bold text-blue-400">156</p>
              <p className="text-sm">Families Helped</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-xl shadow-lg p-6">
              <p className="text-2xl font-bold text-purple-400">89</p>
              <p className="text-sm">Active Volunteers</p>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
            <Link
              to="/register"
              className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-full font-semibold flex items-center justify-center transition-colors text-base w-full sm:w-auto text-center"
            >
              Join Our Mission <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <Link
              to="/login"
              className="border border-white text-white hover:bg-white hover:text-green-700 px-6 py-2 rounded-full font-semibold flex items-center justify-center transition-colors text-base w-full sm:w-auto text-center"
            >
              Already a Member? Login
            </Link>
          </div>
        </div>
      </section>

      {/* Motivational Banner */}
      <section className="py-12 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <MotivationalBanner />
        </div>
      </section>

      {/* Live Impact Dashboard */}
      <section className="py-12 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              🌟 Live Impact Dashboard
            </h2>
            <p className="text-xl text-gray-300">
              Real-time updates of our community's collective impact
            </p>
          </div>
          <LiveImpactDashboard />
        </div>
      </section>

      {/* Community Map */}
      <section className="py-12 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <CommunityMap />
        </div>
      </section>

      {/* Success Stories */}
      <section className="py-12 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SuccessStories />
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">
              Our <span className="text-green-400">Initiatives</span>
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Six powerful initiatives working together to create lasting change in communities across Andhra Pradesh. 
              Each initiative addresses specific needs while building a network of hope and support.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {initiatives.map((initiative, index) => {
              const Icon = initiative.icon;
              return (
                <div
                  key={index}
                  data-card={index}
                  className={`bg-gray-800 rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:scale-105 border border-gray-700 hover:border-green-500/50 ${
                    visibleCards.includes(index) 
                      ? 'opacity-100 translate-y-0' 
                      : 'opacity-0 translate-y-8'
                  }`}
                  style={{ transitionDelay: `${index * 100}ms` }}
                >
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={initiative.image}
                      alt={initiative.title}
                      className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute top-4 left-4 bg-green-500 p-3 rounded-full shadow-lg">
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <div className="absolute bottom-4 left-4 right-4">
                      <div className={`bg-gradient-to-r ${initiative.color} text-white px-3 py-1 rounded-full text-sm font-medium inline-block`}>
                        {initiative.impact}
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-white mb-3">
                      {initiative.title}
                    </h3>
                    <p className="text-gray-300 leading-relaxed">
                      {initiative.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 bg-gray-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">
            Ready to Make a <span className="text-green-400">Difference?</span>
          </h2>
          <p className="text-xl text-gray-300 mb-8 leading-relaxed">
            Whether you're a volunteer ready to serve, a donor wanting to give, or someone in need of support, 
            our platform connects you with the right resources in your city.
          </p>

          {/* Transparent contact info */}
          <div className="mb-8 flex justify-center">
            <span className="bg-transparent text-green-400 text-lg font-semibold px-4 py-2 rounded-full border border-green-400/40">
              If any queries, email us at: <a href="mailto:hungrysaver198@gmail.com" className="underline hover:text-green-300">hungrysaver198@gmail.com</a>
            </span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <div className="bg-gray-700 p-6 rounded-lg hover:bg-gray-600 transition-colors">
              <Users className="h-12 w-12 text-green-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Volunteers</h3>
              <p className="text-gray-300">Join our network of dedicated volunteers making impact in their communities.</p>
            </div>
            <div className="bg-gray-700 p-6 rounded-lg hover:bg-gray-600 transition-colors">
              <Heart className="h-12 w-12 text-green-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Donors</h3>
              <p className="text-gray-300">Support initiatives that matter and see your contributions create real change.</p>
            </div>
            <div className="bg-gray-700 p-6 rounded-lg hover:bg-gray-600 transition-colors">
              <Shield className="h-12 w-12 text-green-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Community</h3>
              <p className="text-gray-300">Access support and resources when you need them most.</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-full font-semibold transition-colors inline-flex items-center justify-center"
            >
              Get Started Today
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <Link
              to="/login"
              className="border-2 border-green-400 text-green-400 hover:bg-green-400 hover:text-gray-900 px-8 py-3 rounded-full font-semibold transition-colors"
            >
              Already a Member? Login
            </Link>
          </div>

          {/* Final motivational message */}
          <div className="mt-12 p-6 bg-gradient-to-r from-green-600/20 to-blue-600/20 rounded-xl border border-green-500/30">
            <p className="text-green-300 text-lg font-medium mb-2">
              🧡 "This is not just a donation — it's a lifeline."
            </p>
            <p className="text-gray-300">
              Your participation changes lives. Even ₹1 can bring hope, hunger relief, and dignity to someone in need.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 border-t border-gray-700 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <div className="bg-green-500 p-2 rounded-lg">
                <Heart className="h-6 w-6 text-white" fill="currentColor" />
              </div>
              <span className="text-xl font-bold text-white">Hungry Saver</span>
            </div>
            <p className="text-gray-400 mb-4">
              © 2025 Hungry Saver. Building bridges of hope across the world.
            </p>
            <p className="text-green-400 text-sm italic">
              "Helping one person might not change the whole world, but it could change the world for one person." 🌟
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;