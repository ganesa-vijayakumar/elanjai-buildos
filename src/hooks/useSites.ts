import { useState, useEffect, useCallback } from 'react';
import api from '../lib/api';
import { Site, SiteWithFinancials, SiteStatus, ConstructionStage, PackageName } from '../lib/database.types';
import { useAuth } from './useAuth';

interface UseSitesReturn {
    sites: SiteWithFinancials[];
    loading: boolean;
    error: Error | null;
    refetch: () => Promise<void>;
    createSite: (site: CreateSiteInput) => Promise<{ data: Site | null; error: Error | null }>;
    updateSite: (id: string, updates: Partial<Site>) => Promise<{ error: Error | null }>;
    deleteSite: (id: string) => Promise<{ error: Error | null }>;
    getSiteById: (id: string) => SiteWithFinancials | undefined;
}

interface CreateSiteInput {
    site_name: string;
    client_name: string;
    client_phone?: string;
    client_email?: string;
    location?: string;
    builtup_area?: number;
    rate_per_sqft?: number;
    package_name?: PackageName;
    total_value?: number;
    current_stage?: ConstructionStage;
    status?: SiteStatus;
    start_date?: string;
    expected_completion?: string;
}

// Helper to map backend CamelCase to frontend snake_case and handle Enums
const mapBackendStatusToFrontend = (backendStatus: string | null): SiteStatus => {
    if (!backendStatus) return 'open';
    const status = backendStatus.toUpperCase();
    switch (status) {
        case 'OPEN':
            return 'open';
        case 'IN_PROGRESS':
            return 'in_progress';
        case 'COMPLETED':
            return 'completed';
        case 'HOLD':
            return 'hold';
        case 'CANCELLED':
            return 'cancelled';
        default:
            return 'open';
    }
};

const mapSiteFromBackend = (data: any): Site => {
    return {
        id: data.id,
        site_name: data.siteName,
        client_name: data.clientName,
        client_phone: data.clientPhone,
        client_email: data.clientEmail,
        client_user_id: data.clientUserId,
        location: data.location,
        builtup_area: data.builtupArea,
        rate_per_sqft: data.ratePerSqft,
        package_name: data.packageName ? data.packageName.toLowerCase() as PackageName : null,
        total_value: data.totalValue,
        current_stage: data.currentStage ? data.currentStage.toLowerCase() as ConstructionStage : null,
        status: mapBackendStatusToFrontend(data.status),
        start_date: data.startDate,
        expected_completion: data.expectedEndDate,
        expected_end_date: data.expectedEndDate,
        estimated_material_expense: data.estimatedMaterialExpense,
        created_by: data.createdBy,
        created_at: data.createdAt,
    };
};

const mapFrontendStatusToBackend = (status: string | null): string | null => {
    if (!status) return null;
    return status.toUpperCase();
};

const mapSiteToBackend = (input: any) => {
    return {
        siteName: input.site_name,
        clientName: input.client_name,
        clientPhone: input.client_phone,
        clientEmail: input.client_email,
        clientUserId: input.client_user_id,
        location: input.location,
        builtupArea: input.builtup_area,
        ratePerSqft: input.rate_per_sqft,
        packageName: input.package_name ? input.package_name.toUpperCase() : null,
        totalValue: input.total_value,
        currentStage: input.current_stage ? input.current_stage.toUpperCase() : null,
        status: mapFrontendStatusToBackend(input.status),
        startDate: input.start_date,
        expectedEndDate: input.expected_completion || input.expected_end_date,
        estimatedMaterialExpense: input.estimated_material_expense
    };
};

export function useSites(): UseSitesReturn {
    const { user, role } = useAuth();
    const [sites, setSites] = useState<SiteWithFinancials[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const fetchSites = useCallback(async () => {
        if (!user) {
            setSites([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // Fetch all data in parallel
            const [sitesRes, collectionsRes, expensesRes] = await Promise.all([
                api.get('/sites'),
                api.get('/collections'),
                api.get('/expenses')
            ]);

            const sitesData = sitesRes.data;
            const collectionsData = collectionsRes.data;
            const expensesData = expensesRes.data;

            if (!sitesData || sitesData.length === 0) {
                setSites([]);
                setLoading(false);
                return;
            }

            // Calculate totals per site
            const collectionsBySite: Record<string, number> = {};
            const expensesBySite: Record<string, number> = {};

            (collectionsData || []).forEach((c: any) => {
                const siteId = c.siteId; // Backend uses CamelCase
                collectionsBySite[siteId] = (collectionsBySite[siteId] || 0) + Number(c.amount);
            });

            (expensesData || []).forEach((e: any) => {
                const siteId = e.siteId; // Backend uses CamelCase
                expensesBySite[siteId] = (expensesBySite[siteId] || 0) + Number(e.totalAmount);
            });

            // Map and Aggregate
            const sitesWithFinancials: SiteWithFinancials[] = sitesData.map((siteBackend: any) => {
                const site = mapSiteFromBackend(siteBackend);

                const totalCollections = collectionsBySite[site.id] || 0;
                const totalExpenses = expensesBySite[site.id] || 0;
                const estimatedMaterialExpense = site.estimated_material_expense || 0;
                const margin = totalCollections - (totalExpenses + estimatedMaterialExpense);
                const marginPercentage = totalCollections > 0
                    ? Math.round((margin / totalCollections) * 1000) / 10
                    : 0;

                return {
                    ...site,
                    total_collections: totalCollections,
                    total_expenses: totalExpenses,
                    estimated_material_expense: estimatedMaterialExpense,
                    margin: margin,
                    margin_percentage: marginPercentage,
                };
            });

            setSites(sitesWithFinancials);
        } catch (err: any) {
            console.error('Error fetching sites:', err);
            setError(err);
            setSites([]);
        } finally {
            setLoading(false);
        }
    }, [user, role]);

    useEffect(() => {
        fetchSites();
    }, [fetchSites]);

    const createSite = async (siteInput: CreateSiteInput) => {
        try {
            const payload = mapSiteToBackend(siteInput);
            const response = await api.post('/sites', payload);
            const newSite = mapSiteFromBackend(response.data);

            await fetchSites(); // Refresh the list
            return { data: newSite, error: null };
        } catch (err: any) {
            console.error('Error creating site:', err);
            return { data: null, error: err };
        }
    };

    const updateSite = async (id: string, updates: Partial<Site>) => {
        try {
            const payload = mapSiteToBackend(updates);
            // PUT typically requires all fields or partial. Our Controller accepts SiteRequest
            // which has all fields. Null fields might overwrite specific values if not handled in backend service.
            // Backend `updateSite` updates ONLY fields present in request? 
            // Looking at `SiteService.java`, it blindly sets fields from request. 
            // So we should strictly FETCH the existing site, merge updates, and send FULL object back 
            // OR ensure backend ignores nulls.
            // Current backend implementation: `site.setSiteName(request.getSiteName())` -> sets null if null.
            // Backend implementation of updateSite is destructive for nulls.
            // Ideally backend should use MapStruct with null checks or manual checks.
            // The current backend code `site.setSiteName(request.getSiteName())` WILL set it to null.

            // QUICK FIX on frontend: Fetch current site, merge, send full object.

            let currentSite = sites.find(s => s.id === id);

            if (!currentSite) {
                // If not found locally, fetch it
                const response = await api.get(`/sites/${id}`);
                const mappedSite = mapSiteFromBackend(response.data);
                currentSite = {
                    ...mappedSite,
                    total_collections: 0,
                    total_expenses: 0,
                    estimated_material_expense: mappedSite.estimated_material_expense || 0,
                    margin: 0,
                    margin_percentage: 0,
                };
            }

            if (!currentSite) throw new Error("Site not found");

            const mergedInput = { ...currentSite, ...updates };
            const fullPayload = mapSiteToBackend(mergedInput);

            await api.put(`/sites/${id}`, fullPayload);

            await fetchSites(); // Refresh the list
            return { error: null };
        } catch (err: any) {
            console.error('Error updating site:', err);
            return { error: err };
        }
    };

    const deleteSite = async (id: string) => {
        try {
            await api.delete(`/sites/${id}`);
            await fetchSites();
            return { error: null };
        } catch (err: any) {
            console.error('Error deleting site:', err);
            return { error: err };
        }
    };

    const getSiteById = (id: string) => {
        return sites.find(site => site.id === id);
    };

    return {
        sites,
        loading,
        error,
        refetch: fetchSites,
        createSite,
        updateSite,
        deleteSite,
        getSiteById,
    };
}

export function useSiteDetails(siteId: string | undefined) {
    const [site, setSite] = useState<Site | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const fetchSite = useCallback(async () => {
        if (!siteId) {
            setSite(null);
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await api.get(`/sites/${siteId}`);
            setSite(mapSiteFromBackend(response.data));
        } catch (err: any) {
            console.error('Error fetching site details:', err);
            setError(err);
        } finally {
            setLoading(false);
        }
    }, [siteId]);

    useEffect(() => {
        fetchSite();
    }, [fetchSite]);

    return { site, loading, error, refetch: fetchSite };
}
