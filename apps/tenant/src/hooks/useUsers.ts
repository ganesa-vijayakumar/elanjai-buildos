import { useState, useEffect, useCallback } from 'react';
import api from '../lib/api';
import { Profile, UserRole } from '../lib/database.types';

interface UseUsersReturn {
    clients: Profile[];
    siteManagers: Profile[];
    loading: boolean;
    error: Error | null;
    refreshClients: () => Promise<void>;
    refreshSiteManagers: () => Promise<void>;
    createUser: (userData: { full_name: string; phone?: string; email?: string; location?: string; role: 'CLIENT' | 'SITE_MANAGER', password?: string }) => Promise<{ data: Profile | null; error: string | null; temporaryPassword?: string }>;
    updateUser: (userId: string, userData: { full_name: string; phone?: string; location?: string; role?: string; password?: string; username?: string }) => Promise<{ data: Profile | null; error: string | null }>;
}

// Helper to map backend user to frontend Profile
const mapUserFromBackend = (user: any): Profile => {
    return {
        id: user.id,
        full_name: user.fullName || null,
        phone: user.phone || null,
        email: user.email || null,
        username: user.username || null,
        location: user.location || null,
        role: user.role === 'OWNER' ? 'owner' :
            user.role === 'ADMIN' ? 'admin' :
                user.role === 'SITE_MANAGER' ? 'site_manager' : 'client',
        company_name: user.companyName || null,
        company_logo: user.companyLogo || null,
        created_at: new Date().toISOString(), // Mocking dates for now as backend might not return them
    };
};

export function useUsers(): UseUsersReturn {
    const [clients, setClients] = useState<Profile[]>([]);
    const [siteManagers, setSiteManagers] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const loadClients = useCallback(async () => {
        try {
            setLoading(true);
            const response = await api.get('/users?role=CLIENT');
            const data: Profile[] = response.data.map(mapUserFromBackend);
            // Sort by full_name
            data.sort((a, b) => (a.full_name || '').localeCompare(b.full_name || ''));
            setClients(data);
            setError(null);
        } catch (err: any) {
            console.error('Error loading clients:', err);
            setError(err.message || 'Failed to load clients');
        } finally {
            setLoading(false);
        }
    }, []);

    const loadSiteManagers = useCallback(async () => {
        try {
            setLoading(true);
            const response = await api.get('/users?role=SITE_MANAGER');
            const data: Profile[] = response.data.map(mapUserFromBackend);
            // Sort by full_name
            data.sort((a, b) => (a.full_name || '').localeCompare(b.full_name || ''));
            setSiteManagers(data);
            setError(null);
        } catch (err: any) {
            console.error('Error loading site managers:', err);
            setError(err.message || 'Failed to load site managers');
        } finally {
            setLoading(false);
        }
    }, []);

    const createUser = async (userData: { full_name: string; phone?: string; email?: string; location?: string; role: 'CLIENT' | 'SITE_MANAGER', password?: string }) => {
        try {
            setLoading(true);
            
            // Use provided password or generate a random one
            const isGenerated = !userData.password;
            const tempPassword = userData.password || (Math.random().toString(36).slice(-8) + 'A1!');

            const payload = {
                fullName: userData.full_name,
                phone: userData.phone,
                email: userData.email || `${Date.now()}@example.com`, // Email is required for auth but might not be provided
                password: tempPassword,
                location: userData.location,
                role: userData.role
            };

            const response = await api.post('/users', payload);
            const newUser = mapUserFromBackend(response.data);

            // Re-load the list to get updated data
            if (userData.role === 'CLIENT') {
                loadClients();
            } else if (userData.role === 'SITE_MANAGER') {
                loadSiteManagers();
            }

            return { data: newUser, error: null, temporaryPassword: isGenerated ? tempPassword : undefined };
        } catch (err: any) {
            console.error('Error creating user:', err);
            return { data: null, error: err.response?.data?.message || err.message || 'Failed to create user' };
        } finally {
            setLoading(false);
        }
    };

    const updateUser = async (userId: string, userData: { full_name: string; phone?: string; location?: string; role?: string; password?: string; username?: string }) => {
        try {
            setLoading(true);

            const payload = {
                fullName: userData.full_name,
                phone: userData.phone,
                location: userData.location,
                role: userData.role,
                ...(userData.password ? { password: userData.password } : {}),
                ...(userData.username ? { username: userData.username } : {})
            };

            const response = await api.put(`/users/${userId}`, payload);
            const updatedUser = mapUserFromBackend(response.data);

            // Re-load lists (we could just update standard state array but reloading is cleaner)
            if (updatedUser.role === 'client') {
                loadClients();
            } else if (updatedUser.role === 'site_manager') {
                loadSiteManagers();
            }

            return { data: updatedUser, error: null };
        } catch (err: any) {
            console.error('Error updating user:', err);
            return { data: null, error: err.response?.data?.message || err.message || 'Failed to update user' };
        } finally {
            setLoading(false);
        }
    };

    // Initial load
    useEffect(() => {
        loadClients();
        loadSiteManagers();
    }, [loadClients, loadSiteManagers]);

    return {
        clients,
        siteManagers,
        loading,
        error,
        refreshClients: loadClients,
        refreshSiteManagers: loadSiteManagers,
        createUser,
        updateUser
    };
}
