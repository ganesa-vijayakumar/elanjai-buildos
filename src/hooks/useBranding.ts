import { useState, useEffect, useCallback } from 'react';
import api from '../lib/api';
import { useAuth } from './useAuth';

export interface TenantBranding {
    logoFileId?: string;
    logoUrl?: string;
    accentColor?: string;   // hex, e.g. #0f766e
    companyName?: string;
}

const DEFAULT_BRANDING: TenantBranding = { accentColor: '#0f766e' };

let cached: TenantBranding | null = null;
const listeners = new Set<() => void>();

export function useBranding() {
    const { user } = useAuth();
    const [branding, setBranding] = useState<TenantBranding>(cached || DEFAULT_BRANDING);
    const [loading, setLoading] = useState(!cached);

    const refetch = useCallback(async () => {
        if (!user) { setBranding(DEFAULT_BRANDING); setLoading(false); return; }
        try {
            const r = await api.get('/settings/branding');
            const val = typeof r.data?.value === 'string' ? JSON.parse(r.data.value) : (r.data?.value || {});
            cached = { ...DEFAULT_BRANDING, ...val };
            setBranding(cached as TenantBranding);
        } catch {
            setBranding(cached ?? DEFAULT_BRANDING);
        } finally { setLoading(false); }
    }, [user]);

    useEffect(() => { refetch(); }, [refetch]);
    useEffect(() => {
        const l = () => setBranding(cached || DEFAULT_BRANDING);
        listeners.add(l);
        return () => { listeners.delete(l); };
    }, []);

    const save = async (b: TenantBranding) => {
        try {
            await api.put('/settings/branding', { key: 'branding', value: JSON.stringify(b) });
            cached = b;
            listeners.forEach(l => l());
            setBranding(b);
            return { error: null };
        } catch (error: any) { return { error }; }
    };

    const uploadLogo = async (file: File) => {
        try {
            const form = new FormData();
            form.append('file', file);
            const r = await api.post('/settings/branding/logo', form, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            return { data: r.data as { fileId: string; url: string }, error: null };
        } catch (error: any) { return { data: null, error }; }
    };

    return { branding, loading, refetch, save, uploadLogo };
}
