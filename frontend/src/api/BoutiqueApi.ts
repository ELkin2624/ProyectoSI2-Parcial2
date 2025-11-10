// src/api/BoutiqueApi.ts
import axios, { AxiosError } from 'axios';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
1
// console.log(baseURL);

const boutiqueApi = axios.create({
    baseURL,
    headers: {
        'Content-Type': 'application/json',
    },
})

boutiqueApi.interceptors.request.use((config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
})

boutiqueApi.interceptors.response.use(
    (response) => {
        return response
    },
    async (error: AxiosError) => {
        const originalRequest = error.config;
        if (error.response?.status !== 401 || originalRequest?.url === '/api/token/refresh/') {
            return Promise.reject(error);
        }

        const handleLogout = () => {
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            window.location.href = '/auth/login';
            return Promise.reject(error);
        }

        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) {
            return handleLogout();
        }
        try {
            // 4. Pedir un nuevo access_token usando el refresh_token
            const { data } = await axios.post(`${baseURL}/api/token/refresh/`, {
                refresh: refreshToken
            });

            // 5. Guardar el nuevo access_token
            localStorage.setItem('access_token', data.access);

            // 6. Actualizar el header de la petición original y reintentarla
            if (originalRequest) {
                originalRequest.headers.Authorization = `Bearer ${data.access}`;
                return boutiqueApi(originalRequest);
            }

        } catch (refreshError) {
            return handleLogout();
        }

        return Promise.reject(error);
    }
)


export { boutiqueApi }