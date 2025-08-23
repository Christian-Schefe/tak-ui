import { createContext, use, useEffect, useRef } from 'react';
import type { AuthState, TextMessage, WebSocketAPIState } from './auth';
import { msgToString } from './websocket';

export const AuthContext = createContext<AuthState | undefined>(undefined);
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

export function useWSListener(
  id: string,
  {
    onMessage,
    onClose,
    onOpen,
  }: {
    onMessage?: (msg: TextMessage) => void;
    onClose?: (ev: CloseEvent) => void;
    onOpen?: () => void;
  },
) {
  const api = useWSAPI();
  const {
    addOnOpenListener,
    addOnCloseListener,
    removeOnOpenListener,
    removeOnCloseListener,
    addOnMessageListener,
    removeOnMessageListener,
  } = api;

  const onMessageRef = useRef(onMessage);
  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  const onOpenRef = useRef(onOpen);
  useEffect(() => {
    onOpenRef.current = onOpen;
  }, [onOpen]);

  useEffect(() => {
    console.log('Adding onMessage listener:', id);
    addOnMessageListener(id, (msg) => {
      msgToString(msg)
        .then((text) => {
          if (!text) return;
          onMessageRef.current?.({ text, timestamp: new Date() });
        })
        .catch((err: unknown) => {
          console.error('Error parsing WebSocket message:', err);
        });
    });
    return () => {
      console.log('Removing onMessage listener:', id);
      removeOnMessageListener(id);
    };
  }, [addOnMessageListener, id, removeOnMessageListener]);

  useEffect(() => {
    console.log('Adding onClose listener:', id);
    addOnCloseListener(id, (ev) => {
      onCloseRef.current?.(ev);
    });
    return () => {
      console.log('Removing onClose listener:', id);
      removeOnCloseListener(id);
    };
  }, [addOnCloseListener, id, removeOnCloseListener]);

  useEffect(() => {
    console.log('Adding onOpen listener:', id);
    addOnOpenListener(id, () => {
      onOpenRef.current?.();
    });
    return () => {
      console.log('Removing onOpen listener:', id);
      removeOnOpenListener(id);
    };
  }, [addOnOpenListener, id, removeOnOpenListener]);

  return api;
}
