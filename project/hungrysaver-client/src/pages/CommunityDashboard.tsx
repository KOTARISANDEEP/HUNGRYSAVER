import React, { useState } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { Heart, BookOpen, Shield, Home, Zap, Building, MapPin, User, Phone } from 'lucide-react';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';

const CommunityDashboard: React.FC = () => {
  const [selectedInitiative, setSelectedInitiative] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { userData } = useAuth();

  const [formData, setFormData] = useState({
    location: '',
    address: '',
    contactName: '',
    contactPhone: '',
    description: '',
    urgency: 'normal',
    // Initiative-specific fields
    childName: '',
    childAge: '',
    educationalNeeds: '',
    emergencyType: '',
    donationAmount: '',
    shelterType: ''
  });

  const cities = [
    'vijayawada', 'guntur', 'visakhapatnam', 'tirupati', 'kakinada',
    'nellore', 'kurnool', 'rajahmundry', 'kadapa', 'anantapur'
  ];

  const initiatives = [
    // TEMPORARY: Hidden for pilot launch - only showing reusable clothes (PunarAsha)
    // {
    //   id: 'annamitra seva',
    //   icon: Heart,
    //   title: "🍛 Annamitra Seva",
    //   description: "Request food assistance for families in need. We connect surplus food with hungry families in your community.",
    //   fields: []
    // },
    // {
    //   id: 'vidya jyothi',
    //   icon: BookOpen,
    //   title: "📚 Vidya Jyothi",
    //   description: "Educational support for children including books, fees, uniforms, and school supplies.",
    //   fields: ['childName', 'childAge', 'educationalNeeds']
    // },
    // {
    //   id: 'suraksha setu',
    //   icon: Shield,
    //   title: "🛡️ Suraksha Setu",
    //   description: "Emergency support during crisis situations. Safety net for vulnerable community members.",
    //   fields: ['emergencyType']
    // },
    {
      id: 'punarasha',
      icon: Home,
      title: "🏠 PunarAsha",
      description: "Rehabilitation support to help families rebuild their lives with dignity and hope.",
      fields: []
    }
    // {
    //   id: 'raksha jyothi',
    //   icon: Zap,
    //   title: "⚡ Raksha Jyothi",
    //   description: "Emergency response for humans and animals during critical situations requiring immediate assistance.",
    //   fields: ['emergencyType']
    // },
    // {
    //   id: 'jyothi nilayam',
    //   icon: Building,
    //   title: "🏛️ Jyothi Nilayam",
    //   description: "Support for shelters caring for humans and animals in need of safe sanctuary.",
    //   fields: ['donationAmount', 'shelterType']
    // }
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleInitiativeSelect = (initiativeId: string) => {
    setSelectedInitiative(initiativeId);
    setShowForm(true);
    // Reset form data when switching initiatives
    setFormData({
      location: '',
      address: '',
      contactName: '',
      contactPhone: '',
      description: '',
      urgency: 'normal',
      childName: '',
      childAge: '',
      educationalNeeds: '',
      emergencyType: '',
      donationAmount: '',
      shelterType: ''
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const taskData = {
        initiative: selectedInitiative,
        location: formData.location,
        location_lowercase: formData.location.toLowerCase(),
        address: formData.address,
        donorName: formData.contactName,
        donorContact: formData.contactPhone,
        description: formData.description,
        urgency: formData.urgency,
        status: 'pending',
        createdAt: new Date(),
        submittedBy: userData?.uid,
        // Add initiative-specific fields
        ...(formData.childName && { childName: formData.childName }),
        ...(formData.childAge && { childAge: formData.childAge }),
        ...(formData.educationalNeeds && { educationalNeeds: formData.educationalNeeds }),
        ...(formData.emergencyType && { emergencyType: formData.emergencyType }),
        ...(formData.donationAmount && { donationAmount: formData.donationAmount }),
        ...(formData.shelterType && { shelterType: formData.shelterType })
      };

      await addDoc(collection(db, 'tasks'), taskData);
      setSuccess(true);
      
      // Reset form after 3 seconds
      setTimeout(() => {
        setSuccess(false);
        setShowForm(false);
        setSelectedInitiative('');
      }, 3000);

    } catch (error) {
      console.error('Error submitting request:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectedInitiativeData = initiatives.find(init => init.id === selectedInitiative);

  if (success) {
    return (
      <div className="min-h-screen bg-gray-900 pt-20 flex items-center justify-center">
        <div className="bg-gray-800 rounded-xl p-8 text-center max-w-md mx-4">
          <div className="bg-green-500 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <Heart className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Request Submitted!</h2>
          <p className="text-gray-300 mb-4">
            Your request has been submitted successfully. Volunteers in {formData.location} will be notified and will reach out to you soon.
          </p>
          <div className="bg-green-500/20 border border-green-500 rounded-lg p-3">
            <p className="text-green-400 text-sm">
              Expected response time: 2-6 hours
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (showForm && selectedInitiativeData) {
    return (
      <div className="min-h-screen bg-gray-900 pt-20 pb-12">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gray-800 rounded-xl p-8">
            <div className="text-center mb-8">
              <div className="text-4xl mb-4">{selectedInitiativeData.title.split(' ')[0]}</div>
              <h2 className="text-2xl font-bold text-white mb-2">
                {selectedInitiativeData.title.slice(2)}
              </h2>
              <p className="text-gray-300">{selectedInitiativeData.description}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Location and Address */}
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
                      <option value="">Select your city</option>
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
                    <option value="normal">Normal</option>
                    <option value="urgent">Urgent</option>
                    <option value="emergency">Emergency</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-white text-sm font-medium mb-2 block">
                  Specific Address <span className="text-red-400">*</span>
                </label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  className="w-full py-3 px-4 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                  rows={2}
                  placeholder="Enter complete address where volunteers should reach"
                  required
                />
              </div>

              {/* Contact Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-white text-sm font-medium mb-2 block">
                    Contact Name <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <input
                      type="text"
                      name="contactName"
                      value={formData.contactName}
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
                      name="contactPhone"
                      value={formData.contactPhone}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Your phone number"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Initiative-specific fields */}
              {selectedInitiativeData.fields.includes('childName') && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-white text-sm font-medium mb-2 block">
                      Child's Name
                    </label>
                    <input
                      type="text"
                      name="childName"
                      value={formData.childName}
                      onChange={handleInputChange}
                      className="w-full py-3 px-4 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Enter child's name"
                    />
                  </div>
                  <div>
                    <label className="text-white text-sm font-medium mb-2 block">
                      Child's Age
                    </label>
                    <input
                      type="number"
                      name="childAge"
                      value={formData.childAge}
                      onChange={handleInputChange}
                      className="w-full py-3 px-4 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Age in years"
                    />
                  </div>
                </div>
              )}

              {selectedInitiativeData.fields.includes('educationalNeeds') && (
                <div>
                  <label className="text-white text-sm font-medium mb-2 block">
                    Educational Needs
                  </label>
                  <textarea
                    name="educationalNeeds"
                    value={formData.educationalNeeds}
                    onChange={handleInputChange}
                    className="w-full py-3 px-4 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                    rows={2}
                    placeholder="Specify needs: books, fees, uniform, etc."
                  />
                </div>
              )}

              {selectedInitiativeData.fields.includes('emergencyType') && (
                <div>
                  <label className="text-white text-sm font-medium mb-2 block">
                    Emergency Type
                  </label>
                  <select
                    name="emergencyType"
                    value={formData.emergencyType}
                    onChange={handleInputChange}
                    className="w-full py-3 px-4 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Select emergency type</option>
                    <option value="human">Human Emergency</option>
                    <option value="animal">Animal Emergency</option>
                    <option value="both">Both Human & Animal</option>
                  </select>
                </div>
              )}

              {selectedInitiativeData.fields.includes('donationAmount') && (
                <div>
                  <label className="text-white text-sm font-medium mb-2 block">
                    Requested Donation Amount
                  </label>
                  <input
                    type="text"
                    name="donationAmount"
                    value={formData.donationAmount}
                    onChange={handleInputChange}
                    className="w-full py-3 px-4 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Amount needed (e.g., ₹5000)"
                  />
                </div>
              )}

              {selectedInitiativeData.fields.includes('shelterType') && (
                <div>
                  <label className="text-white text-sm font-medium mb-2 block">
                    Shelter Type
                  </label>
                  <select
                    name="shelterType"
                    value={formData.shelterType}
                    onChange={handleInputChange}
                    className="w-full py-3 px-4 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Select shelter type</option>
                    <option value="human">Human Shelter</option>
                    <option value="animal">Animal Shelter</option>
                    <option value="both">Both Human & Animal</option>
                  </select>
                </div>
              )}

              {/* Description */}
              <div>
                <label className="text-white text-sm font-medium mb-2 block">
                  Detailed Description <span className="text-red-400">*</span>
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="w-full py-3 px-4 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                  rows={4}
                  placeholder="Provide detailed information about your request..."
                  required
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-3 rounded-lg font-semibold transition-colors"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-green-800 text-white py-3 rounded-lg font-semibold transition-colors flex items-center justify-center"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                  ) : (
                    'Submit Request'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 pt-20 pb-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            Community Support
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Select the initiative that best matches your needs. Our volunteers in your city will be notified and will reach out to help you.
          </p>
        </div>

        {/* Initiative Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {initiatives.map((initiative) => {
            const Icon = initiative.icon;
            return (
              <button
                key={initiative.id}
                onClick={() => handleInitiativeSelect(initiative.id)}
                className="bg-gray-800 rounded-xl p-6 text-left hover:shadow-2xl transition-all duration-300 transform hover:scale-105 hover:bg-gray-750 border border-gray-700 hover:border-green-500/50"
              >
                <div className="flex items-center space-x-3 mb-4">
                  <div className="bg-green-500 p-3 rounded-full">
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-2xl">{initiative.title.split(' ')[0]}</div>
                </div>
                
                <h3 className="text-xl font-bold text-white mb-3">
                  {initiative.title.slice(2)}
                </h3>
                
                <p className="text-gray-300 leading-relaxed mb-4">
                  {initiative.description}
                </p>
                
                <div className="flex items-center text-green-400 font-medium">
                  <span>Request Support</span>
                  <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            );
          })}
        </div>

        {/* Help Section */}
        <div className="mt-16 bg-gray-800 rounded-xl p-8 text-center">
          <h3 className="text-2xl font-bold text-white mb-4">How It Works</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="bg-green-500 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <span className="text-white font-bold text-xl">1</span>
              </div>
              <h4 className="text-lg font-semibold text-white mb-2">Select Initiative</h4>
              <p className="text-gray-300">Choose the type of support you need from our six community initiatives.</p>
            </div>
            
            <div>
              <div className="bg-green-500 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <span className="text-white font-bold text-xl">2</span>
              </div>
              <h4 className="text-lg font-semibold text-white mb-2">Fill Request Form</h4>
              <p className="text-gray-300">Provide details about your location, needs, and contact information.</p>
            </div>
            
            <div>
              <div className="bg-green-500 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <span className="text-white font-bold text-xl">3</span>
              </div>
              <h4 className="text-lg font-semibold text-white mb-2">Get Connected</h4>
              <p className="text-gray-300">Volunteers in your city will be notified and will reach out to assist you.</p>
            </div>
          </div>
          
          <div className="mt-8 bg-green-500/20 border border-green-500 rounded-lg p-4">
            <p className="text-green-400 font-medium">
              Average response time: 2-6 hours | Available 24/7 for emergencies
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommunityDashboard;