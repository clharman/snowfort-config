
interface EngineCardProps {
  engineId: string;
  engineData: any;
  onToggle: (engineId: string, key: string, value: boolean) => void;
}

export function EngineCard({ engineId, engineData, onToggle }: EngineCardProps) {
  const meta = engineData._meta;
  const detected = meta?.detected ?? false;
  const lastModified = meta?.lastModified ? new Date(meta.lastModified) : null;

  return (
    <div className={`
      border rounded-lg p-6 mb-4 transition-colors
      ${detected 
        ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950' 
        : 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950'
      }
    `}>
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className={`text-lg font-semibold ${detected ? 'text-green-800 dark:text-green-200' : 'text-yellow-800 dark:text-yellow-200'}`}>
            {meta?.name || engineId}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 font-mono">
            {meta?.configPath}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${detected ? 'bg-green-500' : 'bg-yellow-500'}`} />
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {detected ? 'Detected' : 'Not Found'}
          </span>
        </div>
      </div>

      {lastModified && (
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Last modified: {lastModified.toLocaleDateString()} {lastModified.toLocaleTimeString()}
        </p>
      )}

      {detected && (
        <div className="space-y-3">
          {engineData.verbose !== undefined && (
            <div className="flex items-center justify-between pointer-events-none">
              <span className="text-sm font-medium">Verbose mode</span>
              <label className="relative inline-flex items-center cursor-pointer pointer-events-auto">
                <input
                  type="checkbox"
                  checked={engineData.verbose}
                  onChange={(e) => onToggle(engineId, 'verbose', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>
          )}

          {engineData.bypassPermissionsModeAccepted !== undefined && (
            <div className="flex items-center justify-between pointer-events-none">
              <span className="text-sm font-medium">Bypass permissions mode</span>
              <label className="relative inline-flex items-center cursor-pointer pointer-events-auto">
                <input
                  type="checkbox"
                  checked={engineData.bypassPermissionsModeAccepted}
                  onChange={(e) => onToggle(engineId, 'bypassPermissionsModeAccepted', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>
          )}

          {engineData.completedOnboarding !== undefined && (
            <div className="flex items-center justify-between pointer-events-none">
              <span className="text-sm font-medium">Completed onboarding</span>
              <label className="relative inline-flex items-center cursor-pointer pointer-events-auto">
                <input
                  type="checkbox"
                  checked={engineData.completedOnboarding}
                  onChange={(e) => onToggle(engineId, 'completedOnboarding', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>
          )}

          {engineData.projects && Object.keys(engineData.projects).length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Projects: {Object.keys(engineData.projects).length}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}