import { EventEmitter } from 'events';
import chokidar from 'chokidar';
import updateNotifier from 'update-notifier';
import { EngineAdapter, CoreServiceAPI, BackupInfo, EngineState, ServiceConfig } from '../types/index.js';
import { BackupService } from './backup.js';
import { ClaudeAdapter, CodexAdapter } from '../adapters/index.js';

export class CoreService extends EventEmitter implements CoreServiceAPI {
  private adapters: Map<string, EngineAdapter> = new Map();
  private state: Map<string, EngineState> = new Map();
  private backupService: BackupService;
  private watchers: Map<string, chokidar.FSWatcher> = new Map();
  private config: ServiceConfig;

  constructor(config: ServiceConfig = {}) {
    super();
    this.config = config;
    this.backupService = new BackupService();
    this.registerAdapters();
  }

  private registerAdapters(): void {
    const adapters = [
      new ClaudeAdapter(),
      new CodexAdapter()
    ];

    for (const adapter of adapters) {
      this.adapters.set(adapter.id, adapter);
    }
  }

  async initialize(): Promise<void> {
    await this.refreshState();
    this.setupFileWatchers();
  }

  async refreshState(): Promise<void> {
    for (const [id, adapter] of this.adapters) {
      try {
        const detected = await adapter.detect();
        if (detected) {
          const data = await adapter.read();
          const stat = await import('fs/promises').then(fs => 
            fs.stat(adapter.getConfigPath())
          );
          
          this.state.set(id, {
            id,
            name: adapter.name,
            configPath: adapter.getConfigPath(),
            lastModified: stat.mtime,
            data,
            detected: true
          });
        } else {
          this.state.set(id, {
            id,
            name: adapter.name,
            configPath: adapter.getConfigPath(),
            lastModified: new Date(0),
            data: {},
            detected: false
          });
        }
      } catch (error) {
        console.error(`Failed to read config for ${id}:`, error);
        this.state.set(id, {
          id,
          name: adapter.name,
          configPath: adapter.getConfigPath(),
          lastModified: new Date(0),
          data: {},
          detected: false
        });
      }
    }
    
    this.emit('stateChanged', this.getStateSync());
  }

  private setupFileWatchers(): void {
    for (const [id, adapter] of this.adapters) {
      const configPath = adapter.getConfigPath();
      
      if (this.watchers.has(id)) {
        this.watchers.get(id)?.close();
      }
      
      const watcher = chokidar.watch(configPath, {
        ignoreInitial: true,
        awaitWriteFinish: {
          stabilityThreshold: 100,
          pollInterval: 10
        }
      });
      
      watcher.on('change', () => {
        this.handleFileChange(id);
      });
      
      this.watchers.set(id, watcher);
    }
  }

  private async handleFileChange(engineId: string): Promise<void> {
    try {
      const adapter = this.adapters.get(engineId);
      if (!adapter) return;
      
      const data = await adapter.read();
      const stat = await import('fs/promises').then(fs => 
        fs.stat(adapter.getConfigPath())
      );
      
      const currentState = this.state.get(engineId);
      if (currentState) {
        this.state.set(engineId, {
          ...currentState,
          data,
          lastModified: stat.mtime,
          detected: true
        });
        
        this.emit('stateChanged', this.getStateSync());
      }
    } catch (error) {
      console.error(`Failed to handle file change for ${engineId}:`, error);
    }
  }

  async getState(): Promise<Record<string, any>> {
    return this.getStateSync();
  }

  private getStateSync(): Record<string, any> {
    const result: Record<string, any> = {};
    for (const [id, state] of this.state) {
      result[id] = {
        ...state.data,
        _meta: {
          engine: id,
          name: state.name,
          configPath: state.configPath,
          lastModified: state.lastModified.toISOString(),
          detected: state.detected
        }
      };
    }
    return result;
  }

  async patch(patchObj: any): Promise<{ success: boolean; errors: string[]; warnings: string[] }> {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    for (const [engineId, enginePatch] of Object.entries(patchObj)) {
      if (engineId.startsWith('_')) continue;
      
      const adapter = this.adapters.get(engineId);
      const currentState = this.state.get(engineId);
      
      if (!adapter) {
        errors.push(`Engine "${engineId}" is not supported. Available engines: ${Array.from(this.adapters.keys()).join(', ')}`);
        continue;
      }
      
      if (!currentState) {
        errors.push(`Engine "${engineId}" configuration not found. Ensure the configuration file exists.`);
        continue;
      }
      
      if (!currentState.detected) {
        warnings.push(`Configuration file for "${engineId}" was not detected. Changes may not persist.`);
      }
      
      try {
        const newData = this.deepMerge(currentState.data, enginePatch);
        
        const validation = await adapter.validate(newData);
        if (!validation.valid) {
          errors.push(...validation.errors.map(err => `${adapter.name}: ${err}`));
          continue;
        }
        
        // Create backup before writing
        try {
          await this.backupService.createBackup(
            engineId, 
            adapter.getConfigPath(), 
            currentState.data
          );
        } catch (backupError) {
          warnings.push(`Failed to create backup for ${adapter.name}: ${(backupError as Error).message}`);
        }
        
        await adapter.write(newData);
        
        this.state.set(engineId, {
          ...currentState,
          data: newData,
          lastModified: new Date()
        });
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        if (errorMessage.includes('ENOENT')) {
          errors.push(`Configuration file not found for ${adapter.name}. File: ${adapter.getConfigPath()}`);
        } else if (errorMessage.includes('EACCES')) {
          errors.push(`Permission denied writing to ${adapter.name} configuration. Check file permissions.`);
        } else if (errorMessage.includes('JSON')) {
          errors.push(`Invalid JSON format for ${adapter.name}: ${errorMessage}`);
        } else {
          errors.push(`${adapter.name}: ${errorMessage}`);
        }
      }
    }
    
    if (errors.length === 0) {
      this.emit('stateChanged', this.getStateSync());
    }
    
    return {
      success: errors.length === 0,
      errors,
      warnings
    };
  }

  private deepMerge(target: any, source: any): any {
    if (source === null || source === undefined) return target;
    if (typeof source !== 'object') return source;
    if (Array.isArray(source)) return source;
    
    const result = { ...target };
    
    for (const key in source) {
      if (source[key] === null || source[key] === undefined) {
        result[key] = source[key];
      } else if (typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this.deepMerge(result[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }
    
    return result;
  }

  async listBackups(engine?: string): Promise<BackupInfo[]> {
    return this.backupService.listBackups(engine);
  }

  async restoreBackup(path: string): Promise<boolean> {
    const success = await this.backupService.restoreBackup(path);
    if (success) {
      await this.refreshState();
    }
    return success;
  }

  async checkUpdate(): Promise<{ latest: string; current: string; url: string }> {
    if (this.config.noUpdateCheck) {
      return {
        latest: '0.0.1',
        current: '0.0.1',
        url: ''
      };
    }
    
    try {
      const notifier = updateNotifier({
        pkg: { name: '@snowfort/config', version: '0.0.1' }
      });
      
      return {
        latest: notifier.update?.latest || '0.0.1',
        current: '0.0.1',
        url: 'https://github.com/snowfort/config'
      };
    } catch (error) {
      return {
        latest: '0.0.1',
        current: '0.0.1',
        url: ''
      };
    }
  }

  async cleanup(): Promise<void> {
    for (const watcher of this.watchers.values()) {
      await watcher.close();
    }
    this.watchers.clear();
    await this.backupService.cleanupOldBackups();
  }
}