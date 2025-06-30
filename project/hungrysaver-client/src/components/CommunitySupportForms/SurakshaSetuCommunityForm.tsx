import React, { useState } from 'react';
import { MapPin, User, Phone, Shield, AlertCircle } from 'lucide-react';
import ErrorMessage from '../ErrorMessage';

interface SurakshaSetuCommunityFormData {
  location: string;
  address: string;
  beneficiaryName: string;
  beneficiaryContact: string;
  neededItemTypes: string[];
  quantityRequired: string;
  urgency: 'low' | 'medium' | 'high';
  description: string;
}

interface SurakshaSetuCommunityFormProps {
  onSubmit: (data: SurakshaSetuCommunityFormData) => void;
  loading?: boolean;
}

const SurakshaSetuCommunityForm: React.FC<SurakshaSetuCommunityFormProps> = ({ onSubmit, loading = false }) => {
  const [formData, setFormData] = useState<SurakshaSetuCommunityFormData>({
    location: '',
    address: '',
    beneficiaryName: '',
    beneficiaryContact: '',
    neededItemTypes: [],
    quantityRequired: '',
    urgency: 'medium',
    description: ''
  });
  const [error, setError] = useState('');

  const cities = [
    'vijayawada', 'guntur', 'visakhapatnam', 'tirupati', 'kakinada',
    'nellore', 'kurnool', 'rajahmundry', 'kadapa', 'anantapur'
  ];

  const itemTypes = [
    { id: 'clothing', label: 'Clothing & Blankets', description: 'Warm clothes, blankets, shoes' },
    { id: 'food', label: 'Emergency Food', description: 'Non-perishable food items' },
    { id: 'medical', label: 'Medical Supplies', description: 'First aid, medicines' },
    { id: 'shelter', label: 'Temporary Shelter', description: 'Tarpaulin, tents' },
    { id: 'hygiene', label: 'Hygiene Items', description: 'Soap, sanitizer, toiletries' }
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : false;
    
    if (name === 'neededItemTypes') {
      const itemId = value;
      setFormData(prev => ({
        ...prev,
        neededItemTypes: checked 
          ? [...prev.neededItemTypes, itemId]
          : prev.neededItemTypes.filter(id => id !== itemId)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const validateForm = (): boolean => {
    if (!formData.location || !formData.address || !formData.beneficiaryName || 
        !formData.beneficiaryContact || !formData.quantityRequired) {
      setError('Please fill in all required fields.');
      return false;
    }

    if (formData.neededItemTypes.length === 0) {
      setError('Please select at least one needed item type.');
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
        <div className="bg-blue-500 p-3 rounded-full">
          <Shield className="h-6 w-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">🤝 Suraksha Setu Request</h2>
          <p className="text-gray-300">Request emergency support items for those in need</p>
        </div>
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
              <AlertCircle className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <select
                name="urgency"
                value={formData.urgency}
                onChange={handleInputChange}
                className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>
        </div>

        <div>
          <label className="text-white text-sm font-medium mb-2 block">
            Delivery Address <span className="text-red-400">*</span>
          </label>
          <textarea
            name="address"
            value={formData.address}
            onChange={handleInputChange}
            className="w-full py-3 px-4 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
            rows={2}
            placeholder="Enter complete address for item delivery"
            required
          />
        </div>

        {/* Beneficiary Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-white text-sm font-medium mb-2 block">
              Beneficiary Name <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                name="beneficiaryName"
                value={formData.beneficiaryName}
                onChange={handleInputChange}
                className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Name of person/family in need"
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
                placeholder="Contact number"
                required
              />
            </div>
          </div>
        </div>

        {/* Needed Items */}
        <div>
          <label className="text-white text-sm font-medium mb-3 block">
            Needed Items <span className="text-red-400">*</span>
          </label>
          <div className="space-y-3">
            {itemTypes.map((item) => (
              <label key={item.id} className="flex items-start space-x-3 cursor-pointer p-3 rounded-lg border border-gray-600 hover:border-gray-500 transition-colors">
                <input
                  type="checkbox"
                  name="neededItemTypes"
                  value={item.id}
                  checked={formData.neededItemTypes.includes(item.id)}
                  onChange={handleInputChange}
                  className="mt-1 h-4 w-4 text-green-600 focus:ring-green-500 border-gray-600 rounded bg-gray-700"
                />
                <div>
                  <span className="text-white font-medium">{item.label}</span>
                  <p className="text-gray-400 text-sm">{item.description}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Quantity Required */}
        <div>
          <label className="text-white text-sm font-medium mb-2 block">
            Quantity Required <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            name="quantityRequired"
            value={formData.quantityRequired}
            onChange={handleInputChange}
            className="w-full py-3 px-4 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="Specify quantities needed (e.g., 5 blankets, 10kg food)"
            required
          />
        </div>

        {/* Description */}
        <div>
          <label className="text-white text-sm font-medium mb-2 block">
            Situation Description <span className="text-red-400">*</span>
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            className="w-full py-3 px-4 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
            rows={4}
            placeholder="Describe the emergency situation and why these items are needed..."
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white py-3 rounded-lg font-semibold transition-colors flex items-center justify-center"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
              Submitting Request...
            </>
          ) : (
            'Submit Emergency Support Request'
          )}
        </button>
      </form>
    </div>
  );
};

export default SurakshaSetuCommunityForm;