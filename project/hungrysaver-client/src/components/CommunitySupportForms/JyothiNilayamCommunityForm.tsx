import React, { useState } from 'react';
import { MapPin, User, Phone, Building, Clock } from 'lucide-react';
import ErrorMessage from '../ErrorMessage';
import ImageUploadSection from '../ImageUploadSection';
import { uploadImageToImgBB } from '../../services/imageUploadService';

interface JyothiNilayamCommunityFormData {
  location: string;
  address: string;
  beneficiaryName: string;
  beneficiaryContact: string;
  shelterTypeNeeded: 'human' | 'animal' | 'both' | '';
  numberOfPeopleAnimals: string;
  durationNeeded: string;
  urgency: 'low' | 'medium' | 'high';
  description: string;
}

interface JyothiNilayamCommunityFormProps {
  onSubmit: (data: JyothiNilayamCommunityFormData) => void;
  loading?: boolean;
}

const JyothiNilayamCommunityForm: React.FC<JyothiNilayamCommunityFormProps> = ({ onSubmit, loading = false }) => {
  const [formData, setFormData] = useState<JyothiNilayamCommunityFormData>({
    location: '',
    address: '',
    beneficiaryName: '',
    beneficiaryContact: '',
    shelterTypeNeeded: '',
    numberOfPeopleAnimals: '',
    durationNeeded: '',
    urgency: 'medium',
    description: ''
  });
  const [error, setError] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);

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
    if (!formData.location || !formData.address || !formData.beneficiaryName || 
        !formData.beneficiaryContact || !formData.shelterTypeNeeded || 
        !formData.numberOfPeopleAnimals || !formData.durationNeeded) {
      setError('Please fill in all required fields.');
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
        try {
          const uploadPromise = Promise.all(selectedFiles.map(f => uploadImageToImgBB(f)));
          const timeoutPromise = new Promise<string[]>((resolve) => setTimeout(() => resolve([]), 3000));
          imageUrls = await Promise.race([uploadPromise, timeoutPromise]);
          if (imageUrls.length === 0) setError('Image upload timed out. Submitting without images.');
        } catch {
          imageUrls = [];
        }
      }

      const submissionData: any = { ...formData };
      if (imageUrls.length > 0) {
        submissionData.imageUrls = imageUrls;
        submissionData.imageUrl = imageUrls[0];
      }
      await Promise.race([
        new Promise((resolve) => setTimeout(resolve, 3000)),
        new Promise((resolve) => { onSubmit(submissionData); resolve(null); })
      ]);
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
        <div className="bg-yellow-500 p-3 rounded-full">
          <Building className="h-6 w-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">🏠 Jyothi Nilayam Request</h2>
          <p className="text-gray-300">Request shelter support for humans and animals</p>
        </div>
      </div>

      <ErrorMessage error={error} className="mb-6" />

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Location and Shelter Type */}
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
            Current Location/Address <span className="text-red-400">*</span>
          </label>
          <textarea
            name="address"
            value={formData.address}
            onChange={handleInputChange}
            className="w-full py-3 px-4 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
            rows={2}
            placeholder="Enter current location or where shelter is needed"
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
                placeholder="Name of person requesting shelter"
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

        {/* Shelter Type */}
        <div>
          <label className="text-white text-sm font-medium mb-3 block">
            Shelter Type Needed <span className="text-red-400">*</span>
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              { value: 'human', label: 'Human Shelter', icon: '👥', description: 'Shelter for people' },
              { value: 'animal', label: 'Animal Shelter', icon: '🐾', description: 'Shelter for animals' },
              { value: 'both', label: 'Both Types', icon: '🤝', description: 'Shelter for people & animals' }
            ].map((option) => (
              <label
                key={option.value}
                className={`cursor-pointer p-4 rounded-lg border-2 text-center transition-all ${
                  formData.shelterTypeNeeded === option.value
                    ? 'border-yellow-500 bg-yellow-500/20'
                    : 'border-gray-600 bg-gray-700/50 hover:border-gray-500'
                }`}
              >
                <input
                  type="radio"
                  name="shelterTypeNeeded"
                  value={option.value}
                  checked={formData.shelterTypeNeeded === option.value}
                  onChange={handleInputChange}
                  className="sr-only"
                  required
                />
                <div className="text-2xl mb-2">{option.icon}</div>
                <div className="text-white font-medium">{option.label}</div>
                <div className="text-gray-400 text-xs">{option.description}</div>
              </label>
            ))}
          </div>
        </div>

        {/* Numbers and Duration */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-white text-sm font-medium mb-2 block">
              Number of People/Animals <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              name="numberOfPeopleAnimals"
              value={formData.numberOfPeopleAnimals}
              onChange={handleInputChange}
              className="w-full py-3 px-4 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="e.g., 4 people, 2 dogs"
              required
            />
          </div>

          <div>
            <label className="text-white text-sm font-medium mb-2 block">
              Duration Needed <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                name="durationNeeded"
                value={formData.durationNeeded}
                onChange={handleInputChange}
                className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="e.g., 1 week, 1 month, temporary"
                required
              />
            </div>
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
            placeholder="Describe the situation requiring shelter, any special needs, medical conditions, etc..."
            required
          />
        </div>

        <div className="bg-yellow-500/20 border border-yellow-500 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <Building className="h-5 w-5 text-yellow-400" />
            <span className="text-yellow-400 font-medium">Shelter Request Information</span>
          </div>
          <p className="text-yellow-200 text-sm">
            We will connect you with verified shelters in your area. 
            Volunteers will coordinate the placement and ensure appropriate care is provided.
          </p>
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
          className="w-full bg-yellow-600 hover:bg-yellow-700 disabled:bg-yellow-800 text-white py-3 rounded-lg font-semibold transition-colors flex items-center justify-center"
        >
          {(loading || uploadingImage) ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
              {uploadingImage ? 'Uploading Images...' : 'Submitting Request...'}
            </>
          ) : (
            'Submit Shelter Support Request'
          )}
        </button>
      </form>
    </div>
  );
};

export default JyothiNilayamCommunityForm;