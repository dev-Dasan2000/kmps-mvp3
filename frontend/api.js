// utils/api.js
import axios from 'axios';
import { toast } from 'sonner';

export const createAPIClient = ({ accessToken, setAccessToken, setUser }) => {
  const backendURL = process.env.NEXT_PUBLIC_BACKEND_URL;

  const api = axios.create({
    baseURL: backendURL,
    withCredentials: true,
  });

  // Attach access token to every request
  api.interceptors.request.use(
    (config) => {
      if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  // Handle 401 and 403 token refresh
  api.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;

      const isTokenExpired403 =
        error.response?.status === 403 &&
        (error.response?.data === 'Invalid token' || error.response?.data?.error === 'Invalid token');

      if (
        (error.response?.status === 401 || isTokenExpired403) &&
        !originalRequest._retry
      ) {
        originalRequest._retry = true;
        try {
          const res = await axios.get(`${backendURL}/auth/refresh_token`, {
            withCredentials: true,
          });

          const newToken = res.data.accessToken;
          setAccessToken(newToken);
          originalRequest.headers.Authorization = `Bearer ${newToken}`;

          return api(originalRequest);
        } catch (refreshError) {
          console.error('Refresh token failed:', refreshError);
          toast.error('Session expired. Please log in again.');

          try {
            await axios.post(`${backendURL}/auth/delete_token`, {}, { withCredentials: true });
          } catch (logoutError) {
            console.error('Token cleanup failed:', logoutError);
          }

          setAccessToken('');
          setUser(null);

          if (typeof window !== 'undefined') {
            window.location.href = '/';
          }

          return Promise.reject(refreshError);
        }
      }

      if (error.response?.status === 403 && !isTokenExpired403) {
        toast.error('You do not have permission to perform this action.');
      }

      return Promise.reject(error);
    }
  );

  return api;
};
