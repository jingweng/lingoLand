import axios from 'axios';

/**
 * FINAL SYNC:
 * We are removing the "/api" from the end of the URL 
 * to match the "No-Prefix" version of server.py.
 */
const api = axios.create({
  baseURL: "http://127.0.0.1:8000",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;