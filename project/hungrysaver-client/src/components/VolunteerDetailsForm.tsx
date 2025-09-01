import React, { useState } from 'react';
import { X, User, Phone, Clock, CheckCircle } from 'lucide-react';

interface VolunteerDetailsFormProps {
  isOpen: boolean;
  onClose: () => void;
  donationId: string;
  onSuccess: () => void;
}

interface FormData {
  volunteerName: string;
  volunteerContact: string;
  expectedArrivalTime: string;
}

const VolunteerDetailsForm: React.FC<VolunteerDetailsFormProps> = ({
  isOpen,
  onClose,
  donationId,
  onSuccess
}) => {
  const [formData, setFormData] = useState<FormData>({
    volunteerName: '',
    volunteerContact: '',
    expectedArrivalTime: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<FormData>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<FormData> = {};

    if (!formData.volunteerName.trim()) {
      newErrors.volunteerName = 'Volunteer name is required';
    }

    if (!formData.volunteerContact.trim()) {
      newErrors.volunteerContact = 'Contact number is required';
    } else if (!/^[0-9]{10}$/.test(formData.volunteerContact.replace(/\D/g, ''))) {
      newErrors.volunteerContact = 'Please enter a valid 10-digit phone number';
    }

    if (!formData.expectedArrivalTime) {
      newErrors.expectedArrivalTime = 'Expected arrival time is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      // Get the current user's ID token for authentication
      const { getAuth } = await import('firebase/auth');
      const auth = getAuth();
      const user = auth.currentUser;
      
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      const idToken = await user.getIdToken();
      
      // Submit volunteer details
      const response = await fetch(`https://hungrysaver.onrender.com/api/volunteer-details/${donationId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to submit volunteer details');
      }

      // Success - close form and notify parent
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error submitting volunteer details:', error);
      alert(error instanceof Error ? error.message : 'Failed to submit volunteer details');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900/95 backdrop-blur-lg rounded-2xl p-8 max-w-md w-full border border-[#eaa640]/30 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <CheckCircle className="h-7 w-7 text-[#eaa640]" />
            Accept Donation
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-800 rounded-lg"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Volunteer Name */}
          <div>
            <label className="block text-[#eaa640] font-semibold mb-2 flex items-center gap-2">
              <User className="h-5 w-5" />
              Volunteer Name
            </label>
            <input
              type="text"
              value={formData.volunteerName}
              onChange={(e) => handleInputChange('volunteerName', e.target.value)}
              className={`w-full px-4 py-3 bg-gray-800 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#eaa640] transition-all ${
                errors.volunteerName ? 'border-red-500' : 'border-gray-600'
              }`}
              placeholder="Enter your full name"
            />
            {errors.volunteerName && (
              <p className="text-red-400 text-sm mt-1">{errors.volunteerName}</p>
            )}
          </div>

          {/* Volunteer Contact */}
          <div>
            <label className="block text-[#eaa640] font-semibold mb-2 flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Contact Number
            </label>
            <input
              type="tel"
              value={formData.volunteerContact}
              onChange={(e) => handleInputChange('volunteerContact', e.target.value)}
              className={`w-full px-4 py-3 bg-gray-800 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#eaa640] transition-all ${
                errors.volunteerContact ? 'border-red-500' : 'border-gray-600'
              }`}
              placeholder="Enter your 10-digit phone number"
            />
            {errors.volunteerContact && (
              <p className="text-red-400 text-sm mt-1">{errors.volunteerContact}</p>
            )}
          </div>

          {/* Expected Arrival Time */}
          <div>
            <label className="block text-[#eaa640] font-semibold mb-2 flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Expected Arrival Time
            </label>
            <input
              type="datetime-local"
              value={formData.expectedArrivalTime}
              onChange={(e) => handleInputChange('expectedArrivalTime', e.target.value)}
              className={`w-full px-4 py-3 bg-gray-800 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#eaa640] transition-all ${
                errors.expectedArrivalTime ? 'border-red-500' : 'border-gray-600'
              }`}
            />
            {errors.expectedArrivalTime && (
              <p className="text-red-400 text-sm mt-1">{errors.expectedArrivalTime}</p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-[#eaa640] to-[#ecae53] text-black font-bold py-3 px-6 rounded-lg hover:from-[#ecae53] hover:to-[#eaa640] transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black"></div>
                Submitting...
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Accept Donation
              </div>
            )}
          </button>
        </form>

        {/* Info Text */}
        <p className="text-gray-400 text-sm text-center mt-4">
          By accepting this donation, you agree to pick it up at the specified time and location.
        </p>
      </div>
    </div>
  );
};

export default VolunteerDetailsForm;
