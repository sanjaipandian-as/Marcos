/**
 * socket.js — Singleton Socket.io client for the MARCOS mobile app.
 *
 * Architecture rules:
 * - connectSocket(token)    → called once after login (in App.js)
 * - disconnectSocket()      → called on logout (in App.js)
 * - reconnectSocket(token)  → called after JWT refresh if socket was dropped
 * - getSocket()             → returns the active socket instance (or null)
 *
 * The socket is an ENHANCEMENT, not a source of truth.
 * Screens always re-fetch data on focus. Socket events only trigger re-fetches.
 */

import { io } from 'socket.io-client';
import { API_URL } from './api';

// Socket connects to the server root (strip /api/v1 path)
const SOCKET_URL = API_URL.replace('/api/v1', '');

let socket = null;

/**
 * Connect the socket. Token is passed explicitly so we use the freshest JWT.
 * @param {string} token - Valid JWT access token
 */
export function connectSocket(token) {
  if (socket && socket.connected) {
    // Already connected — nothing to do
    return;
  }

  if (socket) {
    // Stale disconnected instance — clean it up first
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }

  socket = io(SOCKET_URL, {
    auth: { token },
    query: { token },
    transports: ['websocket'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 2000,
  });

  socket.on('connect', () => {
    console.log('[Socket] Connected:', socket.id);
  });

  socket.on('disconnect', (reason) => {
    console.log('[Socket] Disconnected:', reason);
  });

  socket.on('connect_error', (err) => {
    console.warn('[Socket] Connection error:', err.message);
  });
}

/**
 * Disconnect and destroy the socket. Called on logout.
 */
export function disconnectSocket() {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
    console.log('[Socket] Disconnected and destroyed.');
  }
}

/**
 * Re-initialize the socket with a fresh JWT token.
 * Called after the api.js interceptor successfully refreshes the access token,
 * if the socket was previously disconnected due to token expiry.
 * @param {string} newToken - Fresh JWT access token
 */
export function reconnectSocket(newToken) {
  console.log('[Socket] Reconnecting with fresh token...');
  disconnectSocket();
  connectSocket(newToken);
}

/**
 * Returns the active socket instance, or null if not connected.
 * Screens use this to attach/detach listeners.
 */
export function getSocket() {
  return socket;
}
