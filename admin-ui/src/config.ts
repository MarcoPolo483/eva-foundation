/**
 * EVA Foundation 2.0 - Configuration
 * Simplified configuration for admin dashboard
 */

// API Configuration
export const apiConfig = {
  functionsBaseUrl: process.env.REACT_APP_FUNCTIONS_BASE_URL || 'https://eva-foundation-func.azurewebsites.net/api'
};

// Environment Configuration
export const envConfig = {
  environment: process.env.NODE_ENV || 'development',
  version: '2.0.0',
  buildNumber: process.env.REACT_APP_BUILD_NUMBER || 'dev',
};
