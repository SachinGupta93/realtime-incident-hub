import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import api from '../api/axios';
import LiveFeed from './LiveFeed';

const navItems = [
    { to: '/', label: 'Dashboard', icon: '◈', end: true },
    { to: '/incidents', label: 'Incidents', icon: '⚠' },
    { to: '/audit-logs', label: 'Audit Logs', icon: '📋', adminOnly: true },
];

export default function Layout() {
    const { user, logout, accessToken } = useAuthStore();
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(true);

    const handleLogout = async () => {
        try {
            const { refreshToken } = useAuthStore.getState();
            await api.post('/api/auth/logout', { refreshToken });
        } catch {
            // ignore
        } finally {
            logout();
            navigate('/login');
        }
    };

    const filteredNav = navItems.filter(n => !n.adminOnly || user?.role === 'ADMIN');

    return (
        <div className="app-shell">
            {/* Sidebar */}
            <aside className={`sidebar ${sidebarOpen ? 'open' : 'collapsed'}`}>
                <div className="sidebar-header">
                    <span className="logo-icon">⚡</span>
                    {sidebarOpen && <span className="logo-text">Incident Hub</span>}
                </div>

                <nav className="sidebar-nav">
                    {filteredNav.map(item => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            end={item.end}
                            className={({ isActive }) =>
                                `nav-item ${isActive ? 'nav-item--active' : ''}`
                            }
                        >
                            <span className="nav-icon">{item.icon}</span>
                            {sidebarOpen && <span className="nav-label">{item.label}</span>}
                        </NavLink>
                    ))}
                </nav>

                <div className="sidebar-footer">
                    {user && (
                        <div className="user-info">
                            <div className="user-avatar">{user.name[0].toUpperCase()}</div>
                            {sidebarOpen && (
                                <div className="user-details">
                                    <span className="user-name">{user.name}</span>
                                    <span className={`badge badge-${user.role.toLowerCase()}`}>{user.role}</span>
                                </div>
                            )}
                        </div>
                    )}
                    <button
                        className="btn btn-ghost btn-icon"
                        onClick={handleLogout}
                        title="Sign out"
                    >
                        ⎋
                    </button>
                </div>
            </aside>

            {/* Toggle button */}
            <button
                className="sidebar-toggle"
                onClick={() => setSidebarOpen(o => !o)}
                title={sidebarOpen ? 'Collapse' : 'Expand'}
            >
                {sidebarOpen ? '‹' : '›'}
            </button>

            {/* Main content */}
            <main className="main-content">
                <Outlet />
            </main>

            {/* Live feed */}
            {accessToken && <LiveFeed token={accessToken} />}

            <style>{layoutStyles}</style>
        </div>
    );
}

const layoutStyles = `
.app-shell {
  display: flex;
  min-height: 100vh;
  position: relative;
}
.sidebar {
  display: flex;
  flex-direction: column;
  background: var(--bg-surface);
  border-right: 1px solid var(--border);
  transition: width var(--transition-slow);
  flex-shrink: 0;
  overflow: hidden;
}
.sidebar.open { width: 220px; }
.sidebar.collapsed { width: 64px; }

.sidebar-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 20px 16px;
  border-bottom: 1px solid var(--border);
  min-height: 64px;
}
.logo-icon { font-size: 1.5rem; flex-shrink: 0; }
.logo-text { font-size: 1.1rem; font-weight: 700; background: linear-gradient(135deg, #f0f1f5, #818cf8); -webkit-background-clip: text; -webkit-text-fill-color: transparent; white-space: nowrap; }

.sidebar-nav {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px 8px;
}
.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  border-radius: var(--radius-sm);
  color: var(--text-secondary);
  transition: all var(--transition);
  text-decoration: none;
  white-space: nowrap;
  overflow: hidden;
}
.nav-item:hover { background: var(--bg-elevated); color: var(--text-primary); }
.nav-item--active { background: var(--indigo-glow); color: var(--indigo-light); border: 1px solid var(--border-active); }
.nav-icon { font-size: 1.1rem; flex-shrink: 0; width: 24px; text-align: center; }
.nav-label { font-size: 0.9rem; font-weight: 500; }

.sidebar-footer {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px 8px;
  border-top: 1px solid var(--border);
}
.user-info { display: flex; align-items: center; gap: 10px; flex: 1; overflow: hidden; }
.user-avatar {
  width: 34px; height: 34px;
  background: linear-gradient(135deg, var(--indigo), var(--indigo-dark));
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.875rem;
  color: white;
  flex-shrink: 0;
}
.user-details { display: flex; flex-direction: column; gap: 2px; overflow: hidden; }
.user-name { font-size: 0.8125rem; font-weight: 500; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

.sidebar-toggle {
  position: fixed;
  left: 0;
  bottom: 50%;
  transform: translateY(50%);
  z-index: 10;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-left: none;
  border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
  width: 18px;
  height: 40px;
  cursor: pointer;
  color: var(--text-muted);
  font-size: 1rem;
  transition: all var(--transition);
  display: flex;
  align-items: center;
  justify-content: center;
}
.sidebar.open ~ .sidebar-toggle { left: 220px; }
.sidebar.collapsed ~ .sidebar-toggle { left: 64px; }
.sidebar-toggle:hover { background: var(--bg-elevated); color: var(--text-primary); }

.main-content {
  flex: 1;
  overflow-y: auto;
  padding: 32px;
  min-width: 0;
}

@media (max-width: 768px) {
  .sidebar { width: 0 !important; }
  .main-content { padding: 16px; }
}
`;
