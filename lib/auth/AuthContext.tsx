"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { AuthUser, AuthState, getAuthFromStorage, saveAuthToStorage, clearAuthFromStorage, isTokenExpired } from '@/lib/auth/client';
import { verifyToken, createAnonymousUser } from '@/lib/actions/game-actions';

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
      
      let currentUser = null;
      let currentToken = null;

      if (authState.token && authState.user && !isTokenExpired(authState.token)) {
        // Verify token with server
        const verification = await verifyToken(authState.token);
        if (verification.success && verification.user) {
          currentUser = verification.user;
          currentToken = authState.token;
        }
      }

      if (!currentUser || !currentToken) {
        // No valid session, create anonymous user
        clearAuthFromStorage(); // Clear any potential garbage
        const result = await createAnonymousUser();
         if (result.success && result.user && result.token) {
          currentUser = result.user;
          currentToken = result.token;
          saveAuthToStorage(currentToken, currentUser);
        }
      }

      if (currentUser && currentToken) {
        setUser(currentUser);
        setToken(currentToken);
      }
      
    } catch (error) {
      console.error('Error initializing auth:', error);
      clearAuthFromStorage();
    } finally {
      setIsLoading(false);
    }
  };

  const login = (token: string, user: AuthUser) => {
    setUser(user);
    setToken(token);
    saveAuthToStorage(token, user);
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
