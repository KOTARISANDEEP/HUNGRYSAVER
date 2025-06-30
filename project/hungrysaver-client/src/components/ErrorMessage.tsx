import React from 'react';
import { AlertCircle } from 'lucide-react';

interface ErrorMessageProps {
  error: string | null;
  className?: string;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ error, className = '' }) => {
  if (!error) return null;

  return (
    <div className={`bg-red-500/20 border border-red-500 text-red-200 px-4 py-3 rounded-lg flex items-center space-x-2 ${className}`}>
      <AlertCircle className="h-5 w-5 flex-shrink-0" />
      <span className="text-sm">{error}</span>
    </div>
  );
};

export default ErrorMessage;