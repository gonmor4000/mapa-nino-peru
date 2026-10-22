import { randomUUID } from 'expo-crypto';
import type { SQLiteDatabase } from 'expo-sqlite';

import type { Actor, Level, Project } from '@/model/types';

const now = () => new Date().toISOString();

export function listProjects(db: SQLiteDatabase) {
  return db.getAllAsync<Project>(
    'SELECT * FROM projects WHERE deleted_at IS NULL ORDER BY updated_at DESC',
  );
}

export function getProject(db: SQLiteDatabase, id: string) {
  return db.getFirstAsync<Project>('SELECT * FROM projects WHERE id = ? AND deleted_at IS NULL', id);
}

export async function createProject(db: SQLiteDatabase) {
  const id = randomUUID();
  const t = now();
  await db.runAsync(
    'INSERT INTO projects (id, name, created_at, updated_at) VALUES (?, ?, ?, ?)',
    id,
    'Nouvelle copropriété',
    t,
    t,
  );
  return id;
}

type ProjectFields = Omit<Project, 'id' | 'created_at' | 'updated_at'>;

export async function updateProject(db: SQLiteDatabase, id: string, fields: Partial<ProjectFields>) {
  const keys = Object.keys(fields) as (keyof ProjectFields)[];
  if (keys.length === 0) return;
  const sets = keys.map((k) => `${k} = ?`).join(', ');
  await db.runAsync(
    `UPDATE projects SET ${sets}, updated_at = ? WHERE id = ?`,
    ...keys.map((k) => fields[k] as string),
    now(),
    id,
  );
}

export async function deleteProject(db: SQLiteDatabase, id: string) {
  await db.runAsync('UPDATE projects SET deleted_at = ?, updated_at = ? WHERE id = ?', now(), now(), id);
}

export function listActors(db: SQLiteDatabase, projectId: string) {
  return db.getAllAsync<Actor>(
    'SELECT * FROM actors WHERE project_id = ? AND deleted_at IS NULL ORDER BY created_at',
    projectId,
  );
}

export async function addActor(db: SQLiteDatabase, projectId: string, role: string) {
  const t = now();
  await db.runAsync(
    'INSERT INTO actors (id, project_id, role, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
    randomUUID(),
    projectId,
    role,
    t,
    t,
  );
}

type ActorFields = Pick<Actor, 'role' | 'name' | 'company' | 'contact'>;

export async function updateActor(db: SQLiteDatabase, id: string, fields: Partial<ActorFields>) {
  const keys = Object.keys(fields) as (keyof ActorFields)[];
  if (keys.length === 0) return;
  const sets = keys.map((k) => `${k} = ?`).join(', ');
  await db.runAsync(
    `UPDATE actors SET ${sets}, updated_at = ? WHERE id = ?`,
    ...keys.map((k) => fields[k] as string),
    now(),
    id,
  );
}

export async function deleteActor(db: SQLiteDatabase, id: string) {
  await db.runAsync('UPDATE actors SET deleted_at = ?, updated_at = ? WHERE id = ?', now(), now(), id);
}

export function listLevels(db: SQLiteDatabase, projectId: string) {
  return db.getAllAsync<Level>(
    'SELECT * FROM levels WHERE project_id = ? AND deleted_at IS NULL ORDER BY position',
    projectId,
  );
}

export function getLevel(db: SQLiteDatabase, id: string) {
  return db.getFirstAsync<Level>('SELECT * FROM levels WHERE id = ? AND deleted_at IS NULL', id);
}

export async function addLevel(db: SQLiteDatabase, projectId: string, name: string) {
  const row = await db.getFirstAsync<{ next: number }>(
    'SELECT COALESCE(MAX(position), -1) + 1 AS next FROM levels WHERE project_id = ?',
    projectId,
  );
  const t = now();
  const id = randomUUID();
  await db.runAsync(
    'INSERT INTO levels (id, project_id, name, position, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
    id,
    projectId,
    name,
    row?.next ?? 0,
    t,
    t,
  );
  return id;
}

export async function renameLevel(db: SQLiteDatabase, id: string, name: string) {
  await db.runAsync('UPDATE levels SET name = ?, updated_at = ? WHERE id = ?', name, now(), id);
}

export async function setLevelPlan(
  db: SQLiteDatabase,
  id: string,
  plan: { file: string; width: number; height: number },
) {
  await db.runAsync(
    'UPDATE levels SET plan_file = ?, plan_width = ?, plan_height = ?, updated_at = ? WHERE id = ?',
    plan.file,
    plan.width,
    plan.height,
    now(),
    id,
  );
}

export async function deleteLevel(db: SQLiteDatabase, id: string) {
  await db.runAsync('UPDATE levels SET deleted_at = ?, updated_at = ? WHERE id = ?', now(), now(), id);
}
