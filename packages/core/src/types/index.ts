export interface EngineAdapter {
  id: string;
  name: string;
  detect(): Promise<boolean>;
  read(): Promise<any>;
  validate(data: any): Promise<{ valid: boolean; errors: string[] }>;
  write(data: any): Promise<void>;
  getConfigPath(): string;
}

export interface BackupInfo {
  path: string;
  timestamp: Date;
  engine: string;
}

export interface CoreServiceAPI {
  getState(): Promise<Record<string, any>>;
  patch(patchObj: any): Promise<{ success: boolean; errors: string[] }>;
  listBackups(engine?: string): Promise<BackupInfo[]>;
  restoreBackup(path: string): Promise<boolean>;
  checkUpdate(): Promise<{ latest: string; current: string; url: string }>;
}

export interface ServiceConfig {
  configPath?: string;
  noUpdateCheck?: boolean;
}

export interface EngineState {
  id: string;
  name: string;
  configPath: string;
  lastModified: Date;
  data: any;
  detected: boolean;
}