import type { User } from '../store/authStore';

export type Severity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type Status = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
export type Role = 'ADMIN' | 'RESPONDER' | 'VIEWER';

export interface Incident {
    id: string;
    title: string;
    description: string;
    severity: Severity;
    status: Status;
    createdAt: string;
    updatedAt: string;
    createdBy: Pick<User, 'id' | 'name' | 'email' | 'role'>;
    assignedTo?: Pick<User, 'id' | 'name' | 'email' | 'role'> | null;
}

export interface AuditLog {
    id: string;
    action: string;
    entityType: string;
    entityId: string;
    userId: string;
    metadata?: Record<string, unknown>;
    createdAt: string;
    user: Pick<User, 'id' | 'name' | 'email' | 'role'>;
}

export interface PaginatedResponse<T> {
    [key: string]: T[] | number;
    total: number;
    page: number;
    limit: number;
}
