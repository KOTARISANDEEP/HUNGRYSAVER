import React, { useState, useEffect } from 'react';
import { MapPin, User, Phone, Package, Shield } from 'lucide-react';
import ErrorMessage from '../ErrorMessage';

export interface SurakshaSetuFormData {
  location: string;
  hostel?: string;
  address: string;
  donorName: string;
  donorContact: string;
  itemType: 'clothing' | 'books' | 'groceries' | '';
  itemQuantity: string;
  condition: 'new' | 'used' | '';
  description: string;
}

interface SurakshaSetuFormProps {
  onSubmit: (data: SurakshaSetuFormData) => void;
  loading?: boolean;
}

const SurakshaSetuForm: React.FC<SurakshaSetuFormProps> = ({ onSubmit, loading = false }) => {
  const [formData, setFormData] = useState<SurakshaSetuFormData>({
    location: '',
    address: '',
    donorName: '',
    donorContact: '',
    itemType: '',
    itemQuantity: '',
    condition: '',
    description: ''
  });
  const [hostel, setHostel] = useState('');
  const [error, setError] = useState('');

  // Reset hostel when location changes
  useEffect(() => {
    if (formData.location !== 'kalasalingam academy of research and education') {
      setHostel('');
    }
  }, [formData.location]);

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
        !formData.donorContact || !formData.itemType || !formData.itemQuantity || !formData.condition) {
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
        <div className="bg-blue-500 p-3 rounded-full">
          <Shield className="h-6 w-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">🤝 Suraksha Setu</h2>
          <p className="text-gray-300">Donate essential items for emergency support</p>
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

        {/* Item Type */}
        <div>
          <label className="text-white text-sm font-medium mb-2 block">
            Item Type <span className="text-red-400">*</span>
          </label>
          <select
            name="itemType"
            value={formData.itemType}
            onChange={handleInputChange}
            className="w-full py-3 px-4 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
            required
          >
            <option value="">Select item type</option>
            <option value="clothing">Clothing</option>
            <option value="books">Books</option>
            <option value="groceries">Groceries</option>
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
            placeholder="Enter complete address for item pickup"
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

        {/* Item Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-white text-sm font-medium mb-2 block">
              Quantity <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <Package className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                name="itemQuantity"
                value={formData.itemQuantity}
                onChange={handleInputChange}
                className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="e.g., 10 pieces, 5kg, 20 books"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-white text-sm font-medium mb-2 block">
              Condition <span className="text-red-400">*</span>
            </label>
            <select
              name="condition"
              value={formData.condition}
              onChange={handleInputChange}
              className="w-full py-3 px-4 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            >
              <option value="">Select condition</option>
              <option value="new">New</option>
              <option value="used">Used (Good Condition)</option>
            </select>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="text-white text-sm font-medium mb-2 block">
            Item Description
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            className="w-full py-3 px-4 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
            rows={3}
            placeholder="Describe the items, sizes, any special instructions..."
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
              Submitting...
            </>
          ) : (
            'Submit Emergency Support Donation'
          )}
        </button>
      </form>
    </div>
  );
};

export default SurakshaSetuForm;