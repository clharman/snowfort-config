import { useState, useEffect } from 'react';

interface CoreState {
  [engineId: string]: any;
}

interface BackupInfo {
  path: string;
  timestamp: Date;
  engine: string;
}

export function useCore() {
  const [state, setState] = useState<CoreState>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let eventSource: EventSource | null = null;
    let reconnectTimeout: NodeJS.Timeout | null = null;
    let isComponentMounted = true;
    
    const connect = () => {
      // Cleanup any existing connection
      if (eventSource) {
        eventSource.close();
      }
      
      eventSource = new EventSource('/api/events');
      
      eventSource.onmessage = (event) => {
        if (!isComponentMounted) return;
        
        const data = JSON.parse(event.data);
        if (data.type === 'state') {
          setState(data.payload);
          setLoading(false);
          setError(null);
        }
      };
      
      eventSource.onerror = () => {
        if (!isComponentMounted) return;
        
        setError('Connection lost');
        if (eventSource) {
          eventSource.close();
        }
        
        // Reconnect with exponential backoff
        reconnectTimeout = setTimeout(connect, 5000);
      };
    };

    const fetchInitialState = async () => {
      try {
        const response = await fetch('/api/state');
        if (!isComponentMounted) return;
        
        if (response.ok) {
          const data = await response.json();
          setState(data);
        } else {
          throw new Error('Failed to fetch state');
        }
      } catch (err) {
        if (!isComponentMounted) return;
        setError(err instanceof Error ? err.message : 'Failed to load');
      } finally {
        if (isComponentMounted) {
          setLoading(false);
        }
      }
    };

    fetchInitialState();
    connect();

    return () => {
      isComponentMounted = false;
      if (eventSource) {
        eventSource.close();
      }
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
    };
  }, []); // Empty dependency array - only run once

  const patch = async (patchObj: any) => {
    try {
      const response = await fetch('/api/patch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(patchObj),
      });
      
      const result = await response.json();
      
      if (!result.success) {
        setError(result.errors.join(', '));
      } else {
        setError(null);
      }
      
      return result;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Patch failed';
      setError(errorMsg);
      return { success: false, errors: [errorMsg] };
    }
  };

  const listBackups = async (engine?: string): Promise<BackupInfo[]> => {
    try {
      const url = engine ? `/api/backups?engine=${engine}` : '/api/backups';
      const response = await fetch(url);
      return response.json();
    } catch (err) {
      console.error('Failed to list backups:', err);
      return [];
    }
  };

  const restoreBackup = async (path: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/restore', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ path }),
      });
      
      const result = await response.json();
      return result.success;
    } catch (err) {
      console.error('Failed to restore backup:', err);
      return false;
    }
  };

  const checkUpdate = async () => {
    try {
      const response = await fetch('/api/update-check');
      return response.json();
    } catch (err) {
      console.error('Failed to check for updates:', err);
      return { latest: '0.0.1', current: '0.0.1', url: '' };
    }
  };

  return {
    state,
    loading,
    error,
    patch,
    listBackups,
    restoreBackup,
    checkUpdate
  };
}