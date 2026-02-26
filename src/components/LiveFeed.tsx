import { useEffect, useRef, useState } from 'react';
import { getSocket } from '../api/socket';
import type { Incident } from '../types';

interface FeedEvent {
    id: string;
    type: 'created' | 'updated';
    incident: Incident;
    time: Date;
}

interface Props {
    token: string;
}

export default function LiveFeed({ token }: Props) {
    const [events, setEvents] = useState<FeedEvent[]>([]);
    const [connected, setConnected] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const socket = getSocket(token);

        socket.on('connect', () => setConnected(true));
        socket.on('disconnect', () => setConnected(false));

        socket.on('incident:created', (incident: Incident) => {
            setEvents(prev => [{ id: `${Date.now()}`, type: 'created', incident, time: new Date() }, ...prev.slice(0, 29)]);
        });

        socket.on('incident:updated', (incident: Incident) => {
            setEvents(prev => [{ id: `${Date.now()}`, type: 'updated', incident, time: new Date() }, ...prev.slice(0, 29)]);
        });

        return () => {
            socket.off('incident:created');
            socket.off('incident:updated');
            socket.off('connect');
            socket.off('disconnect');
        };
    }, [token]);

    const severityDot: Record<string, string> = {
        LOW: '#10b981', MEDIUM: '#f59e0b', HIGH: '#f97316', CRITICAL: '#ef4444',
    };

    return (
        <div className="live-feed" ref={containerRef}>
            <div className="feed-header">
                <span className="feed-title">Live Feed</span>
                <span className={`feed-dot ${connected ? 'connected' : ''}`} title={connected ? 'Connected' : 'Disconnected'} />
            </div>
            <div className="feed-body">
                {events.length === 0 ? (
                    <div className="feed-empty">Waiting for events…</div>
                ) : (
                    events.map(ev => (
                        <div key={ev.id} className="feed-event slide-in">
                            <span
                                className="feed-sev-dot"
                                style={{ background: severityDot[ev.incident.severity] }}
                            />
                            <div className="feed-event-content">
                                <span className="feed-event-type">
                                    {ev.type === 'created' ? '✦ New' : '↻ Updated'}
                                </span>
                                <span className="feed-event-title">{ev.incident.title}</span>
                                <span className="feed-event-time">
                                    {ev.time.toLocaleTimeString()}
                                </span>
                            </div>
                        </div>
                    ))
                )}
            </div>
            <style>{feedStyles}</style>
        </div>
    );
}

const feedStyles = `
.live-feed {
  position: fixed;
  right: 0;
  top: 0;
  bottom: 0;
  width: 260px;
  background: var(--bg-surface);
  border-left: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  z-index: 5;
}
.feed-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 16px;
  border-bottom: 1px solid var(--border);
  font-weight: 600;
  font-size: 0.875rem;
}
.feed-title { color: var(--text-primary); }
.feed-dot {
  width: 8px; height: 8px;
  border-radius: 50%;
  background: var(--text-muted);
  transition: background var(--transition);
}
.feed-dot.connected { background: #10b981; box-shadow: 0 0 8px rgba(16,185,129,0.5); animation: pulse 2s ease infinite; }
.feed-body { flex: 1; overflow-y: auto; padding: 12px 8px; display: flex; flex-direction: column; gap: 6px; }
.feed-empty { color: var(--text-muted); font-size: 0.8125rem; text-align: center; margin-top: 24px; }
.feed-event {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 10px 8px;
  border-radius: var(--radius-sm);
  background: var(--bg-card);
  border: 1px solid var(--border);
  transition: border-color var(--transition);
}
.feed-event:hover { border-color: var(--border-active); }
.feed-sev-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; margin-top: 5px; }
.feed-event-content { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.feed-event-type { font-size: 0.7rem; font-weight: 600; color: var(--indigo-light); text-transform: uppercase; letter-spacing: 0.05em; }
.feed-event-title { font-size: 0.8125rem; color: var(--text-primary); font-weight: 500; line-height: 1.3; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.feed-event-time { font-size: 0.7rem; color: var(--text-muted); font-family: 'JetBrains Mono', monospace; }

@media (max-width: 1100px) { .live-feed { display: none; } }
`;
