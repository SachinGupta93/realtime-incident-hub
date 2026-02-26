import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import type { Incident } from '../types';
import { useAuthStore } from '../store/authStore';

interface Stats {
    open: number;
    in_progress: number;
    resolved: number;
    closed: number;
    critical: number;
    high: number;
}

export default function Dashboard() {
    const { user } = useAuthStore();
    const [stats, setStats] = useState<Stats | null>(null);
    const [recent, setRecent] = useState<Incident[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [openR, ipR, resolvedR, closedR, critR, highR, recentR] = await Promise.all([
                    api.get('/api/incidents?status=OPEN&limit=1'),
                    api.get('/api/incidents?status=IN_PROGRESS&limit=1'),
                    api.get('/api/incidents?status=RESOLVED&limit=1'),
                    api.get('/api/incidents?status=CLOSED&limit=1'),
                    api.get('/api/incidents?severity=CRITICAL&limit=1'),
                    api.get('/api/incidents?severity=HIGH&limit=1'),
                    api.get('/api/incidents?limit=5'),
                ]);
                setStats({
                    open: openR.data.total,
                    in_progress: ipR.data.total,
                    resolved: resolvedR.data.total,
                    closed: closedR.data.total,
                    critical: critR.data.total,
                    high: highR.data.total,
                });
                setRecent(recentR.data.incidents);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const statCards = stats ? [
        { label: 'Open', value: stats.open, color: 'var(--status-open)', icon: '🔴' },
        { label: 'In Progress', value: stats.in_progress, color: 'var(--status-inprogress)', icon: '🔵' },
        { label: 'Resolved', value: stats.resolved, color: 'var(--status-resolved)', icon: '✅' },
        { label: 'Critical', value: stats.critical, color: 'var(--sev-critical)', icon: '🚨' },
    ] : [];

    return (
        <div className="dashboard animate-in">
            <div className="page-header">
                <div>
                    <h1>Dashboard</h1>
                    <p>Welcome back, <strong style={{ color: 'var(--text-primary)' }}>{user?.name}</strong></p>
                </div>
                {(user?.role === 'ADMIN' || user?.role === 'RESPONDER') && (
                    <Link to="/incidents/new" className="btn btn-primary">
                        + New Incident
                    </Link>
                )}
            </div>

            {loading ? (
                <div className="loading-center"><div className="spinner" /></div>
            ) : (
                <>
                    <div className="stat-grid">
                        {statCards.map(s => (
                            <div key={s.label} className="stat-card card">
                                <div className="stat-icon">{s.icon}</div>
                                <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
                                <div className="stat-label">{s.label}</div>
                            </div>
                        ))}
                    </div>

                    <div className="recent-section">
                        <div className="flex justify-between items-center" style={{ marginBottom: 16 }}>
                            <h2>Recent Incidents</h2>
                            <Link to="/incidents" className="btn btn-ghost btn-sm">View all →</Link>
                        </div>
                        {recent.length === 0 ? (
                            <div className="empty-state">
                                <div className="empty-state-icon">📭</div>
                                <div className="empty-state-title">No incidents yet</div>
                                <div className="empty-state-desc">Create the first incident to get started</div>
                            </div>
                        ) : (
                            <div className="table-wrapper">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Title</th>
                                            <th>Severity</th>
                                            <th>Status</th>
                                            <th>Created By</th>
                                            <th>Date</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {recent.map(inc => (
                                            <tr key={inc.id}>
                                                <td>
                                                    <Link to={`/incidents/${inc.id}`} style={{ color: 'var(--indigo-light)' }}>
                                                        {inc.title}
                                                    </Link>
                                                </td>
                                                <td><span className={`badge badge-${inc.severity.toLowerCase()}`}>{inc.severity}</span></td>
                                                <td><span className={`badge badge-${inc.status.toLowerCase()}`}>{inc.status.replace('_', ' ')}</span></td>
                                                <td>{inc.createdBy.name}</td>
                                                <td style={{ fontFamily: 'JetBrains Mono', fontSize: '0.8rem' }}>
                                                    {new Date(inc.createdAt).toLocaleDateString()}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </>
            )}
            <style>{dashStyles}</style>
        </div>
    );
}

const dashStyles = `
.dashboard { max-width: 960px; }
.page-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 32px; gap: 16px; }
.stat-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; margin-bottom: 32px; }
.stat-card { display: flex; flex-direction: column; gap: 8px; }
.stat-icon { font-size: 1.5rem; }
.stat-value { font-size: 2.5rem; font-weight: 700; line-height: 1; }
.stat-label { font-size: 0.875rem; color: var(--text-muted); font-weight: 500; text-transform: uppercase; letter-spacing: 0.05em; }
.recent-section {}
`;
