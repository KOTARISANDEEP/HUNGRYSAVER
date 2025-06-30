import React, { useState } from 'react';
import { MapPin, User, Phone, Zap, AlertTriangle } from 'lucide-react';
import ErrorMessage from '../ErrorMessage';

interface RakshaJyothiCommunityFormData {
  location: string;
  address: string;
  beneficiaryName: string;
  beneficiaryContact: string;
  emergencyDescription: string;
  peopleAnimalsAffected: string;
  immediateNeeds: string;
  urgency: 'low' | 'medium' | 'high';
  description: string;
}

interface RakshaJyothiCommunityFormProps {
  onSubmit: (data: RakshaJyothiCommunityFormData) => void;
  loading?: boolean;
}

const RakshaJyothiCommunityForm: React.FC<RakshaJyothiCommunityFormProps> = ({ onSubmit, loading = false }) => {
  const [formData, setFormData] = useState<RakshaJyothiCommunityFormData>({
    location: '',
    address: '',
    beneficiaryName: '',
    beneficiaryContact: '',
    emergencyDescription: '',
    peopleAnimalsAffected: '',
    immediateNeeds: '',
    urgency: 'high',
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
    if (!formData.location || !formData.address || !formData.beneficiaryName || 
        !formData.beneficiaryContact || !formData.emergencyDescription || 
        !formData.peopleAnimalsAffected || !formData.immediateNeeds) {
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
        <div className="bg-red-500 p-3 rounded-full">
          <Zap className="h-6 w-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">🚨 Raksha Jyothi Emergency Request</h2>
          <p className="text-gray-300">Request immediate emergency assistance</p>
        </div>
      </div>

      <div className="bg-red-500/20 border border-red-500 rounded-lg p-4 mb-6">
        <div className="flex items-center space-x-2 mb-2">
          <AlertTriangle className="h-5 w-5 text-red-400" />
          <span className="text-red-400 font-medium">Emergency Request Notice</span>
        </div>
        <p className="text-red-200 text-sm">
          This form is for requesting emergency assistance. If this is a life-threatening emergency, 
          please contact local emergency services (108) immediately.
        </p>
      </div>

      <ErrorMessage error={error} className="mb-6" />

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Location and Urgency */}
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
                <option value="">Select city</option>
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
              Urgency Level
            </label>
            <div className="relative">
              <AlertTriangle className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <select
                name="urgency"
                value={formData.urgency}
                onChange={handleInputChange}
                className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>
        </div>

        <div>
          <label className="text-white text-sm font-medium mb-2 block">
            Emergency Location Address <span className="text-red-400">*</span>
          </label>
          <textarea
            name="address"
            value={formData.address}
            onChange={handleInputChange}
            className="w-full py-3 px-4 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
            rows={2}
            placeholder="Enter exact address where emergency assistance is needed"
            required
          />
        </div>

        {/* Contact Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-white text-sm font-medium mb-2 block">
              Contact Person Name <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                name="beneficiaryName"
                value={formData.beneficiaryName}
                onChange={handleInputChange}
                className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Name of contact person"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-white text-sm font-medium mb-2 block">
              Contact Number <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="tel"
                name="beneficiaryContact"
                value={formData.beneficiaryContact}
                onChange={handleInputChange}
                className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Emergency contact number"
                required
              />
            </div>
          </div>
        </div>

        {/* Emergency Details */}
        <div>
          <label className="text-white text-sm font-medium mb-2 block">
            Emergency Description <span className="text-red-400">*</span>
          </label>
          <textarea
            name="emergencyDescription"
            value={formData.emergencyDescription}
            onChange={handleInputChange}
            className="w-full py-3 px-4 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
            rows={3}
            placeholder="Describe the emergency situation in detail..."
            required
          />
        </div>

        <div>
          <label className="text-white text-sm font-medium mb-2 block">
            People/Animals Affected <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            name="peopleAnimalsAffected"
            value={formData.peopleAnimalsAffected}
            onChange={handleInputChange}
            className="w-full py-3 px-4 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="Number and type of people/animals affected (e.g., 5 people, 3 dogs)"
            required
          />
        </div>

        <div>
          <label className="text-white text-sm font-medium mb-2 block">
            Immediate Needs <span className="text-red-400">*</span>
          </label>
          <textarea
            name="immediateNeeds"
            value={formData.immediateNeeds}
            onChange={handleInputChange}
            className="w-full py-3 px-4 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
            rows={3}
            placeholder="List immediate needs (medical aid, food, shelter, rescue equipment, etc.)"
            required
          />
        </div>

        {/* Additional Description */}
        <div>
          <label className="text-white text-sm font-medium mb-2 block">
            Additional Information
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            className="w-full py-3 px-4 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
            rows={3}
            placeholder="Any additional information that might help responders..."
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-800 text-white py-3 rounded-lg font-semibold transition-colors flex items-center justify-center"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
              Submitting Emergency Request...
            </>
          ) : (
            'Submit Emergency Assistance Request'
          )}
        </button>
      </form>
    </div>
  );
};

export default RakshaJyothiCommunityForm;