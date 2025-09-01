import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Lock, MapPin, GraduationCap, Users, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import ErrorMessage from '../components/ErrorMessage';

const RegisterPage: React.FC = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    email: '',
    password: '',
    userType: '',
    contactNumber: '', // Added contact number field
    location: 'vijayawada', // Default to first city to prevent undefined
    education: '10th Grade', // Default to first education level
    acceptTerms: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{[key: string]: string}>({});
  
  const { register } = useAuth();
  const navigate = useNavigate();

  const cities = [
    'vijayawada', 'guntur', 'visakhapatnam', 'tirupati', 'kakinada',
    'nellore', 'kurnool', 'rajahmundry', 'kadapa', 'anantapur',
    'kalasalingam academy of research and education', 'krishnan koil', 
    'srivilliputtur', 'rajapalayam', 'virudhunagar'
  ];

  const educationLevels = [
    '10th Grade', '12th Grade', 'Diploma', 'Bachelor\'s Degree', 
    'Master\'s Degree', 'MBA', 'PhD', 'Other'
  ];

  const userTypes = [
    { value: 'volunteer', label: 'Volunteer', description: 'Help distribute resources and support community initiatives' },
    { value: 'donor', label: 'Donor', description: 'Contribute resources and support various causes' },
    { value: 'community', label: 'Community Support', description: 'Access support and submit requests for help' }
  ];

  // Validation functions
  const validateEmail = (email: string): string => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) return 'Email is required';
    if (!emailRegex.test(email)) return 'Please enter a valid email address';
    return '';
  };

  const validatePassword = (password: string): string => {
    if (!password) return 'Password is required';
    if (password.length < 8) return 'Password must be at least 8 characters long';
    if (!/[A-Z]/.test(password)) return 'Password must contain at least one uppercase letter';
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) return 'Password must contain at least one special character';
    return '';
  };

  const validateField = (name: string, value: string | boolean) => {
    let error = '';
    
    switch (name) {
      case 'firstName':
        if (!value) error = 'First name is required';
        break;
      case 'email':
        error = validateEmail(value as string);
        break;
      case 'password':
        error = validatePassword(value as string);
        break;
      case 'userType':
        if (!value) error = 'Please select a user type';
        break;
      case 'contactNumber':
        if (formData.userType === 'volunteer' && !value) error = 'Contact number is required for volunteers';
        else if (formData.userType === 'volunteer' && value) {
          const phoneRegex = /^[6-9]\d{9}$/;
          if (!phoneRegex.test(value as string)) error = 'Please enter a valid 10-digit mobile number';
        }
        break;
      case 'location':
        if (formData.userType === 'volunteer' && !value) error = 'Location is required for volunteers';
        break;
      case 'education':
        if (formData.userType === 'volunteer' && !value) error = 'Education is required for volunteers';
        break;
      case 'acceptTerms':
        if (!value) error = 'You must accept the terms of service';
        break;
    }
    
    setFieldErrors(prev => ({
      ...prev,
      [name]: error
    }));
    
    return error === '';
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : false;
    
    const newValue = type === 'checkbox' ? checked : value;
    
    setFormData(prev => ({
      ...prev,
      [name]: newValue
    }));

    // Clear field error when user starts typing
    if (fieldErrors[name]) {
      validateField(name, newValue);
    }
  };

  const handleUserTypeChange = (userType: string) => {
    setFormData(prev => ({
      ...prev,
      userType,
      // Reset to defaults for volunteer fields to prevent undefined values
      contactNumber: userType === 'volunteer' ? (prev.contactNumber || '') : '',
      location: userType === 'volunteer' ? (prev.location || 'vijayawada') : '',
      education: userType === 'volunteer' ? (prev.education || '10th Grade') : ''
    }));
    
    // Clear related field errors
    setFieldErrors(prev => ({
      ...prev,
      userType: '',
      contactNumber: '',
      location: '',
      education: ''
    }));
  };

  const validateForm = (): boolean => {
    const fields = ['firstName', 'email', 'password', 'userType', 'acceptTerms'];
    if (formData.userType === 'volunteer') {
      fields.push('contactNumber', 'location', 'education');
    }
    
    let isValid = true;
    fields.forEach(field => {
      const fieldValue = formData[field as keyof typeof formData];
      if (!validateField(field, fieldValue)) {
        isValid = false;
      }
    });
    
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validate all fields
    if (!validateForm()) {
      setLoading(false);
      setError('Please fix the errors below and try again.');
      return;
    }

    // Additional validation to prevent undefined values
    if (formData.userType === 'volunteer') {
      if (!formData.contactNumber || formData.contactNumber.trim() === '') {
        setError('Please enter a contact number for volunteer registration.');
        setLoading(false);
        return;
      }
      if (!formData.location || formData.location.trim() === '') {
        setError('Please select a location for volunteer registration.');
        setLoading(false);
        return;
      }
      if (!formData.education || formData.education.trim() === '') {
        setError('Please select an education level for volunteer registration.');
        setLoading(false);
        return;
      }
    }

    try {
      await register({
        firstName: formData.firstName.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        userType: formData.userType as 'volunteer' | 'donor' | 'community',
        status: formData.userType === 'volunteer' ? 'pending' : 'approved',
        // Only include volunteer-specific fields, and ensure they're not empty
        contactNumber: formData.userType === 'volunteer' ? formData.contactNumber.trim() : undefined,
        location: formData.userType === 'volunteer' ? formData.location.trim() : undefined,
        education: formData.userType === 'volunteer' ? formData.education.trim() : undefined
      });

      // Redirect based on user type
      if (formData.userType === 'volunteer') {
        navigate('/pending-approval');
      } else if (formData.userType === 'donor') {
        navigate('/donor-dashboard');
      } else if (formData.userType === 'community') {
        navigate('/community-dashboard');
      } else {
        navigate('/');
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
      setError(error.message);
      } else {
        setError(String(error));
      }
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength++;
    return strength;
  };

  const passwordStrength = getPasswordStrength(formData.password);

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.pexels.com/photos/6646918/pexels-photo-6646918.jpeg"
          alt="Community Registration"
          className="w-full h-full object-cover"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-black/70" />
      </div>

      <div className="relative z-10 max-w-2xl w-full space-y-8">
        <div className="bg-gray-800/90 backdrop-blur-sm p-8 rounded-xl shadow-2xl">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-white mb-2">Join Our Mission</h2>
            <p className="text-gray-300">Create your account to start making a difference</p>
          </div>

          <ErrorMessage error={error} className="mb-6" />

          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            {/* User Type Selection */}
            <div>
              <label className="text-white text-sm font-medium mb-3 block">
                I want to join as: <span className="text-red-400">*</span>
              </label>
              <div className="grid grid-cols-1 gap-3" role="radiogroup" aria-labelledby="userType">
                {userTypes.map((type) => (
                  <label
                    key={type.value}
                    className={`cursor-pointer p-4 rounded-lg border-2 transition-all ${
                      formData.userType === type.value
                        ? 'border-green-500 bg-green-500/20'
                        : 'border-gray-600 bg-gray-700/50 hover:border-gray-500'
                    }`}
                  >
                    <input
                      type="radio"
                      name="userType"
                      value={type.value}
                      checked={formData.userType === type.value}
                      onChange={() => handleUserTypeChange(type.value)}
                      className="sr-only"
                      aria-describedby={`${type.value}-description`}
                    />
                    <div className="flex items-start space-x-3">
                      <Users className="h-5 w-5 text-green-400 mt-0.5" />
                      <div>
                        <h3 className="text-white font-medium">{type.label}</h3>
                        <p id={`${type.value}-description`} className="text-gray-300 text-sm">{type.description}</p>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
              {fieldErrors.userType && (
                <p className="mt-2 text-sm text-red-400 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {fieldErrors.userType}
                </p>
              )}
            </div>

            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="firstName" className="text-white text-sm font-medium mb-2 block">
                  First Name <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    onBlur={() => validateField('firstName', formData.firstName)}
                    className={`w-full pl-10 pr-4 py-3 bg-gray-700 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 transition-colors ${
                      fieldErrors.firstName 
                        ? 'border-red-500 focus:ring-red-500' 
                        : 'border-gray-600 focus:ring-green-500 focus:border-transparent'
                    }`}
                    placeholder="Enter your first name"
                    aria-invalid={!!fieldErrors.firstName}
                    aria-describedby={fieldErrors.firstName ? 'firstName-error' : undefined}
                    required
                  />
                </div>
                {fieldErrors.firstName && (
                  <p id="firstName-error" className="mt-2 text-sm text-red-400 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {fieldErrors.firstName}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="email" className="text-white text-sm font-medium mb-2 block">
                  Email Address <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    onBlur={() => validateField('email', formData.email)}
                    className={`w-full pl-10 pr-4 py-3 bg-gray-700 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 transition-colors ${
                      fieldErrors.email 
                        ? 'border-red-500 focus:ring-red-500' 
                        : 'border-gray-600 focus:ring-green-500 focus:border-transparent'
                    }`}
                    placeholder="Enter your email"
                    aria-invalid={!!fieldErrors.email}
                    aria-describedby={fieldErrors.email ? 'email-error' : undefined}
                    required
                  />
                </div>
                {fieldErrors.email && (
                  <p id="email-error" className="mt-2 text-sm text-red-400 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {fieldErrors.email}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="password" className="text-white text-sm font-medium mb-2 block">
                Password <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  onBlur={() => validateField('password', formData.password)}
                  className={`w-full pl-10 pr-12 py-3 bg-gray-700 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 transition-colors ${
                    fieldErrors.password 
                      ? 'border-red-500 focus:ring-red-500' 
                      : 'border-gray-600 focus:ring-green-500 focus:border-transparent'
                  }`}
                  placeholder="Create a strong password"
                  aria-invalid={!!fieldErrors.password}
                  aria-describedby={fieldErrors.password ? 'password-error' : 'password-help'}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              
              {/* Password Strength Indicator */}
              {formData.password && (
                <div className="mt-2">
                  <div className="flex space-x-1">
                    {[1, 2, 3, 4, 5].map((level) => (
                      <div
                        key={level}
                        className={`h-1 flex-1 rounded ${
                          level <= passwordStrength
                            ? passwordStrength < 3
                              ? 'bg-red-500'
                              : passwordStrength < 4
                              ? 'bg-yellow-500'
                              : 'bg-green-500'
                            : 'bg-gray-600'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    Password strength: {
                      passwordStrength < 3 ? 'Weak' : 
                      passwordStrength < 4 ? 'Medium' : 'Strong'
                    }
                  </p>
                </div>
              )}
              
              {fieldErrors.password && (
                <p id="password-error" className="mt-2 text-sm text-red-400 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {fieldErrors.password}
                </p>
              )}
              
              {!fieldErrors.password && (
                <p id="password-help" className="mt-2 text-xs text-gray-400">
                  Must be at least 8 characters with uppercase letter and special character
                </p>
              )}
            </div>

            {/* Volunteer-specific fields */}
            {formData.userType === 'volunteer' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-4 bg-green-500/10 rounded-lg border border-green-500/30">
                <div>
                  <label htmlFor="contactNumber" className="text-white text-sm font-medium mb-2 block">
                    Contact Number <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <input
                      type="tel"
                      id="contactNumber"
                      name="contactNumber"
                      value={formData.contactNumber}
                      onChange={handleInputChange}
                      onBlur={() => validateField('contactNumber', formData.contactNumber)}
                      className={`w-full pl-10 pr-4 py-3 bg-gray-700 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 transition-colors ${
                        fieldErrors.contactNumber 
                          ? 'border-red-500 focus:ring-red-500' 
                          : 'border-gray-600 focus:ring-green-500 focus:border-transparent'
                      }`}
                      placeholder="Enter your mobile number"
                      aria-invalid={!!fieldErrors.contactNumber}
                      aria-describedby={fieldErrors.contactNumber ? 'contactNumber-error' : undefined}
                      required
                    />
                  </div>
                  {fieldErrors.contactNumber && (
                    <p id="contactNumber-error" className="mt-2 text-sm text-red-400 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {fieldErrors.contactNumber}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="location" className="text-white text-sm font-medium mb-2 block">
                    Location <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <select
                      id="location"
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      onBlur={() => validateField('location', formData.location)}
                      className={`w-full pl-10 pr-4 py-3 bg-gray-700 border rounded-lg text-white focus:outline-none focus:ring-2 transition-colors ${
                        fieldErrors.location 
                          ? 'border-red-500 focus:ring-red-500' 
                          : 'border-gray-600 focus:ring-green-500 focus:border-transparent'
                      }`}
                      aria-invalid={!!fieldErrors.location}
                      aria-describedby={fieldErrors.location ? 'location-error' : undefined}
                      required
                    >
                      {cities.map((city) => (
                        <option key={city} value={city}>
                          {city.charAt(0).toUpperCase() + city.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                  {fieldErrors.location && (
                    <p id="location-error" className="mt-2 text-sm text-red-400 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {fieldErrors.location}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="education" className="text-white text-sm font-medium mb-2 block">
                    Education <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <GraduationCap className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <select
                      id="education"
                      name="education"
                      value={formData.education}
                      onChange={handleInputChange}
                      onBlur={() => validateField('education', formData.education)}
                      className={`w-full pl-10 pr-4 py-3 bg-gray-700 border rounded-lg text-white focus:outline-none focus:ring-2 transition-colors ${
                        fieldErrors.education 
                          ? 'border-red-500 focus:ring-red-500' 
                          : 'border-gray-600 focus:ring-green-500 focus:border-transparent'
                      }`}
                      aria-invalid={!!fieldErrors.education}
                      aria-describedby={fieldErrors.education ? 'education-error' : undefined}
                      required
                    >
                      {educationLevels.map((level) => (
                        <option key={level} value={level}>
                          {level}
                        </option>
                      ))}
                    </select>
                  </div>
                  {fieldErrors.education && (
                    <p id="education-error" className="mt-2 text-sm text-red-400 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {fieldErrors.education}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Terms of Service */}
            <div>
              <label className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="acceptTerms"
                  checked={formData.acceptTerms}
                  onChange={handleInputChange}
                  className="mt-1 h-4 w-4 text-green-600 focus:ring-green-500 border-gray-600 rounded bg-gray-700"
                  aria-describedby={fieldErrors.acceptTerms ? 'terms-error' : undefined}
                  required
                />
                <span className="text-sm text-gray-300">
                  I agree to the{' '}
                  <Link to="/terms" className="text-green-400 hover:text-green-300 underline">
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link to="/privacy" className="text-green-400 hover:text-green-300 underline">
                    Privacy Policy
                  </Link>
                  <span className="text-red-400 ml-1">*</span>
                </span>
              </label>
              {fieldErrors.acceptTerms && (
                <p id="terms-error" className="mt-2 text-sm text-red-400 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {fieldErrors.acceptTerms}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-800 disabled:cursor-not-allowed text-white py-3 rounded-lg font-semibold transition-colors flex items-center justify-center"
              aria-describedby="submit-help"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                  Creating Account...
                </>
              ) : (
                <>
                  <CheckCircle className="h-5 w-5 mr-2" />
                  Create Account
                </>
              )}
            </button>
            
            <p id="submit-help" className="text-xs text-gray-400 text-center">
              By creating an account, you'll be able to access our community support platform
            </p>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-400">
              Already have an account?{' '}
              <Link to="/login" className="text-green-400 hover:text-green-300 font-medium">
                Sign in here
              </Link>
            </p>
          </div>
        </div>

        <div className="text-center">
          <p className="text-white text-sm italic">
            "Your donation gave Ravi his first proper meal in days"
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;