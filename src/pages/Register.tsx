import React, { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuthStore } from '../store/authStore';
import type { User } from '../store/authStore';

export default function Register() {
    const { isAuthenticated, setAuth } = useAuthStore();
    const navigate = useNavigate();
    const [form, setForm] = useState({ name: '', email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    if (isAuthenticated) return <Navigate to="/" replace />;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const { data } = await api.post('/api/auth/register', form);
            setAuth(data.user as User, data.accessToken, data.refreshToken);
            navigate('/');
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
            setError(msg ?? 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-bg" />
            <div className="auth-card card card-glass animate-in">
                <div className="auth-logo">
                    <span className="auth-logo-icon">⚡</span>
                    <h1 className="auth-title">Incident Hub</h1>
                    <p className="auth-subtitle">Create your account</p>
                </div>

                {error && <div className="alert alert-error">{error}</div>}

                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="form-group">
                        <label className="form-label" htmlFor="reg-name">Full Name</label>
                        <input
                            id="reg-name"
                            type="text"
                            className="form-input"
                            placeholder="Jane Doe"
                            value={form.name}
                            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                            required
                            autoFocus
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label" htmlFor="reg-email">Email</label>
                        <input
                            id="reg-email"
                            type="email"
                            className="form-input"
                            placeholder="you@example.com"
                            value={form.email}
                            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label" htmlFor="reg-password">Password</label>
                        <input
                            id="reg-password"
                            type="password"
                            className="form-input"
                            placeholder="Min. 6 characters"
                            value={form.password}
                            onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                            required
                            minLength={6}
                        />
                    </div>
                    <button type="submit" className="btn btn-primary btn-lg w-full" disabled={loading}>
                        {loading ? <><span className="spinner" style={{ width: 18, height: 18 }} /> Creating account…</> : 'Create Account'}
                    </button>
                </form>

                <p className="auth-footer">
                    Already have an account? <a href="/login">Sign in</a>
                </p>
            </div>
            <style>{`
.auth-page { min-height:100vh; display:flex; align-items:center; justify-content:center; position:relative; overflow:hidden; }
.auth-bg { position:fixed; inset:0; background: radial-gradient(ellipse at 30% 20%, rgba(99,102,241,0.12) 0%, transparent 60%), radial-gradient(ellipse at 80% 80%, rgba(99,102,241,0.06) 0%, transparent 50%); pointer-events:none; }
.auth-card { width:100%; max-width:420px; margin:24px; display:flex; flex-direction:column; gap:24px; position:relative; z-index:1; }
.auth-logo { text-align:center; }
.auth-logo-icon { font-size:2.5rem; display:block; margin-bottom:8px; }
.auth-title { font-size:1.75rem; background:linear-gradient(135deg,#f0f1f5 0%,#818cf8 100%); -webkit-background-clip:text; -webkit-text-fill-color:transparent; }
.auth-subtitle { color:var(--text-muted); font-size:0.9rem; margin-top:4px; }
.auth-form { display:flex; flex-direction:column; gap:16px; }
.auth-footer { text-align:center; font-size:0.875rem; color:var(--text-muted); }
            `}</style>
        </div>
    );
}
