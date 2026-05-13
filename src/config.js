// Dynamic API Base URL Configuration
// Automatically detects environment and returns correct API URL

const getApiBaseUrl = () => {
  // On Render production - FIXED: Use correct service name
  if (window.location.hostname.includes('onrender.com')) {
    return 'https://trackintake-backend.onrender.com';  // ✅ FIXED: was trackintake-admin-backend
  }
  
  // On localhost development - use localhost to match frontend origin
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:8000';
  }
  
  // Fallback to environment variable
  return import.meta.env.VITE_API_BASE_URL || 'https://trackintake-backend.onrender.com';
};

export const API_BASE_URL = getApiBaseUrl();

// Debug logging
if (typeof window !== 'undefined') {
  console.log('[Config] API_BASE_URL:', API_BASE_URL);
  console.log('[Config] Hostname:', window.location.hostname);
}
