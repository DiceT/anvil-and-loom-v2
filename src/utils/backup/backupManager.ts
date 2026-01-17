import * as fs from 'fs';
import * as path from 'path';

/**
 * Backup Manager for Anvil & Loom v2
 * Provides utilities for backing up and restoring files and directories
 */

/**
 * Generates a timestamp string for backup naming
 * Format: YYYY-MM-DD_HH-MM-SS
 */
export function createBackupTimestamp(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day}_${hours}-${minutes}-${seconds}`;
}

/**
 * Ensures a directory exists, creating it if necessary
 */
async function ensureDirectoryExists(dirPath: string): Promise<void> {
  try {
    await fs.promises.access(dirPath);
  } catch {
    await fs.promises.mkdir(dirPath, { recursive: true });
  }
}

/**
 * Copies a file from source to destination
 */
async function copyFile(sourcePath: string, destPath: string): Promise<void> {
  await ensureDirectoryExists(path.dirname(destPath));
  await fs.promises.copyFile(sourcePath, destPath);
}

/**
 * Recursively copies a directory from source to destination
 */
async function copyDirectory(sourcePath: string, destPath: string): Promise<void> {
  await ensureDirectoryExists(destPath);
  
  const entries = await fs.promises.readdir(sourcePath, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = path.join(sourcePath, entry.name);
    const destEntryPath = path.join(destPath, entry.name);
    
    if (entry.isDirectory()) {
      await copyDirectory(srcPath, destEntryPath);
    } else {
      await copyFile(srcPath, destEntryPath);
    }
  }
}

/**
 * Backs up an entire directory
 * @param sourcePath - Path to the directory to backup
 * @param backupPath - Path where the backup should be stored
 */
export async function backupDirectory(sourcePath: string, backupPath: string): Promise<void> {
  try {
    console.log(`[Backup] Starting directory backup: ${sourcePath} -> ${backupPath}`);
    
    // Check if source exists
    await fs.promises.access(sourcePath);
    
    // Perform the backup
    await copyDirectory(sourcePath, backupPath);
    
    console.log(`[Backup] Directory backup completed successfully`);
  } catch (error) {
    console.error(`[Backup] Failed to backup directory:`, error);
    throw new Error(`Failed to backup directory ${sourcePath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Backs up an individual file
 * @param filePath - Path to the file to backup
 * @param backupPath - Path where the backup should be stored
 */
export async function backupFile(filePath: string, backupPath: string): Promise<void> {
  try {
    console.log(`[Backup] Starting file backup: ${filePath} -> ${backupPath}`);
    
    // Check if source exists
    await fs.promises.access(filePath);
    
    // Perform the backup
    await copyFile(filePath, backupPath);
    
    console.log(`[Backup] File backup completed successfully`);
  } catch (error) {
    console.error(`[Backup] Failed to backup file:`, error);
    throw new Error(`Failed to backup file ${filePath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Verifies that a backup exists and is valid
 * @param backupPath - Path to the backup to verify
 * @returns Promise<boolean> - True if backup is valid, false otherwise
 */
export async function verifyBackup(backupPath: string): Promise<boolean> {
  try {
    console.log(`[Verify] Checking backup: ${backupPath}`);
    
    // Check if backup exists
    await fs.promises.access(backupPath);
    
    // Get stats
    const stats = await fs.promises.stat(backupPath);
    
    // Verify it's not empty
    if (stats.isDirectory()) {
      const entries = await fs.promises.readdir(backupPath);
      if (entries.length === 0) {
        console.warn(`[Verify] Backup directory is empty: ${backupPath}`);
        return false;
      }
    } else {
      if (stats.size === 0) {
        console.warn(`[Verify] Backup file is empty: ${backupPath}`);
        return false;
      }
    }
    
    console.log(`[Verify] Backup verified successfully`);
    return true;
  } catch (error) {
    console.error(`[Verify] Backup verification failed:`, error);
    return false;
  }
}

/**
 * Restores files/directories from a backup
 * @param backupPath - Path to the backup to restore from
 * @param targetPath - Path where the backup should be restored to
 */
export async function restoreFromBackup(backupPath: string, targetPath: string): Promise<void> {
  try {
    console.log(`[Restore] Starting restore: ${backupPath} -> ${targetPath}`);
    
    // Verify backup exists first
    const isValid = await verifyBackup(backupPath);
    if (!isValid) {
      throw new Error('Backup is invalid or does not exist');
    }
    
    // Get backup stats to determine if it's a file or directory
    const stats = await fs.promises.stat(backupPath);
    
    if (stats.isDirectory()) {
      // Restore directory
      await copyDirectory(backupPath, targetPath);
    } else {
      // Restore file
      await copyFile(backupPath, targetPath);
    }
    
    console.log(`[Restore] Restore completed successfully`);
  } catch (error) {
    console.error(`[Restore] Failed to restore:`, error);
    throw new Error(`Failed to restore from backup: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Creates a backup manifest file listing all backed up items
 * @param manifestPath - Path where the manifest should be created
 * @param items - List of items that were backed up
 */
export async function createBackupManifest(manifestPath: string, items: Array<{ path: string; type: 'file' | 'directory'; size: number }>): Promise<void> {
  try {
    const manifest = {
      timestamp: new Date().toISOString(),
      backupVersion: '1.0',
      items: items,
      totalSize: items.reduce((sum, item) => sum + item.size, 0)
    };
    
    await ensureDirectoryExists(path.dirname(manifestPath));
    await fs.promises.writeFile(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8');
    
    console.log(`[Backup] Manifest created at: ${manifestPath}`);
  } catch (error) {
    console.error(`[Backup] Failed to create manifest:`, error);
    throw error;
  }
}

/**
 * Reads a backup manifest file
 * @param manifestPath - Path to the manifest file
 * @returns Parsed manifest object
 */
export async function readBackupManifest(manifestPath: string): Promise<any> {
  try {
    const content = await fs.promises.readFile(manifestPath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`[Backup] Failed to read manifest:`, error);
    throw error;
  }
}
