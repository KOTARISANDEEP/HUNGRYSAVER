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

/**
 * Compress image before upload to reduce file size and improve upload speed
 * @param file - The file to compress
 * @param maxWidth - Maximum width in pixels (default: 1920)
 * @param maxHeight - Maximum height in pixels (default: 1920)
 * @param quality - JPEG quality 0-1 (default: 0.8)
 * @returns Promise<File> - Compressed file
 */
export const compressImage = async (
  file: File,
  maxWidth: number = 1920,
  maxHeight: number = 1920,
  quality: number = 0.8
): Promise<File> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Calculate new dimensions
        let width = img.width;
        let height = img.height;
        
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }
        
        // Create canvas
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to create canvas context'));
          return;
        }
        
        // Draw image
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convert to blob
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              reject(new Error('Failed to compress image'));
            }
          },
          file.type,
          quality
        );
      };
      img.onerror = reject;
      img.src = event.target?.result as string;
    };
    reader.onerror = reject;
  });
};

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
    
    // Compress image to reduce upload time
    let fileToUpload = file;
    if (file.size > 500 * 1024) { // Compress if larger than 500KB
      console.log('📦 Compressing image to reduce upload time...');
      fileToUpload = await compressImage(file);
      console.log(`✅ Compressed: ${formatFileSize(file.size)} → ${formatFileSize(fileToUpload.size)}`);
    }
    
    // Create FormData
    const formData = new FormData();
    formData.append('image', fileToUpload);
    
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
 * Upload multiple images to ImgBB in parallel and return their URLs
 */
export const uploadImagesToImgBB = async (files: File[]): Promise<string[]> => {
  const uploads = files.map(async (file) => await uploadImageToImgBB(file));
  return Promise.all(uploads);
};

/**
 * Upload multiple images but cap total wait time. If timeout reached,
 * return whatever finished (or empty) so the caller can continue.
 */
export const uploadImagesWithTimeout = async (
  files: File[],
  timeoutMs: number = 3000
): Promise<string[]> => {
  if (files.length === 0) return [];
  try {
    const uploadPromise = uploadImagesToImgBB(files);
    const timeoutPromise = new Promise<string[]>((resolve) => setTimeout(() => resolve([]), timeoutMs));
    const result = await Promise.race([uploadPromise, timeoutPromise]);
    return result as string[];
  } catch {
    return [];
  }
};