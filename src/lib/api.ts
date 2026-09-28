import axios from 'axios';
import { currentTenantSlug } from './tenant';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Attach JWT + tenant context (X-Tenant-ID dev fallback; subdomains in prod).
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('jwt_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        const slug = currentTenantSlug();
        if (slug) {
            config.headers['X-Tenant-ID'] = slug;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

api.interceptors.response.use(
    (response) => response,
    (error) => {
        const status = error.response?.status;
        if (status === 401) {
            localStorage.removeItem('jwt_token');
            localStorage.removeItem('user_data');
            window.location.href = '/login';
        }
        // 403 TENANT_MISMATCH / PLAN_LIMIT / FEATURE_LOCKED / TENANT_READ_ONLY
        // surface to callers — do not force logout.
        return Promise.reject(error);
    }
);

export default api;
