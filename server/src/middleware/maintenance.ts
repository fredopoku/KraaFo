import { Request, Response, NextFunction } from 'express';
import { getMaintenanceConfig } from '../config/maintenanceConfig';
import { buildMaintenancePage } from '../templates/maintenanceTemplate';

// Exempt so an admin is never locked out of turning maintenance mode back
// off, and so the host's health check doesn't see the site as crashed and
// restart it (which would fight the "we're doing planned maintenance" point).
const EXEMPT_PREFIXES = ['/api/health', '/api/admin'];

export function maintenanceGate(req: Request, res: Response, next: NextFunction): void {
  const { enabled, message } = getMaintenanceConfig();
  if (!enabled) { next(); return; }
  if (EXEMPT_PREFIXES.some(prefix => req.path.startsWith(prefix))) { next(); return; }

  res.set('Retry-After', '300');
  if (req.path.startsWith('/api/')) {
    res.status(503).json({ error: message, maintenance: true });
    return;
  }
  res.status(503).send(buildMaintenancePage(message));
}
