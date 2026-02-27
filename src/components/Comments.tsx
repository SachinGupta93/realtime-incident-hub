import React, { useEffect, useState, useRef } from 'react';
import api from '../api/axios';
import { getSocket } from '../api/socket';
import { useAuthStore } from '../store/authStore';
import type { Comment } from '../types';

interface Props {
    incidentId: string;
}

export default function Comments({ incidentId }: Props) {
    const { user, accessToken } = useAuthStore();
    const [comments, setComments] = useState<Comment[]>([]);
    const [loading, setLoading] = useState(true);
    const [newComment, setNewComment] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editContent, setEditContent] = useState('');
    const bottomRef = useRef<HTMLDivElement>(null);

    const fetchComments = async () => {
        try {
            const { data } = await api.get(`/api/incidents/${incidentId}/comments`);
            setComments(data);
        } catch (err) {
            console.error('Failed to fetch comments', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchComments();
    }, [incidentId]);

    // Realtime comment updates
    useEffect(() => {
        if (!accessToken) return;
        const socket = getSocket(accessToken);

        socket.on('comment:created', (comment: Comment) => {
            if (comment.incidentId === incidentId) {
                setComments(prev => [...prev, comment]);
                setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
            }
        });

        socket.on('comment:updated', (comment: Comment) => {
            if (comment.incidentId === incidentId) {
                setComments(prev => prev.map(c => c.id === comment.id ? comment : c));
            }
        });

        socket.on('comment:deleted', (data: { id: string; incidentId: string }) => {
            if (data.incidentId === incidentId) {
                setComments(prev => prev.filter(c => c.id !== data.id));
            }
        });

        return () => {
            socket.off('comment:created');
            socket.off('comment:updated');
            socket.off('comment:deleted');
        };
    }, [accessToken, incidentId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim()) return;
        setSubmitting(true);
        try {
            await api.post(`/api/incidents/${incidentId}/comments`, { content: newComment.trim() });
            setNewComment('');
        } catch (err) {
            console.error('Failed to add comment', err);
        } finally {
            setSubmitting(false);
        }
    };

    const handleEdit = async (commentId: string) => {
        if (!editContent.trim()) return;
        try {
            await api.patch(`/api/incidents/${incidentId}/comments/${commentId}`, { content: editContent.trim() });
            setEditingId(null);
            setEditContent('');
        } catch (err) {
            console.error('Failed to edit comment', err);
        }
    };

    const handleDelete = async (commentId: string) => {
        if (!confirm('Delete this comment?')) return;
        try {
            await api.delete(`/api/incidents/${incidentId}/comments/${commentId}`);
        } catch (err) {
            console.error('Failed to delete comment', err);
        }
    };

    const startEdit = (comment: Comment) => {
        setEditingId(comment.id);
        setEditContent(comment.content);
    };

    const getInitials = (name: string) =>
        name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

    const timeAgo = (dateStr: string) => {
        const diff = Date.now() - new Date(dateStr).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return 'just now';
        if (mins < 60) return `${mins}m ago`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs}h ago`;
        const days = Math.floor(hrs / 24);
        return `${days}d ago`;
    };

    return (
        <div className="comments-section">
            <h3 className="comments-title">
                Comments
                <span className="comments-count">{comments.length}</span>
            </h3>

            {loading ? (
                <div className="loading-center" style={{ padding: 24 }}><div className="spinner" /></div>
            ) : (
                <div className="comments-list">
                    {comments.length === 0 ? (
                        <div className="comments-empty">No comments yet. Be the first to comment.</div>
                    ) : (
                        comments.map(comment => (
                            <div key={comment.id} className="comment-item">
                                <div className="comment-avatar" title={comment.user.name}>
                                    {getInitials(comment.user.name)}
                                </div>
                                <div className="comment-body">
                                    <div className="comment-meta">
                                        <span className="comment-author">{comment.user.name}</span>
                                        <span className={`badge badge-${comment.user.role.toLowerCase()}`} style={{ fontSize: '0.6rem', padding: '1px 6px' }}>{comment.user.role}</span>
                                        <span className="comment-time" title={new Date(comment.createdAt).toLocaleString()}>
                                            {timeAgo(comment.createdAt)}
                                        </span>
                                        {comment.updatedAt !== comment.createdAt && (
                                            <span className="comment-edited">(edited)</span>
                                        )}
                                    </div>
                                    {editingId === comment.id ? (
                                        <div className="comment-edit-form">
                                            <textarea
                                                className="form-input comment-textarea"
                                                value={editContent}
                                                onChange={e => setEditContent(e.target.value)}
                                                rows={2}
                                            />
                                            <div className="flex gap-2" style={{ marginTop: 6 }}>
                                                <button className="btn btn-primary btn-sm" onClick={() => handleEdit(comment.id)} style={{ fontSize: '0.75rem', padding: '4px 10px' }}>Save</button>
                                                <button className="btn btn-ghost btn-sm" onClick={() => setEditingId(null)} style={{ fontSize: '0.75rem', padding: '4px 10px' }}>Cancel</button>
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="comment-content">{comment.content}</p>
                                    )}
                                    {editingId !== comment.id && (user?.id === comment.user.id || user?.role === 'ADMIN') && (
                                        <div className="comment-actions">
                                            <button className="comment-action-btn" onClick={() => startEdit(comment)}>Edit</button>
                                            <button className="comment-action-btn comment-action-delete" onClick={() => handleDelete(comment.id)}>Delete</button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                    <div ref={bottomRef} />
                </div>
            )}

            {/* New comment form */}
            <form className="comment-form" onSubmit={handleSubmit}>
                <div className="comment-avatar comment-avatar-sm" title={user?.name ?? ''}>
                    {user ? getInitials(user.name) : '?'}
                </div>
                <div className="comment-form-input-wrap">
                    <textarea
                        className="form-input comment-textarea"
                        placeholder="Add a comment..."
                        value={newComment}
                        onChange={e => setNewComment(e.target.value)}
                        rows={2}
                        onKeyDown={e => {
                            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                                handleSubmit(e);
                            }
                        }}
                    />
                    <div className="comment-form-footer">
                        <span className="comment-form-hint">Ctrl+Enter to submit</span>
                        <button
                            className="btn btn-primary btn-sm"
                            type="submit"
                            disabled={submitting || !newComment.trim()}
                            style={{ fontSize: '0.8rem', padding: '6px 16px' }}
                        >
                            {submitting ? 'Posting...' : 'Comment'}
                        </button>
                    </div>
                </div>
            </form>

            <style>{commentStyles}</style>
        </div>
    );
}

const commentStyles = `
.comments-section { margin-top: 24px; }
.comments-title { display: flex; align-items: center; gap: 8px; margin-bottom: 16px; font-size: 1.1rem; }
.comments-count { background: var(--bg-elevated); color: var(--text-secondary); font-size: 0.75rem; padding: 2px 8px; border-radius: 10px; font-weight: 500; }
.comments-list { display: flex; flex-direction: column; gap: 2px; margin-bottom: 20px; max-height: 500px; overflow-y: auto; padding-right: 4px; }
.comments-empty { color: var(--text-muted); font-size: 0.875rem; padding: 24px 0; text-align: center; }
.comment-item { display: flex; gap: 12px; padding: 12px 0; border-bottom: 1px solid var(--border); }
.comment-item:last-of-type { border-bottom: none; }
.comment-avatar { width: 36px; height: 36px; border-radius: 50%; background: var(--accent); color: #fff; display: flex; align-items: center; justify-content: center; font-size: 0.7rem; font-weight: 700; flex-shrink: 0; }
.comment-avatar-sm { width: 32px; height: 32px; font-size: 0.65rem; }
.comment-body { flex: 1; min-width: 0; }
.comment-meta { display: flex; align-items: center; gap: 6px; margin-bottom: 4px; flex-wrap: wrap; }
.comment-author { font-weight: 600; font-size: 0.85rem; color: var(--text-primary); }
.comment-time { font-size: 0.75rem; color: var(--text-muted); }
.comment-edited { font-size: 0.7rem; color: var(--text-muted); font-style: italic; }
.comment-content { font-size: 0.875rem; line-height: 1.6; color: var(--text-secondary); white-space: pre-wrap; word-break: break-word; }
.comment-actions { display: flex; gap: 8px; margin-top: 4px; opacity: 0; transition: opacity 0.15s; }
.comment-item:hover .comment-actions { opacity: 1; }
.comment-action-btn { background: none; border: none; color: var(--text-muted); font-size: 0.75rem; cursor: pointer; padding: 2px 4px; }
.comment-action-btn:hover { color: var(--text-primary); }
.comment-action-delete:hover { color: var(--danger); }
.comment-form { display: flex; gap: 12px; align-items: flex-start; padding-top: 16px; border-top: 1px solid var(--border); }
.comment-form-input-wrap { flex: 1; }
.comment-textarea { font-size: 0.875rem; resize: vertical; min-height: 48px; }
.comment-form-footer { display: flex; align-items: center; justify-content: space-between; margin-top: 8px; }
.comment-form-hint { font-size: 0.7rem; color: var(--text-muted); }
.comment-edit-form { margin-top: 4px; }
`;
