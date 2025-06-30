import React, { useState, useEffect } from 'react';
import { MapPin, Users, Heart, Clock, TrendingUp } from 'lucide-react';

interface ActivityPin {
  id: string;
  type: 'donation' | 'request' | 'volunteer';
  location: string;
  coordinates: { lat: number; lng: number };
  status: 'active' | 'completed' | 'pending';
  title: string;
  time: string;
  count?: number;
}

const mockActivities: ActivityPin[] = [
  {
    id: '1',
    type: 'donation',
    location: 'Vijayawada',
    coordinates: { lat: 16.5062, lng: 80.6480 },
    status: 'active',
    title: 'Food Donation Available',
    time: '2 mins ago',
    count: 4
  },
  {
    id: '2',
    type: 'request',
    location: 'Guntur',
    coordinates: { lat: 16.3067, lng: 80.4365 },
    status: 'pending',
    title: 'Family Needs Support',
    time: '15 mins ago'
  },
  {
    id: '3',
    type: 'volunteer',
    location: 'Visakhapatnam',
    coordinates: { lat: 17.6868, lng: 83.2185 },
    status: 'active',
    title: 'Volunteer Active',
    time: 'Online now',
    count: 12
  },
  {
    id: '4',
    type: 'donation',
    location: 'Tirupati',
    coordinates: { lat: 13.6288, lng: 79.4192 },
    status: 'completed',
    title: 'Delivery Completed',
    time: '1 hour ago'
  }
];

const CommunityMap: React.FC = () => {
  const [selectedPin, setSelectedPin] = useState<ActivityPin | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'donation' | 'request' | 'volunteer'>('all');

  const filteredActivities = mockActivities.filter(activity => 
    activeFilter === 'all' || activity.type === activeFilter
  );

  const getPinColor = (type: string, status: string) => {
    if (status === 'completed') return 'bg-gray-500';
    
    switch (type) {
      case 'donation': return 'bg-green-500';
      case 'request': return 'bg-red-500';
      case 'volunteer': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getPinIcon = (type: string) => {
    switch (type) {
      case 'donation': return <Heart className="h-3 w-3" />;
      case 'request': return <Users className="h-3 w-3" />;
      case 'volunteer': return <MapPin className="h-3 w-3" />;
      default: return <MapPin className="h-3 w-3" />;
    }
  };

  return (
    <div className="bg-gray-800 rounded-xl p-6 shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-white text-xl font-bold flex items-center">
          🗺️ Live Community Activity
        </h3>
        <div className="flex items-center space-x-2 text-green-400 text-sm">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <span>Real-time updates</span>
        </div>
      </div>

      {/* Filter Buttons */}
      <div className="flex space-x-2 mb-6">
        {[
          { key: 'all', label: 'All', icon: '🌍' },
          { key: 'donation', label: 'Donations', icon: '💝' },
          { key: 'request', label: 'Requests', icon: '🆘' },
          { key: 'volunteer', label: 'Volunteers', icon: '👥' }
        ].map((filter) => (
          <button
            key={filter.key}
            onClick={() => setActiveFilter(filter.key as any)}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              activeFilter === filter.key
                ? 'bg-green-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            <span className="mr-1">{filter.icon}</span>
            {filter.label}
          </button>
        ))}
      </div>

      {/* Map Container */}
      <div className="relative h-80 bg-gray-700 rounded-lg overflow-hidden">
        {/* Simplified Map Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-green-900/20 to-blue-900/20">
          <div className="absolute inset-0 opacity-10">
            <svg className="w-full h-full" viewBox="0 0 400 300">
              {/* Andhra Pradesh outline (simplified) */}
              <path
                d="M50 150 Q100 100 150 120 Q200 110 250 130 Q300 140 350 160 Q340 200 300 220 Q250 240 200 230 Q150 220 100 200 Q60 180 50 150"
                fill="currentColor"
                className="text-green-500/30"
                stroke="currentColor"
                strokeWidth="2"
              />
            </svg>
          </div>
        </div>

        {/* Activity Pins */}
        {filteredActivities.map((activity) => (
          <div
            key={activity.id}
            className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer"
            style={{
              left: `${(activity.coordinates.lng - 78) * 15 + 50}%`,
              top: `${(18 - activity.coordinates.lat) * 15 + 30}%`
            }}
            onClick={() => setSelectedPin(activity)}
          >
            <div className={`relative ${getPinColor(activity.type, activity.status)} rounded-full p-2 shadow-lg hover:scale-110 transition-transform`}>
              <div className="text-white">
                {getPinIcon(activity.type)}
              </div>
              {activity.status === 'active' && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-ping"></div>
              )}
              {activity.count && (
                <div className="absolute -top-2 -right-2 bg-white text-gray-800 text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                  {activity.count}
                </div>
              )}
            </div>
          </div>
        ))}

        {/* City Labels */}
        {[
          { name: 'Vijayawada', x: 55, y: 45 },
          { name: 'Guntur', x: 45, y: 55 },
          { name: 'Visakhapatnam', x: 85, y: 25 },
          { name: 'Tirupati', x: 25, y: 85 }
        ].map((city) => (
          <div
            key={city.name}
            className="absolute text-white text-xs font-medium bg-black/50 px-2 py-1 rounded"
            style={{ left: `${city.x}%`, top: `${city.y}%` }}
          >
            {city.name}
          </div>
        ))}
      </div>

      {/* Activity Details */}
      {selectedPin && (
        <div className="mt-4 bg-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-white font-semibold">{selectedPin.title}</h4>
            <button
              onClick={() => setSelectedPin(null)}
              className="text-gray-400 hover:text-white"
            >
              ✕
            </button>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex items-center text-gray-300">
              <MapPin className="h-4 w-4 mr-2" />
              {selectedPin.location}
            </div>
            <div className="flex items-center text-gray-300">
              <Clock className="h-4 w-4 mr-2" />
              {selectedPin.time}
            </div>
            <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
              selectedPin.status === 'active' ? 'bg-green-500/20 text-green-400' :
              selectedPin.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
              'bg-gray-500/20 text-gray-400'
            }`}>
              {selectedPin.status.charAt(0).toUpperCase() + selectedPin.status.slice(1)}
            </div>
          </div>
        </div>
      )}

      {/* Activity Summary */}
      <div className="mt-6 grid grid-cols-3 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-green-400">
            {mockActivities.filter(a => a.type === 'donation').length}
          </div>
          <div className="text-gray-400 text-sm">Active Donations</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-red-400">
            {mockActivities.filter(a => a.type === 'request').length}
          </div>
          <div className="text-gray-400 text-sm">Pending Requests</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-400">
            {mockActivities.filter(a => a.type === 'volunteer').length}
          </div>
          <div className="text-gray-400 text-sm">Online Volunteers</div>
        </div>
      </div>
    </div>
  );
};

export default CommunityMap;