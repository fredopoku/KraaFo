import fs from 'fs';
import path from 'path';

// Site-wide maintenance mode, toggled instantly from the admin Security tab
// (no redeploy needed) - see routes/admin.ts and middleware/maintenance.ts.
// Persisted the same way as riskConfig.ts so it survives restarts.
const DB_DIR = path.dirname(process.env.DB_PATH || './data/krafo.db');
const CONFIG_PATH = process.env.MAINTENANCE_CONFIG_PATH || path.join(DB_DIR, 'maintenance.json');

export interface MaintenanceConfig {
  enabled: boolean;
  message: string;
}

const DEFAULT_CONFIG: MaintenanceConfig = {
  enabled: false,
  message: "We're making some improvements and will be back shortly. Thanks for your patience!",
};

let current: MaintenanceConfig = DEFAULT_CONFIG;

function ensureDir(): void {
  if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });
}

export function reloadMaintenanceConfig(): MaintenanceConfig {
  try {
    const raw = fs.readFileSync(CONFIG_PATH, 'utf8');
    current = { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
  } catch {
    current = DEFAULT_CONFIG;
  }
  return current;
}

export function getMaintenanceConfig(): MaintenanceConfig {
  return current;
}

export function setMaintenanceConfig(next: Partial<MaintenanceConfig>): MaintenanceConfig {
  current = { ...current, ...next };
  ensureDir();
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(current, null, 2));
  return current;
}

// Load at module init so a restart picks up whatever state was last saved.
reloadMaintenanceConfig();
