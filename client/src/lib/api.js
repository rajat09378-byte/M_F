import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 120000,
});

// Request interceptor
api.interceptors.request.use(
  (config) => config,
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message = error.response?.data?.error || error.message || 'An error occurred';
    return Promise.reject(new Error(message));
  }
);

export const uploadFile = (file, onProgress) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: onProgress,
  });
};

export const uploadText = (text) => 
  api.post('/upload/text', { text });

export const sendChatMessage = (sessionId, message) =>
  api.post(`/chat/${sessionId}`, { message });

export const getChatHistory = (sessionId) =>
  api.get(`/chat/${sessionId}/history`);

export const getSession = (sessionId) =>
  api.get(`/session/${sessionId}`);

export const getSessions = () =>
  api.get('/session');

export const checkHealth = () =>
  api.get('/health');

export default api;
