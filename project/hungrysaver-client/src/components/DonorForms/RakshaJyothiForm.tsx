import React, { useState } from 'react';
import { MapPin, User, Phone, Zap, AlertTriangle } from 'lucide-react';
import ErrorMessage from '../ErrorMessage';

export interface RakshaJyothiFormData {
  location: string;
  address: string;
  donorName: string;
  donorContact: string;
  emergencyType: 'medical' | 'accident' | 'animal' | '';
  urgencyLevel: '1' | '2' | '3' | '4' | '5' | '';
  description: string;
}

interface RakshaJyothiFormProps {
  onSubmit: (data: RakshaJyothiFormData) => void;
  loading?: boolean;
}

const RakshaJyothiForm: React.FC<RakshaJyothiFormProps> = ({ onSubmit, loading = false }) => {
  const [formData, setFormData] = useState<RakshaJyothiFormData>({
    location: '',
    address: '',
    donorName: '',
    donorContact: '',
    emergencyType: '',
    urgencyLevel: '',
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
        !formData.donorContact || !formData.emergencyType || !formData.urgencyLevel || !formData.description) {
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

  const getUrgencyColor = (level: string) => {
    switch (level) {
      case '1': return 'text-green-400';
      case '2': return 'text-yellow-400';
      case '3': return 'text-orange-400';
      case '4': return 'text-red-400';
      case '5': return 'text-red-600';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="bg-gray-800 rounded-xl p-8">
      <div className="flex items-center space-x-3 mb-6">
        <div className="bg-red-500 p-3 rounded-full">
          <Zap className="h-6 w-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">🚨 Raksha Jyothi</h2>
          <p className="text-gray-300">Provide emergency response support</p>
        </div>
      </div>

      <ErrorMessage error={error} className="mb-6" />

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Location and Emergency Type */}
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
              Emergency Type <span className="text-red-400">*</span>
            </label>
            <select
              name="emergencyType"
              value={formData.emergencyType}
              onChange={handleInputChange}
              className="w-full py-3 px-4 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            >
              <option value="">Select emergency type</option>
              <option value="medical">Medical Emergency</option>
              <option value="accident">Accident Response</option>
              <option value="animal">Animal Emergency</option>
            </select>
          </div>
        </div>

        <div>
          <label className="text-white text-sm font-medium mb-2 block">
            Response Address <span className="text-red-400">*</span>
          </label>
          <textarea
            name="address"
            value={formData.address}
            onChange={handleInputChange}
            className="w-full py-3 px-4 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
            rows={2}
            placeholder="Enter complete address where emergency support is needed"
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

        {/* Urgency Level */}
        <div>
          <label className="text-white text-sm font-medium mb-3 block">
            Urgency Level <span className="text-red-400">*</span>
          </label>
          <div className="grid grid-cols-5 gap-3">
            {['1', '2', '3', '4', '5'].map((level) => (
              <label
                key={level}
                className={`cursor-pointer p-3 rounded-lg border-2 text-center transition-all ${
                  formData.urgencyLevel === level
                    ? 'border-red-500 bg-red-500/20'
                    : 'border-gray-600 bg-gray-700/50 hover:border-gray-500'
                }`}
              >
                <input
                  type="radio"
                  name="urgencyLevel"
                  value={level}
                  checked={formData.urgencyLevel === level}
                  onChange={handleInputChange}
                  className="sr-only"
                  required
                />
                <div className="flex flex-col items-center">
                  <AlertTriangle className={`h-6 w-6 mb-1 ${getUrgencyColor(level)}`} />
                  <span className="text-white font-medium">{level}</span>
                  <span className="text-xs text-gray-400">
                    {level === '1' ? 'Low' : level === '2' ? 'Mild' : level === '3' ? 'Moderate' : level === '4' ? 'High' : 'Critical'}
                  </span>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="text-white text-sm font-medium mb-2 block">
            Emergency Description <span className="text-red-400">*</span>
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            className="w-full py-3 px-4 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
            rows={4}
            placeholder="Describe the emergency situation, what support is needed, any immediate requirements..."
            required
          />
        </div>

        <div className="bg-red-500/20 border border-red-500 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <AlertTriangle className="h-5 w-5 text-red-400" />
            <span className="text-red-400 font-medium">Emergency Support Notice</span>
          </div>
          <p className="text-red-200 text-sm">
            This form is for offering emergency support resources. If you are currently experiencing an emergency, 
            please contact local emergency services immediately.
          </p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-800 text-white py-3 rounded-lg font-semibold transition-colors flex items-center justify-center"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
              Submitting...
            </>
          ) : (
            'Submit Emergency Support Offer'
          )}
        </button>
      </form>
    </div>
  );
};

export default RakshaJyothiForm;