// src/auth/store/auth.store.ts
import type { User } from '@/interfaces/user.interface';
import { create } from 'zustand'
import { loginAction } from '../actions/login.action';
import { checkAuthAction } from '../actions/check-auth.action';
import { registerAction } from '../actions/register.action';
import { queryClient } from '@/Boutique';

type AuthStatus = 'authenticated' | 'not-authenticated' | 'checking';

type AuthState = {
    user: User | null;
    access_token: string | null;
    refresh_token: string | null;
    authStatus: AuthStatus;

    isAdmin: () => boolean;

    register: (email: string, password: string, fullName: string) => Promise<boolean>;
    login: (email: string, password: string) => Promise<boolean>;
    logout: () => void;
    checkAuthStatus: () => Promise<boolean>;
};



export const useAuthStore = create<AuthState>()((set, get) => ({
    user: null,
    access_token: null,
    refresh_token: null,
    authStatus: 'checking',

    isAdmin: () => {
        const user = get().user;
        return user?.is_admin ?? false;
    },

    register: async (email: string, password: string, fullName: string) => {
        try {
            await registerAction(email, password, fullName);
            return await get().login(email, password);
        } catch (error) {
            console.log(error);
            set({ user: null, access_token: null, refresh_token: null, authStatus: 'not-authenticated' });
            return false;
        }
    },

    login: async (email: string, password: string) => {
        try {
            const data = await loginAction(email, password);
            localStorage.setItem('access_token', data.access);
            localStorage.setItem('refresh_token', data.refresh);
            // 3. Obtiene los datos del usuario
            const user = await checkAuthAction();
            queryClient.invalidateQueries({ queryKey: ['carrito'] });
            set({
                user: user,
                access_token: data.access,
                refresh_token: data.refresh,
                authStatus: 'authenticated'
            });
            return true;

        } catch (error) {
            console.log(error);
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            set({ user: null, access_token: null, refresh_token: null, authStatus: 'not-authenticated' });
            return false;
        }
    },

    logout: () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        queryClient.removeQueries({ queryKey: ['carrito'] });

        set({ user: null, access_token: null, refresh_token: null, authStatus: 'not-authenticated' });
    },

    checkAuthStatus: async () => {
        const token = localStorage.getItem('access_token');
        if (!token) {
            set({ user: null, access_token: null, refresh_token: null, authStatus: 'not-authenticated' });
            return false;
        }

        try {
            const user = await checkAuthAction();
            set({
                user: user,
                access_token: localStorage.getItem('access_token'),
                refresh_token: localStorage.getItem('refresh_token'),
                authStatus: 'authenticated',
            })
            return true;
        } catch (error) {
            console.log(error);
            get().logout();
            return false;
        }
    }
}))

