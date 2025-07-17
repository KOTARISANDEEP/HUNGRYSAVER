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
    <div className="bg-gradient-to-r from-[#EAA640] to-[#FAF9F6] rounded-xl p-6 shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-white text-xl font-bold flex items-center">
          🗺️ Live Community Activity
        </h3>
        <div className="flex items-center space-x-2 text-white text-sm">
          <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
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
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all shadow-sm border border-[#EAA640] ${
              activeFilter === filter.key
                ? 'bg-[#EAA640] text-white'
                : 'bg-[#FAF9F6] text-[#845D38] hover:bg-[#EAA640]/80 hover:text-white'
            }`}
          >
            <span className="mr-1">{filter.icon}</span>
            {filter.label}
          </button>
        ))}
      </div>

      {/* Map Container */}
      <div className="relative h-96 w-full max-w-5xl mx-auto rounded-lg overflow-hidden bg-gradient-to-br from-[#EAA640] to-[#FAF9F6]">
        {/* Static Map Image as Background */}
        <img
          src="/assets/images/static_map.png"
          alt="Community Map"
          className="absolute inset-0 w-full h-full object-cover opacity-95"
          style={{ zIndex: 1, top: 0, left: 0 }}
        />
        {/* Overlay: Pins */}
        {filteredActivities.map((activity) => {
          // Manually set pin positions to match the new map image
          let pinPositions: Record<string, { left: string; top: string }> = {
            'Vijayawada': { left: '62%', top: '38%' },
            'Guntur': { left: '54%', top: '48%' },
            'Visakhapatnam': { left: '87%', top: '18%' },
            'Tirupati': { left: '18%', top: '82%' }
          };
          const pos = pinPositions[activity.location] || { left: '50%', top: '50%' };
          return (
            <div
              key={activity.id}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer"
              style={{ ...pos, zIndex: 2 }}
              onClick={() => setSelectedPin(activity)}
            >
              <div className={`relative ${activity.type === 'donation' ? 'bg-[#EAA640]' : activity.type === 'request' ? 'bg-[#BFA893]' : 'bg-[#845D38]'} rounded-full p-2 shadow-lg hover:scale-110 transition-transform`}>
                <div className="text-white">
                  {getPinIcon(activity.type)}
                </div>
                {activity.status === 'active' && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full animate-ping"></div>
                )}
                {activity.count && (
                  <div className="absolute -top-2 -right-2 bg-white text-[#845D38] text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                    {activity.count}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {/* Overlay: City Labels */}
        {[
          { name: 'Vijayawada', left: '59%', top: '41%' },
          { name: 'Guntur', left: '51%', top: '50%' },
          { name: 'Visakhapatnam', left: '80%', top: '20%' },
          { name: 'Tirupati', left: '22%', top: '77%' }
        ].map((city) => (
          <div
            key={city.name}
            className="absolute text-white text-xs font-medium bg-[#845D38]/80 px-2 py-1 rounded"
            style={{ left: city.left, top: city.top, zIndex: 2 }}
          >
            {city.name}
          </div>
        ))}
      </div>

      {/* Activity Details */}
      {selectedPin && (
        <div className="mt-4 bg-[#F5E3C3] rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-[#845D38] font-semibold">{selectedPin.title}</h4>
            <button
              onClick={() => setSelectedPin(null)}
              className="text-[#845D38] hover:text-[#EAA640]"
            >
              ✕
            </button>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex items-center text-[#845D38]">
              <MapPin className="h-4 w-4 mr-2" />
              {selectedPin.location}
            </div>
            <div className="flex items-center text-[#845D38]">
              <Clock className="h-4 w-4 mr-2" />
              {selectedPin.time}
            </div>
            <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
              selectedPin.status === 'active' ? 'bg-[#EAA640]/20 text-[#EAA640]' :
              selectedPin.status === 'pending' ? 'bg-[#BFA893]/20 text-[#BFA893]' :
              'bg-[#845D38]/20 text-[#845D38]'
            }`}>
              {selectedPin.status.charAt(0).toUpperCase() + selectedPin.status.slice(1)}
            </div>
          </div>
        </div>
      )}

      {/* Activity Summary */}
      <div className="mt-6 grid grid-cols-3 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-[#EAA640]">
            {mockActivities.filter(a => a.type === 'donation').length}
          </div>
          <div className="text-[#845D38] text-sm">Active Donations</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-[#BFA893]">
            {mockActivities.filter(a => a.type === 'request').length}
          </div>
          <div className="text-[#845D38] text-sm">Pending Requests</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-[#845D38]">
            {mockActivities.filter(a => a.type === 'volunteer').length}
          </div>
          <div className="text-[#845D38] text-sm">Online Volunteers</div>
        </div>
      </div>
    </div>
  );
};

export default CommunityMap;