import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const classifyMaterial = (data) => api.post('/classify', data);
export const simulateHysteresis = (data) => api.post('/hysteresis', data);
export const computeProperties = (data) => api.post('/properties', data);
export const uploadDataCSV = (formData) => api.post('/upload', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});
export const getTemperatureCurves = (data) => api.post('/temperature', data);
export const getFrequencyLosses = (data) => api.post('/frequency', data);
export const compareMaterials = (data) => api.post('/compare', data);
export const getPresetMaterials = () => api.get('/materials');
export const getModelMetrics = () => api.get('/model/metrics');
export const getQuizData = () => api.get('/learning/quiz');
export const generateReport = (data) => api.post('/report', data, { responseType: 'blob' });
export const getHistory = () => api.get('/history');

export default api;
