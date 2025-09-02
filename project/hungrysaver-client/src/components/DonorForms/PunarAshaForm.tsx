import React, { useState, useEffect } from 'react';
import { MapPin, User, Phone, Home, DollarSign } from 'lucide-react';
import ErrorMessage from '../ErrorMessage';
import ImageUploadSection from '../ImageUploadSection';
import { uploadImagesToImgBB } from '../../services/imageUploadService';

export interface PunarAshaFormData {
  location: string;
  hostel?: string;
  address: string;
  donorName: string;
  donorContact: string;
  itemCategory: 'electronics' | 'furniture' | '';
  workingCondition: boolean | null;
  estimatedValue: string;
  description: string;
}

interface PunarAshaFormProps {
  onSubmit: (data: PunarAshaFormData) => void;
  loading?: boolean;
}

const PunarAshaForm: React.FC<PunarAshaFormProps> = ({ onSubmit, loading = false }) => {
  const [formData, setFormData] = useState<PunarAshaFormData>({
    location: '',
    address: '',
    donorName: '',
    donorContact: '',
    itemCategory: '',
    workingCondition: null,
    estimatedValue: '',
    description: ''
  });
  const [hostel, setHostel] = useState('');
  const [error, setError] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);

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
    const { name, value, type } = e.target;
    
    if (name === 'workingCondition') {
      setFormData(prev => ({
        ...prev,
        [name]: value === 'true'
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const validateForm = (): boolean => {
    if (!formData.location || !formData.address || !formData.donorName || 
        !formData.donorContact || !formData.itemCategory || formData.workingCondition === null) {
      setError('Please fill in all required fields.');
      return false;
    }
    if (formData.location === 'kalasalingam academy of research and education' && !hostel) {
      setError('Please select a hostel for Kalasalingam Academy location.');
      return false;
    }
    if (selectedFiles.length === 0) {
      setError('Please upload at least one image.');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) return;

    try {
      let imageUrls: string[] = [];
      if (selectedFiles.length > 0) {
        setUploadingImage(true);
        imageUrls = await uploadImagesToImgBB(selectedFiles);
      }

      const submissionData: any = { ...formData };
      if (formData.location === 'kalasalingam academy of research and education') {
        submissionData.hostel = hostel;
      }
      if (imageUrls.length > 0) {
        submissionData.imageUrls = imageUrls;
        submissionData.imageUrl = imageUrls[0];
      }
      onSubmit(submissionData);
    } catch (err) {
      console.error('Error uploading images:', err);
      setError(err instanceof Error ? err.message : 'Failed to upload images. Please try again.');
    } finally {
      setUploadingImage(false);
    }
  };

  return (
    <div className="bg-gray-800 rounded-xl p-8">
      <div className="flex items-center space-x-3 mb-6">
        <div className="bg-purple-500 p-3 rounded-full">
          <Home className="h-6 w-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">🔄 PunarAsha</h2>
          <p className="text-gray-300">Donate items for rehabilitation support</p>
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
              value={hostel}
              onChange={(e) => setHostel(e.target.value)}
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

        {/* Item Category */}
        <div>
          <label className="text-white text-sm font-medium mb-2 block">
            Item Category <span className="text-red-400">*</span>
          </label>
          <select
            name="itemCategory"
            value={formData.itemCategory}
            onChange={handleInputChange}
            className="w-full py-3 px-4 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
            required
          >
            <option value="">Select category</option>
            <option value="electronics">Electronics</option>
            <option value="furniture">Furniture</option>
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
              Working Condition <span className="text-red-400">*</span>
            </label>
            <div className="space-y-2">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="workingCondition"
                  value="true"
                  checked={formData.workingCondition === true}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-600"
                  required
                />
                <span className="text-white">Working/Good Condition</span>
              </label>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="workingCondition"
                  value="false"
                  checked={formData.workingCondition === false}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-600"
                  required
                />
                <span className="text-white">Needs Repair</span>
              </label>
            </div>
          </div>

          <div>
            <label className="text-white text-sm font-medium mb-2 block">
              Estimated Value
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                name="estimatedValue"
                value={formData.estimatedValue}
                onChange={handleInputChange}
                className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Approximate value in ₹"
              />
            </div>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="text-white text-sm font-medium mb-2 block">
            Item Description <span className="text-red-400">*</span>
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            className="w-full py-3 px-4 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
            rows={4}
            placeholder="Describe the items in detail, including brand, model, condition, any accessories..."
            required
          />
        </div>

        <ImageUploadSection
          label="Upload relevant images (max 3)"
          maxImages={3}
          disabled={uploadingImage}
          value={selectedFiles}
          onChange={setSelectedFiles}
        />

        <button
          type="submit"
          disabled={loading || uploadingImage}
          className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 text-white py-3 rounded-lg font-semibold transition-colors flex items-center justify-center"
        >
          {(loading || uploadingImage) ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
              {uploadingImage ? 'Uploading Images...' : 'Submitting...'}
            </>
          ) : (
            'Submit Rehabilitation Support Donation'
          )}
        </button>
      </form>
    </div>
  );
};

export default PunarAshaForm;