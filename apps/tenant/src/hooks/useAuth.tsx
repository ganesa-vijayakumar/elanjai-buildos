import { useState, useEffect, useContext, createContext, ReactNode } from 'react';
import api, { tenantSession } from '../lib/api';
import {
    TENANT_TOKEN_KEY, TENANT_USER_KEY,
    LEGACY_JWT_KEY, LEGACY_USER_KEY, readStorage,
} from '@buildos/shared/storage';
// We keep UserRole for type compatibility, but might need to adjust based on backend response
import { UserRole } from '../lib/database.types';

interface User {
    id: string;
    email: string;
    fullName: string;
    role: string;
    phone?: string;
    // Add other fields as needed from backend UserResponse
}

interface AuthContextType {
    user: User | null;
    role: UserRole;
    loading: boolean;
    error: Error | null;
    signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        // Check for existing token and user data on mount
        const token = readStorage(TENANT_TOKEN_KEY, LEGACY_JWT_KEY);
        const savedUser = readStorage(TENANT_USER_KEY, LEGACY_USER_KEY);

        if (token && savedUser) {
            try {
                setUser(JSON.parse(savedUser));
            } catch (e) {
                console.error("Failed to parse user data", e);
                tenantSession.clear();
            }
        }
        setLoading(false);
    }, []);

    const signIn = async (email: string, password: string) => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.post('/auth/authenticate', { email, password });
            const { token, user } = response.data;

            localStorage.setItem(TENANT_TOKEN_KEY, token);
            localStorage.setItem(TENANT_USER_KEY, JSON.stringify(user));
            setUser(user);

            return { error: null };
        } catch (err: any) {
            console.error("Login failed", err);
            const message = err.response?.data?.message || 'Login failed';
            const errorObj = new Error(message);
            setError(errorObj);
            return { error: errorObj };
        } finally {
            setLoading(false);
        }
    };

    const logout = () => {
        tenantSession.clear();
        setUser(null);
        window.location.href = '/login';
    };

    // Fallback role logic - normalize to lowercase to match UserRole type
    const role: UserRole = (user?.role?.toLowerCase() as UserRole) || 'client';

    const value = {
        user,
        role,
        loading,
        error,
        signIn,
        logout,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

// Role-based access control helpers
export function useIsOwner() {
    const { role } = useAuth();
    return role === 'owner';
}

export function useIsAdmin() {
    const { role } = useAuth();
    return role === 'admin';
}

export function useIsOwnerOrAdmin() {
    const { role } = useAuth();
    return role === 'owner' || role === 'admin';
}

export function useIsSiteManager() {
    const { role } = useAuth();
    return role === 'site_manager';
}

export function useIsClient() {
    const { role } = useAuth();
    return role === 'client';
}

export function useCanManageSites() {
    const { role } = useAuth();
    return role === 'owner' || role === 'admin';
}

export function useCanAddExpenses() {
    const { role } = useAuth();
    return role === 'owner' || role === 'admin' || role === 'site_manager';
}

export function useCanAddCollections() {
    const { role } = useAuth();
    return role === 'owner' || role === 'admin';
}

export function useCanViewReports() {
    const { role } = useAuth();
    return role === 'owner' || role === 'admin';
}

export function useCanViewMargins() {
    const { role } = useAuth();
    return role === 'owner'; // Only owner sees margins/profits
}
