import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import { prisma } from './lib/prisma.js';
import { setupSocket } from './socket/index.js';
import authRoutes from './routes/auth.js';
import { createIncidentsRouter } from './routes/incidents.js';
import auditLogRoutes from './routes/auditLogs.js';
import userRoutes from './routes/users.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);

const isProduction = process.env.NODE_ENV === 'production';

const io = new SocketServer(httpServer, {
    cors: isProduction
        ? undefined
        : {
            origin: 'http://localhost:5173',
            methods: ['GET', 'POST', 'PATCH', 'DELETE'],
            credentials: true,
        },
});

// Middleware
if (!isProduction) {
    app.use(
        cors({
            origin: 'http://localhost:5173',
            credentials: true,
        })
    );
}
app.use(express.json());
app.use(cookieParser());

// Health check
app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/incidents', createIncidentsRouter(io));
app.use('/api/audit-logs', auditLogRoutes);
app.use('/api/users', userRoutes);

// Serve static frontend in production
if (isProduction) {
    const clientDir = path.resolve(__dirname, '../client');
    app.use(express.static(clientDir));

    // SPA fallback — serve index.html for all non-API routes
    app.get('*', (_req, res) => {
        res.sendFile(path.join(clientDir, 'index.html'));
    });
} else {
    // In development, Vite dev server handles the frontend.
    // This catch-all only applies to non-proxied requests.
    app.use((_req, res) => {
        res.status(404).json({ error: 'Route not found. Frontend is served by Vite dev server on port 5173.' });
    });
}

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
        console.log('[DB] Local PostgreSQL connected via Prisma');

        httpServer.listen(PORT, () => {
            console.log(`[Server] Running on http://localhost:${PORT}`);
            console.log(`[WS] Socket.IO listening`);
            if (!isProduction) {
                console.log(`[Dev] Frontend at http://localhost:5173 (Vite proxies API here)`);
            } else {
                console.log(`[Prod] Serving frontend from dist/client`);
            }
        });
    } catch (err) {
        console.error('[DB] Connection failed:', err);
        process.exit(1);
    }
}

main();
