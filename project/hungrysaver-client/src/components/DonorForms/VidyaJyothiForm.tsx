import React, { useState } from 'react';
import { MapPin, User, Phone, DollarSign, BookOpen } from 'lucide-react';
import ErrorMessage from '../ErrorMessage';

export interface VidyaJyothiFormData {
  location: string;
  hostel?: string;
  address: string;
  donorName: string;
  donorContact: string;
  supportType: 'fees' | 'books' | 'uniforms' | 'supplies' | '';
  amount: string;
  description: string;
}

interface VidyaJyothiFormProps {
  onSubmit: (data: VidyaJyothiFormData) => void;
  loading?: boolean;
}

const VidyaJyothiForm: React.FC<VidyaJyothiFormProps> = ({ onSubmit, loading = false }) => {
  const [formData, setFormData] = useState<VidyaJyothiFormData>({
    location: '',
    hostel: '',
    address: '',
    donorName: '',
    donorContact: '',
    supportType: '',
    amount: '',
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
        !formData.donorContact || !formData.supportType || !formData.amount) {
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
          <BookOpen className="h-6 w-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">📚 Vidya Jyothi</h2>
          <p className="text-gray-300">Support education through financial assistance</p>
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
              className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              className="w-full py-3 px-4 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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

        {/* Support Type */}
        <div>
          <label className="text-white text-sm font-medium mb-2 block">
            Support Type <span className="text-red-400">*</span>
          </label>
          <select
            name="supportType"
            value={formData.supportType}
            onChange={handleInputChange}
            className="w-full py-3 px-4 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">Select support type</option>
            <option value="fees">School Fees</option>
            <option value="books">Books & Supplies</option>
            <option value="uniforms">School Uniforms</option>
            <option value="supplies">Educational Supplies</option>
          </select>
        </div>

        <div>
          <label className="text-white text-sm font-medium mb-2 block">
            Address <span className="text-red-400">*</span>
          </label>
          <textarea
            name="address"
            value={formData.address}
            onChange={handleInputChange}
            className="w-full py-3 px-4 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={2}
            placeholder="Enter your address"
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
                className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Your phone number"
                required
              />
            </div>
          </div>
        </div>

        {/* Amount */}
        <div>
          <label className="text-white text-sm font-medium mb-2 block">
            Donation Amount <span className="text-red-400">*</span>
          </label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleInputChange}
              className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Amount in ₹"
              min="1"
              required
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="text-white text-sm font-medium mb-2 block">
            Additional Details
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            className="w-full py-3 px-4 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
            placeholder="Any additional information about the donation..."
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
            'Submit Educational Support'
          )}
        </button>
      </form>
    </div>
  );
};

export default VidyaJyothiForm;