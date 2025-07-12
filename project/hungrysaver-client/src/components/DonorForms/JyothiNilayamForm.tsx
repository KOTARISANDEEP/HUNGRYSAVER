import React, { useState } from 'react';
import { MapPin, User, Phone, Building, DollarSign } from 'lucide-react';
import ErrorMessage from '../ErrorMessage';

export interface JyothiNilayamFormData {
  location: string;
  address: string;
  donorName: string;
  donorContact: string;
  donationType: 'full' | 'partial' | '';
  donationAmount: string;
  shelterPreference: 'human' | 'animal' | 'both' | '';
  description: string;
}

interface JyothiNilayamFormProps {
  onSubmit: (data: JyothiNilayamFormData) => void;
  loading?: boolean;
}

const JyothiNilayamForm: React.FC<JyothiNilayamFormProps> = ({ onSubmit, loading = false }) => {
  const [formData, setFormData] = useState<JyothiNilayamFormData>({
    location: '',
    address: '',
    donorName: '',
    donorContact: '',
    donationType: '',
    donationAmount: '',
    shelterPreference: '',
    description: ''
  });
  const [error, setError] = useState('');

  const cities = [
    'vijayawada', 'guntur', 'visakhapatnam', 'tirupati', 'kakinada',
    'nellore', 'kurnool', 'rajahmundry', 'kadapa', 'anantapur'
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
        !formData.donorContact || !formData.donationType || !formData.shelterPreference) {
      setError('Please fill in all required fields.');
      return false;
    }
    
    if (formData.donationType === 'partial' && !formData.donationAmount) {
      setError('Please specify the donation amount for partial donations.');
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
        <div className="bg-yellow-500 p-3 rounded-full">
          <Building className="h-6 w-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">🏠 Jyothi Nilayam</h2>
          <p className="text-gray-300">Support shelters for humans and animals</p>
        </div>
      </div>

      <ErrorMessage error={error} className="mb-6" />

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Location and Donation Type */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-white text-sm font-medium mb-2 block">
              City <span className="text-red-400">*</span>
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
                <option value="">Select your city</option>
                {cities.map((city) => (
                  <option key={city} value={city}>
                    {city.charAt(0).toUpperCase() + city.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-white text-sm font-medium mb-2 block">
              Donation Type <span className="text-red-400">*</span>
            </label>
            <select
              name="donationType"
              value={formData.donationType}
              onChange={handleInputChange}
              className="w-full py-3 px-4 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            >
              <option value="">Select donation type</option>
              <option value="full">Full Support</option>
              <option value="partial">Partial Support</option>
            </select>
          </div>
        </div>

        <div>
          <label className="text-white text-sm font-medium mb-2 block">
            Your Address <span className="text-red-400">*</span>
          </label>
          <textarea
            name="address"
            value={formData.address}
            onChange={handleInputChange}
            className="w-full py-3 px-4 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
            rows={2}
            placeholder="Enter your address for coordination"
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

        {/* Shelter Preference */}
        <div>
          <label className="text-white text-sm font-medium mb-3 block">
            Shelter Preference <span className="text-red-400">*</span>
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              { value: 'human', label: 'Human Shelters', icon: '👥' },
              { value: 'animal', label: 'Animal Shelters', icon: '🐾' },
              { value: 'both', label: 'Both Types', icon: '🤝' }
            ].map((option) => (
              <label
                key={option.value}
                className={`cursor-pointer p-4 rounded-lg border-2 text-center transition-all ${
                  formData.shelterPreference === option.value
                    ? 'border-yellow-500 bg-yellow-500/20'
                    : 'border-gray-600 bg-gray-700/50 hover:border-gray-500'
                }`}
              >
                <input
                  type="radio"
                  name="shelterPreference"
                  value={option.value}
                  checked={formData.shelterPreference === option.value}
                  onChange={handleInputChange}
                  className="sr-only"
                  required
                />
                <div className="text-2xl mb-2">{option.icon}</div>
                <div className="text-white font-medium">{option.label}</div>
              </label>
            ))}
          </div>
        </div>

        {/* Donation Amount (conditional) */}
        {formData.donationType === 'partial' && (
          <div>
            <label className="text-white text-sm font-medium mb-2 block">
              Donation Amount <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="number"
                name="donationAmount"
                value={formData.donationAmount}
                onChange={handleInputChange}
                className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Amount in ₹"
                min="1"
                required
              />
            </div>
          </div>
        )}

        {/* Description */}
        <div>
          <label className="text-white text-sm font-medium mb-2 block">
            Support Description
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            className="w-full py-3 px-4 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
            rows={4}
            placeholder="Describe how you'd like to support shelters, any specific preferences or requirements..."
          />
        </div>

        <div className="bg-yellow-500/20 border border-yellow-500 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <Building className="h-5 w-5 text-yellow-400" />
            <span className="text-yellow-400 font-medium">Shelter Support Information</span>
          </div>
          <p className="text-yellow-200 text-sm">
            Your donation will be coordinated with verified shelters in your area. 
            Volunteers will help facilitate the connection and ensure your support reaches those in need.
          </p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-yellow-600 hover:bg-yellow-700 disabled:bg-yellow-800 text-white py-3 rounded-lg font-semibold transition-colors flex items-center justify-center"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
              Submitting...
            </>
          ) : (
            'Submit Shelter Support Donation'
          )}
        </button>
      </form>
    </div>
  );
};

export default JyothiNilayamForm;