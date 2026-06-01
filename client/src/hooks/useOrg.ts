import { useState, useEffect } from 'react';
import { Organization } from '../types';
import { api } from '../utils/api';

const ORG_KEY = 'krafo_org_id';

export function useOrg() {
  const [org, setOrg] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const savedId = localStorage.getItem(ORG_KEY);

  useEffect(() => {
    if (!savedId) { setLoading(false); return; }
    api.organizations.get(savedId)
      .then(setOrg)
      .catch(() => localStorage.removeItem(ORG_KEY))
      .finally(() => setLoading(false));
  }, [savedId]);

  const saveOrg = (o: Organization) => {
    localStorage.setItem(ORG_KEY, o.id);
    setOrg(o);
    setError(null);
  };

  const clearOrg = () => {
    localStorage.removeItem(ORG_KEY);
    setOrg(null);
  };

  return { org, setOrg: saveOrg, clearOrg, loading, error, setError };
}
