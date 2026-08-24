import { Request, Response, NextFunction } from 'express';
import { getMaintenanceConfig } from '../config/maintenanceConfig';
import { buildMaintenancePage } from '../templates/maintenanceTemplate';

// Exempt so an admin is never locked out of turning maintenance mode back
// off, and so the host's health check doesn't see the site as crashed and
// restart it (which would fight the "we're doing planned maintenance" point).
// '/api/admin' alone isn't enough - the browser also needs to load the
// /admin *page* itself (the React SPA shell) and its JS/CSS bundle under
// /assets, or the admin dashboard is just as gated as everything else and
// there's no way back in through the UI. Safe to expose: the shell renders
// nothing until Admin.tsx's own password prompt (checked server-side via
// x-admin-token) passes, so nothing protected is reachable without it.
const EXEMPT_PREFIXES = ['/api/health', '/api/admin', '/admin', '/assets'];

export function maintenanceGate(req: Request, res: Response, next: NextFunction): void {
  const { enabled, message } = getMaintenanceConfig();
  // MAINTENANCE_MODE env var force-enables regardless of the persisted
  // config, so it stays on across a deploy even if the config file's disk
  // turns out not to be persistent - env vars are part of the host's
  // service config either way, not the filesystem. Message still comes
  // from the saved config either way, so it stays editable from the admin
  // panel even while the env var is what's actually forcing this on.
  const forcedOn = process.env.MAINTENANCE_MODE === 'true';
  if (!enabled && !forcedOn) { next(); return; }
  if (EXEMPT_PREFIXES.some(prefix => req.path.startsWith(prefix))) { next(); return; }

  res.set('Retry-After', '300');
  if (req.path.startsWith('/api/')) {
    res.status(503).json({ error: message, maintenance: true });
    return;
  }
  res.status(503).send(buildMaintenancePage(message));
}
