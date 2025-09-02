import React, { useState } from 'react';
import { X, Send } from 'lucide-react';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (feedback: string) => void;
  loading?: boolean;
  taskName?: string;
}

const FeedbackModal: React.FC<FeedbackModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  loading = false,
  taskName = 'this task'
}) => {
  const [feedback, setFeedback] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (feedback.trim()) {
      onSubmit(feedback.trim());
    }
  };

  const handleClose = () => {
    if (!loading) {
      setFeedback('');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-xl border border-[#eaa640]/30 max-w-md w-full p-6 transform transition-all duration-300 scale-100">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">📝 Task Feedback</h2>
          <button
            onClick={handleClose}
            disabled={loading}
            className="text-gray-400 hover:text-white transition-colors disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="mb-6">
          <p className="text-gray-300 mb-4">
            Please provide feedback about your experience with <span className="text-[#eaa640] font-medium">{taskName}</span>. 
            This will help improve our service and will be shared with the donor.
          </p>
          
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="feedback" className="block text-sm font-medium text-gray-300 mb-2">
                Your Feedback *
              </label>
              <textarea
                id="feedback"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Share your experience, any challenges faced, or how the delivery went..."
                className="w-full h-32 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-[#eaa640] focus:ring-1 focus:ring-[#eaa640] transition-colors resize-none"
                required
                disabled={loading}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="flex-1 py-2 px-4 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !feedback.trim()}
                className="flex-1 py-2 px-4 bg-gradient-to-r from-[#eaa640] to-[#ecae53] hover:from-[#ecae53] hover:to-[#eeb766] text-black rounded-lg font-medium transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black"></div>
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    <span>Submit Feedback</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Footer Note */}
        <div className="text-xs text-gray-500 text-center">
          <p>💡 Your feedback helps us improve and will be visible to the donor</p>
        </div>
      </div>
    </div>
  );
};

export default FeedbackModal;
