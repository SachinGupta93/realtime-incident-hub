import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function getSocket(token: string): Socket {
    if (socket?.connected) return socket;

    socket = io(import.meta.env.VITE_API_URL ?? 'http://localhost:4000', {
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
