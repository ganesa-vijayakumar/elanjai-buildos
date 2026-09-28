/**
 * Tenant resolution for the SPA.
 * Dev:  *.localhost subdomains resolve locally in modern browsers; fallback via
 *       ?tenant=<slug> param or localStorage 'tenant_slug' override.
 * Prod: <slug>.<baseDomain>.
 */

const BASE_DOMAIN = (import.meta.env.VITE_BASE_DOMAIN || 'localhost').toLowerCase();
const ADMIN_HOST = (import.meta.env.VITE_ADMIN_HOST || `admin.${BASE_DOMAIN}`).toLowerCase();

export function isAdminHost(): boolean {
    return window.location.hostname.toLowerCase() === ADMIN_HOST
        || localStorage.getItem('admin_console') === '1';
}

/** Tenant slug from hostname, URL param, or stored override. null → public realm. */
export function currentTenantSlug(): string | null {
    const host = window.location.hostname.toLowerCase();
    if (host.endsWith('.' + BASE_DOMAIN) && host !== ADMIN_HOST && host !== 'www.' + BASE_DOMAIN) {
        return host.slice(0, -(BASE_DOMAIN.length + 1));
    }
    const param = new URLSearchParams(window.location.search).get('tenant');
    if (param) return param.toLowerCase();
    const stored = localStorage.getItem('tenant_slug');
    return stored ? stored.toLowerCase() : null;
}

export function setTenantOverride(slug: string | null) {
    if (slug) localStorage.setItem('tenant_slug', slug.toLowerCase());
    else localStorage.removeItem('tenant_slug');
}

/** Base URL for a tenant workspace on this domain. */
export function tenantUrl(slug: string): string {
    const proto = window.location.protocol;
    const port = window.location.port ? ':' + window.location.port : '';
    return `${proto}//${slug}.${BASE_DOMAIN}${port}`;
}
