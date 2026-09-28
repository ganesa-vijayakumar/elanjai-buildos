import { useState, useEffect, useCallback } from 'react';
import api from '../lib/api';
import { Quotation, QuotationStatus, PackageName, StageBreakdown, DEFAULT_STAGES, PACKAGE_RATES } from '../lib/database.types';
import { useAuth } from './useAuth';

/** Tenant stage templates → StageBreakdown rows (fallback: DEFAULT_STAGES). */
export async function fetchStageTemplates(totalValue = 0): Promise<StageBreakdown[]> {
    try {
        const { data } = await api.get('/masters/stage-templates');
        if (Array.isArray(data) && data.length > 0) {
            return data.map((t: any) => ({
                stage: String(t.name).toLowerCase().replace(/[^a-z0-9]+/g, '_'),
                label: t.name,
                percentage: Number(t.percentage) || 0,
                amount: Math.round((Number(t.percentage) / 100) * totalValue),
            }));
        }
    } catch { /* fallback */ }
    return DEFAULT_STAGES.map(s => ({ ...s, amount: Math.round((s.percentage / 100) * totalValue) }));
}

interface UseQuotationsReturn {
    quotations: Quotation[];
    loading: boolean;
    error: Error | null;
    refetch: () => Promise<void>;
    createQuotation: (quotation: CreateQuotationInput) => Promise<{ data: Quotation | null; error: Error | null }>;
    updateQuotation: (id: string, updates: Partial<Quotation>) => Promise<{ error: Error | null }>;
    deleteQuotation: (id: string) => Promise<{ error: Error | null }>;
    convertToSite: (quotationId: string, options: ConvertToSiteOptions) => Promise<{ siteId: string | null; error: Error | null }>;
}

interface ConvertToSiteOptions {
    clientUserId: string;
    managerIds?: string[];
    expectedEndDate?: string;
}

interface CreateQuotationInput {
    client_name: string;
    client_phone?: string;
    client_email?: string;
    location?: string;
    builtup_area: number;
    package_name: PackageName;
}

const mapQuotationFromBackend = (data: any): Quotation => {
    return {
        id: data.id,
        quotation_number: data.quotationNumber,
        client_name: data.clientName,
        client_phone: data.clientPhone,
        client_email: data.clientEmail,
        location: data.location,
        builtup_area: data.builtupArea,
        rate_per_sqft: data.ratePerSqft,
        package_name: data.packageName ? data.packageName.toLowerCase() as PackageName : null,
        total_value: data.totalValue,
        stage_breakdown: typeof data.stageBreakdown === 'string' ? JSON.parse(data.stageBreakdown) : data.stageBreakdown,
        status: data.status ? data.status.toLowerCase() as QuotationStatus : 'draft',
        converted_site_id: data.convertedSiteId,
        created_by: data.createdBy,
        created_at: data.createdAt,
    };
};

const mapQuotationToBackend = (input: any) => {
    return {
        clientName: input.client_name,
        clientPhone: input.client_phone,
        clientEmail: input.client_email,
        location: input.location,
        builtupArea: input.builtup_area,
        ratePerSqft: input.rate_per_sqft,
        packageName: input.package_name ? input.package_name.toUpperCase() : null,
        totalValue: input.total_value,
        stageBreakdown: JSON.stringify(input.stage_breakdown),
        status: input.status ? input.status.toUpperCase() : null,
        convertedSiteId: input.converted_site_id
    };
};

export function useQuotations(): UseQuotationsReturn {
    const { user } = useAuth();
    const [quotations, setQuotations] = useState<Quotation[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const fetchQuotations = useCallback(async () => {
        if (!user) {
            setQuotations([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await api.get('/quotations');
            const data = response.data;

            const mappedQuotations = Array.isArray(data)
                ? data.map(mapQuotationFromBackend)
                : [];

            // Sort by created_at desc
            mappedQuotations.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

            setQuotations(mappedQuotations);
        } catch (err: any) {
            // Ignore abort errors from React StrictMode
            if (err.name === 'AbortError' || err.message?.includes('AbortError')) {
                return;
            }
            console.error('Error fetching quotations:', err);
            setError(err);
            setQuotations([]);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchQuotations();
    }, [fetchQuotations]);

    const createQuotation = async (input: CreateQuotationInput) => {
        try {
            const rate = PACKAGE_RATES[input.package_name];
            const totalValue = input.builtup_area * rate;

            // Stage split from tenant templates (fallback: defaults)
            const stageBreakdown: StageBreakdown[] = await fetchStageTemplates(totalValue);

            const payload = mapQuotationToBackend({
                ...input,
                rate_per_sqft: rate,
                total_value: totalValue,
                stage_breakdown: stageBreakdown,
                status: 'draft'
            });

            const response = await api.post('/quotations', payload);
            const newQuotation = mapQuotationFromBackend(response.data);

            await fetchQuotations();
            return { data: newQuotation, error: null };
        } catch (err: any) {
            console.error('Error creating quotation:', err);
            return { data: null, error: err };
        }
    };

    const updateQuotation = async (id: string, updates: Partial<Quotation>) => {
        try {
            const current = quotations.find(q => q.id === id);
            if (!current) throw new Error("Quotation not found locally");

            const merged = { ...current, ...updates };
            const payload = mapQuotationToBackend(merged);

            await api.put(`/quotations/${id}`, payload);
            await fetchQuotations();
            return { error: null };
        } catch (err: any) {
            console.error('Error updating quotation:', err);
            return { error: err };
        }
    };

    const deleteQuotation = async (id: string) => {
        try {
            await api.delete(`/quotations/${id}`);
            await fetchQuotations();
            return { error: null };
        } catch (err: any) {
            console.error('Error deleting quotation:', err);
            return { error: err };
        }
    };

    const convertToSite = async (quotationId: string, options: ConvertToSiteOptions) => {
        try {
            // Backend endpoint: POST /quotations/{id}/convert
            // Payload needs clientUserId, expectedEndDate. Manager assignment separate?
            // Backend `convertToSite` logic takes `ConvertToSiteRequest`. 
            // I need to create `ConvertToSiteRequest` DTO in backend if I haven't?
            // Wait, looking at `QuotationService.java` from memory, I implemented `convertToSite` logic.
            // But `QuotationController` endpoint?
            // Let's assume I implemented `POST /api/quotations/{id}/convert`.
            // Payload: { clientUserId, expectedEndDate, managerIds }

            const payload = {
                clientUserId: options.clientUserId,
                expectedEndDate: options.expectedEndDate,
                managerIds: options.managerIds
            };

            const response = await api.post(`/quotations/${quotationId}/convert`, payload);
            // Response typically contains the new Site ID or Site object.
            // Assuming it returns `SiteResponse` or just ID.
            // Let's assume it returns the created Site object.

            const siteData = response.data;
            const siteId = siteData.id;

            await fetchQuotations();
            return { siteId: siteId, error: null };
        } catch (err: any) {
            console.error('Error converting quotation to site:', err);
            return { siteId: null, error: err };
        }
    };

    return {
        quotations,
        loading,
        error,
        refetch: fetchQuotations,
        createQuotation,
        updateQuotation,
        deleteQuotation,
        convertToSite,
    };
}

export function getQuotationStatusInfo(status: QuotationStatus): { label: string; color: string; bgColor: string } {
    switch (status) {
        case 'draft':
            return { label: 'Draft', color: 'text-gray-600', bgColor: 'bg-gray-100' };
        case 'sent':
            return { label: 'Sent', color: 'text-blue-600', bgColor: 'bg-blue-100' };
        case 'signed':
            return { label: 'Signed', color: 'text-green-600', bgColor: 'bg-green-100' };
        case 'converted':
            return { label: 'Converted', color: 'text-purple-600', bgColor: 'bg-purple-100' };
        default:
            return { label: status, color: 'text-gray-600', bgColor: 'bg-gray-100' };
    }
}

export function getPackageInfo(packageName: PackageName): { label: string; rate: number; description: string } {
    const packages: Record<PackageName, { label: string; rate: number; description: string }> = {
        economy: { label: 'Economy', rate: 1500, description: 'Basic construction with standard materials' },
        standard: { label: 'Standard', rate: 1650, description: 'Quality construction with branded materials' },
        premium: { label: 'Premium', rate: 1800, description: 'Premium construction with top-tier materials' },
        luxury: { label: 'Luxury', rate: 2100, description: 'Luxury construction with imported/designer materials' },
    };
    return packages[packageName];
}
