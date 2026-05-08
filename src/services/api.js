import axios from 'axios';
import toast from 'react-hot-toast';

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export const axiosInstance = axios.create({
  baseURL: BASE,
});

axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('audit_token');
  if (token && !config.url.includes('/auth/login') && !config.url.includes('/auth/send-verification')) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 400 || error.response?.status === 500 || error.response?.status === 401 || error.response?.status === 422) {
       let msg = error.response?.data?.detail || 'An error occurred';
       if (Array.isArray(msg)) {
         msg = msg.map(m => `${m.loc[m.loc.length-1]}: ${m.msg}`).join(', ');
       }
       toast.error(msg);
    }
    return Promise.reject(error);
  }
);

export const api = {
  login: async (email, password) => {
    const { data } = await axiosInstance.post('/auth/login', { email, password });
    return data;
  },
  sendVerification: async (data) => {
    const { data: res } = await axiosInstance.post('/auth/send-verification', data, {
      headers: { 'Content-Type': 'application/json' }
    });
    return res;
  },
  completeRegistration: async (requestData) => {
    const { data } = await axiosInstance.post(`/auth/complete-registration`, requestData, {
      headers: { 'Content-Type': 'application/json' }
    });
    return data;
  },
  getUsers: async () => {
    const { data } = await axiosInstance.get('/users');
    return data;
  },
  logout: async () => {
    return Promise.resolve();
  },
  getEProceedings: async (tab = 'action') => [],
  getNotices: async () => [],
  getStaffList: async () => [],
  getGlobalAudit: async () => [],
};

export default api;
