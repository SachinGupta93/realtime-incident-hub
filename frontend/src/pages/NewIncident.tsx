import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';

export default function NewIncident() {
    const navigate = useNavigate();
    const [form, setForm] = useState({
        title: '',
        description: '',
        severity: 'MEDIUM',
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const { data } = await api.post('/api/incidents', form);
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
