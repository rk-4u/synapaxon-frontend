// src/api/axiosConfig.js - Optional setup file
import axios from 'axios';

// Base URL setup - adjust as needed
axios.defaults.baseURL = 'https://synapaxon-backend.onrender.com';

// Request interceptor - automatically add token
axios.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle common errors
axios.interceptors.response.use(
  response => response,
  error => {
    // Handle 401 Unauthorized - redirect to login
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default axios;