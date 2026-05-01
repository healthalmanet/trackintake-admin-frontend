// Dynamic API Base URL Configuration
// Automatically detects environment and returns correct API URL

const getApiBaseUrl = () => {
  // On Render production
  if (window.location.hostname.includes('onrender.com')) {
    return 'https://trackintake-admin-backend.onrender.com';
  }
  
  // On localhost development - use localhost to match frontend origin
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:8000';
  }
  
  // Fallback to environment variable
  return import.meta.env.VITE_API_BASE_URL || '';
};

export const API_BASE_URL = getApiBaseUrl();
