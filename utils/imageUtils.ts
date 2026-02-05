
import { ShareData } from '../types.ts';

/**
 * Compresses an image to fit within URL limits (roughly targeting < 100kb for high compatibility)
 */
export const compressImage = (file: File, maxWidth = 800, quality = 0.6): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = (maxWidth / width) * height;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        
        // Use JPEG for better compression
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = reject;
    };
    reader.onerror = reject;
  });
};

/**
 * Encodes share data into a URL-safe hash string
 */
export const encodeShareLink = (data: ShareData): string => {
  const jsonStr = JSON.stringify(data);
  // Using btoa and making it URL safe
  return btoa(unescape(encodeURIComponent(jsonStr)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
};

/**
 * Decodes share data from a hash string
 */
export const decodeShareLink = (hash: string): ShareData | null => {
  try {
    // Reverse the URL-safe transformations
    const base64 = hash.replace(/-/g, '+').replace(/_/g, '/');
    const jsonStr = decodeURIComponent(escape(atob(base64)));
    return JSON.parse(jsonStr) as ShareData;
  } catch (e) {
    console.error("Failed to decode share link", e);
    return null;
  }
};

export const formatBytes = (bytes: number, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};
