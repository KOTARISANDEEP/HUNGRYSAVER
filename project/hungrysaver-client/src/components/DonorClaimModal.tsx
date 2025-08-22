import React, { useState } from 'react';
import { X, MapPin, FileText, Gift } from 'lucide-react';
import { CommunityRequest } from '../types/formTypes';

interface DonorClaimModalProps {
  request: CommunityRequest;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (donorAddress: string, notes: string) => Promise<void>;
}

const DonorClaimModal: React.FC<DonorClaimModalProps> = ({ request, isOpen, onClose, onSubmit }) => {
  const [donorAddress, setDonorAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!donorAddress.trim()) {
      alert('Please provide your address');
      return;
    }

    setLoading(true);
    try {
      await onSubmit(donorAddress.trim(), notes.trim());
      // Reset form and close modal on success
      setDonorAddress('');
      setNotes('');
      onClose();
    } catch (error) {
      console.error('Error claiming request:', error);
      alert('Failed to claim request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-2xl w-full max-w-md mx-auto border border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-[#eaa640]/20 rounded-lg">
              <Gift className="h-6 w-6 text-[#eaa640]" />
            </div>
            <h3 className="text-xl font-semibold text-white">Claim Request</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Request Info */}
          <div className="bg-gray-700/30 rounded-lg p-4">
            <h4 className="text-white font-medium mb-3">Request Details</h4>
            <div className="space-y-2 text-sm text-gray-300">
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-[#eaa640]" />
                <span>{request.address}</span>
              </div>
              <div className="flex items-center space-x-2">
                <FileText className="h-4 w-4 text-[#eaa640]" />
                <span>{request.description}</span>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="donorAddress" className="block text-sm font-medium text-white mb-2">
                Your Address <span className="text-red-400">*</span>
              </label>
              <textarea
                id="donorAddress"
                value={donorAddress}
                onChange={(e) => setDonorAddress(e.target.value)}
                placeholder="Enter your full address for pickup..."
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-[#eaa640] focus:outline-none transition-colors"
                rows={3}
                required
              />
            </div>

            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-white mb-2">
                Additional Notes (Optional)
              </label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any additional information or special instructions..."
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-[#eaa640] focus:outline-none transition-colors"
                rows={2}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-3 bg-gray-600 hover:bg-gray-700 rounded-lg text-white font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !donorAddress.trim()}
                className="flex-1 px-4 py-3 bg-[#eaa640] hover:bg-[#eaa640]/80 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-black font-medium transition-colors"
              >
                {loading ? 'Claiming...' : 'Claim Request'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default DonorClaimModal;
