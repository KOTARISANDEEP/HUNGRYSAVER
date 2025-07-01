import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, Crown } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Navbar: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { currentUser, userData, logout, isAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const scrollToSection = (sectionId: string) => {
    if (location.pathname !== '/') {
      navigate('/');
      setTimeout(() => {
        const element = document.getElementById(sectionId);
        element?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      const element = document.getElementById(sectionId);
      element?.scrollIntoView({ behavior: 'smooth' });
    }
    setIsMobileMenuOpen(false);
  };

  const isActive = (section: string) => {
    return location.hash === `#${section}` || (location.pathname === '/' && section === 'home');
  };

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      isScrolled ? 'bg-gray-900/95 backdrop-blur-sm shadow-lg' : 'bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 group">
            <div className="p-2 rounded-full group-hover:bg-green-100 transition-colors">
              <img
                src="https://res-console.cloudinary.com/dlvc4lbod/thumbnails/v1/image/upload/v1751363493/QWx0cnVpc3RpY19QYXJ0bmVyc2hpcF9Mb2dvX25uY3F5Zg==/drilldown"
                alt="Hungry Saver Logo"
                className="h-16 w-16 rounded-full object-cover"
                style={{ background: "transparent" }}
              />
            </div>
            <span className="text-xl font-bold text-white">Hungry Saver</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-8">
              <button
                onClick={() => scrollToSection('home')}
                className={`text-white hover:text-green-400 px-3 py-2 text-sm font-medium transition-colors relative ${
                  isActive('home') ? 'text-green-400' : ''
                }`}
              >
                Home
                {isActive('home') && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-400 rounded-full" />
                )}
              </button>
              <button
                onClick={() => scrollToSection('about')}
                className={`text-white hover:text-green-400 px-3 py-2 text-sm font-medium transition-colors relative ${
                  isActive('about') ? 'text-green-400' : ''
                }`}
              >
                About
                {isActive('about') && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-400 rounded-full" />
                )}
              </button>
              <button
                onClick={() => scrollToSection('contact')}
                className={`text-white hover:text-green-400 px-3 py-2 text-sm font-medium transition-colors relative ${
                  isActive('contact') ? 'text-green-400' : ''
                }`}
              >
                Contact
                {isActive('contact') && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-400 rounded-full" />
                )}
              </button>
              
              {currentUser ? (
                <div className="flex items-center space-x-4">
                  {isAdmin && (
                    <Link
                      to="/admin-dashboard"
                      className="text-yellow-400 hover:text-yellow-300 px-3 py-2 text-sm font-medium transition-colors flex items-center space-x-1"
                    >
                      <Crown className="h-4 w-4" />
                      <span>Admin Dashboard</span>
                    </Link>
                  )}
                  {userData?.userType === 'volunteer' && userData?.status === 'approved' && userData?.location && !isAdmin && (
                    <Link
                      to={`/dashboard/${userData.location}`}
                      className="text-white hover:text-green-400 px-3 py-2 text-sm font-medium transition-colors"
                    >
                      Dashboard
                    </Link>
                  )}
                  {userData?.userType === 'volunteer' && userData?.status === 'pending' && !isAdmin && (
                    <Link
                      to="/pending-approval"
                      className="text-yellow-400 px-3 py-2 text-sm font-medium"
                    >
                      Pending Approval
                    </Link>
                  )}
                  {userData?.userType === 'donor' && !isAdmin && (
                    <Link
                      to="/donor-dashboard"
                      className="text-white hover:text-green-400 px-3 py-2 text-sm font-medium transition-colors"
                    >
                      Donor Dashboard
                    </Link>
                  )}
                  {userData?.userType === 'community' && !isAdmin && (
                    <Link
                      to="/community-dashboard"
                      className="text-white hover:text-green-400 px-3 py-2 text-sm font-medium transition-colors"
                    >
                      Community Dashboard
                    </Link>
                  )}
                  <button
                    onClick={handleLogout}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-4">
                  <Link
                    to="/login"
                    className="text-white hover:text-green-400 px-3 py-2 text-sm font-medium transition-colors"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-bold transition-colors"
                  >
                    Register
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-white hover:text-green-400 p-2"
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 bg-gray-900/95 backdrop-blur-sm rounded-lg mt-2">
              <button
                onClick={() => scrollToSection('home')}
                className="text-white hover:text-green-400 block px-3 py-2 text-base font-medium w-full text-left"
              >
                Home
              </button>
              <button
                onClick={() => scrollToSection('about')}
                className="text-white hover:text-green-400 block px-3 py-2 text-base font-medium w-full text-left"
              >
                About
              </button>
              <button
                onClick={() => scrollToSection('contact')}
                className="text-white hover:text-green-400 block px-3 py-2 text-base font-medium w-full text-left"
              >
                Contact
              </button>
              
              {currentUser ? (
                <div className="space-y-1 pt-2 border-t border-gray-700">
                  {isAdmin && (
                    <Link
                      to="/admin-dashboard"
                      className="text-yellow-400 hover:text-yellow-300 block px-3 py-2 text-base font-medium flex items-center space-x-2"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Crown className="h-4 w-4" />
                      <span>Admin Dashboard</span>
                    </Link>
                  )}
                  {userData?.userType === 'volunteer' && userData?.status === 'approved' && userData?.location && !isAdmin && (
                    <Link
                      to={`/dashboard/${userData.location}`}
                      className="text-white hover:text-green-400 block px-3 py-2 text-base font-medium"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Dashboard
                    </Link>
                  )}
                  {userData?.userType === 'volunteer' && userData?.status === 'pending' && !isAdmin && (
                    <Link
                      to="/pending-approval"
                      className="text-yellow-400 block px-3 py-2 text-base font-medium"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Pending Approval
                    </Link>
                  )}
                  {userData?.userType === 'donor' && !isAdmin && (
                    <Link
                      to="/donor-dashboard"
                      className="text-white hover:text-green-400 block px-3 py-2 text-base font-medium"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Donor Dashboard
                    </Link>
                  )}
                  {userData?.userType === 'community' && !isAdmin && (
                    <Link
                      to="/community-dashboard"
                      className="text-white hover:text-green-400 block px-3 py-2 text-base font-medium"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Community Dashboard
                    </Link>
                  )}
                  <button
                    onClick={handleLogout}
                    className="text-red-400 hover:text-red-300 block px-3 py-2 text-base font-medium w-full text-left"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <div className="space-y-1 pt-2 border-t border-gray-700">
                  <Link
                    to="/login"
                    className="text-white hover:text-green-400 block px-3 py-2 text-base font-medium"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="text-green-400 hover:text-green-300 block px-3 py-2 text-base font-bold"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Register
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;