import { createContext, useContext, useState, useCallback, useRef } from 'react';

export type ToastType = 'info' | 'success' | 'warning' | 'error';

interface Toast {
    id: number;
    type: ToastType;
    title: string;
    message?: string;
}

interface ToastContextValue {
    addToast: (type: ToastType, title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextValue>({ addToast: () => {} });

export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);
    const nextId = useRef(0);

    const removeToast = useCallback((id: number) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const addToast = useCallback((type: ToastType, title: string, message?: string) => {
        const id = nextId.current++;
        setToasts(prev => [...prev, { id, type, title, message }]);
        setTimeout(() => removeToast(id), 5000);
    }, [removeToast]);

    return (
        <ToastContext.Provider value={{ addToast }}>
            {children}

            {/* Toast container */}
            <div className="toast-container">
                {toasts.map(toast => (
                    <div key={toast.id} className={`toast toast-${toast.type}`}>
                        <div className="toast-icon">
                            {toast.type === 'success' ? '✓' : toast.type === 'error' ? '✕' : toast.type === 'warning' ? '⚠' : 'ℹ'}
                        </div>
                        <div className="toast-body">
                            <div className="toast-title">{toast.title}</div>
                            {toast.message && <div className="toast-message">{toast.message}</div>}
                        </div>
                        <button className="toast-close" onClick={() => removeToast(toast.id)}>✕</button>
                    </div>
                ))}
            </div>

            <style>{toastStyles}</style>
        </ToastContext.Provider>
    );
}

const toastStyles = `
.toast-container {
    position: fixed;
    top: 16px;
    right: 16px;
    z-index: 10000;
    display: flex;
    flex-direction: column;
    gap: 8px;
    max-width: 380px;
}
.toast {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: 12px 14px;
    border-radius: 10px;
    background: var(--bg-surface);
    border: 1px solid var(--border);
    box-shadow: 0 8px 24px rgba(0,0,0,0.25);
    animation: toast-slide-in 0.3s ease;
    min-width: 280px;
}
@keyframes toast-slide-in {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
}
.toast-icon {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.75rem;
    font-weight: 700;
    flex-shrink: 0;
}
.toast-success .toast-icon { background: rgba(16,185,129,0.15); color: #10b981; }
.toast-error .toast-icon { background: rgba(239,68,68,0.15); color: #ef4444; }
.toast-warning .toast-icon { background: rgba(245,158,11,0.15); color: #f59e0b; }
.toast-info .toast-icon { background: rgba(59,130,246,0.15); color: #3b82f6; }
.toast-body { flex: 1; min-width: 0; }
.toast-title { font-size: 0.85rem; font-weight: 600; color: var(--text-primary); }
.toast-message { font-size: 0.78rem; color: var(--text-muted); margin-top: 2px; }
.toast-close { background: none; border: none; color: var(--text-muted); cursor: pointer; font-size: 0.7rem; padding: 2px; flex-shrink: 0; }
.toast-close:hover { color: var(--text-primary); }
`;
