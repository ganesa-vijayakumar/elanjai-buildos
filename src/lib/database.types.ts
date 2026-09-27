// Database type definitions for MySQL backend
// Generated from the implementation plan schema

export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[];

export type UserRole = 'owner' | 'admin' | 'site_manager' | 'client';
export type SiteStatus = 'open' | 'in_progress' | 'hold' | 'cancelled' | 'completed';
export type ExpenseApprovalStatus = 'pending' | 'approved' | 'rejected';
export type QuotationStatus = 'draft' | 'sent' | 'signed' | 'converted';
export type PaymentMode = 'cash' | 'upi' | 'cheque' | 'bank_transfer';
export type ExpenseCategory = 'materials' | 'labor' | 'transport' | 'petty_cash' | 'contractor';
export type ConstructionStage =
    | 'advance'
    | 'foundation'
    | 'plinth'
    | 'rcc_roof'
    | 'brickwork'
    | 'plastering'
    | 'electrical_plumbing'
    | 'finishing'
    | 'handover';

export type PackageName = 'economy' | 'standard' | 'premium' | 'luxury';

// Stage breakdown for quotations
export interface StageBreakdown {
    stage: ConstructionStage;
    label: string;
    percentage: number;
    amount: number;
}

// Default construction stages with percentages
export const DEFAULT_STAGES: StageBreakdown[] = [
    { stage: 'advance', label: 'Advance Payment', percentage: 10, amount: 0 },
    { stage: 'foundation', label: 'Foundation', percentage: 12, amount: 0 },
    { stage: 'plinth', label: 'Plinth Level', percentage: 8, amount: 0 },
    { stage: 'rcc_roof', label: 'RCC / Roof Work', percentage: 14, amount: 0 },
    { stage: 'brickwork', label: 'Brickwork', percentage: 8, amount: 0 },
    { stage: 'plastering', label: 'Plastering', percentage: 10, amount: 0 },
    { stage: 'electrical_plumbing', label: 'Electrical & Plumbing', percentage: 12, amount: 0 },
    { stage: 'finishing', label: 'Finishing Works', percentage: 18, amount: 0 },
    { stage: 'handover', label: 'Final Handover', percentage: 8, amount: 0 },
];

// Package rates per sqft
export const PACKAGE_RATES: Record<PackageName, number> = {
    economy: 1500,
    standard: 1650,
    premium: 1800,
    luxury: 2100,
};

export interface Database {
    public: {
        Tables: {
            profiles: {
                Row: {
                    id: string;
                    full_name: string | null;
                    phone: string | null;
                    email: string | null;
                    location: string | null;
                    role: UserRole;
                    company_name: string | null;
                    company_logo: string | null;
                    created_at: string;
                };
                Insert: {
                    id: string;
                    full_name?: string | null;
                    phone?: string | null;
                    role?: UserRole;
                    company_name?: string | null;
                    company_logo?: string | null;
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    full_name?: string | null;
                    phone?: string | null;
                    role?: UserRole;
                    company_name?: string | null;
                    company_logo?: string | null;
                    created_at?: string;
                };
            };
            sites: {
                Row: {
                    id: string;
                    site_name: string;
                    client_name: string;
                    client_phone: string | null;
                    client_email: string | null;
                    client_user_id: string | null;
                    location: string | null;
                    builtup_area: number | null;
                    rate_per_sqft: number | null;
                    package_name: PackageName | null;
                    total_value: number | null;
                    current_stage: ConstructionStage | null;
                    status: SiteStatus;
                    start_date: string | null;
                    expected_completion: string | null;
                    expected_end_date: string | null;
                    estimated_material_expense: number | null;
                    created_by: string | null;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    site_name: string;
                    client_name: string;
                    client_phone?: string | null;
                    client_email?: string | null;
                    client_user_id?: string | null;
                    location?: string | null;
                    builtup_area?: number | null;
                    rate_per_sqft?: number | null;
                    package_name?: PackageName | null;
                    total_value?: number | null;
                    current_stage?: ConstructionStage | null;
                    status?: SiteStatus;
                    start_date?: string | null;
                    expected_completion?: string | null;
                    expected_end_date?: string | null;
                    estimated_material_expense?: number | null;
                    created_by?: string | null;
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    site_name?: string;
                    client_name?: string;
                    client_phone?: string | null;
                    client_email?: string | null;
                    client_user_id?: string | null;
                    location?: string | null;
                    builtup_area?: number | null;
                    rate_per_sqft?: number | null;
                    package_name?: PackageName | null;
                    total_value?: number | null;
                    current_stage?: ConstructionStage | null;
                    status?: SiteStatus;
                    start_date?: string | null;
                    expected_completion?: string | null;
                    expected_end_date?: string | null;
                    estimated_material_expense?: number | null;
                    created_by?: string | null;
                    created_at?: string;
                };
            };
            site_assignments: {
                Row: {
                    id: string;
                    site_id: string;
                    manager_id: string;
                    assigned_at: string;
                };
                Insert: {
                    id?: string;
                    site_id: string;
                    manager_id: string;
                    assigned_at?: string;
                };
                Update: {
                    id?: string;
                    site_id?: string;
                    manager_id?: string;
                    assigned_at?: string;
                };
            };
            collections: {
                Row: {
                    id: string;
                    site_id: string;
                    amount: number;
                    stage: ConstructionStage | null;
                    payment_mode: PaymentMode | null;
                    reference_number: string | null;
                    notes: string | null;
                    received_date: string;
                    created_by: string | null;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    site_id: string;
                    amount: number;
                    stage?: ConstructionStage | null;
                    payment_mode?: PaymentMode | null;
                    reference_number?: string | null;
                    notes?: string | null;
                    received_date: string;
                    created_by?: string | null;
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    site_id?: string;
                    amount?: number;
                    stage?: ConstructionStage | null;
                    payment_mode?: PaymentMode | null;
                    reference_number?: string | null;
                    notes?: string | null;
                    received_date?: string;
                    created_by?: string | null;
                    created_at?: string;
                };
            };
            expenses: {
                Row: {
                    id: string;
                    site_id: string;
                    category: ExpenseCategory;
                    item_name: string;
                    quantity: number | null;
                    unit: string | null;
                    unit_price: number | null;
                    total_amount: number;
                    paid_to: string | null;
                    payment_mode: PaymentMode | null;
                    bill_image_url: string | null;
                    expense_date: string;
                    created_by: string | null;
                    created_at: string;
                    approval_status: ExpenseApprovalStatus;
                    approved_by: string | null;
                    approved_at: string | null;
                    rejection_reason: string | null;
                };
                Insert: {
                    id?: string;
                    site_id: string;
                    category: ExpenseCategory;
                    item_name: string;
                    quantity?: number | null;
                    unit?: string | null;
                    unit_price?: number | null;
                    total_amount: number;
                    paid_to?: string | null;
                    payment_mode?: PaymentMode | null;
                    bill_image_url?: string | null;
                    expense_date: string;
                    created_by?: string | null;
                    created_at?: string;
                    approval_status?: ExpenseApprovalStatus;
                    approved_by?: string | null;
                    approved_at?: string | null;
                    rejection_reason?: string | null;
                };
                Update: {
                    id?: string;
                    site_id?: string;
                    category?: ExpenseCategory;
                    item_name?: string;
                    quantity?: number | null;
                    unit?: string | null;
                    unit_price?: number | null;
                    total_amount?: number;
                    paid_to?: string | null;
                    payment_mode?: PaymentMode | null;
                    bill_image_url?: string | null;
                    expense_date?: string;
                    created_by?: string | null;
                    created_at?: string;
                    approval_status?: ExpenseApprovalStatus;
                    approved_by?: string | null;
                    approved_at?: string | null;
                    rejection_reason?: string | null;
                };
            };
            quotations: {
                Row: {
                    id: string;
                    quotation_number: string | null;
                    client_name: string;
                    client_phone: string | null;
                    client_email: string | null;
                    location: string | null;
                    builtup_area: number | null;
                    rate_per_sqft: number | null;
                    package_name: PackageName | null;
                    total_value: number | null;
                    stage_breakdown: StageBreakdown[] | null;
                    status: QuotationStatus;
                    converted_site_id: string | null;
                    created_by: string | null;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    quotation_number?: string | null;
                    client_name: string;
                    client_phone?: string | null;
                    client_email?: string | null;
                    location?: string | null;
                    builtup_area?: number | null;
                    rate_per_sqft?: number | null;
                    package_name?: PackageName | null;
                    total_value?: number | null;
                    stage_breakdown?: StageBreakdown[] | null;
                    status?: QuotationStatus;
                    converted_site_id?: string | null;
                    created_by?: string | null;
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    quotation_number?: string | null;
                    client_name?: string;
                    client_phone?: string | null;
                    client_email?: string | null;
                    location?: string | null;
                    builtup_area?: number | null;
                    rate_per_sqft?: number | null;
                    package_name?: PackageName | null;
                    total_value?: number | null;
                    stage_breakdown?: StageBreakdown[] | null;
                    status?: QuotationStatus;
                    converted_site_id?: string | null;
                    created_by?: string | null;
                    created_at?: string;
                };
            };
            settings: {
                Row: {
                    id: string;
                    key: string;
                    value: Json | null;
                    updated_by: string | null;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    key: string;
                    value?: Json | null;
                    updated_by?: string | null;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    key?: string;
                    value?: Json | null;
                    updated_by?: string | null;
                    updated_at?: string;
                };
            };
            material_spent: {
                Row: {
                    id: string;
                    site_id: string;
                    material_type: 'cement' | 'steel' | 'bricks' | 'm_sand' | 'p_sand' | 'aggregate';
                    quantity: number;
                    unit: string;
                    updated_by: string | null;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    site_id: string;
                    material_type: 'cement' | 'steel' | 'bricks' | 'm_sand' | 'p_sand' | 'aggregate';
                    quantity?: number;
                    unit: string;
                    updated_by?: string | null;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    site_id?: string;
                    material_type?: 'cement' | 'steel' | 'brigs' | 'mchant' | 'pchant' | 'aggregate';
                    quantity?: number;
                    unit?: string;
                    updated_by?: string | null;
                    updated_at?: string;
                };
            };
        };
        Views: Record<string, never>;
        Functions: Record<string, never>;
        Enums: {
            user_role: UserRole;
            site_status: SiteStatus;
            quotation_status: QuotationStatus;
            payment_mode: PaymentMode;
            expense_category: ExpenseCategory;
            construction_stage: ConstructionStage;
            package_name: PackageName;
            expense_approval_status: ExpenseApprovalStatus;
        };
    };
}

// Convenience type aliases
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Site = Database['public']['Tables']['sites']['Row'];
export type SiteAssignment = Database['public']['Tables']['site_assignments']['Row'];
export type Collection = Database['public']['Tables']['collections']['Row'];
export type Expense = Database['public']['Tables']['expenses']['Row'];
export type Quotation = Database['public']['Tables']['quotations']['Row'];
export type Setting = Database['public']['Tables']['settings']['Row'];
export type MaterialSpent = Database['public']['Tables']['material_spent']['Row'];

// Material type definitions for tracking
export type MaterialType = 'cement' | 'steel' | 'bricks' | 'm_sand' | 'p_sand' | 'aggregate';

export const MATERIAL_SPENT_CONFIG: Record<MaterialType, { label: string; unit: string }> = {
    cement: { label: 'Cement', unit: 'Bags' },
    steel: { label: 'Steel', unit: 'Count' },
    bricks: { label: 'Bricks', unit: 'Count' },
    m_sand: { label: 'M-Sand', unit: 'Unit' },
    p_sand: { label: 'P-Sand', unit: 'Unit' },
    aggregate: { label: 'Aggregate', unit: 'Unit' },
};

// Extended types with computed fields
export interface SiteWithFinancials extends Site {
    total_collections: number;
    total_expenses: number;
    estimated_material_expense: number;
    margin: number;
    margin_percentage: number;
}

// Company settings type
export interface CompanySettings {
    company_name: string;
    company_address: string;
    company_phone: string;
    company_email: string;
    company_logo?: string | null;
    gst_number?: string | null;
}

// Package configuration type
export interface PackageConfig {
    rate: number;
    label: string;
    description: string;
}
