import { useState, useEffect, useCallback } from 'react';
import api from '../lib/api';
import { Expense, ExpenseCategory, PaymentMode, ExpenseApprovalStatus } from '../lib/database.types';
import { useAuth } from './useAuth';

interface UseExpensesReturn {
    expenses: Expense[];
    loading: boolean;
    error: Error | null;
    totalExpenses: number;
    refetch: () => Promise<void>;
    addExpense: (expense: CreateExpenseInput) => Promise<{ data: Expense | null; error: Error | null }>;
    updateExpense: (id: string, updates: Partial<Expense>) => Promise<{ error: Error | null }>;
    deleteExpense: (id: string) => Promise<{ error: Error | null }>;
}

interface CreateExpenseInput {
    site_id: string;
    category: ExpenseCategory;
    item_name: string;
    quantity?: number;
    unit?: string;
    unit_price?: number;
    total_amount: number;
    paid_to?: string;
    payment_mode?: PaymentMode;
    bill_image_url?: string;
    expense_date: string;
}

const mapExpenseFromBackend = (data: any): Expense => {
    return {
        id: data.id,
        site_id: data.siteId,
        category: data.category ? data.category.toLowerCase() as ExpenseCategory : 'materials', // default or handle null
        item_name: data.itemName,
        quantity: data.quantity,
        unit: data.unit,
        unit_price: data.unitPrice,
        total_amount: data.totalAmount,
        paid_to: data.paidTo,
        payment_mode: data.paymentMode ? data.paymentMode.toLowerCase() as PaymentMode : null,
        bill_image_url: data.billImageUrl,
        expense_date: data.expenseDate,
        created_by: data.createdBy,
        created_at: data.createdAt,
        approval_status: data.approvalStatus ? data.approvalStatus.toLowerCase() as ExpenseApprovalStatus : 'pending',
        approved_by: data.approvedBy,
        approved_at: data.approvedAt,
        rejection_reason: data.rejectionReason,
    };
};

const mapExpenseToBackend = (input: any) => {
    return {
        siteId: input.site_id,
        category: input.category ? input.category.toUpperCase() : null,
        itemName: input.item_name,
        quantity: input.quantity,
        unit: input.unit,
        unitPrice: input.unit_price,
        totalAmount: input.total_amount,
        paidTo: input.paid_to,
        paymentMode: input.payment_mode ? input.payment_mode.toUpperCase() : null,
        billImageUrl: input.bill_image_url,
        expenseDate: input.expense_date,
        approvalStatus: input.approval_status ? input.approval_status.toUpperCase() : null,
        rejectionReason: input.rejection_reason
    };
};

export function useExpenses(siteId?: string): UseExpensesReturn {
    const { user } = useAuth();
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const fetchExpenses = useCallback(async () => {
        if (!user) {
            setExpenses([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            let url = '/expenses';
            if (siteId) {
                url = `/expenses/site/${siteId}`;
            }

            const response = await api.get(url);
            const data = response.data;

            const mappedExpenses = Array.isArray(data)
                ? data.map(mapExpenseFromBackend)
                : [];

            // Sort by expense_date desc
            mappedExpenses.sort((a, b) => new Date(b.expense_date).getTime() - new Date(a.expense_date).getTime());

            setExpenses(mappedExpenses);
        } catch (err: any) {
            console.error('Error fetching expenses:', err);
            setError(err);
            setExpenses([]);
        } finally {
            setLoading(false);
        }
    }, [user, siteId]);

    useEffect(() => {
        fetchExpenses();
    }, [fetchExpenses]);

    const addExpense = async (expenseInput: CreateExpenseInput) => {
        try {
            const payload = mapExpenseToBackend(expenseInput);
            const response = await api.post('/expenses', payload);
            const newExpense = mapExpenseFromBackend(response.data);

            await fetchExpenses(); // Refresh the list
            return { data: newExpense, error: null };
        } catch (err: any) {
            console.error('Error adding expense:', err);
            return { data: null, error: err };
        }
    };

    const updateExpense = async (id: string, updates: Partial<Expense>) => {
        try {
            const current = expenses.find(e => e.id === id);
            if (!current) throw new Error("Expense not found locally");

            const merged = { ...current, ...updates };
            const payload = mapExpenseToBackend(merged);

            await api.put(`/expenses/${id}`, payload);
            await fetchExpenses(); // Refresh the list
            return { error: null };
        } catch (err: any) {
            console.error('Error updating expense:', err);
            return { error: err };
        }
    };

    const deleteExpense = async (id: string) => {
        try {
            await api.delete(`/expenses/${id}`);
            await fetchExpenses(); // Refresh the list
            return { error: null };
        } catch (err: any) {
            console.error('Error deleting expense:', err);
            return { error: err };
        }
    };

    const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.total_amount), 0);

    return {
        expenses,
        loading,
        error,
        totalExpenses,
        refetch: fetchExpenses,
        addExpense,
        updateExpense,
        deleteExpense,
    };
}

// Get expenses grouped by category
export function useExpensesByCategory(siteId: string | undefined) {
    const { expenses, loading, error } = useExpenses(siteId);

    const expensesByCategory = expenses.reduce((acc, expense) => {
        const category = expense.category;
        if (!acc[category]) {
            acc[category] = { total: 0, count: 0, expenses: [] };
        }
        acc[category].total += Number(expense.total_amount);
        acc[category].count += 1;
        acc[category].expenses.push(expense);
        return acc;
    }, {} as Record<ExpenseCategory, { total: number; count: number; expenses: Expense[] }>);

    return { expensesByCategory, loading, error };
}

// Category labels for display
export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
    materials: 'Materials',
    labor: 'Labor',
    transport: 'Transport',
    petty_cash: 'Petty Cash',
    contractor: 'Contractor',
};

// Common expense items by category
export const COMMON_EXPENSE_ITEMS: Record<ExpenseCategory, string[]> = {
    materials: [
        'Cement - ACC 50kg',
        'Cement - Ultratech 50kg',
        'Steel - TMT Bars',
        'Sand - River Sand',
        'Sand - M-Sand',
        'Bricks - Red Bricks',
        'Bricks - Fly Ash',
        'Aggregate - 20mm',
        'Aggregate - 40mm',
        'Tiles - Floor',
        'Tiles - Wall',
        'Paint',
        'Electrical Wire',
        'PVC Pipes',
        'Plumbing Fittings',
    ],
    labor: [
        'Mason - Daily Wage',
        'Helper - Daily Wage',
        'Carpenter - Daily Wage',
        'Electrician - Daily Wage',
        'Plumber - Daily Wage',
        'Painter - Daily Wage',
        'Welder - Daily Wage',
    ],
    transport: [
        'Material Delivery',
        'Sand Delivery',
        'Aggregate Delivery',
        'Steel Delivery',
        'Equipment Transport',
    ],
    petty_cash: [
        'Tea & Snacks',
        'Minor Tools',
        'Office Supplies',
        'Phone Recharge',
        'Miscellaneous',
    ],
    contractor: [
        'Foundation Work',
        'RCC Work',
        'Brickwork',
        'Plastering',
        'Electrical Work',
        'Plumbing Work',
        'Tile Work',
        'Painting Work',
        'Fabrication Work',
    ],
};
