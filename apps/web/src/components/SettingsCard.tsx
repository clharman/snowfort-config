
interface SettingsCardProps {
  engineId: string;
  engineData: any;
  onToggle: (engineId: string, key: string, value: boolean) => void;
  onArrayUpdate?: (engineId: string, key: string, value: string[]) => void;
  onStringUpdate?: (engineId: string, key: string, value: string) => void;
}

export function SettingsCard({ engineId, engineData, onToggle }: SettingsCardProps) {
  const meta = engineData._meta;

  if (!meta?.detected) {
    return (
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 mb-4 opacity-60">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-400 dark:text-gray-500">
              {meta?.name || engineId}
            </h3>
            <p className="text-sm text-gray-400 dark:text-gray-500">{meta?.configPath}</p>
          </div>
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
            Not Detected
          </span>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Configuration file not found
        </p>
      </div>
    );
  }


  const renderBooleanControl = (key: string, label: string, description?: string) => {
    const value = engineData[key];
    if (value === undefined) return null;

    return (
      <div className="flex items-center justify-between py-2">
        <div>
          <div className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</div>
          {description && (
            <div className="text-xs text-gray-500 dark:text-gray-400">{description}</div>
          )}
        </div>
        <button
          onClick={() => onToggle(engineId, key, !value)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
            value ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              value ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>
    );
  };


  return (
    <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-6 border border-green-200 dark:border-green-800 mb-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            {meta?.name || engineId}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">{meta?.configPath}</p>
        </div>
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
          <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
          Detected
        </span>
      </div>

      <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        Last modified: {new Date(meta?.lastModified).toLocaleString()}
      </div>

      <div className="space-y-1 border-t border-green-200 dark:border-green-800 pt-4">
        {/* Runtime configuration controls */}
        {renderBooleanControl('bypassPermissionsModeAccepted', 'Bypass permissions mode')}
        {renderBooleanControl('hasCompletedOnboarding', 'Completed onboarding')}
        {renderBooleanControl('autoUpdates', 'Automatic updates')}
        {renderBooleanControl('hasAvailableSubscription', 'Has subscription')}
        
        {engineData.numStartups !== undefined && (
          <div className="py-2">
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Startups: {engineData.numStartups.toLocaleString()}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Number of times started
            </div>
          </div>
        )}
        
        {engineData.projects && (
          <div className="py-2">
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Projects: {Object.keys(engineData.projects).length}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Configured projects
            </div>
          </div>
        )}
      </div>
    </div>
  );
}