import { Router } from 'express';
import type { Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { authenticate } from '../middleware/auth.js';
import type { AuthRequest } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';

const router = Router();

// GET /api/users/me
router.get('/me', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user!.userId },
            select: { id: true, name: true, email: true, role: true, createdAt: true },
        });
        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }
        res.json(user);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/users — admin only
router.get(
    '/',
    authenticate,
    requireRole('ADMIN'),
    async (_req: AuthRequest, res: Response): Promise<void> => {
        try {
            const users = await prisma.user.findMany({
                select: { id: true, name: true, email: true, role: true, createdAt: true },
                orderBy: { createdAt: 'desc' },
            });
            res.json(users);
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
);

// PATCH /api/users/:id/role — admin only
router.patch(
    '/:id/role',
    authenticate,
    requireRole('ADMIN'),
    async (req: AuthRequest, res: Response): Promise<void> => {
        try {
            const { role } = req.body as { role: string };
            if (!['ADMIN', 'RESPONDER', 'VIEWER'].includes(role)) {
                res.status(400).json({ error: 'Invalid role' });
                return;
            }
            const user = await prisma.user.update({
                where: { id: req.params.id },
                data: { role: role as 'ADMIN' | 'RESPONDER' | 'VIEWER' },
                select: { id: true, name: true, email: true, role: true },
            });
            res.json(user);
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
);

export default router;
