import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from 'react';
import { msgToString, WS_URL, wsOptions } from './websocket';
import { router } from './router';
import useWebSocket, { ReadyState } from 'react-use-websocket';
import { AuthContext, WebSocketAPIContext } from './authHooks';
import { Affix, Button } from '@mantine/core';
import { useSettings } from './settings';

interface User {
  username: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  login: (username: string, password: string) => void;
  logout: () => void;
}

export interface WebSocketAPIState {
  readyState: ReadyState;
  sendMessage: (message: string, keep?: boolean) => void;
  addOnMessageListener: (key: string, callback: MessageListener) => void;
  removeOnMessageListener: (key: string) => void;
  addOnCloseListener: (key: string, callback: CloseEventListener) => void;
  addOnOpenListener: (key: string, callback: OpenEventListener) => void;
  removeOnCloseListener: (key: string) => void;
  removeOnOpenListener: (key: string) => void;
}

export interface TextMessage {
  text: string;
  timestamp: Date;
}

export type CloseEventListener = (ev: CloseEvent) => void;
export type MessageListener = (msg: MessageEvent) => void;
export type OpenEventListener = () => void;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const onCloseListeners = useRef<
    { key: string; callback: CloseEventListener }[]
  >([]);
  const onOpenListeners = useRef<
    { key: string; callback: OpenEventListener }[]
  >([]);
  const onMessageListeners = useRef<
    { key: string; callback: MessageListener }[]
  >([]);

  const { sendMessage, lastMessage, getWebSocket, readyState } = useWebSocket(
    WS_URL,
    {
      ...wsOptions,
      onOpen: () => {
        console.log('WebSocket opened');
        sendMessage('Protocol 2');
        sendToken();
        onOpenListeners.current.forEach((listener) => {
          console.log('Called onOpen listener', listener.key);
          listener.callback();
        });
      },
      onClose: (ev) => {
        console.warn('WebSocket closed', ev);
        onCloseListeners.current.forEach((listener) => {
          console.log('Called onClose listener', listener.key);
          listener.callback(ev);
        });
      },
      onMessage: (msg) => {
        onMessageListeners.current.forEach((listener) => {
          listener.callback(msg);
        });
      },
    },
  );

  const addOnCloseListener = useCallback(
    (key: string, callback: CloseEventListener) => {
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

  const addOnMessageListener = useCallback(
    (key: string, callback: MessageListener) => {
      onMessageListeners.current.push({ key, callback });
    },
    [],
  );

  const removeOnMessageListener = useCallback((key: string) => {
    onMessageListeners.current = onMessageListeners.current.filter(
      (listener) => listener.key !== key,
    );
  }, []);

  const triggerClose = useCallback(() => {
    const ws = getWebSocket();
    if (ws) {
      ws.close(1000, 'logout');
    }
  }, [getWebSocket]);

  const api = useMemo<WebSocketAPIState>(() => {
    return {
      readyState,
      sendMessage: (msg, keep) => {
        console.log('sent:', msg);
        sendMessage(msg, keep ?? true);
      },
      addOnCloseListener,
      removeOnCloseListener,
      addOnOpenListener,
      removeOnOpenListener,
      addOnMessageListener,
      removeOnMessageListener,
    };
  }, [
    readyState,
    sendMessage,
    addOnMessageListener,
    removeOnMessageListener,
    addOnCloseListener,
    removeOnCloseListener,
    addOnOpenListener,
    removeOnOpenListener,
  ]);

  const sendToken = useCallback(() => {
    const token = localStorage.getItem('auth-token');
    if (token !== null) {
      console.log('Found auth token:', token);
      sendMessage(`Login ${token}`);
      console.log('Sent login message');
    } else {
      console.log('No auth token found');
    }
  }, [sendMessage]);

  useEffect(() => {
    if (lastMessage === null) return;
    msgToString(lastMessage)
      .then((msg) => {
        if (msg === null) return;
        console.log('Received WebSocket message:', msg);
        const userMatch = /Welcome (.+)!/.exec(msg);
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
      });
  }, [lastMessage, sendToken, isAuthenticated]);

  const login = useCallback(
    (username: string, password: string) => {
      console.log('Logging in as:', username, password);
      localStorage.setItem('auth-token', `${username} ${password}`);
      sendToken();
    },
    [sendToken],
  );

  const logout = useCallback(() => {
    console.log('Logging out');
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('auth-token');
    void router.navigate({ to: '/' });
    triggerClose();
  }, [triggerClose]);

  const authContextMemo = useMemo<AuthState>(() => {
    return { isAuthenticated, user, login, logout };
  }, [isAuthenticated, user, login, logout]);

  const { devMode } = useSettings();

  return (
    <AuthContext value={authContextMemo}>
      <WebSocketAPIContext value={api}>{children}</WebSocketAPIContext>
      {devMode.value && (
        <Affix position={{ bottom: 20, right: 20 }} zIndex={100}>
          <Button onClick={triggerClose}>Close WebSocket</Button>
        </Affix>
      )}
    </AuthContext>
  );
}
