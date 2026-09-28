import { createApiClient } from '@buildos/shared/api-client';
import {
    ADMIN_TOKEN_KEY, ADMIN_USER_KEY, LEGACY_JWT_KEY, LEGACY_ADMIN_USER_KEY,
    clearStorage,
} from '@buildos/shared/storage';

/**
 * Platform-realm client. Admin session lives under buildos.admin.* keys so a
 * tenant token on a shared dev origin can never be replayed into the console
 * (and the backend rejects realm mismatches anyway).
 */
export const api = createApiClient({
    tokenKey: ADMIN_TOKEN_KEY,
    legacyTokenKeys: [LEGACY_JWT_KEY],
    sessionKeys: [ADMIN_TOKEN_KEY, ADMIN_USER_KEY, LEGACY_JWT_KEY, LEGACY_ADMIN_USER_KEY],
    onUnauthorized: () => {
        if (!window.location.pathname.startsWith('/admin/login')) {
            window.location.href = '/admin/login';
        }
    },
});

export const adminSessionKeys = [
    ADMIN_TOKEN_KEY, ADMIN_USER_KEY, LEGACY_JWT_KEY, LEGACY_ADMIN_USER_KEY,
];
export { clearStorage };
