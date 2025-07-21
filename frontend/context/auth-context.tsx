'use client';

import {
  createContext,
  useState,
  useEffect,
  ReactNode,
  Dispatch,
  SetStateAction,
  useMemo,
} from 'react';
import axios from 'axios';
import { createAPIClient } from './../api';

type AuthContextType = {
  user: any;
  accessToken: string;
  isLoggedIn: boolean;
  isLoadingAuth: boolean;
  setUser: Dispatch<SetStateAction<any>>;
  setAccessToken: Dispatch<SetStateAction<string>>;
  apiClient: ReturnType<typeof createAPIClient>;
};

export const AuthContext = createContext<AuthContextType>({
  user: null,
  accessToken: '',
  isLoggedIn: false,
  isLoadingAuth: true,
  setUser: () => {},
  setAccessToken: () => {},
  apiClient: {} as any,
});

type AuthProviderProps = {
  children: ReactNode;
};

export const AuthContextProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<any>(null);
  const [accessToken, setAccessToken] = useState<string>('');
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  const isLoggedIn = !!user && !!accessToken;

  const apiClient = useMemo(
    () => createAPIClient({ accessToken, setAccessToken, setUser }),
    [accessToken]
  );

  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/refresh_token`,
          {
            withCredentials: true,
          }
        );

        setUser(response.data.user);
        if (response.data.accessToken) {
          setAccessToken(response.data.accessToken);
        }
      } catch (error) {
        setUser(null);
        setAccessToken('');
      } finally {
        setIsLoadingAuth(false);
      }
    };

    checkLoginStatus();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        isLoggedIn,
        isLoadingAuth,
        setUser,
        setAccessToken,
        apiClient,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
