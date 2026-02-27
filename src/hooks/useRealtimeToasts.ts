import { useEffect } from 'react';
import { getSocket } from '../api/socket';
import { useAuthStore } from '../store/authStore';
import { useToast } from '../components/Toast';
import type { Incident } from '../types';

export function useRealtimeToasts() {
    const { accessToken } = useAuthStore();
    const { addToast } = useToast();

    useEffect(() => {
        if (!accessToken) return;
        const socket = getSocket(accessToken);

        socket.on('incident:created', (inc: Incident) => {
            addToast('info', 'New Incident', `"${inc.title}" reported by ${inc.createdBy.name}`);
        });

        socket.on('incident:updated', (inc: Incident) => {
            addToast('success', 'Incident Updated', `"${inc.title}" → ${inc.status.replace('_', ' ')}`);
        });

        socket.on('comment:created', (data: { incidentId: string; user: { name: string } }) => {
            addToast('info', 'New Comment', `${data.user.name} commented on an incident`);
        });

        return () => {
            socket.off('incident:created');
            socket.off('incident:updated');
            socket.off('comment:created');
        };
    }, [accessToken, addToast]);
}
