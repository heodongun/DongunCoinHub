'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';
import type { LoginRequest, RegisterRequest, AuthResponse } from '@/types';
import toast from 'react-hot-toast';

interface AuthContextType {
    isAuthenticated: boolean;
    isLoading: boolean;
    user: AuthResponse | null;
    login: (credentials: LoginRequest) => Promise<void>;
    register: (data: RegisterRequest) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const router = useRouter();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [user, setUser] = useState<AuthResponse | null>(null);

    useEffect(() => {
        const token = localStorage.getItem('accessToken');
        const savedUser = localStorage.getItem('user');

        if (token && savedUser) {
            setIsAuthenticated(true);
            setUser(JSON.parse(savedUser));
        }

        setIsLoading(false);
    }, []);

    const login = async (credentials: LoginRequest) => {
        try {
            const data = await authApi.login(credentials);

            localStorage.setItem('accessToken', data.accessToken);
            localStorage.setItem('refreshToken', data.refreshToken);
            localStorage.setItem('user', JSON.stringify(data));

            setIsAuthenticated(true);
            setUser(data);

            toast.success('로그인 성공!');
            router.push('/dashboard');
        } catch (error: any) {
            toast.error(error.response?.data?.error || '로그인 실패');
            throw error;
        }
    };

    const register = async (data: RegisterRequest) => {
        try {
            const response = await authApi.register(data);

            localStorage.setItem('accessToken', response.accessToken);
            localStorage.setItem('refreshToken', response.refreshToken);
            localStorage.setItem('user', JSON.stringify(response));

            setIsAuthenticated(true);
            setUser(response);

            toast.success('회원가입 성공!');
            router.push('/dashboard');
        } catch (error: any) {
            toast.error(error.response?.data?.error || '회원가입 실패');
            throw error;
        }
    };

    const logout = () => {
        authApi.logout();
        setIsAuthenticated(false);
        setUser(null);
        toast.success('로그아웃 완료');
        router.push('/login');
    };

    return (
        <AuthContext.Provider
            value={{
                isAuthenticated,
                isLoading,
                user,
                login,
                register,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuthContext() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuthContext must be used within an AuthProvider');
    }
    return context;
}
