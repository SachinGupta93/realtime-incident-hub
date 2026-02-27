import { useEffect, useState } from 'react';
import api from '../api/axios';
import type { AuditLog } from '../types';
import { downloadJSON, downloadCSV } from '../lib/export';

export default function AuditLogs() {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const limit = 50;

    useEffect(() => {
        const fetch = async () => {
            setLoading(true);
            try {
                const { data } = await api.get(`/api/audit-logs?page=${page}&limit=${limit}`);
                setLogs(data.logs);
                setTotal(data.total);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetch();
    }, [page]);

    const actionColor: Record<string, string> = {
        CREATE: '#10b981',
        UPDATE: '#3b82f6',
        STATUS_CHANGE: '#f59e0b',
        DELETE: '#ef4444',
    };

    const totalPages = Math.ceil(total / limit);

    return (
        <div className="audit-logs animate-in" style={{ maxWidth: 1000 }}>
            <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                <div>
                    <h1>Audit Logs</h1>
                    <p>{total} total log entries</p>
                </div>
                <div className="flex gap-2">
                    <button className="btn btn-ghost btn-sm" onClick={() => {
                        const flat = logs.map(l => ({
                            id: l.id, action: l.action, entityType: l.entityType, entityId: l.entityId,
                            userName: l.user.name, userRole: l.user.role, createdAt: l.createdAt
                        }));
                        downloadCSV(flat, 'audit-logs');
                    }}>Export CSV</button>
                    <button className="btn btn-ghost btn-sm" onClick={() => downloadJSON(logs, 'audit-logs')}>Export JSON</button>
                </div>
            </div>

            {loading ? (
                <div className="loading-center"><div className="spinner" /></div>
            ) : logs.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon">📋</div>
                    <div className="empty-state-title">No audit logs yet</div>
                    <div className="empty-state-desc">Actions on incidents will appear here</div>
                </div>
            ) : (
                <div className="table-wrapper">
                    <table>
                        <thead>
                            <tr>
                                <th>Time</th>
                                <th>Action</th>
                                <th>Entity</th>
                                <th>Entity ID</th>
                                <th>User</th>
                                <th>Role</th>
                            </tr>
                        </thead>
                        <tbody>
                            {logs.map(log => (
                                <tr key={log.id}>
                                    <td style={{ fontFamily: 'JetBrains Mono', fontSize: '0.75rem', whiteSpace: 'nowrap', color: 'var(--text-muted)' }}>
                                        {new Date(log.createdAt).toLocaleString()}
                                    </td>
                                    <td>
                                        <span
                                            className="badge"
                                            style={{
                                                background: `${actionColor[log.action] ?? '#818cf8'}22`,
                                                color: actionColor[log.action] ?? '#818cf8',
                                            }}
                                        >
                                            {log.action}
                                        </span>
                                    </td>
                                    <td><code>{log.entityType}</code></td>
                                    <td style={{ fontFamily: 'JetBrains Mono', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                        {log.entityId.substring(0, 8)}…
                                    </td>
                                    <td>{log.user.name}</td>
                                    <td><span className={`badge badge-${log.user.role.toLowerCase()}`}>{log.user.role}</span></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {totalPages > 1 && (
                        <div className="pagination">
                            <span>Page {page} of {totalPages}</span>
                            <div className="pagination-controls">
                                <button className="btn btn-ghost btn-sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
                                <button className="btn btn-ghost btn-sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next →</button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
