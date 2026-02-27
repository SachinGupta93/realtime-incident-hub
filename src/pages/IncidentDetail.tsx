import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuthStore } from '../store/authStore';
import { getSocket } from '../api/socket';
import type { Incident, Status } from '../types';
import Comments from '../components/Comments';

const STATUS_FLOW: Record<Status, Status[]> = {
    OPEN: ['IN_PROGRESS'],
    IN_PROGRESS: ['RESOLVED'],
    RESOLVED: ['CLOSED'],
    CLOSED: [],
};

export default function IncidentDetail() {
    const { id } = useParams<{ id: string }>();
    const { user, accessToken } = useAuthStore();
    const navigate = useNavigate();
    const canMutate = user?.role === 'ADMIN' || user?.role === 'RESPONDER';
    const isAdmin = user?.role === 'ADMIN';

    const [incident, setIncident] = useState<Incident | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [updating, setUpdating] = useState(false);
    const [editing, setEditing] = useState(false);
    const [editForm, setEditForm] = useState({ title: '', description: '', severity: '', assignedToId: '' as string | null });
    const [users, setUsers] = useState<Array<{ id: string; name: string; role: string }>>([]);

    const fetchIncident = async () => {
        try {
            const { data } = await api.get(`/api/incidents/${id}`);
            setIncident(data);
            setEditForm({ title: data.title, description: data.description, severity: data.severity, assignedToId: data.assignedTo?.id ?? null });
        } catch {
            setError('Incident not found');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchIncident(); }, [id]);

    // Fetch users for assignment dropdown when editing
    useEffect(() => {
        if (editing && isAdmin && users.length === 0) {
            api.get('/api/users').then(({ data }) => setUsers(data)).catch(() => {});
        }
    }, [editing, isAdmin]);

    // Live updates
    useEffect(() => {
        if (!accessToken) return;
        const socket = getSocket(accessToken);
        socket.on('incident:updated', (updated: Incident) => {
            if (updated.id === id) setIncident(updated);
        });
        return () => { socket.off('incident:updated'); };
    }, [accessToken, id]);

    const changeStatus = async (newStatus: Status) => {
        if (!canMutate) return;
        setUpdating(true);
        try {
            const { data } = await api.patch(`/api/incidents/${id}/status`, { status: newStatus });
            setIncident(data);
        } catch {
            setError('Failed to update status');
        } finally {
            setUpdating(false);
        }
    };

    const saveEdit = async (e: React.FormEvent) => {
        e.preventDefault();
        setUpdating(true);
        try {
            const payload: Record<string, unknown> = {
                title: editForm.title,
                description: editForm.description,
                severity: editForm.severity,
            };
            if (isAdmin) payload.assignedToId = editForm.assignedToId || null;
            const { data } = await api.patch(`/api/incidents/${id}`, payload);
            setIncident(data);
            setEditing(false);
        } catch {
            setError('Failed to update incident');
        } finally {
            setUpdating(false);
        }
    };

    const closeIncident = async () => {
        if (!isAdmin) return;
        if (!confirm('Close this incident? This will mark it as CLOSED.')) return;
        setUpdating(true);
        try {
            await api.delete(`/api/incidents/${id}`);
            navigate('/incidents');
        } catch {
            setError('Failed to close incident');
        } finally {
            setUpdating(false);
        }
    };

    if (loading) return <div className="loading-center"><div className="spinner" /></div>;
    if (error || !incident) return <div className="alert alert-error">{error || 'Not found'}</div>;

    const nextStatuses = STATUS_FLOW[incident.status];

    return (
        <div className="incident-detail animate-in">
            <div className="detail-header">
                <div>
                    <Link to="/incidents" className="btn btn-ghost btn-sm" style={{ marginBottom: 12 }}>← Back</Link>
                    {editing ? (
                        <input
                            className="form-input detail-title-input"
                            value={editForm.title}
                            onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))}
                        />
                    ) : (
                        <h1 className="detail-title">{incident.title}</h1>
                    )}
                </div>
                <div className="detail-actions">
                    {canMutate && !editing && <button className="btn btn-secondary btn-sm" onClick={() => setEditing(true)}>Edit</button>}
                    {isAdmin && incident.status !== 'CLOSED' && (
                        <button className="btn btn-danger btn-sm" onClick={closeIncident} disabled={updating}>Close</button>
                    )}
                </div>
            </div>

            {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}

            <div className="detail-grid">
                {/* Main content */}
                <div>
                    <div className="card" style={{ marginBottom: 16 }}>
                        <h3 style={{ marginBottom: 12 }}>Description</h3>
                        {editing ? (
                            <textarea
                                className="form-input"
                                style={{ minHeight: 120 }}
                                value={editForm.description}
                                onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
                            />
                        ) : (
                            <p style={{ whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>{incident.description}</p>
                        )}
                        {editing && (
                            <div className="flex gap-2" style={{ marginTop: 16 }}>
                                <button className="btn btn-primary btn-sm" onClick={saveEdit} disabled={updating}>Save Changes</button>
                                <button className="btn btn-ghost btn-sm" onClick={() => setEditing(false)}>Cancel</button>
                            </div>
                        )}
                    </div>

                    {/* Status workflow */}
                    {canMutate && nextStatuses.length > 0 && (
                        <div className="card">
                            <h3 style={{ marginBottom: 12 }}>Status Transition</h3>
                            <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
                                {nextStatuses.map(s => (
                                    <button
                                        key={s}
                                        className="btn btn-secondary"
                                        onClick={() => changeStatus(s)}
                                        disabled={updating}
                                    >
                                        → {s.replace('_', ' ')}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Comments */}
                    <div className="card" style={{ marginTop: 16 }}>
                        <Comments incidentId={id!} />
                    </div>
                </div>

                {/* Sidebar info */}
                <div>
                    <div className="card">
                        <h3 style={{ marginBottom: 16 }}>Details</h3>
                        <dl className="detail-list">
                            <dt>Status</dt>
                            <dd><span className={`badge badge-${incident.status.toLowerCase()}`}>{incident.status.replace('_', ' ')}</span></dd>

                            <dt>Severity</dt>
                            <dd>
                                {editing ? (
                                    <select
                                        className="form-input"
                                        value={editForm.severity}
                                        onChange={e => setEditForm(f => ({ ...f, severity: e.target.value }))}
                                    >
                                        {['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map(s => <option key={s}>{s}</option>)}
                                    </select>
                                ) : (
                                    <span className={`badge badge-${incident.severity.toLowerCase()}`}>{incident.severity}</span>
                                )}
                            </dd>

                            <dt>Created By</dt>
                            <dd>{incident.createdBy.name} <span className={`badge badge-${incident.createdBy.role.toLowerCase()}`}>{incident.createdBy.role}</span></dd>

                            <dt>Assigned To</dt>
                            <dd>
                                {editing && isAdmin ? (
                                    <select
                                        className="form-input"
                                        value={editForm.assignedToId ?? ''}
                                        onChange={e => setEditForm(f => ({ ...f, assignedToId: e.target.value || null }))}
                                    >
                                        <option value="">Unassigned</option>
                                        {users.filter(u => u.role !== 'VIEWER').map(u => (
                                            <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                                        ))}
                                    </select>
                                ) : (
                                    incident.assignedTo?.name ?? <span style={{ color: 'var(--text-muted)' }}>Unassigned</span>
                                )}
                            </dd>

                            <dt>Created</dt>
                            <dd style={{ fontFamily: 'JetBrains Mono', fontSize: '0.8rem' }}>{new Date(incident.createdAt).toLocaleString()}</dd>

                            <dt>Updated</dt>
                            <dd style={{ fontFamily: 'JetBrains Mono', fontSize: '0.8rem' }}>{new Date(incident.updatedAt).toLocaleString()}</dd>
                        </dl>
                    </div>
                </div>
            </div>

            <style>{detailStyles}</style>
        </div>
    );
}

const detailStyles = `
.incident-detail { max-width: 960px; }
.detail-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; margin-bottom: 24px; flex-wrap: wrap; }
.detail-title { font-size: 1.625rem; line-height: 1.25; }
.detail-title-input { font-size: 1.5rem; font-weight: 600; }
.detail-actions { display: flex; gap: 8px; align-items: center; flex-shrink: 0; }
.detail-grid { display: grid; grid-template-columns: 1fr 300px; gap: 20px; }
@media (max-width: 768px) { .detail-grid { grid-template-columns: 1fr; } }
.detail-list { display: grid; grid-template-columns: auto 1fr; gap: 10px 16px; align-items: center; }
dt { font-size: 0.8125rem; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.04em; }
dd { display: flex; gap: 6px; align-items: center; flex-wrap: wrap; }
`;
