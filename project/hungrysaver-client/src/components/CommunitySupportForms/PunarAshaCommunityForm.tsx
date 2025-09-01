import React, { useState } from 'react';
import { MapPin, User, Phone, Home, Package } from 'lucide-react';
import ErrorMessage from '../ErrorMessage';

interface PunarAshaCommunityFormData {
  location: string;
  address: string;
  beneficiaryName: string;
  beneficiaryContact: string;
  requestedItems: string[];
  purpose: 'resale' | 'reuse' | '';
  quantityNeeded: string;
  urgency: 'low' | 'medium' | 'high';
  description: string;
}

interface PunarAshaCommunityFormProps {
  onSubmit: (data: PunarAshaCommunityFormData) => void;
  loading?: boolean;
}

const PunarAshaCommunityForm: React.FC<PunarAshaCommunityFormProps> = ({ onSubmit, loading = false }) => {
  const [formData, setFormData] = useState<PunarAshaCommunityFormData>({
    location: '',
    address: '',
    beneficiaryName: '',
    beneficiaryContact: '',
    requestedItems: [],
    purpose: '',
    quantityNeeded: '',
    urgency: 'medium',
    description: ''
  });
  const [error, setError] = useState('');

  const cities = [
    'vijayawada', 'guntur', 'visakhapatnam', 'tirupati', 'kakinada',
    'nellore', 'kurnool', 'rajahmundry', 'kadapa', 'anantapur',
    'kalasalingam academy of research and education', 'krishnan koil',
    'srivilliputtur', 'rajapalayam', 'virudhunagar'
  ];

  const itemCategories = [
    { id: 'electronics', label: 'Electronics', description: 'TV, radio, mobile phones, appliances' },
    { id: 'furniture', label: 'Furniture', description: 'Chairs, tables, beds, storage' },
    { id: 'household', label: 'Household Items', description: 'Utensils, containers, tools' },
    { id: 'books', label: 'Books & Educational', description: 'Textbooks, reference materials' },
    { id: 'clothing', label: 'Clothing', description: 'Clothes, shoes, accessories' }
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : false;
    
    if (name === 'requestedItems') {
      const itemId = value;
      setFormData(prev => ({
        ...prev,
        requestedItems: checked 
          ? [...prev.requestedItems, itemId]
          : prev.requestedItems.filter(id => id !== itemId)
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
        !formData.beneficiaryContact || !formData.purpose || !formData.quantityNeeded) {
      setError('Please fill in all required fields.');
      return false;
    }

    if (formData.requestedItems.length === 0) {
      setError('Please select at least one item category.');
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
        <div className="bg-purple-500 p-3 rounded-full">
          <Home className="h-6 w-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">🔄 PunarAsha Request</h2>
          <p className="text-gray-300">Request items for rehabilitation and rebuilding lives</p>
        </div>
      </div>

      <ErrorMessage error={error} className="mb-6" />

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Location and Purpose */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                <option value="">Select location</option>
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
              Purpose <span className="text-red-400">*</span>
            </label>
            <select
              name="purpose"
              value={formData.purpose}
              onChange={handleInputChange}
              className="w-full py-3 px-4 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            >
              <option value="">Select purpose</option>
              <option value="reuse">Personal Use</option>
              <option value="resale">Resale for Income</option>
            </select>
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

        {/* Requested Items */}
        <div>
          <label className="text-white text-sm font-medium mb-3 block">
            Requested Item Categories <span className="text-red-400">*</span>
          </label>
          <div className="space-y-3">
            {itemCategories.map((category) => (
              <label key={category.id} className="flex items-start space-x-3 cursor-pointer p-3 rounded-lg border border-gray-600 hover:border-gray-500 transition-colors">
                <input
                  type="checkbox"
                  name="requestedItems"
                  value={category.id}
                  checked={formData.requestedItems.includes(category.id)}
                  onChange={handleInputChange}
                  className="mt-1 h-4 w-4 text-green-600 focus:ring-green-500 border-gray-600 rounded bg-gray-700"
                />
                <div>
                  <span className="text-white font-medium">{category.label}</span>
                  <p className="text-gray-400 text-sm">{category.description}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Quantity and Urgency */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-white text-sm font-medium mb-2 block">
              Quantity Needed <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <Package className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                name="quantityNeeded"
                value={formData.quantityNeeded}
                onChange={handleInputChange}
                className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Specify quantities (e.g., 1 TV, 2 chairs)"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-white text-sm font-medium mb-2 block">
              Urgency Level
            </label>
            <select
              name="urgency"
              value={formData.urgency}
              onChange={handleInputChange}
              className="w-full py-3 px-4 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
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
            placeholder="Describe the rehabilitation needs and how these items will help rebuild their life..."
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 text-white py-3 rounded-lg font-semibold transition-colors flex items-center justify-center"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
              Submitting Request...
            </>
          ) : (
            'Submit Rehabilitation Support Request'
          )}
        </button>
      </form>
    </div>
  );
};

export default PunarAshaCommunityForm;