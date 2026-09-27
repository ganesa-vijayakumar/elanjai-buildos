import { useState, useCallback } from 'react';
import api from '../lib/api';
import { MaterialSpent, MaterialType } from '../lib/database.types';

interface UseMaterialSpentReturn {
    materialSpentList: MaterialSpent[];
    loading: boolean;
    error: Error | null;
    fetchMaterialSpent: (siteId: string) => Promise<void>;
    updateMaterialSpent: (data: UpdateMaterialSpentInput) => Promise<{ data: MaterialSpent | null; error: Error | null }>;
}

interface UpdateMaterialSpentInput {
    siteId: string;
    materialType: MaterialType;
    quantity: number;
    unit: string;
}

export function useMaterialSpent(): UseMaterialSpentReturn {
    const [materialSpentList, setMaterialSpentList] = useState<MaterialSpent[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const fetchMaterialSpent = useCallback(async (siteId: string) => {
        setLoading(true);
        setError(null);
        try {
            // Check if backend supports filtering by siteId. Currently getAll returns all.
            // Ideally backend should support /api/material-spent?siteId=...
            // Or we filter client side for now if dataset is small.
            // Backend update step 436: "TODO: Filter by site ID?". It's not implemented yet.
            // I will implement client side filtering for MVP, but strongly suggest backend update.
            const response = await api.get('/material-spent');
            const allSpent: MaterialSpent[] = response.data.map((item: any) => ({
                id: item.id,
                site_id: item.siteId,
                material_type: item.materialType ? item.materialType.toLowerCase() as MaterialType : 'cement', // fallback
                quantity: item.quantity,
                unit: item.unit,
                updated_by: item.updatedBy,
                updated_at: item.updatedAt
            }));

            setMaterialSpentList(allSpent.filter(m => m.site_id === siteId));
        } catch (err: any) {
            console.error('Error fetching material spent:', err);
            setError(err);
        } finally {
            setLoading(false);
        }
    }, []);

    const updateMaterialSpent = async (input: UpdateMaterialSpentInput) => {
        setLoading(true);
        setError(null);
        try {
            const payload = {
                siteId: input.siteId,
                materialType: input.materialType.toUpperCase(), // Enum is UPPERCASE in backend
                quantity: input.quantity,
                unit: input.unit
            };
            const response = await api.post('/material-spent', payload);

            const newSpent: MaterialSpent = {
                id: response.data.id,
                site_id: response.data.siteId,
                material_type: response.data.materialType ? response.data.materialType.toLowerCase() as MaterialType : input.materialType,
                quantity: response.data.quantity,
                unit: response.data.unit,
                updated_by: response.data.updatedBy,
                updated_at: response.data.updatedAt
            };

            // Update local state
            setMaterialSpentList(prev => {
                const existingIndex = prev.findIndex(p => p.site_id === input.siteId && p.material_type === input.materialType);
                if (existingIndex >= 0) {
                    const updated = [...prev];
                    updated[existingIndex] = newSpent;
                    return updated;
                }
                return [...prev, newSpent];
            });

            return { data: newSpent, error: null };
        } catch (err: any) {
            console.error('Error updating material spent:', err);
            return { data: null, error: err };
        } finally {
            setLoading(false);
        }
    };

    return {
        materialSpentList,
        loading,
        error,
        fetchMaterialSpent,
        updateMaterialSpent
    };
}
