import path from 'path';
import fs from 'fs';
import { env } from './env';

export function getStoragePath(...segments: string[]): string {
  const resolved = path.resolve(env.STORAGE_PATH, ...segments);
  return resolved;
}

export function ensureDirectoryExists(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

export function initializeStorage(): void {
  const directories = [
    getStoragePath('documents'),
    getStoragePath('uploads'),
    getStoragePath('templates'),
  ];

  for (const dir of directories) {
    ensureDirectoryExists(dir);
  }
}
