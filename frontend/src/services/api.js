import axios from 'axios';

let API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
if (API_BASE_URL && !API_BASE_URL.endsWith('/api')) {
  // Prevent double slashes when appending
  API_BASE_URL = API_BASE_URL.replace(/\/$/, '') + '/api';
}

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 8000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Attach JWT token if stored
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
