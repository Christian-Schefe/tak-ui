import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
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

export interface WebSocketMessageState {
  lastMessage: MessageEvent | null;
}

export interface WebSocketAPIState {
  sendMessage: (message: string) => void;
  addOnCloseListener: (key: string, callback: () => void) => void;
  addOnOpenListener: (key: string, callback: () => void) => void;
  removeOnCloseListener: (key: string) => void;
  removeOnOpenListener: (key: string) => void;
}
const AuthContext = createContext<AuthState | undefined>(undefined);
const WebSocketMessageContext = createContext<
  WebSocketMessageState | undefined
>(undefined);
const WebSocketAPIContext = createContext<WebSocketAPIState | undefined>(
  undefined,
);

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

  const addOnCloseListener = useCallback(
    (key: string, callback: () => void) => {
      onCloseListeners.current.push({ key, callback });
    },
    [],
  );

  const removeOnCloseListener = useCallback((key: string) => {
    onCloseListeners.current = onCloseListeners.current.filter(
      (listener) => listener.key !== key,
    );
  }, []);

  const addOnOpenListener = useCallback((key: string, callback: () => void) => {
    onOpenListeners.current.push({ key, callback });
  }, []);

  const removeOnOpenListener = useCallback((key: string) => {
    onOpenListeners.current = onOpenListeners.current.filter(
      (listener) => listener.key !== key,
    );
  }, []);

  const api = useMemo<WebSocketAPIState>(() => {
    return {
      sendMessage,
      addOnCloseListener,
      removeOnCloseListener,
      addOnOpenListener,
      removeOnOpenListener,
    };
  }, [
    sendMessage,
    addOnCloseListener,
    removeOnCloseListener,
    addOnOpenListener,
    removeOnOpenListener,
  ]);

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
      <WebSocketMessageContext.Provider value={{ lastMessage }}>
        <WebSocketAPIContext.Provider value={api}>
          {children}
        </WebSocketAPIContext.Provider>
      </WebSocketMessageContext.Provider>
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
export function useWSAPI() {
  const context = useContext(WebSocketAPIContext);
  if (context === undefined) {
    throw new Error('useWSAPI must be used within a WebSocketAPIProvider');
  }
  return context;
}

/* eslint-disable-next-line react-refresh/only-export-components */
export function useWSListener({
  onMessage,
  onClose,
  onOpen,
}: {
  onMessage?: (msg: TextMessage) => void;
  onClose?: () => void;
  onOpen?: () => void;
}) {
  const api = useWSAPI();
  const {
    addOnOpenListener,
    addOnCloseListener,
    removeOnOpenListener,
    removeOnCloseListener,
  } = api;
  const { lastMessage } = useContext(WebSocketMessageContext) || {
    lastMessage: null,
  };
  const callbackRef = useRef({ onMessage, onClose, onOpen });
  callbackRef.current = { onMessage, onClose, onOpen };

  useEffect(() => {
    if (!lastMessage) return;
    msgToString(lastMessage).then((text) => {
      if (!text || !callbackRef.current.onMessage) return;
      callbackRef.current.onMessage({ text, timestamp: new Date() });
    });
  }, [lastMessage]);

  useEffect(() => {
    if (!callbackRef.current.onClose) return;
    const id = uuidv4();
    console.log('Adding onClose listener:', id);
    addOnCloseListener(id, callbackRef.current.onClose);
    return () => {
      removeOnCloseListener(id);
    };
  }, [addOnCloseListener, removeOnCloseListener]);

  useEffect(() => {
    if (!callbackRef.current.onOpen) return;
    const id = uuidv4();
    addOnOpenListener(id, callbackRef.current.onOpen);
    return () => {
      removeOnOpenListener(id);
    };
  }, [addOnOpenListener, removeOnOpenListener]);

  return api;
}
