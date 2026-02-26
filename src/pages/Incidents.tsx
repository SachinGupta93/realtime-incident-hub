import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuthStore } from '../store/authStore';
import type { Incident, Status, Severity } from '../types';
import { getSocket } from '../api/socket';

const STATUS_OPTIONS: Status[] = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];
const SEV_OPTIONS: Severity[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

export default function Incidents() {
    const { user, accessToken } = useAuthStore();
    const navigate = useNavigate();
    const canMutate = user?.role === 'ADMIN' || user?.role === 'RESPONDER';

    const [incidents, setIncidents] = useState<Incident[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [status, setStatus] = useState('');
    const [severity, setSeverity] = useState('');
    const [loading, setLoading] = useState(true);

    const limit = 15;

    const fetchIncidents = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ page: String(page), limit: String(limit) });
            if (status) params.set('status', status);
            if (severity) params.set('severity', severity);
            const { data } = await api.get(`/api/incidents?${params}`);
            setIncidents(data.incidents);
            setTotal(data.total);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [page, status, severity]);

    useEffect(() => { fetchIncidents(); }, [fetchIncidents]);

    // Live updates via Socket.IO
    useEffect(() => {
        if (!accessToken) return;
        const socket = getSocket(accessToken);
        const refresh = () => fetchIncidents();
        socket.on('incident:created', refresh);
        socket.on('incident:updated', refresh);
        return () => {
            socket.off('incident:created', refresh);
            socket.off('incident:updated', refresh);
        };
    }, [accessToken, fetchIncidents]);

    const totalPages = Math.ceil(total / limit);

    return (
        <div className="incidents-page animate-in">
            <div className="page-header" style={{ marginBottom: 24 }}>
                <div>
                    <h1>Incidents</h1>
                    <p>{total} total incidents</p>
                </div>
                {canMutate && (
                    <Link to="/incidents/new" className="btn btn-primary">+ New Incident</Link>
                )}
            </div>

            {/* Filters */}
            <div className="filters-row">
                <select className="form-input" style={{ width: 'auto', minWidth: 140 }} value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}>
                    <option value="">All Statuses</option>
                    {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                </select>
                <select className="form-input" style={{ width: 'auto', minWidth: 140 }} value={severity} onChange={e => { setSeverity(e.target.value); setPage(1); }}>
                    <option value="">All Severities</option>
                    {SEV_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <button className="btn btn-ghost btn-sm" onClick={() => { setStatus(''); setSeverity(''); setPage(1); }}>Reset</button>
            </div>

            {loading ? (
                <div className="loading-center"><div className="spinner" /></div>
            ) : incidents.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon">📭</div>
                    <div className="empty-state-title">No incidents found</div>
                    <div className="empty-state-desc">Try adjusting your filters or create a new incident</div>
                </div>
            ) : (
                <div className="table-wrapper">
                    <table>
                        <thead>
                            <tr>
                                <th>Title</th>
                                <th>Severity</th>
                                <th>Status</th>
                                <th>Assigned To</th>
                                <th>Created By</th>
                                <th>Updated</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {incidents.map(inc => (
                                <tr key={inc.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/incidents/${inc.id}`)}>
                                    <td style={{ maxWidth: 240 }}>{inc.title}</td>
                                    <td><span className={`badge badge-${inc.severity.toLowerCase()}`}>{inc.severity}</span></td>
                                    <td><span className={`badge badge-${inc.status.toLowerCase()}`}>{inc.status.replace('_', ' ')}</span></td>
                                    <td>{inc.assignedTo?.name ?? <span style={{ color: 'var(--text-muted)' }}>Unassigned</span>}</td>
                                    <td>{inc.createdBy.name}</td>
                                    <td style={{ fontFamily: 'JetBrains Mono', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                        {new Date(inc.updatedAt).toLocaleDateString()}
                                    </td>
                                    <td onClick={e => e.stopPropagation()}>
                                        <Link to={`/incidents/${inc.id}`} className="btn btn-ghost btn-sm">View</Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {totalPages > 1 && (
                        <div className="pagination">
                            <span>Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}</span>
                            <div className="pagination-controls">
                                <button className="btn btn-ghost btn-sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
                                <button className="btn btn-ghost btn-sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next →</button>
                            </div>
                        </div>
                    )}
                </div>
            )}
            <style>{`.incidents-page { max-width: 1000px; } .filters-row { display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 20px; align-items: center; }`}</style>
        </div>
    );
}
