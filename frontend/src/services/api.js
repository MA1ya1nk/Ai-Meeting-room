import axios from 'axios';

const BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({ baseURL: BASE, timeout: 60000 });

api.interceptors.response.use(
  r => r,
  e => Promise.reject(new Error(e.response?.data?.error || e.message || 'Something went wrong'))
);

export const meetingsAPI = {
  create: d => api.post('/meetings/create', d),
  process: id => api.post('/meetings/process', { meeting_id: id }),
  getAll: (search = '') => api.get('/meetings' + (search ? `?search=${encodeURIComponent(search)}` : '')),
  getOne: id => api.get(`/meetings/${id}`),
};

export const actionsAPI = {
  getAll: (f = {}) => {
    const p = new URLSearchParams();
    Object.entries(f).forEach(([k, v]) => v && p.set(k, v));
    const qs = p.toString();
    return api.get('/actions' + (qs ? `?${qs}` : ''));
  },
  update: (id, d) => api.patch(`/actions/${id}`, d),
  delete: id => api.delete(`/actions/${id}`),
};