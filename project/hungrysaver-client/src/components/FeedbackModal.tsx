import React, { useState } from 'react';
import { X, Send, Upload, Image } from 'lucide-react';
import { uploadImageToImgBB, validateImageFile, formatFileSize } from '../services/imageUploadService';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (feedback: string, imageUrl?: string) => void;
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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState('');

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!validateImageFile(file)) {
      setError('Please select a valid image file (JPEG, PNG, GIF, WebP) smaller than 32MB.');
      return;
    }

    setSelectedFile(file);
    setError('');

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setSelectedFile(null);
    setImagePreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedback.trim()) return;

    try {
      let imageUrl: string | undefined;
      
      // Upload image if selected
      if (selectedFile) {
        setUploadingImage(true);
        // Enforce a 3s max duration for image upload; continue without image if it takes longer
        const uploadPromise = uploadImageToImgBB(selectedFile);
        const timeoutPromise = new Promise<undefined>((resolve) => setTimeout(() => resolve(undefined), 3000));
        imageUrl = await Promise.race([uploadPromise as unknown as Promise<string>, timeoutPromise]);
        if (!imageUrl) {
          setError('Image upload timed out. Submitting without the image.');
        }
      }

      onSubmit(feedback.trim(), imageUrl);
    } catch (error) {
      console.error('Error uploading image:', error);
      setError(error instanceof Error ? error.message : 'Failed to upload image. Please try again.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleClose = () => {
    if (!loading && !uploadingImage) {
      setFeedback('');
      setSelectedFile(null);
      setImagePreview(null);
      setError('');
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

            {/* Image Upload Section */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Proof of Donation Image (Optional)
              </label>
              <div className="space-y-3">
                {/* File Input */}
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="proof-image-upload"
                    disabled={loading || uploadingImage}
                  />
                  <label
                    htmlFor="proof-image-upload"
                    className={`flex items-center justify-center w-full p-3 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                      loading || uploadingImage
                        ? 'border-gray-500 bg-gray-800 cursor-not-allowed'
                        : 'border-gray-600 bg-gray-800 hover:border-[#eaa640] hover:bg-gray-700'
                    }`}
                  >
                    <div className="text-center">
                      <Upload className="h-6 w-6 text-gray-400 mx-auto mb-1" />
                      <p className="text-gray-300 text-sm">
                        {uploadingImage ? 'Uploading...' : 'Upload proof image (happy faces)'}
                      </p>
                      <p className="text-gray-400 text-xs mt-1">
                        JPEG, PNG, GIF, WebP (max 32MB)
                      </p>
                    </div>
                  </label>
                </div>

                {/* Image Preview */}
                {imagePreview && (
                  <div className="relative">
                    <div className="relative inline-block">
                      <img
                        src={imagePreview}
                        alt="Proof preview"
                        className="w-24 h-24 object-cover rounded-lg border border-gray-600"
                      />
                      <button
                        type="button"
                        onClick={removeImage}
                        className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 transition-colors"
                        disabled={loading || uploadingImage}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                    {selectedFile && (
                      <p className="text-gray-400 text-xs mt-1">
                        {selectedFile.name} ({formatFileSize(selectedFile.size)})
                      </p>
                    )}
                  </div>
                )}

                {/* Error Message */}
                {error && (
                  <p className="text-red-400 text-xs">{error}</p>
                )}
              </div>
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
                disabled={loading || !feedback.trim() || uploadingImage}
                className="flex-1 py-2 px-4 bg-gradient-to-r from-[#eaa640] to-[#ecae53] hover:from-[#ecae53] hover:to-[#eeb766] text-black rounded-lg font-medium transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {loading || uploadingImage ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black"></div>
                    <span>{uploadingImage ? 'Uploading Image...' : 'Submitting...'}</span>
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
