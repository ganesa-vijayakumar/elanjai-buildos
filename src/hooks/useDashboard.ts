import { useState, useEffect, useCallback } from 'react';
import api from '../lib/api';

interface DashboardKPIs {
    active_sites: number;
    completed_sites: number;
    total_collections: number;
    total_expenses: number;
    total_estimated_material_expense: number;
    net_profit: number;
    profit_margin_percentage: number;
}

interface MonthlyCashFlow {
    month: string;
    collections: number;
    expenses: number;
    net_flow: number;
}

interface UseDashboardReturn {
    kpis: DashboardKPIs | null;
    monthlyCashFlow: MonthlyCashFlow[];
    loading: boolean;
    error: Error | null;
    refetch: () => Promise<void>;
}

const DEFAULT_KPIS: DashboardKPIs = {
    active_sites: 0,
    completed_sites: 0,
    total_collections: 0,
    total_expenses: 0,
    total_estimated_material_expense: 0,
    net_profit: 0,
    profit_margin_percentage: 0,
};

const mapSummaryFromBackend = (data: any): DashboardKPIs => {
    return {
        active_sites: data.activeSites || 0,
        completed_sites: data.completedSites || 0,
        total_collections: data.totalCollections || 0,
        total_expenses: data.totalExpenses || 0,
        total_estimated_material_expense: data.totalEstimatedMaterials || 0,
        net_profit: data.netProfit || 0,
        profit_margin_percentage: data.profitMarginPercentage || 0,
    };
};

const mapCashFlowFromBackend = (data: any): MonthlyCashFlow => {
    return {
        month: data.month,
        collections: data.collections || 0,
        expenses: data.expenses || 0,
        net_flow: data.netFlow || 0,
    };
};

export function useDashboard(): UseDashboardReturn {
    const [kpis, setKpis] = useState<DashboardKPIs | null>(null);
    const [monthlyCashFlow, setMonthlyCashFlow] = useState<MonthlyCashFlow[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const fetchDashboardData = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const [summaryRes, cashFlowRes] = await Promise.all([
                api.get('/dashboard/kpis'),
                api.get('/dashboard/cash-flow')
            ]);

            setKpis(mapSummaryFromBackend(summaryRes.data));

            const cashFlowData = Array.isArray(cashFlowRes.data)
                ? cashFlowRes.data.map(mapCashFlowFromBackend)
                : [];
            setMonthlyCashFlow(cashFlowData);

        } catch (err: any) {
            console.error('Error fetching dashboard data:', err);
            setError(err);
            setKpis(DEFAULT_KPIS);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

    return {
        kpis,
        monthlyCashFlow,
        loading,
        error,
        refetch: fetchDashboardData,
    };
}

// Format currency for display (Indian format)
export function formatCurrency(amount: number): string {
    if (amount >= 10000000) {
        return `₹${(amount / 10000000).toFixed(2)} Cr`;
    } else if (amount >= 100000) {
        return `₹${(amount / 100000).toFixed(2)}L`;
    } else if (amount >= 1000) {
        return `₹${(amount / 1000).toFixed(1)}K`;
    }
    return `₹${amount.toLocaleString('en-IN')}`;
}

// Format full currency without abbreviation
export function formatFullCurrency(amount: number): string {
    return `₹${amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

// Get margin status color
export function getMarginStatus(marginPercentage: number): { color: string; status: string } {
    if (marginPercentage >= 20) {
        return { color: 'text-green-600', status: 'Excellent' };
    } else if (marginPercentage >= 10) {
        return { color: 'text-emerald-600', status: 'Good' };
    } else if (marginPercentage >= 0) {
        return { color: 'text-yellow-600', status: 'Low' };
    } else {
        return { color: 'text-red-600', status: 'Loss' };
    }
}
