import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react';
import { msgToString, WS_URL, wsOptions } from './websocket';
import { router } from './router';
import useWebSocket from 'react-use-websocket';
import { v4 as uuidv4 } from 'uuid';

interface User {
  username: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  login: (username: string, password: string) => void;
  logout: () => void;
}

export interface WebSocketState {
  lastMessage: MessageEvent | null;
  sendMessage: (message: string) => void;
  addOnCloseListener: (key: string, callback: () => void) => void;
  addOnOpenListener: (key: string, callback: () => void) => void;
  removeOnCloseListener: (key: string) => void;
  removeOnOpenListener: (key: string) => void;
}

const AuthContext = createContext<AuthState | undefined>(undefined);
const WebSocketContext = createContext<WebSocketState | undefined>(undefined);

export type TextMessage = {
  text: string;
  timestamp: Date;
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const onCloseListeners = useRef<{ key: string; callback: () => void }[]>([]);
  const onOpenListeners = useRef<{ key: string; callback: () => void }[]>([]);

  const { sendMessage, lastMessage } = useWebSocket(WS_URL, {
    ...wsOptions,
    onOpen: () => {
      console.log('WebSocket opened');
      onOpenListeners.current.forEach((listener) => listener.callback());
    },
    onClose: () => {
      console.warn('WebSocket closed');
      onCloseListeners.current.forEach((listener) => listener.callback());
    },
  });

  const addOnCloseListener = (key: string, callback: () => void) => {
    onCloseListeners.current.push({ key, callback });
  };

  const removeOnCloseListener = (key: string) => {
    onCloseListeners.current = onCloseListeners.current.filter(
      (listener) => listener.key !== key,
    );
  };

  const addOnOpenListener = (key: string, callback: () => void) => {
    onOpenListeners.current.push({ key, callback });
  };

  const removeOnOpenListener = (key: string) => {
    onOpenListeners.current = onOpenListeners.current.filter(
      (listener) => listener.key !== key,
    );
  };

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
    msgToString(lastMessage)
      .then((msg) => {
        if (!msg) return;
        console.log('Received WebSocket message:', msg);
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
      <WebSocketContext.Provider
        value={{
          lastMessage,
          sendMessage,
          addOnCloseListener,
          removeOnCloseListener,
          addOnOpenListener,
          removeOnOpenListener,
        }}
      >
        {children}
      </WebSocketContext.Provider>
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

/* eslint-disable-next-line react-refresh/only-export-components */
export function useWS() {
  const context = useContext(WebSocketContext);
  if (context === undefined) {
    throw new Error('useWS must be used within a WebSocketProvider');
  }
  return context;
}

/* eslint-disable-next-line react-refresh/only-export-components */
export function useWSListener(
  onMessage?: (msg: TextMessage) => void,
  onClose?: () => void,
  onOpen?: () => void,
) {
  const context = useWS();
  const callbackRef = useRef({ onMessage, onClose, onOpen });
  callbackRef.current = { onMessage, onClose, onOpen };

  useEffect(() => {
    if (!context.lastMessage) return;
    msgToString(context.lastMessage).then((text) => {
      if (!text || !callbackRef.current.onMessage) return;
      callbackRef.current.onMessage({ text, timestamp: new Date() });
    });
  }, [context.lastMessage]);

  useEffect(() => {
    if (!callbackRef.current.onClose) return;
    const id = uuidv4();
    console.log('Adding onClose listener:', id);
    context.addOnCloseListener(id, callbackRef.current.onClose);
    return () => {
      context.removeOnCloseListener(id);
    };
  }, [context]);

  useEffect(() => {
    if (!callbackRef.current.onOpen) return;
    const id = uuidv4();
    context.addOnOpenListener(id, callbackRef.current.onOpen);
    return () => {
      context.removeOnOpenListener(id);
    };
  }, [context]);

  return context;
}
