import { useState, useEffect } from 'react';
import { Organization } from '../types';
import { api } from '../utils/api';

const TOKEN_KEY = 'krafo_token';

export type UserRole = 'owner' | 'admin' | 'staff' | 'accountant';

export interface TokenPayload {
  orgId: string;
  userId: string;
  role: UserRole;
  email: string;
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export function decodeToken(token: string): TokenPayload | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.orgId ? payload as TokenPayload : null;
  } catch {
    return null;
  }
}

export function useOrg() {
  const [org, setOrgState] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const token = getToken();
  const decoded = token ? decodeToken(token) : null;
  const orgId = decoded?.orgId ?? null;
  const role: UserRole = decoded?.role ?? 'owner';

  const canWrite = role === 'owner' || role === 'admin' || role === 'staff';
  const canManageTeam = role === 'owner' || role === 'admin';
  const isOwner = role === 'owner';

  useEffect(() => {
    if (!orgId) { setLoading(false); return; }
    api.organizations.get(orgId)
      .then(setOrgState)
      .catch((err: Error) => {
        // Only clear the token when the server explicitly rejects it (401/403).
        // Network errors or server downtime should not log the user out.
        if (err.message.includes('401') || err.message.includes('403') || err.message.includes('Forbidden') || err.message.includes('Unauthorized')) {
          clearToken();
        }
      })
      .finally(() => setLoading(false));
  }, [orgId]);

  const saveOrg = (o: Organization, token?: string) => {
    if (token) setToken(token);
    setOrgState(o);
    setError(null);
  };

  const clearOrg = () => {
    clearToken();
    setOrgState(null);
  };

  return { org, setOrg: saveOrg, clearOrg, loading, error, setError, role, canWrite, canManageTeam, isOwner };
}
