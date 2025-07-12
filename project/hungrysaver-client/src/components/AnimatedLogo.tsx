import React from "react";

const AnimatedLogo: React.FC = () => {
  return (
    <div
      className="absolute left-1/2 top-24 z-20 flex flex-col items-center"
      style={{ transform: 'translateX(-50%)', background: 'transparent', pointerEvents: 'none' }}
    >
      <div className="relative flex items-center justify-center" style={{ width: 220, height: 220, background: 'transparent' }}>
        <img
          src="/assets/images/circle_rotation-removebg-preview.png"
          alt="Animated circle rotation"
          className="absolute w-full h-full rounded-full"
          style={{ animation: 'spin 20s linear infinite', background: 'transparent', pointerEvents: 'auto', borderRadius: '50%' }}
        />
        <img
          src="/assets/images/logo.png"
          alt="Center Logo"
          className="absolute rounded-full"
          style={{ width: '200px', height: '200px', left: 10, top: 10, background: 'transparent', pointerEvents: 'auto', borderRadius: '50%' }}
        />
      </div>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default AnimatedLogo; 