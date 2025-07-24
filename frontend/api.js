import axios from 'axios';
import { toast } from 'sonner';

export const createAPIClient = ({ accessToken, setAccessToken, setUser }) => {
  const backendURL = process.env.NEXT_PUBLIC_BACKEND_URL;

  // Mutable reference to always hold latest token
  const tokenRef = { current: accessToken };

  // Keep tokenRef updated when accessToken changes
  tokenRef.current = accessToken;

  const api = axios.create({
    baseURL: backendURL,
    withCredentials: true,
  });

  // Attach latest accessToken from ref to every request
  api.interceptors.request.use(
    (config) => {
      if (tokenRef.current) {
        config.headers.Authorization = `Bearer ${tokenRef.current}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  // Interceptor to refresh token if expired and retry request
  api.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;

      if (!originalRequest) {
        return Promise.reject(error);
      }

      const status = error.response?.status;
      const errorData = error.response?.data;

      const isInvalidToken =
        status === 403 &&
        (errorData === 'Invalid token' || errorData?.error === 'Invalid token');

      if ((status === 401 || isInvalidToken) && !originalRequest._retry) {
        originalRequest._retry = true;

        try {
          const res = await axios.get(`${backendURL}/auth/refresh_token`, {
            withCredentials: true,
          });

          const newAccessToken = res.data.accessToken;

          if (!newAccessToken) {
            throw new Error('No access token returned');
          }

          // Update ref and state
          tokenRef.current = newAccessToken;
          setAccessToken(newAccessToken);

          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return api(originalRequest);
        } catch (refreshError) {
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

      if (status === 403 && !isInvalidToken) {
        toast.error('You do not have permission to perform this action.');
      }

      return Promise.reject(error);
    }
  );

  return api;
};
