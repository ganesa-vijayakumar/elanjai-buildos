import { useCallback, useEffect, useState } from 'react';
import api from '../lib/api';

export interface SiteStage {
    id: string;
    name: string;
    percentage: number;
    budgetAmount: number | null;
    actualSpent: number;
    status: 'pending' | 'in_progress' | 'done';
    plannedStart: string | null;
    plannedEnd: string | null;
    actualStart: string | null;
    actualEnd: string | null;
    orderIndex: number;
    notes: string | null;
}

/** Live per-site construction stages (copied from tenant stage_templates at creation, editable). */
export function useSiteStages(siteId?: string) {
    const [stages, setStages] = useState<SiteStage[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const refetch = useCallback(async () => {
        if (!siteId) { setStages([]); setLoading(false); return; }
        setLoading(true);
        try {
            const { data } = await api.get(`/sites/${siteId}/stages`);
            setStages(data);
            setError(null);
        } catch (e: any) {
            setError(e);
        } finally {
            setLoading(false);
        }
    }, [siteId]);

    useEffect(() => { refetch(); }, [refetch]);

    const updateStage = async (stageId: string, patch: Partial<SiteStage>) => {
        await api.put(`/sites/${siteId}/stages/${stageId}`, patch);
        await refetch();
    };

    const addStage = async (body: { name: string; percentage: number; budgetAmount?: number; notes?: string }) => {
        await api.post(`/sites/${siteId}/stages`, body);
        await refetch();
    };

    const deleteStage = async (stageId: string) => {
        await api.delete(`/sites/${siteId}/stages/${stageId}`);
        await refetch();
    };

    return { stages, loading, error, refetch, updateStage, addStage, deleteStage };
}
