export const wsOptions = {
  onOpen: () => console.log('opened'),
  //Will attempt to reconnect on all close events, such as server shutting down
  shouldReconnect: () => true,
  share: true,
  heartbeat: {
    interval: 30000,
    message: 'PING',
    returnMessage: 'OK',
  },
  protocols: ['binary'],
};
