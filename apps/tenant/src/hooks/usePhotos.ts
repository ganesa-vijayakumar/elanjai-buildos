import { useState, useEffect, useCallback } from 'react';
import api from '../lib/api';
import { useAuth } from './useAuth';

export interface SitePhoto {
    id: string;
    fileId: string;
    url: string;
    caption?: string;
    stageId?: string;
    stageName?: string;
    uploadedBy?: string;
    uploadedAt?: string;
}

export function usePhotos(siteId?: string, stageId?: string) {
    const { user } = useAuth();
    const [photos, setPhotos] = useState<SitePhoto[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);

    const refetch = useCallback(async () => {
        if (!user || !siteId) { setPhotos([]); setLoading(false); return; }
        setLoading(true);
        try {
            const r = await api.get(`/sites/${siteId}/photos`, { params: stageId ? { stageId } : {} });
            setPhotos(Array.isArray(r.data) ? r.data : []);
        } catch (e) {
            console.error('Error fetching photos:', e);
            setPhotos([]);
        } finally { setLoading(false); }
    }, [user, siteId, stageId]);

    useEffect(() => { refetch(); }, [refetch]);

    const upload = async (file: File, caption?: string, forStageId?: string) => {
        setUploading(true);
        try {
            const form = new FormData();
            form.append('file', file);
            if (caption) form.append('caption', caption);
            if (forStageId) form.append('stageId', forStageId);
            await api.post(`/sites/${siteId}/photos`, form, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            await refetch();
            return { error: null };
        } catch (error: any) { return { error }; }
        finally { setUploading(false); }
    };

    const remove = async (id: string) => {
        try {
            await api.delete(`/photos/${id}`);
            await refetch();
            return { error: null };
        } catch (error: any) { return { error }; }
    };

    return { photos, loading, uploading, refetch, upload, remove };
}
