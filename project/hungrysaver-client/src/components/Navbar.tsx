import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';

type NavKey = 'home' | 'about' | 'contact' | 'login' | 'register';

interface TopNavItem {
  key: NavKey;
  label: string;
  imageSrc: string;
  kind: 'section' | 'route';
  target: string;
}

const topNavItems: TopNavItem[] = [
  { key: 'home', label: 'Home', imageSrc: '/assets/images/home-removebg-preview.png', kind: 'section', target: 'home' },
  { key: 'about', label: 'About', imageSrc: '/assets/images/about-removebg-preview.png', kind: 'section', target: 'about' },
  { key: 'contact', label: 'Contact', imageSrc: '/assets/images/email-removebg-preview.png', kind: 'section', target: 'contact' },
  { key: 'login', label: 'Login', imageSrc: '/assets/images/login-removebg-preview.png', kind: 'route', target: '/login' },
  { key: 'register', label: 'Register', imageSrc: '/assets/images/register-removebg-preview.png', kind: 'route', target: '/register' },
];

const Navbar: React.FC = () => {
  const { logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [activeItem, setActiveItem] = useState<NavKey>('home');

  // Scroll spy for homepage sections
  useEffect(() => {
    const handleScrollSpy = () => {
      const sections = ['home', 'about', 'contact'];
      for (let sec of sections) {
        const el = document.getElementById(sec);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 120 && rect.bottom >= 120) {
            setActiveItem(sec as NavKey);
            return;
          }
        }
      }
    };

    if (location.pathname === '/') {
      window.addEventListener('scroll', handleScrollSpy);
    }
    return () => window.removeEventListener('scroll', handleScrollSpy);
  }, [location.pathname]);

  // Update active item on route change
  useEffect(() => {
    if (location.pathname === '/login') setActiveItem('login');
    else if (location.pathname === '/register') setActiveItem('register');
    else if (location.pathname === '/') setActiveItem('home');
  }, [location.pathname]);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const navbarOffset = 56;
      const elementY = element.getBoundingClientRect().top + window.scrollY - navbarOffset;
      window.scrollTo({ top: elementY, behavior: 'smooth' });
    }
  };

  const handleNavClick = (item: TopNavItem) => {
    setActiveItem(item.key);
    if (item.kind === 'route') {
      navigate(item.target);
    } else {
      if (location.pathname !== '/') {
        navigate('/');
        setTimeout(() => scrollToSection(item.target), 200);
      } else {
        scrollToSection(item.target);
      }
    }
  };

  return (
    <nav className="fixed top-6 left-0 right-0 z-50 bg-transparent shadow-none"> 
      {/* top-6 pushes navbar slightly down for breathing space */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Logo + Brand */}
          <Link to="/" className="flex items-center space-x-2 group">
            <div className="p-1 rounded-full group-hover:bg-green-100 transition-colors">
              <img
                src="/assets/images/logo.png"
                alt="Hungry Saver Logo"
                className="h-12 w-12 rounded-full object-cover"
              />
            </div>
            <span className="text-lg font-bold text-white">Hungry Saver</span>
          </Link>

          {/* Navigation Items */}
          <div className="flex items-center gap-4">
            {topNavItems.map((item) => {
              const isActiveItem = activeItem === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => handleNavClick(item)}
                  className="relative flex flex-col items-center justify-end w-14"
                >
                  {/* Circular white background only (no square box) */}
                  <div className="relative w-10 h-10 flex items-center justify-center bg-white rounded-full shadow-md">
                    {isActiveItem && (
                      <motion.span
                        layoutId="topnav-active-glow"
                        className="absolute inset-0 rounded-full"
                        style={{ boxShadow: '0 0 15px 5px rgba(234,166,77,0.65)' }} // gold glow
                      />
                    )}
                    <motion.img
                      src={item.imageSrc}
                      alt={item.label}
                      className={[
                        'object-contain w-6 h-6',
                        isActiveItem ? 'opacity-100' : 'opacity-60 grayscale',
                      ].join(' ')}
                      animate={{ scale: isActiveItem ? 1.1 : 0.95 }}
                      transition={{ type: 'spring', stiffness: 120, damping: 20 }}
                    />
                  </div>
                  <motion.span
                    className={[
                      'mt-1 text-[11px]',
                      isActiveItem ? 'text-[#EAA64D] font-semibold' : 'text-white/70',
                    ].join(' ')}
                  >
                    {item.label}
                  </motion.span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
