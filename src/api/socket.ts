import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function getSocket(token: string): Socket {
    if (socket?.connected) return socket;

    // In dev, Vite proxy handles /socket.io.
    // In production, same origin serves everything.
    socket = io({
        auth: { token },
        transports: ['websocket', 'polling'],
    });

    return socket;
}

export function disconnectSocket(): void {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
}
