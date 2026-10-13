import axios from 'axios';

const apiBaseURL = import.meta.env.VITE_API_URL
  || (import.meta.env.DEV
    ? '/api/v1'
    : 'https://salesai-backend-8mgi.onrender.com/api/v1');

const api = axios.create({
  baseURL: apiBaseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('marketmind_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('marketmind_token');
      localStorage.removeItem('marketmind_user');
      if (window.location.pathname.startsWith('/app')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
