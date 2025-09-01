import React, { useState } from 'react';
import { MapPin, User, Phone, Clock, Package } from 'lucide-react';
import ErrorMessage from '../ErrorMessage';

export interface AnnamitraSevaFormData {
  location: string;
  hostel?: string;
  address: string;
  donorName: string;
  donorContact: string;
  foodType: 'veg' | 'non-veg' | '';
  quantity: string;
  preparationTime: string;
  description: string;
}

interface AnnamitraSevaFormProps {
  onSubmit: (data: AnnamitraSevaFormData) => void;
  loading?: boolean;
}

const AnnamitraSevaForm: React.FC<AnnamitraSevaFormProps> = ({ onSubmit, loading = false }) => {
  const [formData, setFormData] = useState<AnnamitraSevaFormData>({
    location: '',
    hostel: '',
    address: '',
    donorName: '',
    donorContact: '',
    foodType: '',
    quantity: '',
    preparationTime: '',
    description: ''
  });
  const [error, setError] = useState('');

  const cities = [
    'vijayawada', 'guntur', 'visakhapatnam', 'tirupati', 'kakinada',
    'nellore', 'kurnool', 'rajahmundry', 'kadapa', 'anantapur',
    'kalasalingam academy of research and education', 'krishnan koil', 
    'srivilliputtur', 'rajapalayam', 'virudhunagar'
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.location || !formData.address || !formData.donorName || 
        !formData.donorContact || !formData.foodType || !formData.quantity) {
      setError('Please fill in all required fields.');
      return false;
    }
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) return;

    onSubmit(formData);
  };

  return (
    <div className="bg-gray-800 rounded-xl p-8">
      <div className="flex items-center space-x-3 mb-6">
        <div className="bg-green-500 p-3 rounded-full">
          <Package className="h-6 w-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">🍛 Annamitra Seva</h2>
          <p className="text-gray-300">Donate surplus food to feed hungry families</p>
        </div>
      </div>

      <ErrorMessage error={error} className="mb-6" />

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Location */}
        <div>
          <label className="text-white text-sm font-medium mb-2 block">
            Location <span className="text-red-400">*</span>
          </label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <select
              name="location"
              value={formData.location}
              onChange={handleInputChange}
              className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            >
              <option value="">Select your location</option>
              {cities.map((city) => (
                <option key={city} value={city}>
                  {city.charAt(0).toUpperCase() + city.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Hostel (conditional) */}
        {formData.location === 'kalasalingam academy of research and education' && (
          <div>
            <label className="text-white text-sm font-medium mb-2 block">
              Select Hostel <span className="text-red-400">*</span>
            </label>
            <select
              name="hostel"
              value={formData.hostel}
              onChange={handleInputChange}
              className="w-full py-3 px-4 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            >
              <option value="">Select hostel</option>
              <option value="Mh1">Mh1</option>
              <option value="Mh2">Mh2</option>
              <option value="Mh3">Mh3</option>
              <option value="Mh4">Mh4</option>
              <option value="Mh5">Mh5</option>
              <option value="Mh6">Mh6</option>
              <option value="Mh7">Mh7</option>
              <option value="Lh2">Lh2</option>
              <option value="Lh3">Lh3</option>
              <option value="Lh4">Lh4</option>
            </select>
          </div>
        )}

        {/* Food Type */}
        <div>
          <label className="text-white text-sm font-medium mb-2 block">
            Food Type <span className="text-red-400">*</span>
          </label>
          <select
            name="foodType"
            value={formData.foodType}
            onChange={handleInputChange}
            className="w-full py-3 px-4 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
            required
          >
            <option value="">Select food type</option>
            <option value="veg">Vegetarian</option>
            <option value="non-veg">Non-Vegetarian</option>
          </select>
        </div>

        <div>
          <label className="text-white text-sm font-medium mb-2 block">
            Pickup Address <span className="text-red-400">*</span>
          </label>
          <textarea
            name="address"
            value={formData.address}
            onChange={handleInputChange}
            className="w-full py-3 px-4 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
            rows={2}
            placeholder="Enter complete address for food pickup"
            required
          />
        </div>

        {/* Contact Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-white text-sm font-medium mb-2 block">
              Your Name <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                name="donorName"
                value={formData.donorName}
                onChange={handleInputChange}
                className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Your name"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-white text-sm font-medium mb-2 block">
              Phone Number <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="tel"
                name="donorContact"
                value={formData.donorContact}
                onChange={handleInputChange}
                className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Your phone number"
                required
              />
            </div>
          </div>
        </div>

        {/* Food Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-white text-sm font-medium mb-2 block">
              Quantity (Number of People) <span className="text-red-400">*</span>
            </label>
            <input
              type="number"
              name="quantity"
              value={formData.quantity}
              onChange={handleInputChange}
              className="w-full py-3 px-4 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="How many people can this feed?"
              min="1"
              required
            />
          </div>

          <div>
            <label className="text-white text-sm font-medium mb-2 block">
              Preparation Time
            </label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="datetime-local"
                name="preparationTime"
                value={formData.preparationTime}
                onChange={handleInputChange}
                className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="text-white text-sm font-medium mb-2 block">
            Food Description
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            className="w-full py-3 px-4 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
            rows={3}
            placeholder="Describe the food items, any special instructions..."
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-800 text-white py-3 rounded-lg font-semibold transition-colors flex items-center justify-center"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
              Submitting...
            </>
          ) : (
            'Submit Food Donation'
          )}
        </button>
      </form>
    </div>
  );
};

export default AnnamitraSevaForm;