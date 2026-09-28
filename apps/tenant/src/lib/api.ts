import { createApiClient } from '@buildos/shared/api-client';
import {
    TENANT_TOKEN_KEY, TENANT_USER_KEY, LEGACY_JWT_KEY, LEGACY_USER_KEY,
    clearStorage,
} from '@buildos/shared/storage';
import { currentTenantSlug } from './tenant';

/**
 * Tenant-realm client: attaches the workspace JWT, plus X-Tenant-ID in dev
 * builds only (production tenant resolution is Host-based server-side).
 */
const api = createApiClient({
    tokenKey: TENANT_TOKEN_KEY,
    legacyTokenKeys: [LEGACY_JWT_KEY],
    sessionKeys: [TENANT_TOKEN_KEY, TENANT_USER_KEY, LEGACY_JWT_KEY, LEGACY_USER_KEY],
    tenantSlug: currentTenantSlug,
    onUnauthorized: () => {
        window.location.href = '/login';
    },
});

export default api;

/** Auth session helpers — all reads accept legacy keys during migration. */
export const tenantSession = {
    token: () => localStorage.getItem(TENANT_TOKEN_KEY)
        ?? localStorage.getItem(LEGACY_JWT_KEY),
    clear: () => clearStorage(
        TENANT_TOKEN_KEY, TENANT_USER_KEY, LEGACY_JWT_KEY, LEGACY_USER_KEY),
};
