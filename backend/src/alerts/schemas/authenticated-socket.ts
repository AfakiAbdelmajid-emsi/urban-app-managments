import { Socket } from 'socket.io';

export interface AuthenticatedSocket extends Socket {
  data: {
    userId: string | null; // null for anonymous connections
  };
}

export interface SocketAuth {
  token: string;
}
