import { useState, useEffect, useContext, createContext, ReactNode } from 'react';
import api from '../lib/api';
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
        const token = localStorage.getItem('jwt_token');
        const savedUser = localStorage.getItem('user_data');

        if (token && savedUser) {
            try {
                setUser(JSON.parse(savedUser));
            } catch (e) {
                console.error("Failed to parse user data", e);
                localStorage.removeItem('jwt_token');
                localStorage.removeItem('user_data');
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

            localStorage.setItem('jwt_token', token);
            localStorage.setItem('user_data', JSON.stringify(user));
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
        localStorage.removeItem('jwt_token');
        localStorage.removeItem('user_data');
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
