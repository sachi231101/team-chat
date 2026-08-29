import { io, Socket } from 'socket.io-client';
import { getWsUrl } from './env';

const WS_URL = getWsUrl();

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    socket = io(WS_URL, {
      autoConnect: false,
      transports: ['websocket', 'polling'],
    });
  }
  return socket;
};
