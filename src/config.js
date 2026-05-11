// Dynamic API Base URL Configuration
// Automatically detects environment and returns correct API URL

const getApiBaseUrl = () => {
  // Check for environment variable first (Vite)
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  if (envUrl) {
    return envUrl;
  }
  
  // On Render production
  if (window.location.hostname.includes('onrender.com')) {
    return 'https://trackintake-backend.onrender.com';
  }
  
  // On localhost development
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:8000';
  }
  
  // Fallback
  return 'http://localhost:8000';
};

export const API_BASE_URL = getApiBaseUrl();
