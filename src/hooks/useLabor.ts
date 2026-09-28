import { useState, useEffect, useCallback } from 'react';
import api from '../lib/api';
import { useAuth } from './useAuth';

export interface Worker {
    id: string;
    name: string;
    phone?: string;
    type: string;
    dailyWage: number;
    status: string;
    advanceBalance: number;
    site?: { id: string };
    createdAt?: string;
}

export interface AttendanceRecord {
    id: string;
    worker: Worker;
    status: string;
    wageEarned?: number;
    overtimeHours?: number;
    overtimePay?: number;
}

export interface DailyAttendance {
    id: string;
    date: string;
    notes?: string;
    site?: { id: string };
    markedBy?: { fullName?: string };
    markedAt?: string;
}

export interface WorkerAdvance {
    id: string;
    amount: number;
    date: string;
    reason?: string;
    status: string;
    recoveredAmount: number;
}

export function useWorkers(siteId?: string, activeOnly = true) {
    const { user } = useAuth();
    const [workers, setWorkers] = useState<Worker[]>([]);
    const [loading, setLoading] = useState(true);

    const refetch = useCallback(async () => {
        if (!user || !siteId) { setWorkers([]); setLoading(false); return; }
        setLoading(true);
        try {
            const r = await api.get(`/labor/sites/${siteId}/workers`, { params: { activeOnly } });
            setWorkers(Array.isArray(r.data) ? r.data : []);
        } catch (e) {
            console.error('Error fetching workers:', e);
            setWorkers([]);
        } finally { setLoading(false); }
    }, [user, siteId, activeOnly]);

    useEffect(() => { refetch(); }, [refetch]);

    const addWorker = async (w: { name: string; phone?: string; type: string; dailyWage: number }) => {
        try {
            await api.post(`/labor/sites/${siteId}/workers`, w);
            await refetch();
            return { error: null };
        } catch (error: any) { return { error }; }
    };

    const updateWorker = async (id: string, updates: Partial<Worker>) => {
        try {
            await api.put(`/labor/workers/${id}`, updates);
            await refetch();
            return { error: null };
        } catch (error: any) { return { error }; }
    };

    return { workers, loading, refetch, addWorker, updateWorker };
}

export function useAttendance(siteId?: string, days = 30) {
    const { user } = useAuth();
    const [sheets, setSheets] = useState<DailyAttendance[]>([]);
    const [loading, setLoading] = useState(true);

    const refetch = useCallback(async () => {
        if (!user || !siteId) { setSheets([]); setLoading(false); return; }
        setLoading(true);
        try {
            const to = new Date().toISOString().slice(0, 10);
            const from = new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);
            const r = await api.get(`/labor/sites/${siteId}/attendance`, { params: { from, to } });
            setSheets(Array.isArray(r.data) ? r.data : []);
        } catch (e) {
            console.error('Error fetching attendance:', e);
            setSheets([]);
        } finally { setLoading(false); }
    }, [user, siteId, days]);

    useEffect(() => { refetch(); }, [refetch]);

    const fetchRows = async (attendanceId: string): Promise<AttendanceRecord[]> => {
        const r = await api.get(`/labor/attendance/${attendanceId}/records`);
        return Array.isArray(r.data) ? r.data : [];
    };

    const mark = async (date: string, rows: { workerId: string; status: string; overtimeHours?: number }[], notes?: string) => {
        try {
            await api.post(`/labor/sites/${siteId}/attendance`, { date, rows, notes });
            await refetch();
            return { error: null };
        } catch (error: any) { return { error }; }
    };

    return { sheets, loading, refetch, fetchRows, mark };
}

export function useWorkerAdvances(workerId?: string) {
    const { user } = useAuth();
    const [advances, setAdvances] = useState<WorkerAdvance[]>([]);
    const [loading, setLoading] = useState(true);

    const refetch = useCallback(async () => {
        if (!user || !workerId) { setAdvances([]); setLoading(false); return; }
        setLoading(true);
        try {
            const r = await api.get(`/labor/workers/${workerId}/advances`);
            setAdvances(Array.isArray(r.data) ? r.data : []);
        } catch (e) {
            console.error('Error fetching advances:', e);
            setAdvances([]);
        } finally { setLoading(false); }
    }, [user, workerId]);

    useEffect(() => { refetch(); }, [refetch]);

    const addAdvance = async (amount: number, reason?: string, date?: string) => {
        try {
            await api.post(`/labor/workers/${workerId}/advances`, { amount, reason, date });
            await refetch();
            return { error: null };
        } catch (error: any) { return { error }; }
    };

    const recover = async (advanceId: string, amount: number) => {
        try {
            await api.post(`/labor/advances/${advanceId}/recover`, { amount });
            await refetch();
            return { error: null };
        } catch (error: any) { return { error }; }
    };

    return { advances, loading, refetch, addAdvance, recover };
}
