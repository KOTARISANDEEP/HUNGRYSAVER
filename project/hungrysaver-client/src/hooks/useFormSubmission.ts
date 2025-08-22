import { useState } from 'react';
import { submitDonation, validateDonationData, validateRequestData } from '../services/firestoreService';
import { createCommunityRequest } from '../services/communityRequestService';
import { useAuth } from '../contexts/AuthContext';

export const useFormSubmission = (userType: 'donor' | 'community') => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const { userData } = useAuth();

  const submitForm = async (formData: any): Promise<boolean> => {
    console.log('🚀 Starting form submission:', { userType, formData });
    
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      // Validate user authentication
      if (!userData?.uid) {
        throw new Error('You must be logged in to submit forms');
      }

      // Add user metadata and normalize location
      const submissionData = {
        ...formData,
        userId: userData.uid,
        location_lowercase: formData.location?.toLowerCase() || '',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      console.log('📝 Prepared submission data:', submissionData);

      // Validate data based on user type
      let isValid = false;
      if (userType === 'donor') {
        isValid = validateDonationData(submissionData);
        if (!isValid) {
          throw new Error('Please fill in all required donation fields correctly');
        }
      } else {
        isValid = validateRequestData(submissionData);
        if (!isValid) {
          throw new Error('Please fill in all required request fields correctly');
        }
      }

      // Submit to appropriate collection
      let result;
      if (userType === 'donor') {
        result = await submitDonation(submissionData);
        console.log('✅ Donation submitted with ID:', result);
      } else {
        // Use the new community request service for community users
        result = await createCommunityRequest(submissionData);
        console.log('✅ Community request submitted with ID:', result);
      }

      setSuccess(true);
      console.log('🎉 Form submission successful!');
      return true;

    } catch (error: any) {
      console.error('❌ Form submission error:', error);
      setError(error.message || 'Failed to submit form. Please try again.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    console.log('🔄 Resetting form state');
    setError('');
    setSuccess(false);
    setLoading(false);
  };

  return {
    submitForm,
    loading,
    error,
    success,
    resetForm
  };
};