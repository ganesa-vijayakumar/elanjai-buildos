import { useState, useEffect, useCallback } from 'react';
import api from '../lib/api';
import { useAuth } from './useAuth';

export interface ProjectMaterial {
    id: string;
    category?: string;
    materialName: string;
    specifiedBrand?: string;
    actualBrand?: { id: string; name: string } | null;
    estQuantity?: number;
    actualQuantity?: number;
    unit?: string;
    status: 'pending' | 'ordered' | 'delivered' | 'installed';
    statusHistory?: string;
    notes?: string;
    createdAt?: string;
}

export function useProjectMaterials(siteId?: string) {
    const { user } = useAuth();
    const [materials, setMaterials] = useState<ProjectMaterial[]>([]);
    const [loading, setLoading] = useState(true);

    const refetch = useCallback(async () => {
        if (!user || !siteId) { setMaterials([]); setLoading(false); return; }
        setLoading(true);
        try {
            const r = await api.get(`/sites/${siteId}/materials`);
            setMaterials(Array.isArray(r.data) ? r.data : []);
        } catch (e) {
            console.error('Error fetching project materials:', e);
            setMaterials([]);
        } finally { setLoading(false); }
    }, [user, siteId]);

    useEffect(() => { refetch(); }, [refetch]);

    const addMaterial = async (m: Partial<ProjectMaterial>) => {
        try {
            await api.post(`/sites/${siteId}/materials`, m);
            await refetch();
            return { error: null };
        } catch (error: any) { return { error }; }
    };

    const updateMaterial = async (id: string, updates: Partial<ProjectMaterial> & { actualBrandId?: string | null }) => {
        try {
            await api.put(`/sites/${siteId}/materials/${id}`, updates);
            await refetch();
            return { error: null };
        } catch (error: any) { return { error }; }
    };

    const deleteMaterial = async (id: string) => {
        try {
            await api.delete(`/sites/${siteId}/materials/${id}`);
            await refetch();
            return { error: null };
        } catch (error: any) { return { error }; }
    };

    return { materials, loading, refetch, addMaterial, updateMaterial, deleteMaterial };
}
