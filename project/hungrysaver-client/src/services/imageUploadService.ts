// Image upload service using ImgBB API
const IMGBB_API_KEY = '2790626512f8556a4df151f5c0a4acc0';
const IMGBB_API_URL = 'https://api.imgbb.com/1/upload';

export interface ImgBBResponse {
  success: boolean;
  data?: {
    url: string;
    display_url: string;
    delete_url: string;
    title: string;
    time: string;
    image: {
      filename: string;
      name: string;
      mime: string;
      extension: string;
      url: string;
      size: number;
    };
  };
  error?: {
    message: string;
    code: number;
  };
}

/**
 * Upload image to ImgBB and return the image URL
 * @param file - The file to upload
 * @returns Promise<string> - The uploaded image URL
 */
export const uploadImageToImgBB = async (file: File): Promise<string> => {
  try {
    console.log('🖼️ Uploading image to ImgBB:', file.name, file.size);
    
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      throw new Error('Invalid file type. Please upload JPEG, PNG, GIF, or WebP images only.');
    }
    
    // Validate file size (max 32MB for ImgBB)
    const maxSize = 32 * 1024 * 1024; // 32MB
    if (file.size > maxSize) {
      throw new Error('File size too large. Please upload images smaller than 32MB.');
    }
    
    // Create FormData
    const formData = new FormData();
    formData.append('image', file);
    
    // Upload to ImgBB
    const response = await fetch(`${IMGBB_API_URL}?key=${IMGBB_API_KEY}`, {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
    }
    
    const result: ImgBBResponse = await response.json();
    
    if (!result.success || !result.data?.url) {
      throw new Error(result.error?.message || 'Upload failed. Please try again.');
    }
    
    console.log('✅ Image uploaded successfully:', result.data.url);
    return result.data.url;
    
  } catch (error) {
    console.error('❌ Error uploading image:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to upload image. Please try again.');
  }
};

/**
 * Validate image file before upload
 * @param file - The file to validate
 * @returns boolean - Whether the file is valid
 */
export const validateImageFile = (file: File): boolean => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  const maxSize = 32 * 1024 * 1024; // 32MB
  
  if (!allowedTypes.includes(file.type)) {
    return false;
  }
  
  if (file.size > maxSize) {
    return false;
  }
  
  return true;
};

/**
 * Get file size in human readable format
 * @param bytes - File size in bytes
 * @returns string - Human readable file size
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};
