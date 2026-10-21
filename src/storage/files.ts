import { randomUUID } from 'expo-crypto';
import { Directory, File, Paths } from 'expo-file-system';

// Each project keeps its images in its own folder, so a project can later be
// zipped for backup or handed to another device in one piece.
export function projectDir(projectId: string) {
  const dir = new Directory(Paths.document, 'projects', projectId);
  if (!dir.exists) dir.create({ intermediates: true });
  return dir;
}

export function projectFile(projectId: string, name: string) {
  return new File(projectDir(projectId), name);
}

/** Copies a picked image into the project folder and returns its new file name. */
export function importImage(projectId: string, sourceUri: string) {
  const source = new File(sourceUri);
  const ext = source.extension || '.jpg';
  const name = `${randomUUID()}${ext.toLowerCase()}`;
  source.copySync(projectFile(projectId, name));
  return name;
}

export function removeProjectFile(projectId: string, name: string) {
  const file = projectFile(projectId, name);
  if (file.exists) file.delete();
}
