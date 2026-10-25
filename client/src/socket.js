import { io } from 'socket.io-client';
import { apiBase, getToken } from './api.js';

export function connectSocket() {
  return io(apiBase || undefined, { auth: { token: getToken() } });
}
