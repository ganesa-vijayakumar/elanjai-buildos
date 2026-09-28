/**
 * Tenant resolution for the tenant workspace app.
 * Prod: <slug>.<baseDomain> host → slug.
 * Dev:  ?tenant=<slug> param or localStorage 'tenant_slug' override — only in
 *       dev builds (the backend ignores X-Tenant-ID outside development).
 */
import { slugFromHost, tenantUrl, BASE_DOMAIN } from '@buildos/shared/host';

const DEV_OVERRIDE_KEY = 'tenant_slug';

/** Tenant slug from hostname (always) + dev overrides (dev builds only). */
export function currentTenantSlug(): string | null {
    const fromHost = slugFromHost();
    if (fromHost) return fromHost;
    if (!import.meta.env.DEV) return null;
    const param = new URLSearchParams(window.location.search).get('tenant');
    if (param) return param.toLowerCase();
    const stored = localStorage.getItem(DEV_OVERRIDE_KEY);
    return stored ? stored.toLowerCase() : null;
}

export function setTenantOverride(slug: string | null) {
    if (slug) localStorage.setItem(DEV_OVERRIDE_KEY, slug.toLowerCase());
    else localStorage.removeItem(DEV_OVERRIDE_KEY);
}

export { tenantUrl, BASE_DOMAIN };
