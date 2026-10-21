import type { SQLiteDatabase } from 'expo-sqlite';

// Every table carries a UUID and created/updated/deleted timestamps so that a
// future Cloud version can sync rows without changing the schema.
const MIGRATIONS: string[] = [
  `
  CREATE TABLE projects (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL DEFAULT '',
    address TEXT NOT NULL DEFAULT '',
    file_number TEXT NOT NULL DEFAULT '',
    construction_year TEXT NOT NULL DEFAULT '',
    lot_count TEXT NOT NULL DEFAULT '',
    building_type TEXT NOT NULL DEFAULT 'ancien',
    report_mode TEXT NOT NULL DEFAULT 'ancien',
    visit_dates TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    deleted_at TEXT
  );
  CREATE TABLE actors (
    id TEXT PRIMARY KEY NOT NULL,
    project_id TEXT NOT NULL REFERENCES projects(id),
    role TEXT NOT NULL,
    name TEXT NOT NULL DEFAULT '',
    company TEXT NOT NULL DEFAULT '',
    contact TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    deleted_at TEXT
  );
  CREATE TABLE levels (
    id TEXT PRIMARY KEY NOT NULL,
    project_id TEXT NOT NULL REFERENCES projects(id),
    name TEXT NOT NULL,
    position INTEGER NOT NULL,
    plan_file TEXT,
    plan_width INTEGER,
    plan_height INTEGER,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    deleted_at TEXT
  );
  CREATE INDEX actors_project ON actors(project_id);
  CREATE INDEX levels_project ON levels(project_id);
  `,
];

export async function migrate(db: SQLiteDatabase) {
  await db.execAsync('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  let version = row?.user_version ?? 0;
  while (version < MIGRATIONS.length) {
    await db.withExclusiveTransactionAsync(async (tx) => {
      await tx.execAsync(MIGRATIONS[version]);
      await tx.execAsync(`PRAGMA user_version = ${version + 1}`);
    });
    version += 1;
  }
}
