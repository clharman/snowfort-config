
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
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Verbose mode</span>
              <button
                onClick={() => onToggle(engineId, 'verbose', !engineData.verbose)}
                className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                style={{
                  backgroundColor: engineData.verbose ? '#2563eb' : '#d1d5db'
                }}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    engineData.verbose ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          )}

          {engineData.bypassPermissionsModeAccepted !== undefined && (
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Bypass permissions mode</span>
              <button
                onClick={() => onToggle(engineId, 'bypassPermissionsModeAccepted', !engineData.bypassPermissionsModeAccepted)}
                className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                style={{
                  backgroundColor: engineData.bypassPermissionsModeAccepted ? '#2563eb' : '#d1d5db'
                }}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    engineData.bypassPermissionsModeAccepted ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          )}

          {engineData.completedOnboarding !== undefined && (
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Completed onboarding</span>
              <button
                onClick={() => onToggle(engineId, 'completedOnboarding', !engineData.completedOnboarding)}
                className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                style={{
                  backgroundColor: engineData.completedOnboarding ? '#2563eb' : '#d1d5db'
                }}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    engineData.completedOnboarding ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
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