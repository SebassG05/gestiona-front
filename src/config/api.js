import axios from 'axios';
import { clearAuthSession, getAuthToken, redirectToLogin } from '../utils/session.js';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3016/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const hasStoredToken = Boolean(getAuthToken());

    if (error.response?.status === 401 && hasStoredToken) {
      clearAuthSession();
      redirectToLogin('expired');
    }

    return Promise.reject(error);
  }
);

export default api;
