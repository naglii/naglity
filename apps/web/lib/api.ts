import axios from 'axios';
import { clearAuth } from './auth';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true, // send httpOnly cookie with every request
});

api.interceptors.response.use(
  (r) => r,
  (error) => {
    const isLoginRequest = error.config?.url?.includes('/auth/login');
    if (error.response?.status === 401 && !isLoginRequest) {
      clearAuth();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

export default api;
