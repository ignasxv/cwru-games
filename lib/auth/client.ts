export interface AuthUser {
  id: number;
  username: string;
  email: string | null;
  phoneNumber?: string | null;
}

export interface AuthState {
  user: AuthUser | null;
  token: string | null;
}

const AUTH_TOKEN_KEY = 'auth-token';
const AUTH_USER_KEY = 'auth-user';

export function saveAuthToStorage(token: string, user: AuthUser): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
  }
}

export function getAuthFromStorage(): AuthState {
  if (typeof window === 'undefined') {
    return { user: null, token: null };
  }

  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  const userStr = localStorage.getItem(AUTH_USER_KEY);
  
  if (!token || !userStr) {
    return { user: null, token: null };
  }

  try {
    const user = JSON.parse(userStr) as AuthUser;
    return { user, token };
  } catch (error) {
    console.error('Error parsing user from storage:', error);
    clearAuthFromStorage();
    return { user: null, token: null };
  }
}

export function clearAuthFromStorage(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
  }
}

export function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 < Date.now();
  } catch (error) {
    return true;
  }
}
