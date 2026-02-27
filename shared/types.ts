// Shared types used by both server and client

export type Severity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type Status = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
export type Role = 'ADMIN' | 'RESPONDER' | 'VIEWER';

export interface UserInfo {
    id: string;
    name: string;
    email: string;
    role: Role;
    createdAt?: string;
}

export interface Incident {
    id: string;
    title: string;
    description: string;
    severity: Severity;
    status: Status;
    createdAt: string;
    updatedAt: string;
    createdBy: Pick<UserInfo, 'id' | 'name' | 'email' | 'role'>;
    assignedTo?: Pick<UserInfo, 'id' | 'name' | 'email' | 'role'> | null;
}

export interface AuditLog {
    id: string;
    action: string;
    entityType: string;
    entityId: string;
    userId: string;
    metadata?: Record<string, unknown>;
    createdAt: string;
    user: Pick<UserInfo, 'id' | 'name' | 'email' | 'role'>;
}

export interface Comment {
    id: string;
    content: string;
    incidentId: string;
    createdAt: string;
    updatedAt: string;
    user: Pick<UserInfo, 'id' | 'name' | 'email' | 'role'>;
}

export interface PaginatedResponse<T> {
    [key: string]: T[] | number;
    total: number;
    page: number;
    limit: number;
}

export interface TokenPayload {
    userId: string;
    email: string;
    role: string;
}
