import React, { useState } from 'react';
import { MapPin, User, Phone, BookOpen, GraduationCap } from 'lucide-react';
import ErrorMessage from '../ErrorMessage';

interface VidyaJyothiCommunityFormData {
  location: string;
  address: string;
  beneficiaryName: string;
  beneficiaryContact: string;
  childName: string;
  childAge: string;
  schoolName: string;
  className: string;
  neededItems: {
    fees: boolean;
    books: boolean;
    uniform: boolean;
  };
  urgency: 'low' | 'medium' | 'high';
  description: string;
}

interface VidyaJyothiCommunityFormProps {
  onSubmit: (data: VidyaJyothiCommunityFormData) => void;
  loading?: boolean;
}

const VidyaJyothiCommunityForm: React.FC<VidyaJyothiCommunityFormProps> = ({ onSubmit, loading = false }) => {
  const [formData, setFormData] = useState<VidyaJyothiCommunityFormData>({
    location: '',
    address: '',
    beneficiaryName: '',
    beneficiaryContact: '',
    childName: '',
    childAge: '',
    schoolName: '',
    className: '',
    neededItems: {
      fees: false,
      books: false,
      uniform: false
    },
    urgency: 'medium',
    description: ''
  });
  const [error, setError] = useState('');

  const cities = [
    'vijayawada', 'guntur', 'visakhapatnam', 'tirupati', 'kakinada',
    'nellore', 'kurnool', 'rajahmundry', 'kadapa', 'anantapur'
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : false;
    
    if (name.startsWith('neededItems.')) {
      const itemKey = name.split('.')[1] as keyof typeof formData.neededItems;
      setFormData(prev => ({
        ...prev,
        neededItems: {
          ...prev.neededItems,
          [itemKey]: checked
        }
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
        !formData.beneficiaryContact || !formData.childName || !formData.childAge) {
      setError('Please fill in all required fields.');
      return false;
    }

    const hasNeededItems = Object.values(formData.neededItems).some(item => item);
    if (!hasNeededItems) {
      setError('Please select at least one needed item.');
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
          <h2 className="text-2xl font-bold text-white">📚 Vidya Jyothi Request</h2>
          <p className="text-gray-300">Request educational support for children</p>
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

        <div>
          <label className="text-white text-sm font-medium mb-2 block">
            Address <span className="text-red-400">*</span>
          </label>
          <textarea
            name="address"
            value={formData.address}
            onChange={handleInputChange}
            className="w-full py-3 px-4 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
            rows={2}
            placeholder="Enter complete address"
            required
          />
        </div>

        {/* Beneficiary Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-white text-sm font-medium mb-2 block">
              Parent/Guardian Name <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                name="beneficiaryName"
                value={formData.beneficiaryName}
                onChange={handleInputChange}
                className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Parent or guardian name"
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

        {/* Child Details */}
        <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/30">
          <h3 className="text-lg font-semibold text-white mb-4">Child Details</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-white text-sm font-medium mb-2 block">
                Child Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                name="childName"
                value={formData.childName}
                onChange={handleInputChange}
                className="w-full py-3 px-4 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Child's name"
                required
              />
            </div>
            
            <div>
              <label className="text-white text-sm font-medium mb-2 block">
                Age <span className="text-red-400">*</span>
              </label>
              <input
                type="number"
                name="childAge"
                value={formData.childAge}
                onChange={handleInputChange}
                className="w-full py-3 px-4 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Age"
                min="3"
                max="18"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            <div>
              <label className="text-white text-sm font-medium mb-2 block">
                School Name
              </label>
              <div className="relative">
                <GraduationCap className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  name="schoolName"
                  value={formData.schoolName}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="School name"
                />
              </div>
            </div>
            
            <div>
              <label className="text-white text-sm font-medium mb-2 block">
                Class/Grade
              </label>
              <input
                type="text"
                name="className"
                value={formData.className}
                onChange={handleInputChange}
                className="w-full py-3 px-4 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="e.g., 5th Grade"
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
            {[
              { key: 'fees', label: 'School Fees', description: 'Tuition and other school fees' },
              { key: 'books', label: 'Books & Supplies', description: 'Textbooks, notebooks, stationery' },
              { key: 'uniform', label: 'School Uniform', description: 'School uniform and shoes' }
            ].map((item) => (
              <label key={item.key} className="flex items-start space-x-3 cursor-pointer p-3 rounded-lg border border-gray-600 hover:border-gray-500 transition-colors">
                <input
                  type="checkbox"
                  name={`neededItems.${item.key}`}
                  checked={formData.neededItems[item.key as keyof typeof formData.neededItems]}
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
            placeholder="Describe the child's educational needs and family situation..."
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
            'Submit Educational Support Request'
          )}
        </button>
      </form>
    </div>
  );
};

export default VidyaJyothiCommunityForm;