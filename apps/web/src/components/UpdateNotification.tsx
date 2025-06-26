import { useState, useEffect } from 'react';
import { XMarkIcon, ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';

interface UpdateInfo {
  latest: string;
  current: string;
  url: string;
  hasUpdate: boolean;
}

interface UpdateNotificationProps {
  onDismiss?: () => void;
}

export function UpdateNotification({ onDismiss }: UpdateNotificationProps) {
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    checkForUpdates();
  }, []);

  const checkForUpdates = async () => {
    try {
      const response = await fetch('/api/update-check');
      const data: UpdateInfo = await response.json();
      setUpdateInfo(data);
      setLoading(false);
    } catch (error) {
      console.error('Failed to check for updates:', error);
      setLoading(false);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  if (loading || !updateInfo || !updateInfo.hasUpdate || dismissed) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 max-w-md">
      <div className="bg-blue-50 dark:bg-blue-900/50 border border-blue-200 dark:border-blue-800 rounded-lg shadow-lg p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 pr-3">
            <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
              Update Available
            </h3>
            <p className="mt-1 text-sm text-blue-700 dark:text-blue-300">
              Version {updateInfo.latest} is available (current: {updateInfo.current})
            </p>
            <div className="mt-2 flex gap-2">
              <button
                onClick={() => window.open(updateInfo.url, '_blank')}
                className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
              >
                View Release
                <ArrowTopRightOnSquareIcon className="w-3 h-3" />
              </button>
              <span className="text-xs text-blue-600 dark:text-blue-400">•</span>
              <span className="text-xs text-blue-600 dark:text-blue-400">
                Run: npm update -g sfconfig
              </span>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 text-blue-500 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-200"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}