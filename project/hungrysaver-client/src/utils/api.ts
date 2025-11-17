const DEFAULT_API_BASE = 'https://hungrysaver.onrender.com';

export const getApiBaseUrl = () => {
  const base = import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE;
  return base.replace(/\/$/, '');
};

export const buildApiUrl = (path: string) => `${getApiBaseUrl()}${path}`;

export default {
  getApiBaseUrl,
  buildApiUrl
};

