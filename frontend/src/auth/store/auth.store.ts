import type { User } from '@/interfaces/user.interface';
import { create } from 'zustand'
import { loginAction } from '../actions/login.action';

type AuthState = {
    //Properties
    user: User | null,
    token: string | null,
    //Getters

    //Actions
    login: (email: string, password: string) => Promise<boolean>;
};

export const useAuthStore = create<AuthState>()((set) => ({
    //Implementacion del store
    user: null,
    token: null,


    //actions
    login: async (email: string, password: string) => {
        console.log({ email, password });

        try {
            const data = await loginAction(email, password);
            localStorage.setItem('token', data.token);

            set({ user: data.user, token: data.token });
            return true;

        } catch (error) {
            localStorage.removeItem('token');
            set({ user: null, token: null });
            return false;

        }


    }
}))

