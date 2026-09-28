import { createApiClient } from '@buildos/shared/api-client';

/** Public-realm client: plans, signup, verification. Never sends auth headers. */
export const api = createApiClient({ tokenKey: null });
