import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuthStore } from '../store/authStore';

interface UserOption { id: string; name: string; role: string; }

export default function NewIncident() {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const isAdmin = user?.role === 'ADMIN';
    const [users, setUsers] = useState<UserOption[]>([]);
    const [form, setForm] = useState({
        title: '',
        description: '',
        severity: 'MEDIUM',
        assignedToId: '',
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isAdmin) {
            api.get('/api/users').then(({ data }) => setUsers(data)).catch(() => {});
        }
    }, [isAdmin]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const payload: Record<string, string> = { title: form.title, description: form.description, severity: form.severity };
            if (form.assignedToId) payload.assignedToId = form.assignedToId;
            const { data } = await api.post('/api/incidents', payload);
            navigate(`/incidents/${data.id}`);
        } catch (err: unknown) {
            const errData = err as { response?: { data?: { error?: string, details?: Array<{ message: string }> } } };
            setError(
                errData?.response?.data?.details?.[0]?.message ??
                errData?.response?.data?.error ??
                'Failed to create incident'
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="new-incident animate-in">
            <Link to="/incidents" className="btn btn-ghost btn-sm" style={{ marginBottom: 20 }}>← Back</Link>
            <h1 style={{ marginBottom: 4 }}>New Incident</h1>
            <p style={{ marginBottom: 28 }}>Report a new incident to the team</p>

            {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}

            <div className="card" style={{ maxWidth: 600 }}>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    <div className="form-group">
                        <label className="form-label" htmlFor="inc-title">Title *</label>
                        <input
                            id="inc-title"
                            type="text"
                            className="form-input"
                            placeholder="Brief description of the incident"
                            value={form.title}
                            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                            required
                            minLength={3}
                            autoFocus
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label" htmlFor="inc-desc">Description *</label>
                        <textarea
                            id="inc-desc"
                            className="form-input"
                            placeholder="Detailed description, impact, steps to reproduce…"
                            value={form.description}
                            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                            required
                            minLength={10}
                            style={{ minHeight: 140 }}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label" htmlFor="inc-sev">Severity</label>
                        <select
                            id="inc-sev"
                            className="form-input"
                            value={form.severity}
                            onChange={e => setForm(f => ({ ...f, severity: e.target.value }))}
                        >
                            <option value="LOW">Low — Minor issue, minimal impact</option>
                            <option value="MEDIUM">Medium — Moderate impact on users</option>
                            <option value="HIGH">High — Significant service disruption</option>
                            <option value="CRITICAL">Critical — Complete outage</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label className="form-label" htmlFor="inc-assign">Assign To</label>
                        <select
                            id="inc-assign"
                            className="form-input"
                            value={form.assignedToId}
                            onChange={e => setForm(f => ({ ...f, assignedToId: e.target.value }))}
                        >
                            <option value="">Unassigned</option>
                            {users.filter(u => u.role !== 'VIEWER').map(u => (
                                <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex gap-3">
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? <><span className="spinner" style={{ width: 16, height: 16 }} /> Creating…</> : 'Create Incident'}
                        </button>
                        <Link to="/incidents" className="btn btn-ghost">Cancel</Link>
                    </div>
                </form>
            </div>
            <style>{`.new-incident { max-width: 680px; }`}</style>
        </div>
    );
}
