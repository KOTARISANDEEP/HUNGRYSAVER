import React, { useEffect, useRef, useState } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { validateImageFile, formatFileSize } from '../services/imageUploadService';

interface ImageUploadSectionProps {
  label?: string;
  maxImages?: number;
  disabled?: boolean;
  value: File[];
  onChange: (files: File[]) => void;
}

const ImageUploadSection: React.FC<ImageUploadSectionProps> = ({
  label = 'Upload relevant images (max 3)',
  maxImages = 3,
  disabled = false,
  value,
  onChange
}) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [error, setError] = useState<string>('');
  const [previews, setPreviews] = useState<string[]>([]);

  useEffect(() => {
    const urls = value.map((file) => URL.createObjectURL(file));
    setPreviews(urls);
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [value]);

  const handleFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const current = [...value];
    for (const file of files) {
      if (current.length >= maxImages) break;
      if (!validateImageFile(file)) {
        setError('Please select valid images (JPEG, PNG, GIF, WebP) under 32MB.');
        continue;
      }
      current.push(file);
    }
    onChange(current);
    setError('');
    if (inputRef.current) inputRef.current.value = '';
  };

  const removeAtIndex = (idx: number) => {
    const next = value.filter((_, i) => i !== idx);
    onChange(next);
  };

  return (
    <div>
      <label className="text-white text-sm font-medium mb-2 block">{label}</label>
      <div className="space-y-3">
        <div className="relative">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFilesSelected}
            className="hidden"
            id="images-upload-input"
            disabled={disabled || value.length >= maxImages}
          />
          <label
            htmlFor="images-upload-input"
            className={`flex items-center justify-center w-full p-4 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
              disabled || value.length >= maxImages
                ? 'border-gray-500 bg-gray-700 cursor-not-allowed'
                : 'border-gray-400 bg-gray-700 hover:border-[#eaa640] hover:bg-gray-600'
            }`}
          >
            <div className="text-center">
              <Upload className="h-8 w-8 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-200 text-sm">
                {disabled ? 'Uploading...' : value.length >= maxImages ? 'Maximum images added' : 'Click to select images'}
              </p>
              <p className="text-gray-400 text-xs mt-1">JPEG, PNG, GIF, WebP (max 32MB)</p>
            </div>
          </label>
        </div>

        {error && <p className="text-red-400 text-xs">{error}</p>}

        {value.length > 0 && (
          <div className="flex flex-wrap gap-3">
            {value.map((file, idx) => (
              <div key={idx} className="relative">
                <div className="relative inline-block">
                  <img
                    src={previews[idx]}
                    alt={`Selected ${idx + 1}`}
                    className="w-24 h-24 object-cover rounded-lg border border-gray-600"
                  />
                  <button
                    type="button"
                    onClick={() => removeAtIndex(idx)}
                    className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 transition-colors"
                    disabled={disabled}
                    aria-label="Remove image"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
                <p className="text-gray-400 text-[10px] mt-1 w-24 truncate" title={file.name}>
                  <span className="inline-flex items-center gap-1"><ImageIcon className="h-3 w-3" />{file.name}</span>
                </p>
                <p className="text-gray-500 text-[10px]">{formatFileSize(file.size)}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageUploadSection;


