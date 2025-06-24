import { useState, useEffect } from 'react';
import { CoreService } from '@snowfort/config-core';

export function useCore() {
  const [core] = useState(() => new CoreService());
  const [state, setState] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      try {
        await core.initialize();
        if (mounted) {
          const initialState = await core.getState();
          setState(initialState);
          setLoading(false);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to initialize');
          setLoading(false);
        }
      }
    };

    const handleStateChange = (newState: Record<string, any>) => {
      if (mounted) {
        setState(newState);
      }
    };

    core.on('stateChanged', handleStateChange);
    initialize();

    return () => {
      mounted = false;
      core.off('stateChanged', handleStateChange);
      core.cleanup();
    };
  }, [core]);

  const patch = async (patchObj: any) => {
    try {
      const result = await core.patch(patchObj);
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

  const listBackups = (engine?: string) => core.listBackups(engine);
  const restoreBackup = (path: string) => core.restoreBackup(path);
  const checkUpdate = () => core.checkUpdate();

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