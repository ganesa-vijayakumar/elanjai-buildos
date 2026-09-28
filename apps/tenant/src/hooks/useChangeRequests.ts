import { useState, useEffect, useCallback } from 'react';
import api from '../lib/api';
import { useAuth } from './useAuth';

export interface ChangeRequest {
    id: string;
    crNumber: string;
    description: string;
    type?: string;
    category?: string;
    costImpact?: number;
    timelineImpact?: string;
    status: 'pending' | 'approved' | 'rejected' | 'in_progress' | 'completed' | 'implemented';
    approverNotes?: string;
    requestedBy?: string;
    createdBy?: { id: string; fullName?: string };
    createdAt?: string;
    updatedAt?: string;
}

export function useChangeRequests(siteId?: string, status?: string) {
    const { user } = useAuth();
    const [items, setItems] = useState<ChangeRequest[]>([]);
    const [loading, setLoading] = useState(true);

    const refetch = useCallback(async () => {
        if (!user || !siteId) { setItems([]); setLoading(false); return; }
        setLoading(true);
        try {
            const r = await api.get(`/sites/${siteId}/change-requests`, { params: status ? { status } : {} });
            setItems(Array.isArray(r.data) ? r.data : []);
        } catch (e) {
            console.error('Error fetching change requests:', e);
            setItems([]);
        } finally { setLoading(false); }
    }, [user, siteId, status]);

    useEffect(() => { refetch(); }, [refetch]);

    const create = async (cr: { description: string; type?: string; category?: string; costImpact?: number; timelineImpact?: string }) => {
        try {
            await api.post(`/sites/${siteId}/change-requests`, cr);
            await refetch();
            return { error: null };
        } catch (error: any) { return { error }; }
    };

    const decide = async (id: string, decision: 'approved' | 'rejected' | 'implemented', approverNotes?: string) => {
        try {
            await api.post(`/change-requests/${id}/decision`, { status: decision, approverNotes });
            await refetch();
            return { error: null };
        } catch (error: any) { return { error }; }
    };

    return { items, loading, refetch, create, decide };
}
