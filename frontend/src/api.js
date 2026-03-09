import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({ baseURL: API_URL });

// Attach token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auth
export const register = (data) => api.post('/auth/register', data);
export const login = (username, password) => {
  const formData = new URLSearchParams();
  formData.append('username', username);
  formData.append('password', password);
  return api.post('/auth/login', formData, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });
};
export const getProfile = () => api.get('/auth/profile');

// Upload
export const uploadEEG = (file) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post('/upload/analyze', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};
export const getSampleData = () => api.get('/upload/sample-data');

// History
export const getHistory = () => api.get('/history/');
export const getPredictionDetail = (id) => api.get(`/history/${id}`);

// Reports
export const getReport = (id) => api.get(`/reports/${id}`);
export const downloadReport = (id, format) =>
  api.get(`/reports/${id}/download/${format}`, { responseType: 'blob' });

// Feedback
export const submitFeedback = (data) => api.post('/feedback/', data);
export const getFeedback = (predictionId) => api.get(`/feedback/${predictionId}`);

export default api;
