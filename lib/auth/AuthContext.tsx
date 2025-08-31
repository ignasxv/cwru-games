"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { AuthUser, AuthState, getAuthFromStorage, saveAuthToStorage, clearAuthFromStorage, isTokenExpired } from '@/lib/auth/client';
import { verifyToken } from '@/lib/actions/game-actions';

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  login: (token: string, user: AuthUser) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    setIsLoading(true);
    
    try {
      const authState = getAuthFromStorage();
      
      if (!authState.token || !authState.user) {
        setIsLoading(false);
        return;
      }

      // Check if token is expired
      if (isTokenExpired(authState.token)) {
        clearAuthFromStorage();
        setIsLoading(false);
        return;
      }

      // Verify token with server
      const verification = await verifyToken(authState.token);
      
      if (verification.success && verification.user) {
        setUser(verification.user);
        setToken(authState.token);
      } else {
        // Token is invalid, clear storage
        clearAuthFromStorage();
      }
    } catch (error) {
      console.error('Error initializing auth:', error);
      clearAuthFromStorage();
    } finally {
      setIsLoading(false);
    }
  };

  const login = (newToken: string, newUser: AuthUser) => {
    setUser(newUser);
    setToken(newToken);
    saveAuthToStorage(newToken, newUser);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    clearAuthFromStorage();
  };

  const refreshUser = async () => {
    if (!token) return;

    try {
      const verification = await verifyToken(token);
      if (verification.success && verification.user) {
        setUser(verification.user);
        saveAuthToStorage(token, verification.user);
      } else {
        logout();
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
      logout();
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      isLoading,
      login,
      logout,
      refreshUser
    }}>
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
