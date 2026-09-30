import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema.ts';
import * as fs from 'fs';
import * as path from 'path';

declare global {
  var _postgresPool: Pool | undefined;
}

export const createPool = () => {
  if (!global._postgresPool) {
    let host = process.env.SQL_HOST;

    // Auto-detect actual mounted Cloud SQL socket directory
    const cloudsqlDirs = ['/app/cloudsql', '/cloudsql'];
    let actualDir: string | null = null;

    for (const dir of cloudsqlDirs) {
      try {
        if (fs.existsSync(dir)) {
          const subdirs = fs.readdirSync(dir);
          for (const subdir of subdirs) {
            const fullSubdirPath = path.join(dir, subdir);
            const socketPath = path.join(fullSubdirPath, '.s.PGSQL.5432');
            if (fs.existsSync(socketPath)) {
              actualDir = fullSubdirPath;
              break;
            }
          }
        }
      } catch (e) {}
      if (actualDir) break;
    }

    if (actualDir) {
      host = actualDir;
    } else if (host && host.includes('cloudsql') && !host.startsWith('/')) {
      host = '/' + host;
    }

    global._postgresPool = new Pool({
      host: host,
      user: process.env.SQL_USER,
      password: process.env.SQL_PASSWORD,
      database: process.env.SQL_DB_NAME,
      max: 10,
      connectionTimeoutMillis: 15000,
    });

    global._postgresPool.on('error', (err) => {
      console.error('Unexpected error on idle SQL pool client:', err);
    });
  }
  return global._postgresPool;
};

const pool = createPool();
export const db = drizzle(pool, { schema });
