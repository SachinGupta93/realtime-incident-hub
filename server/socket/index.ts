import type { Server as SocketServer } from 'socket.io';
import { verifyAccessToken } from '../lib/jwt.js';

export function setupSocket(io: SocketServer): void {
    io.use((socket, next) => {
        // Authenticate socket connections via JWT
        const token =
            (socket.handshake.auth.token as string) ||
            (socket.handshake.headers.authorization as string)?.split(' ')[1];

        if (!token) {
            next(new Error('Authentication required'));
            return;
        }

        try {
            const payload = verifyAccessToken(token);
            socket.data.user = payload;
            next();
        } catch {
            next(new Error('Invalid token'));
        }
    });

    io.on('connection', (socket) => {
        const user = socket.data.user as { userId: string; role: string; email: string };
        console.log(`[Socket] Connected: ${user.email} (${user.role}) — ${socket.id}`);

        // Join role room
        socket.join(`role:${user.role}`);
        socket.join(`user:${user.userId}`);

        socket.on('disconnect', () => {
            console.log(`[Socket] Disconnected: ${user.email} — ${socket.id}`);
        });
    });
}
