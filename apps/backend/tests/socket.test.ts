import http from 'http';
import { AddressInfo } from 'net';
import { io as Client, Socket as ClientSocket } from 'socket.io-client';
import { initSocket } from '../src/socket/socket.handler.js';
import AuthService from '../src/services/auth.service.js';
import { Role } from '@prisma/client';
import { jest } from '@jest/globals';
import env from '../src/config/env.js';

// Mock Redis adapter module to verify its attachment behavior
jest.mock('../src/socket/socket.adapter.js', () => ({
  createRedisAdapter: jest.fn().mockImplementation(() => {
    return (io: any) => {}; // return mock adapter
  }),
}));

import { createRedisAdapter } from '../src/socket/socket.adapter.js';

describe('Real-Time WebSockets (Socket.io)', () => {
  let server: http.Server;
  let port: number;
  let clientSocket: ClientSocket;
  let adminClientSocket: ClientSocket;
  let superadminClientSocket: ClientSocket;

  const mockUserPayload = {
    id: 'user-uuid-123',
    email: 'user@marcosapp.com',
    role: Role.CUSTOMER,
    fullName: 'Test Customer',
  };

  const mockAdminPayload = {
    id: 'admin-uuid-456',
    email: 'admin@marcosapp.com',
    role: Role.ADMIN,
    fullName: 'Test Admin',
  };

  const mockSuperadminPayload = {
    id: 'superadmin-uuid-789',
    email: 'superadmin@marcosapp.com',
    role: Role.SUPERADMIN,
    fullName: 'Test Superadmin',
  };

  beforeAll((done) => {
    server = http.createServer();
    initSocket(server);
    server.listen(() => {
      port = (server.address() as AddressInfo).port;
      done();
    });
  });

  afterAll((done) => {
    server.close();
    done();
  });

  afterEach(() => {
    if (clientSocket && clientSocket.connected) {
      clientSocket.disconnect();
    }
    if (adminClientSocket && adminClientSocket.connected) {
      adminClientSocket.disconnect();
    }
    if (superadminClientSocket && superadminClientSocket.connected) {
      superadminClientSocket.disconnect();
    }
    jest.clearAllMocks();
  });

  test('Should reject connection without authorization token', (done) => {
    clientSocket = Client(`http://localhost:${port}`, {
      autoConnect: false,
    });

    clientSocket.connect();
    clientSocket.on('connect_error', (err) => {
      expect(err.message).toContain('Authentication error');
      done();
    });
  });

  test('Should reject connection with invalid authorization token', (done) => {
    clientSocket = Client(`http://localhost:${port}`, {
      auth: { token: 'invalid-token-signature' },
      autoConnect: false,
    });

    clientSocket.connect();
    clientSocket.on('connect_error', (err) => {
      expect(err.message).toContain('Authentication error: Invalid token');
      done();
    });
  });

  test('Should allow connection with valid JWT and auto join personal room', (done) => {
    const token = AuthService.generateAccessToken(mockUserPayload);

    clientSocket = Client(`http://localhost:${port}`, {
      auth: { token },
      autoConnect: false,
    });

    clientSocket.connect();
    
    clientSocket.on('connect', () => {
      expect(clientSocket.connected).toBe(true);

      // Verify server socket joins personal room
      const ioInstance = require('../src/socket/socket.handler.js').getIO();
      const serverSocket = ioInstance.sockets.sockets.get(clientSocket.id);
      expect(serverSocket).toBeTruthy();
      expect(serverSocket.rooms.has(`user:${mockUserPayload.id}`)).toBe(true);
      expect(serverSocket.rooms.has('admins')).toBe(false);

      done();
    });
  });

  test('Admins should auto join admins room and receive broadcast events', (done) => {
    const adminToken = AuthService.generateAccessToken(mockAdminPayload);

    adminClientSocket = Client(`http://localhost:${port}`, {
      auth: { token: adminToken },
    });

    adminClientSocket.on('connect', () => {
      const ioInstance = require('../src/socket/socket.handler.js').getIO();
      const serverSocket = ioInstance.sockets.sockets.get(adminClientSocket.id);
      expect(serverSocket.rooms.has('admins')).toBe(true);
      expect(serverSocket.rooms.has(`user:${mockAdminPayload.id}`)).toBe(true);

      adminClientSocket.on('appointment:created', (payload) => {
        expect(payload.type).toBe('MEASUREMENT');
        expect(payload.customerName).toBe('Jane Doe');
        done();
      });

      ioInstance.to('admins').emit('appointment:created', {
        id: 'appointment-id-1',
        customerName: 'Jane Doe',
        type: 'MEASUREMENT',
      });
    });
  });

  test('Superadmins should auto join superadmins room', (done) => {
    const superadminToken = AuthService.generateAccessToken(mockSuperadminPayload);

    superadminClientSocket = Client(`http://localhost:${port}`, {
      auth: { token: superadminToken },
    });

    superadminClientSocket.on('connect', () => {
      const ioInstance = require('../src/socket/socket.handler.js').getIO();
      const serverSocket = ioInstance.sockets.sockets.get(superadminClientSocket.id);
      expect(serverSocket.rooms.has('admins')).toBe(true);
      expect(serverSocket.rooms.has('superadmins')).toBe(true);
      done();
    });
  });

  test('Should invoke Redis adapter attachment logic in production/non-test environment', () => {
    const tempEnv = env.NODE_ENV;
    try {
      // Set to production to trigger adapter attachment
      (env as any).NODE_ENV = 'production';
      const mockServer = http.createServer();
      
      initSocket(mockServer);

      expect(createRedisAdapter).toHaveBeenCalled();
      mockServer.close();
    } finally {
      // Restore test environment
      (env as any).NODE_ENV = tempEnv;
    }
  });
});
