import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import useWebSocket from 'react-use-websocket';
import { WS_URL, wsOptions } from './websocket';
import { router } from './router';

interface User {
  username: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  login: (username: string, password: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const { sendMessage, lastMessage } = useWebSocket(WS_URL, wsOptions);

  const sendToken = useCallback(() => {
    const token = localStorage.getItem('auth-token');
    if (token) {
      console.log('Found auth token:', token);
      sendMessage(`Login ${token}`);
      console.log('Sent login message');
    } else {
      setIsLoading(false);
    }
  }, [sendMessage]);

  useEffect(() => {
    if (!lastMessage?.data) return;
    (lastMessage?.data as Blob)
      .text()
      .then((msg) => {
        console.log('WebSocket message:', msg);
        const userMatch = msg.match(/Welcome (.+)!/);
        if (msg === 'NOK') {
          if (isAuthenticated) return;
          localStorage.removeItem('auth-token');
        } else if (userMatch) {
          if (isAuthenticated) return;
          setUser({ username: userMatch[1] || '' });
          setIsAuthenticated(true);
        } else if (msg.startsWith('Login or Register')) {
          console.log('No user found, sending token');
          sendToken();
        }
      })
      .catch(() => {
        localStorage.removeItem('auth-token');
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [lastMessage, sendToken, isAuthenticated]);

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading...
      </div>
    );
  }

  const login = (username: string, password: string) => {
    console.log('Logging in as:', username);
    localStorage.setItem('auth-token', `${username} ${password}`);
    sendMessage(`Login ${username} ${password}`);
  };

  const logout = () => {
    console.log('Logging out');
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('auth-token');
    router.navigate({ to: '/' });
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

/* eslint-disable-next-line react-refresh/only-export-components */
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
