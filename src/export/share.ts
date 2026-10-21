import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import type { SQLiteDatabase } from 'expo-sqlite';

import { getProject, listActors, listLevels } from '@/db/repo';
import { renderReport, type LevelWithImage } from '@/export/report';
import { projectFile } from '@/storage/files';

const DOCX_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

function imageType(fileName: string): 'jpg' | 'png' | null {
  const ext = fileName.split('.').pop()?.toLowerCase();
  if (ext === 'png') return 'png';
  if (ext === 'jpg' || ext === 'jpeg') return 'jpg';
  return null;
}

function safeFileName(value: string) {
  return value.replace(/[^\p{L}\p{N} _-]+/gu, '').trim().replace(/\s+/g, '_') || 'copropriete';
}

/** Generates the Word report on the device and opens the system share sheet. */
export async function exportAndShare(db: SQLiteDatabase, projectId: string) {
  const project = await getProject(db, projectId);
  if (!project) throw new Error('Projet introuvable');
  const [actors, levels] = await Promise.all([listActors(db, projectId), listLevels(db, projectId)]);

  const withImages: LevelWithImage[] = await Promise.all(
    levels.map(async (level) => {
      const type = level.plan_file ? imageType(level.plan_file) : null;
      if (!level.plan_file || !type) return { ...level, image: null };
      const file = projectFile(projectId, level.plan_file);
      if (!file.exists) return { ...level, image: null };
      return { ...level, image: { data: await file.bytes(), type } };
    }),
  );

  const bytes = await renderReport({ project, actors, levels: withImages, generatedAt: new Date() });
  const out = new File(Paths.cache, `DTG_${safeFileName(project.name)}.docx`);
  if (out.exists) out.delete();
  out.create();
  out.writeSync(bytes);

  if (!(await Sharing.isAvailableAsync())) {
    throw new Error('Le partage n’est pas disponible sur cet appareil.');
  }
  await Sharing.shareAsync(out.uri, {
    mimeType: DOCX_MIME,
    UTI: 'org.openxmlformats.wordprocessingml.document',
    dialogTitle: 'Envoyer le rapport DTG',
  });
}
