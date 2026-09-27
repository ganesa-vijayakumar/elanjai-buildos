import { useState, useEffect, useCallback } from 'react';
import api from '../lib/api';
import { Collection, ConstructionStage, PaymentMode } from '../lib/database.types';
import { useAuth } from './useAuth';

interface UseCollectionsReturn {
    collections: Collection[];
    loading: boolean;
    error: Error | null;
    totalCollections: number;
    refetch: () => Promise<void>;
    addCollection: (collection: CreateCollectionInput) => Promise<{ data: Collection | null; error: Error | null }>;
    updateCollection: (id: string, updates: Partial<Collection>) => Promise<{ error: Error | null }>;
    deleteCollection: (id: string) => Promise<{ error: Error | null }>;
}

interface CreateCollectionInput {
    site_id: string;
    amount: number;
    stage?: ConstructionStage;
    payment_mode?: PaymentMode;
    reference_number?: string;
    notes?: string;
    received_date: string;
}

const mapCollectionFromBackend = (data: any): Collection => {
    return {
        id: data.id,
        site_id: data.siteId,
        amount: data.amount,
        stage: data.stage ? data.stage.toLowerCase() as ConstructionStage : null,
        payment_mode: data.paymentMode ? data.paymentMode.toLowerCase() as PaymentMode : null,
        reference_number: data.referenceNumber,
        notes: data.notes,
        received_date: data.receivedDate,
        created_by: data.createdBy,
        created_at: data.createdAt,
    };
};

const mapCollectionToBackend = (input: any) => {
    return {
        siteId: input.site_id,
        amount: input.amount,
        stage: input.stage ? input.stage.toUpperCase() : null,
        paymentMode: input.payment_mode ? input.payment_mode.toUpperCase() : null,
        referenceNumber: input.reference_number,
        notes: input.notes,
        receivedDate: input.received_date
    };
};

export function useCollections(siteId?: string): UseCollectionsReturn {
    const { user } = useAuth();
    const [collections, setCollections] = useState<Collection[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const fetchCollections = useCallback(async () => {
        if (!user) {
            setCollections([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            let url = '/collections';
            if (siteId) {
                url = `/collections/site/${siteId}`;
            }

            const response = await api.get(url);
            const data = response.data;

            const mappedCollections = Array.isArray(data)
                ? data.map(mapCollectionFromBackend)
                : [];

            // Sort by received_date desc
            mappedCollections.sort((a, b) => new Date(b.received_date).getTime() - new Date(a.received_date).getTime());

            setCollections(mappedCollections);
        } catch (err: any) {
            console.error('Error fetching collections:', err);
            setError(err);
            setCollections([]);
        } finally {
            setLoading(false);
        }
    }, [user, siteId]);

    useEffect(() => {
        fetchCollections();
    }, [fetchCollections]);

    const addCollection = async (collectionInput: CreateCollectionInput) => {
        try {
            const payload = mapCollectionToBackend(collectionInput);
            const response = await api.post('/collections', payload);
            const newCollection = mapCollectionFromBackend(response.data);

            await fetchCollections(); // Refresh the list
            return { data: newCollection, error: null };
        } catch (err: any) {
            console.error('Error adding collection:', err);
            return { data: null, error: err };
        }
    };

    const updateCollection = async (id: string, updates: Partial<Collection>) => {
        try {
            // Fetch existing to merge
            const current = collections.find(c => c.id === id);
            if (!current) throw new Error("Collection not found locally");

            const merged = { ...current, ...updates };
            const payload = mapCollectionToBackend(merged);

            await api.put(`/collections/${id}`, payload);
            await fetchCollections();
            return { error: null };
        } catch (err: any) {
            console.error('Error updating collection:', err);
            return { error: err };
        }
    };

    const deleteCollection = async (id: string) => {
        try {
            await api.delete(`/collections/${id}`);
            await fetchCollections();
            return { error: null };
        } catch (err: any) {
            console.error('Error deleting collection:', err);
            return { error: err };
        }
    };

    const totalCollections = collections.reduce((sum, c) => sum + Number(c.amount), 0);

    return {
        collections,
        loading,
        error,
        totalCollections,
        refetch: fetchCollections,
        addCollection,
        updateCollection,
        deleteCollection,
    };
}

// Get collections grouped by stage for a site
export function useCollectionsByStage(siteId: string | undefined) {
    const { collections, loading, error } = useCollections(siteId);

    const collectionsByStage = collections.reduce((acc, collection) => {
        const stage = collection.stage || 'unassigned';
        if (!acc[stage]) {
            acc[stage] = { total: 0, count: 0, collections: [] };
        }
        acc[stage].total += Number(collection.amount);
        acc[stage].count += 1;
        acc[stage].collections.push(collection);
        return acc;
    }, {} as Record<string, { total: number; count: number; collections: Collection[] }>);

    return { collectionsByStage, loading, error };
}
