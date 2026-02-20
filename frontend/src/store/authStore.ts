import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { disconnectSocket } from '../api/socket';

export interface User {
    id: string;
    name: string;
    email: string;
    role: 'ADMIN' | 'RESPONDER' | 'VIEWER';
    createdAt: string;
}

interface AuthState {
    user: User | null;
    accessToken: string | null;
    refreshToken: string | null;
    setAuth: (user: User, accessToken: string, refreshToken: string) => void;
    setTokens: (accessToken: string, refreshToken: string) => void;
    logout: () => void;
    isAuthenticated: boolean;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,

            setAuth: (user, accessToken, refreshToken) =>
                set({ user, accessToken, refreshToken, isAuthenticated: true }),

            setTokens: (accessToken, refreshToken) =>
                set({ accessToken, refreshToken }),

            logout: () => {
                disconnectSocket();
                set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
            },
        }),
        { name: 'incident-hub-auth' }
    )
);
