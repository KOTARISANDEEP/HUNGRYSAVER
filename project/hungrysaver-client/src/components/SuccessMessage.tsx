import React from 'react';
import { CheckCircle, X } from 'lucide-react';

interface SuccessMessageProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  icon?: React.ReactNode;
  actionButton?: {
    text: string;
    onClick: () => void;
  };
}

const SuccessMessage: React.FC<SuccessMessageProps> = ({
  isOpen,
  onClose,
  title,
  message,
  icon,
  actionButton
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900/95 backdrop-blur-lg rounded-2xl p-8 text-center max-w-md mx-4 border border-[#eaa640]/30 shadow-2xl">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Success Icon */}
        <div className="bg-[#eaa640] p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
          {icon || <CheckCircle className="h-8 w-8 text-black" />}
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-white mb-2">{title}</h2>

        {/* Message */}
        <p className="text-gray-300 mb-6 leading-relaxed">
          {message}
        </p>

        {/* Action Button */}
        {actionButton && (
          <button
            onClick={actionButton.onClick}
            className="bg-[#eaa640] hover:bg-[#ecae53] text-black px-6 py-3 rounded-lg font-medium transition-colors w-full"
          >
            {actionButton.text}
          </button>
        )}

        {/* Close Button (if no action button) */}
        {!actionButton && (
          <button
            onClick={onClose}
            className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-medium transition-colors w-full"
          >
            Close
          </button>
        )}
      </div>
    </div>
  );
};

export default SuccessMessage;
