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

  // Response interceptor for handling token refresh
  api.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;

      if (!originalRequest) {
        // no config on error, just reject
        return Promise.reject(error);
      }

      // Check if error status is 401 or 403 with invalid token
      const status = error.response?.status;
      const errorData = error.response?.data;

      const isInvalidToken =
        status === 403 &&
        (errorData === 'Invalid token' || errorData?.error === 'Invalid token');

      if (
        (status === 401 || isInvalidToken) &&
        !originalRequest._retry
      ) {
        originalRequest._retry = true; // avoid infinite loops

        try {
          // Call refresh token endpoint
          const res = await axios.get(`${backendURL}/auth/refresh_token`, {
            withCredentials: true,
          });

          const newAccessToken = res.data.accessToken;

          if (!newAccessToken) {
            throw new Error('No access token returned');
          }

          // Update access token state
          setAccessToken(newAccessToken);

          // Update Authorization header and retry original request
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return api(originalRequest);
        } catch (refreshError) {
          // Refresh failed: logout user
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

      // Handle other 403 (permission denied)
      if (status === 403 && !isInvalidToken) {
        toast.error('You do not have permission to perform this action.');
      }

      return Promise.reject(error);
    }
  );

  return api;
};
