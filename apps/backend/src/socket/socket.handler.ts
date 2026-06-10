import { Server, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';
import env from '../config/env.js';
import logger from '../utils/logger.js';
import { createRedisAdapter } from './socket.adapter.js';
import { Role } from '@prisma/client';

let io: Server | null = null;

export interface SocketUser {
  id: string;
  email: string;
  role: Role;
  fullName: string;
}

export function getIO(): Server | null {
  return io;
}

export function initSocket(server: HttpServer) {
  io = new Server(server, {
    cors: {
      origin: '*', // Enforce restrictive origins in production
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // Attach Redis adapter for horizontal scaling unless in testing
  if (env.NODE_ENV !== 'test') {
    try {
      const adapter = createRedisAdapter();
      io.adapter(adapter);
      logger.info('Socket.io Redis adapter attached.');
    } catch (err: any) {
      logger.error('Failed to attach Socket.io Redis adapter', { metadata: { error: err.message } });
    }
  }

  // Handshake Token validation Middleware
  io.use((socket: Socket, next) => {
    const token = socket.handshake.query.token as string || socket.handshake.auth.token as string;
    
    if (!token) {
      return next(new Error('Authentication error: Token required'));
    }

    try {
      const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as SocketUser;
      socket.data.user = decoded;
      next();
    } catch (err) {
      return next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const user = socket.data.user as SocketUser;
    
    logger.info(`Socket client connected: ${socket.id} (User: ${user.id}, Role: ${user.role})`);

    // 1. Join user to personal room
    socket.join(`user:${user.id}`);

    // 2. Join RBAC rooms
    if (user.role === Role.ADMIN || user.role === Role.SUPERADMIN) {
      socket.join('admins');
    }
    
    if (user.role === Role.SUPERADMIN) {
      socket.join('superadmins');
    }

    // Handlers
    socket.on('disconnect', () => {
      logger.info(`Socket client disconnected: ${socket.id} (User: ${user.id})`);
      // Socket.io automatically handles room cleanup, we just log and clean up any local states if tracked
    });
  });

  return io;
}
