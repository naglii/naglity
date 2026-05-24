import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { Injectable } from '@nestjs/common';

@Injectable()
@WebSocketGateway({
  cors: {
    origin: process.env['FRONTEND_URL'] ?? 'http://localhost:3000',
    credentials: true,
  },
  namespace: '/',
})
export class JobsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  constructor(private jwt: JwtService) {}

  handleConnection(client: Socket) {
    try {
      const cookieHeader = client.handshake.headers.cookie ?? '';
      const token = cookieHeader
        .split(';')
        .map((c) => c.trim())
        .find((c) => c.startsWith('access_token='))
        ?.slice('access_token='.length);

      if (!token) { client.disconnect(); return; }

      const payload = this.jwt.verify(token) as { sub: string; role: string };

      if (payload.role === 'DRIVER') client.join('drivers');
      else if (payload.role === 'BUSINESS') client.join(`business:${payload.sub}`);
      else if (payload.role === 'ADMIN') client.join('admin');

      client.join(`user:${payload.sub}`);
      (client as any).userId = payload.sub;
      (client as any).userRole = payload.role;
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(_client: Socket) {}

  emitJobNew(job: any) {
    this.server.to('drivers').emit('job:new', { job });
    this.server.to('admin').emit('job:new', { job });
  }

  emitJobAccepted(jobId: string, driverId: string, driverName: string, businessOwnerId: string) {
    this.server.to('drivers').emit('job:accepted', { jobId, driverId, driverName });
    this.server.to(`business:${businessOwnerId}`).emit('job:accepted', { jobId, driverId, driverName });
    this.server.to('admin').emit('job:accepted', { jobId, driverId, driverName });
  }

  emitJobUpdated(jobId: string, status: string, businessOwnerId: string) {
    this.server.to(`business:${businessOwnerId}`).emit('job:updated', { jobId, status });
    this.server.to('admin').emit('job:updated', { jobId, status });
  }

  emitNotification(userId: string, notification: any) {
    this.server.to(`user:${userId}`).emit('notification:new', { notification });
  }
}
