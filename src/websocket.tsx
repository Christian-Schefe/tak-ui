import { type Options } from 'react-use-websocket';
import { logError } from './logger';

export const wsOptions: Options = {
  shouldReconnect: () => true,
  heartbeat: {
    interval: 30000,
    message: 'PING',
  },
  protocols: ['binary'],
};

export const WS_URL = import.meta.env.VITE_WEBSOCKET_URL;

export async function msgToString(msg: MessageEvent): Promise<string | null> {
  try {
    const text = await (msg.data as Blob).text();
    return text;
  } catch (error) {
    logError('Failed to convert message to string:', error);
    return null;
  }
}
