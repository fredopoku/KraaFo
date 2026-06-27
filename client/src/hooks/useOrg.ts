import { useState, useEffect } from 'react';
import { Organization } from '../types';
import { api } from '../utils/api';

const TOKEN_KEY = 'krafo_token';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

function decodeOrgId(token: string): string | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.orgId || null;
  } catch {
    return null;
  }
}

export function useOrg() {
  const [org, setOrgState] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const token = getToken();
  const orgId = token ? decodeOrgId(token) : null;

  useEffect(() => {
    if (!orgId) { setLoading(false); return; }
    api.organizations.get(orgId)
      .then(setOrgState)
      .catch(() => { clearToken(); })
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

  return { org, setOrg: saveOrg, clearOrg, loading, error, setError };
}
