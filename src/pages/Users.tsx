import { useEffect, useState } from 'react';
import api from '../api/axios';
import type { Role } from '../types';

interface UserRow {
    id: string;
    name: string;
    email: string;
    role: Role;
    createdAt: string;
}

const ROLES: Role[] = ['ADMIN', 'RESPONDER', 'VIEWER'];

export default function Users() {
    const [users, setUsers] = useState<UserRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState<string | null>(null);

    const fetchUsers = async () => {
        try {
            const { data } = await api.get('/api/users');
            setUsers(data);
        } catch (err) {
            console.error('Failed to fetch users', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchUsers(); }, []);

    const changeRole = async (userId: string, newRole: Role) => {
        setUpdating(userId);
        try {
            const { data } = await api.patch(`/api/users/${userId}/role`, { role: newRole });
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: data.role } : u));
        } catch (err) {
            console.error('Failed to update role', err);
        } finally {
            setUpdating(null);
        }
    };

    if (loading) return <div className="loading-center"><div className="spinner" /></div>;

    return (
        <div className="users-page animate-in">
            <div className="page-header" style={{ marginBottom: 24 }}>
                <div>
                    <h1>User Management</h1>
                    <p>{users.length} registered users</p>
                </div>
            </div>

            <div className="table-wrapper">
                <table>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Role</th>
                            <th>Joined</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(u => (
                            <tr key={u.id}>
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                        <div style={{
                                            width: 32, height: 32, borderRadius: '50%',
                                            background: 'var(--accent)', color: '#fff',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: '0.75rem', fontWeight: 700, flexShrink: 0
                                        }}>
                                            {u.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)}
                                        </div>
                                        {u.name}
                                    </div>
                                </td>
                                <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{u.email}</td>
                                <td><span className={`badge badge-${u.role.toLowerCase()}`}>{u.role}</span></td>
                                <td style={{ fontFamily: 'JetBrains Mono', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                    {new Date(u.createdAt).toLocaleDateString()}
                                </td>
                                <td>
                                    <select
                                        className="form-input"
                                        style={{ width: 'auto', minWidth: 130, fontSize: '0.8rem', padding: '4px 8px' }}
                                        value={u.role}
                                        onChange={e => changeRole(u.id, e.target.value as Role)}
                                        disabled={updating === u.id}
                                    >
                                        {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                                    </select>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <style>{`.users-page { max-width: 900px; }`}</style>
        </div>
    );
}
