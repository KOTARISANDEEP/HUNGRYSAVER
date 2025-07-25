import React, { useEffect, useState } from 'react';
import { TrendingUp, Users, Heart, MapPin } from 'lucide-react';

interface ImpactCounterProps {
  value: number;
  label: string;
  icon: React.ReactNode;
  trend?: string;
}

const ImpactCounter: React.FC<ImpactCounterProps> = ({ value, label, icon, trend }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const duration = 2000;
    const steps = 60;
    const increment = value / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setCount(value);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [value]);

  return (
    <div className="bg-gradient-to-r from-[#EAA640] to-[#FAF9F6] p-6 rounded-xl text-[#333] shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-3xl font-bold mb-1">
            {count.toLocaleString()}
          </div>
          <p className="text-sm opacity-90">{label}</p>
          {trend && (
            <div className="flex items-center mt-2 text-xs" style={{ color: '#845D38' }}>
              <TrendingUp className="h-3 w-3 mr-1" style={{ color: '#845D38' }} />
              <span>{trend}</span>
            </div>
          )}
        </div>
        <div className="text-4xl opacity-80 text-[#EAA640]">
          {icon}
        </div>
      </div>
    </div>
  );
};

export const LiveImpactDashboard: React.FC = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <ImpactCounter
        value={2847}
        label="Meals Served Today"
        icon={<Heart className="h-8 w-8 text-[#EAA640]" />}
        trend="+342 since yesterday"
      />
      <ImpactCounter
        value={156}
        label="Families Helped This Week"
        icon={<Users className="h-8 w-8 text-[#EAA640]" />}
        trend="+23 new families"
      />
      <ImpactCounter
        value={89}
        label="Active Volunteers"
        icon={<MapPin className="h-8 w-8 text-[#EAA640]" />}
        trend="+12 this month"
      />
      <ImpactCounter
        value={10}
        label="Cities Covered"
        icon={<span className="text-3xl text-[#EAA640]">🌍</span>}
        trend="Expanding daily"
      />
    </div>
  );
};

export default ImpactCounter;