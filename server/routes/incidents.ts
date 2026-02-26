import { Router } from 'express';
import type { Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authenticate } from '../middleware/auth.js';
import type { AuthRequest } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { auditAction } from '../middleware/audit.js';
import type { Server as SocketServer } from 'socket.io';

export function createIncidentsRouter(io: SocketServer) {
    const router = Router();

    const createSchema = z.object({
        title: z.string().min(3).max(200),
        description: z.string().min(10),
        severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
        assignedToId: z.string().optional(),
    });

    const updateSchema = z.object({
        title: z.string().min(3).max(200).optional(),
        description: z.string().min(10).optional(),
        severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
        assignedToId: z.string().nullable().optional(),
    });

    const statusSchema = z.object({
        status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']),
    });

    const incidentSelect = {
        id: true,
        title: true,
        description: true,
        severity: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        createdBy: { select: { id: true, name: true, email: true, role: true } },
        assignedTo: { select: { id: true, name: true, email: true, role: true } },
    };

    // GET /api/incidents
    router.get('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
        try {
            const { status, severity, page = '1', limit = '20' } = req.query as Record<string, string>;
            const skip = (parseInt(page) - 1) * parseInt(limit);

            const where: Record<string, unknown> = {};
            if (status) where.status = status;
            if (severity) where.severity = severity;

            const [incidents, total] = await Promise.all([
                prisma.incident.findMany({
                    where,
                    select: incidentSelect,
                    orderBy: { createdAt: 'desc' },
                    skip,
                    take: parseInt(limit),
                }),
                prisma.incident.count({ where }),
            ]);

            res.json({ incidents, total, page: parseInt(page), limit: parseInt(limit) });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    // GET /api/incidents/:id
    router.get('/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
        try {
            const incident = await prisma.incident.findUnique({
                where: { id: req.params.id },
                select: incidentSelect,
            });
            if (!incident) {
                res.status(404).json({ error: 'Incident not found' });
                return;
            }
            res.json(incident);
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    // POST /api/incidents
    router.post(
        '/',
        authenticate,
        requireRole('ADMIN', 'RESPONDER'),
        auditAction('CREATE', 'Incident'),
        async (req: AuthRequest, res: Response): Promise<void> => {
            try {
                const data = createSchema.parse(req.body);
                const incident = await prisma.incident.create({
                    data: {
                        ...data,
                        createdById: req.user!.userId,
                    },
                    select: incidentSelect,
                });

                io.emit('incident:created', incident);
                res.status(201).json(incident);
            } catch (err) {
                if (err instanceof z.ZodError) {
                    res.status(400).json({ error: 'Validation failed', details: err.errors });
                    return;
                }
                console.error(err);
                res.status(500).json({ error: 'Internal server error' });
            }
        }
    );

    // PATCH /api/incidents/:id
    router.patch(
        '/:id',
        authenticate,
        requireRole('ADMIN', 'RESPONDER'),
        auditAction('UPDATE', 'Incident'),
        async (req: AuthRequest, res: Response): Promise<void> => {
            try {
                const data = updateSchema.parse(req.body);
                const existing = await prisma.incident.findUnique({ where: { id: req.params.id } });
                if (!existing) {
                    res.status(404).json({ error: 'Incident not found' });
                    return;
                }

                const incident = await prisma.incident.update({
                    where: { id: req.params.id },
                    data,
                    select: incidentSelect,
                });

                io.emit('incident:updated', incident);
                res.json(incident);
            } catch (err) {
                if (err instanceof z.ZodError) {
                    res.status(400).json({ error: 'Validation failed', details: err.errors });
                    return;
                }
                console.error(err);
                res.status(500).json({ error: 'Internal server error' });
            }
        }
    );

    // PATCH /api/incidents/:id/status
    router.patch(
        '/:id/status',
        authenticate,
        requireRole('ADMIN', 'RESPONDER'),
        auditAction('STATUS_CHANGE', 'Incident'),
        async (req: AuthRequest, res: Response): Promise<void> => {
            try {
                const { status } = statusSchema.parse(req.body);
                const existing = await prisma.incident.findUnique({ where: { id: req.params.id } });
                if (!existing) {
                    res.status(404).json({ error: 'Incident not found' });
                    return;
                }

                const incident = await prisma.incident.update({
                    where: { id: req.params.id },
                    data: { status },
                    select: incidentSelect,
                });

                io.emit('incident:updated', { ...incident, previousStatus: existing.status });
                res.json(incident);
            } catch (err) {
                if (err instanceof z.ZodError) {
                    res.status(400).json({ error: 'Validation failed', details: err.errors });
                    return;
                }
                console.error(err);
                res.status(500).json({ error: 'Internal server error' });
            }
        }
    );

    // DELETE /api/incidents/:id  (admin only — close)
    router.delete(
        '/:id',
        authenticate,
        requireRole('ADMIN'),
        auditAction('DELETE', 'Incident'),
        async (req: AuthRequest, res: Response): Promise<void> => {
            try {
                const existing = await prisma.incident.findUnique({ where: { id: req.params.id } });
                if (!existing) {
                    res.status(404).json({ error: 'Incident not found' });
                    return;
                }

                const incident = await prisma.incident.update({
                    where: { id: req.params.id },
                    data: { status: 'CLOSED' },
                    select: incidentSelect,
                });

                io.emit('incident:updated', incident);
                res.json({ message: 'Incident closed', incident });
            } catch (err) {
                console.error(err);
                res.status(500).json({ error: 'Internal server error' });
            }
        }
    );

    return router;
}
