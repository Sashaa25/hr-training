import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";

dotenv.config();

import * as fs from 'fs';
import * as path from 'path';

let sqlHost = process.env.SQL_HOST;

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
  sqlHost = actualDir;
} else if (sqlHost && sqlHost.includes('cloudsql') && !sqlHost.startsWith('/')) {
  sqlHost = '/' + sqlHost;
}
const sqlDbName = process.env.SQL_DB_NAME;
const user = process.env.SQL_ADMIN_USER;
const password = process.env.SQL_ADMIN_PASSWORD;

if (!sqlHost) {
  throw new Error("SQL_HOST must be set in environment variables.");
}
if (!sqlDbName) {
  throw new Error("SQL_DB_NAME must be set in environment variables.");
}
if (!user) {
  throw new Error("SQL_ADMIN_USER must be set in environment variables.");
}
if (!password) {
  throw new Error("SQL_ADMIN_PASSWORD must be set in environment variables.");
}

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  schemaFilter: ["public"],
  dbCredentials: {
    host: sqlHost,
    user: user,
    password: password,
    database: sqlDbName,
    ssl: false,
  },
  verbose: true,
});
