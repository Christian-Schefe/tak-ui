import { createContext, use, useEffect, useRef } from 'react';
import type {
  AuthState,
  TextMessage,
  WebSocketAPIState,
  WebSocketMessageState,
} from './auth';
import { v4 } from 'uuid';
import { msgToString } from './websocket';

export const AuthContext = createContext<AuthState | undefined>(undefined);
export const WebSocketMessageContext = createContext<
  WebSocketMessageState | undefined
>(undefined);
export const WebSocketAPIContext = createContext<WebSocketAPIState | undefined>(
  undefined,
);

export function useAuth() {
  const context = use(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function useWSAPI() {
  const context = use(WebSocketAPIContext);
  if (context === undefined) {
    throw new Error('useWSAPI must be used within a WebSocketAPIProvider');
  }
  return context;
}

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
  const { lastMessage } = use(WebSocketMessageContext) ?? {
    lastMessage: null,
  };
  const callbackRef = useRef({ onMessage, onClose, onOpen });
  callbackRef.current = { onMessage, onClose, onOpen };

  useEffect(() => {
    if (!lastMessage) return;
    msgToString(lastMessage)
      .then((text) => {
        if (!text || !callbackRef.current.onMessage) return;
        callbackRef.current.onMessage({ text, timestamp: new Date() });
      })
      .catch((err: unknown) => {
        console.error('Error parsing WebSocket message:', err);
      });
  }, [lastMessage]);

  useEffect(() => {
    if (!callbackRef.current.onClose) return;
    const id = v4();
    console.log('Adding onClose listener:', id);
    addOnCloseListener(id, callbackRef.current.onClose);
    return () => {
      removeOnCloseListener(id);
    };
  }, [addOnCloseListener, removeOnCloseListener]);

  useEffect(() => {
    if (!callbackRef.current.onOpen) return;
    const id = v4();
    addOnOpenListener(id, callbackRef.current.onOpen);
    return () => {
      removeOnOpenListener(id);
    };
  }, [addOnOpenListener, removeOnOpenListener]);

  return api;
}
