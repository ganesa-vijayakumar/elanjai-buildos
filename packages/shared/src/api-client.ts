import axios, { type AxiosInstance } from 'axios';
import { readStorage, clearStorage } from './storage';

export interface ApiClientOptions {
    /**
     * Storage key holding this realm's JWT. null → never send Authorization
     * (public client for the landing app).
     */
    tokenKey: string | null;
    /** Legacy token keys accepted during the storage migration window. */
    legacyTokenKeys?: string[];
    /**
     * Returns the workspace slug to send as X-Tenant-ID. Only sent in dev
     * builds (import.meta.env.DEV) — production resolves tenants by Host.
     */
    tenantSlug?: () => string | null;
    /** Called on 401 responses (e.g. clear session + redirect to login). */
    onUnauthorized?: () => void;
    /** Extra keys to clear when onUnauthorized fires. */
    sessionKeys?: string[];
}

const API_BASE =
    (import.meta.env as Record<string, string | undefined>).VITE_API_BASE_URL
    || '/api';

export function createApiClient(opts: ApiClientOptions): AxiosInstance {
    const api = axios.create({
        baseURL: API_BASE,
        headers: { 'Content-Type': 'application/json' },
    });

    api.interceptors.request.use((config) => {
        if (opts.tokenKey) {
            const token = readStorage(opts.tokenKey, ...(opts.legacyTokenKeys ?? []));
            if (token) config.headers.Authorization = `Bearer ${token}`;
        }
        if ((import.meta.env as Record<string, unknown>).DEV && opts.tenantSlug) {
            const slug = opts.tenantSlug();
            if (slug) config.headers['X-Tenant-ID'] = slug;
        }
        return config;
    });

    api.interceptors.response.use(
        (response) => response,
        (error) => {
            // 403 TENANT_MISMATCH / PLAN_LIMIT / FEATURE_LOCKED / REALM_MISMATCH
            // surface to callers — only 401 means the session is dead.
            if (error.response?.status === 401) {
                if (opts.sessionKeys?.length) clearStorage(...opts.sessionKeys);
                opts.onUnauthorized?.();
            }
            return Promise.reject(error);
        }
    );

    return api;
}
