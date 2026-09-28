/**
 * Realm-scoped localStorage keys. The tenant and admin frontends run on
 * separate origins; the namespaced keys also protect shared-origin dev setups
 * (localhost:port) and the jwt_token → per-realm migration.
 */
export const TENANT_TOKEN_KEY = 'buildos.tenant.token';
export const TENANT_USER_KEY = 'buildos.tenant.user';
export const ADMIN_TOKEN_KEY = 'buildos.admin.token';
export const ADMIN_USER_KEY = 'buildos.admin.user';

/** Legacy keys written by the pre-split monolith — read-only fallback. */
export const LEGACY_JWT_KEY = 'jwt_token';
export const LEGACY_USER_KEY = 'user_data';
export const LEGACY_ADMIN_USER_KEY = 'admin_user';

/** Read primary key first, then legacy keys (migration window). */
export function readStorage(primary: string, ...legacy: string[]): string | null {
    const v = localStorage.getItem(primary);
    if (v != null) return v;
    for (const k of legacy) {
        const lv = localStorage.getItem(k);
        if (lv != null) return lv;
    }
    return null;
}

export function readJson<T>(primary: string, ...legacy: string[]): T | null {
    const raw = readStorage(primary, ...legacy);
    if (raw == null) return null;
    try {
        return JSON.parse(raw) as T;
    } catch {
        return null;
    }
}

/** Clear the primary key plus any legacy aliases (logout / 401 handling). */
export function clearStorage(...keys: string[]) {
    for (const k of keys) localStorage.removeItem(k);
}
