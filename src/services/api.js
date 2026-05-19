import axios from 'axios';

const BASE_URL = "http://localhost:8000";

const instance = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Request interceptor to automatically add authorization header
instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Automatic retry mechanism: Retry once automatically if a request fails
instance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;
    // If config does not exist or already retried
    if (!config || config._isRetry) {
      return Promise.reject(error);
    }
    
    // Set the flag to prevent infinite loops
    config._isRetry = true;
    
    try {
      // Retry the exact request once
      return await instance(config);
    } catch (retryError) {
      return Promise.reject(retryError);
    }
  }
);

export const apiService = {
  get: async (url, config = {}) => {
    try {
      const response = await instance.get(url, config);
      return response.data;
    } catch (error) {
      console.error(`API GET error on ${url}:`, error);
      throw error;
    }
  },

  post: async (url, data, config = {}) => {
    try {
      const response = await instance.post(url, data, config);
      return response.data;
    } catch (error) {
      console.error(`API POST error on ${url}:`, error);
      throw error;
    }
  },

  put: async (url, data, config = {}) => {
    try {
      const response = await instance.put(url, data, config);
      return response.data;
    } catch (error) {
      console.error(`API PUT error on ${url}:`, error);
      throw error;
    }
  },

  download: async (url) => {
    try {
      // Support blob download or clean window.open depending on preference
      const downloadUrl = url.startsWith('http') ? url : `${BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
      window.open(downloadUrl, '_blank');
      return true;
    } catch (error) {
      console.error(`API download error on ${url}:`, error);
      throw error;
    }
  }
};

export default apiService;
