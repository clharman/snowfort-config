import fs from 'fs/promises';
import path from 'path';
import { BackupInfo } from '../types/index.js';

export class BackupService {
  private backupDir: string;

  constructor(backupDir: string = path.join(process.cwd(), '.snowfort-config-backups')) {
    this.backupDir = backupDir;
  }

  async createBackup(engineId: string, originalPath: string, data: any): Promise<string> {
    await fs.mkdir(this.backupDir, { recursive: true });
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFilename = `${engineId}-${timestamp}.json`;
    const backupPath = path.join(this.backupDir, backupFilename);
    
    const backupData = {
      engine: engineId,
      originalPath,
      timestamp: new Date().toISOString(),
      data
    };
    
    await fs.writeFile(backupPath, JSON.stringify(backupData, null, 2), 'utf8');
    return backupPath;
  }

  async listBackups(engineId?: string): Promise<BackupInfo[]> {
    try {
      const files = await fs.readdir(this.backupDir);
      const backups: BackupInfo[] = [];
      
      for (const file of files) {
        if (!file.endsWith('.json')) continue;
        
        const filePath = path.join(this.backupDir, file);
        try {
          const content = await fs.readFile(filePath, 'utf8');
          const backupData = JSON.parse(content);
          
          if (!engineId || backupData.engine === engineId) {
            backups.push({
              path: filePath,
              timestamp: new Date(backupData.timestamp),
              engine: backupData.engine
            });
          }
        } catch (error) {
          console.warn(`Failed to read backup file ${file}:`, error);
        }
      }
      
      return backups.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    } catch (error) {
      if ((error as any).code === 'ENOENT') {
        return [];
      }
      throw error;
    }
  }

  async restoreBackup(backupPath: string): Promise<boolean> {
    try {
      const content = await fs.readFile(backupPath, 'utf8');
      const backupData = JSON.parse(content);
      
      await fs.mkdir(path.dirname(backupData.originalPath), { recursive: true });
      await fs.writeFile(
        backupData.originalPath, 
        JSON.stringify(backupData.data, null, 2), 
        'utf8'
      );
      
      return true;
    } catch (error) {
      console.error('Failed to restore backup:', error);
      return false;
    }
  }

  async cleanupOldBackups(maxAge: number = 30 * 24 * 60 * 60 * 1000): Promise<void> {
    const backups = await this.listBackups();
    const cutoff = new Date(Date.now() - maxAge);
    
    for (const backup of backups) {
      if (backup.timestamp < cutoff) {
        try {
          await fs.unlink(backup.path);
        } catch (error) {
          console.warn(`Failed to delete old backup ${backup.path}:`, error);
        }
      }
    }
  }
}