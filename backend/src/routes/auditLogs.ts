import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';

const router = Router();

// GET /api/audit-logs  — admin only
router.get(
    '/',
    authenticate,
    requireRole('ADMIN'),
    async (req: AuthRequest, res: Response): Promise<void> => {
        try {
            const { page = '1', limit = '50', entityType, userId } = req.query as Record<string, string>;
            const skip = (parseInt(page) - 1) * parseInt(limit);

            const where: Record<string, unknown> = {};
            if (entityType) where.entityType = entityType;
            if (userId) where.userId = userId;

            const [logs, total] = await Promise.all([
                prisma.auditLog.findMany({
                    where,
                    include: {
                        user: { select: { id: true, name: true, email: true, role: true } },
                    },
                    orderBy: { createdAt: 'desc' },
                    skip,
                    take: parseInt(limit),
                }),
                prisma.auditLog.count({ where }),
            ]);

            res.json({ logs, total, page: parseInt(page), limit: parseInt(limit) });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
);

export default router;
