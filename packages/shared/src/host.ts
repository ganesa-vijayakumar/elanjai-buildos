/**
 * Host-derived realm + workspace resolution shared by the three frontends.
 * Production conventions (base domain from VITE_BASE_DOMAIN):
 *   apex/www.<base>     → landing app
 *   admin.<base>        → admin app (VITE_ADMIN_HOST override)
 *   <slug>.<base>       → tenant app, workspace = slug
 * Tenant resolution is identity only — authorization happens server-side via
 * the resolved Host + JWT realm/tenant claims.
 */

const env = (k: string): string | undefined =>
    (import.meta.env as Record<string, string | undefined>)[k];

export const BASE_DOMAIN = (env('VITE_BASE_DOMAIN') || 'localhost').toLowerCase();
export const ADMIN_HOST = (env('VITE_ADMIN_HOST') || `admin.${BASE_DOMAIN}`).toLowerCase();

const origin = (host: string): string => {
    const proto = window.location.protocol;
    const port = window.location.port ? `:${window.location.port}` : '';
    return `${proto}//${host}${port}`;
};

export function isAdminHost(): boolean {
    return window.location.hostname.toLowerCase() === ADMIN_HOST;
}

/** Workspace slug embedded in the current hostname, or null on apex/www/admin. */
export function slugFromHost(): string | null {
    const host = window.location.hostname.toLowerCase();
    if (host.endsWith('.' + BASE_DOMAIN)
        && host !== ADMIN_HOST
        && host !== 'www.' + BASE_DOMAIN) {
        return host.slice(0, -(BASE_DOMAIN.length + 1));
    }
    return null;
}

/** Absolute URL for a tenant workspace on this domain. */
export function tenantUrl(slug: string): string {
    return origin(`${slug}.${BASE_DOMAIN}`);
}

export function adminUrl(): string {
    return origin(ADMIN_HOST);
}

/** Apex / landing site URL. */
export function landingUrl(): string {
    return origin(`www.${BASE_DOMAIN}`);
}
