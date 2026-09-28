import { useState, useEffect, useCallback } from 'react';
import api from '../lib/api';
import { useAuth } from './useAuth';

export interface MaterialCalculation {
    id: string;
    taskType: string;
    dimensions: string;   // json string
    results: string;      // json string
    calculatedBy?: { fullName?: string };
    calculatedAt?: string;
}

export function useEstimatorHistory(siteId?: string) {
    const { user } = useAuth();
    const [history, setHistory] = useState<MaterialCalculation[]>([]);
    const [loading, setLoading] = useState(true);

    const refetch = useCallback(async () => {
        if (!user || !siteId) { setHistory([]); setLoading(false); return; }
        setLoading(true);
        try {
            const r = await api.get(`/estimator/sites/${siteId}/history`);
            setHistory(Array.isArray(r.data) ? r.data : []);
        } catch (e) {
            console.error('Error fetching calc history:', e);
            setHistory([]);
        } finally { setLoading(false); }
    }, [user, siteId]);

    useEffect(() => { refetch(); }, [refetch]);

    const save = async (taskType: string, dimensions: Record<string, unknown>, results: Record<string, unknown>) => {
        try {
            await api.post(`/estimator/sites/${siteId}/calculations`, { taskType, dimensions, results });
            await refetch();
            return { error: null };
        } catch (error: any) { return { error }; }
    };

    const remove = async (id: string) => {
        try {
            await api.delete(`/estimator/calculations/${id}`);
            await refetch();
            return { error: null };
        } catch (error: any) { return { error }; }
    };

    return { history, loading, refetch, save, remove };
}
