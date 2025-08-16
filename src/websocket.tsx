import { type Options } from 'react-use-websocket';

export const wsOptions: Options = {
  //Will attempt to reconnect on all close events, such as server shutting down
  shouldReconnect: () => true,
  share: true,
  heartbeat: {
    interval: 10000,
    message: 'PING',
    returnMessage: 'OK',
  },
  protocols: ['binary'],
};

export const WS_URL = 'wss://playtak.com/ws';

export async function msgToString(msg: MessageEvent): Promise<string | null> {
  try {
    const text = await (msg.data as Blob).text();
    return text;
  } catch (error) {
    console.error('Failed to convert message to string:', error);
    return null;
  }
}
