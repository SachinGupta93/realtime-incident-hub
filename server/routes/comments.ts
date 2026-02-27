import { Router } from 'express';
import type { Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authenticate } from '../middleware/auth.js';
import type { AuthRequest } from '../middleware/auth.js';
import type { Server as SocketServer } from 'socket.io';

const commentSelect = {
    id: true,
    content: true,
    incidentId: true,
    createdAt: true,
    updatedAt: true,
    user: { select: { id: true, name: true, email: true, role: true } },
};

export function createCommentsRouter(io: SocketServer) {
    const router = Router({ mergeParams: true });

    const createSchema = z.object({
        content: z.string().min(1).max(2000),
    });

    const updateSchema = z.object({
        content: z.string().min(1).max(2000),
    });

    // GET /api/incidents/:incidentId/comments
    router.get('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
        try {
            const { incidentId } = req.params;

            const incident = await prisma.incident.findUnique({ where: { id: incidentId } });
            if (!incident) {
                res.status(404).json({ error: 'Incident not found' });
                return;
            }

            const comments = await prisma.comment.findMany({
                where: { incidentId },
                select: commentSelect,
                orderBy: { createdAt: 'asc' },
            });

            res.json(comments);
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    // POST /api/incidents/:incidentId/comments
    router.post('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
        try {
            const { incidentId } = req.params;
            const { content } = createSchema.parse(req.body);

            const incident = await prisma.incident.findUnique({ where: { id: incidentId } });
            if (!incident) {
                res.status(404).json({ error: 'Incident not found' });
                return;
            }

            const comment = await prisma.comment.create({
                data: {
                    content,
                    incidentId,
                    userId: req.user!.userId,
                },
                select: commentSelect,
            });

            io.emit('comment:created', comment);
            res.status(201).json(comment);
        } catch (err) {
            if (err instanceof z.ZodError) {
                res.status(400).json({ error: 'Validation failed', details: err.errors });
                return;
            }
            console.error(err);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    // PATCH /api/incidents/:incidentId/comments/:commentId
    router.patch('/:commentId', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
        try {
            const { commentId } = req.params;
            const { content } = updateSchema.parse(req.body);

            const existing = await prisma.comment.findUnique({ where: { id: commentId } });
            if (!existing) {
                res.status(404).json({ error: 'Comment not found' });
                return;
            }

            // Only author or admin can edit
            if (existing.userId !== req.user!.userId && req.user!.role !== 'ADMIN') {
                res.status(403).json({ error: 'Not authorized to edit this comment' });
                return;
            }

            const comment = await prisma.comment.update({
                where: { id: commentId },
                data: { content },
                select: commentSelect,
            });

            io.emit('comment:updated', comment);
            res.json(comment);
        } catch (err) {
            if (err instanceof z.ZodError) {
                res.status(400).json({ error: 'Validation failed', details: err.errors });
                return;
            }
            console.error(err);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    // DELETE /api/incidents/:incidentId/comments/:commentId
    router.delete('/:commentId', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
        try {
            const { commentId } = req.params;

            const existing = await prisma.comment.findUnique({ where: { id: commentId } });
            if (!existing) {
                res.status(404).json({ error: 'Comment not found' });
                return;
            }

            // Only author or admin can delete
            if (existing.userId !== req.user!.userId && req.user!.role !== 'ADMIN') {
                res.status(403).json({ error: 'Not authorized to delete this comment' });
                return;
            }

            await prisma.comment.delete({ where: { id: commentId } });

            io.emit('comment:deleted', { id: commentId, incidentId: existing.incidentId });
            res.json({ message: 'Comment deleted' });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    return router;
}
