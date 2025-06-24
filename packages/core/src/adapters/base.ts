import { EngineAdapter } from '../types/index.js';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

export abstract class BaseAdapter implements EngineAdapter {
  abstract id: string;
  abstract name: string;
  abstract configPath: string;
  abstract schema: object;

  async detect(): Promise<boolean> {
    try {
      await fs.access(this.getConfigPath());
      return true;
    } catch {
      return false;
    }
  }

  async read(): Promise<any> {
    const configPath = this.getConfigPath();
    try {
      const content = await fs.readFile(configPath, 'utf8');
      return this.parseConfig(content);
    } catch (error) {
      if ((error as any).code === 'ENOENT') {
        return {};
      }
      throw error;
    }
  }

  async validate(data: any): Promise<{ valid: boolean; errors: string[] }> {
    const Ajv = (await import('ajv')).default;
    const ajv = new Ajv();
    const validate = ajv.compile(this.schema);
    const valid = validate(data);
    
    return {
      valid,
      errors: valid ? [] : (validate.errors?.map(err => 
        `${err.instancePath}: ${err.message}`
      ) || ['Unknown validation error'])
    };
  }

  async write(data: any): Promise<void> {
    const configPath = this.getConfigPath();
    const content = this.serializeConfig(data);
    
    await fs.mkdir(path.dirname(configPath), { recursive: true });
    await fs.writeFile(configPath, content, 'utf8');
  }

  getConfigPath(): string {
    return this.configPath.replace('~', os.homedir());
  }

  protected abstract parseConfig(content: string): any;
  protected abstract serializeConfig(data: any): string;
}