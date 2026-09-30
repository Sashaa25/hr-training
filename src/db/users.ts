import { db } from './index.ts';
import { users } from './schema.ts';
import { eq } from 'drizzle-orm';

export async function getOrCreateUser(uid: string, email: string, name?: string, nik?: string) {
  try {
    const result = await db.insert(users)
      .values({
        uid,
        email,
        name: name || email.split('@')[0],
        nik: nik || `EMP-${Math.floor(100 + Math.random() * 900)}`,
        role: email.includes('admin') || email.includes('hr') ? 'admin' : 'karyawan',
      })
      .onConflictDoUpdate({
        target: users.uid,
        set: {
          email,
        },
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error("Database getOrCreateUser failed:", error);
    throw new Error("Failed to get or create user in Cloud SQL.", { cause: error });
  }
}
