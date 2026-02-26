import type { Response, NextFunction } from 'express';
import type { AuthRequest } from './auth.js';
import { prisma } from '../lib/prisma.js';

export function auditAction(action: string, entityType: string) {
    return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
        const originalJson = res.json.bind(res);

        res.json = (body: unknown) => {
            // After response, log the action asynchronously
            if (res.statusCode >= 200 && res.statusCode < 300 && req.user) {
                const entityId = (req.params.id as string) || (body as Record<string, string>)?.id;
                if (entityId) {
                    prisma.auditLog
                        .create({
                            data: {
                                action,
                                entityType,
                                entityId,
                                userId: req.user.userId,
                                metadata: {
                                    method: req.method,
                                    path: req.path,
                                    body: req.body as Record<string, unknown>,
                                } as unknown as Record<string, string>,
                            },
                        })
                        .catch(console.error);
                }
            }
            return originalJson(body);
        };

        next();
    };
}
