import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { prisma } from './lib/prisma';
import { setupSocket } from './socket';
import authRoutes from './routes/auth';
import { createIncidentsRouter } from './routes/incidents';
import auditLogRoutes from './routes/auditLogs';
import userRoutes from './routes/users';

const app = express();
const httpServer = createServer(app);

const io = new SocketServer(httpServer, {
    cors: {
        origin: process.env.CLIENT_ORIGIN ?? 'http://localhost:5173',
        methods: ['GET', 'POST', 'PATCH', 'DELETE'],
        credentials: true,
    },
});

// Middleware
app.use(
    cors({
        origin: process.env.CLIENT_ORIGIN ?? 'http://localhost:5173',
        credentials: true,
    })
);
app.use(express.json());
app.use(cookieParser());

// Health check
app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/incidents', createIncidentsRouter(io));
app.use('/api/audit-logs', auditLogRoutes);
app.use('/api/users', userRoutes);

// 404 handler
app.use((_req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Global error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('[Error]', err);
    res.status(500).json({ error: err.message ?? 'Internal server error' });
});

// Setup WebSocket
setupSocket(io);

const PORT = parseInt(process.env.PORT ?? '4000', 10);

async function main() {
    try {
        await prisma.$connect();
        console.log('[DB] PostgreSQL connected');

        httpServer.listen(PORT, () => {
            console.log(`[Server] Running on http://localhost:${PORT}`);
            console.log(`[WS] Socket.IO listening`);
        });
    } catch (err) {
        console.error('[DB] Connection failed:', err);
        process.exit(1);
    }
}

main();
