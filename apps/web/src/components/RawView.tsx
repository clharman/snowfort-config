import { useState } from 'react';
import { truncateLargeContent, getJsonStats } from '../utils/jsonUtils';

interface RawViewProps {
  engines: [string, any][];
}

function RawEngineCard({ engineId, engineData }: { engineId: string; engineData: any }) {
  const [showTruncated, setShowTruncated] = useState(true);

  const configData = Object.fromEntries(
    Object.entries(engineData).filter(([key]) => !key.startsWith('_'))
  );
  
  // Create both truncated and full versions
  const truncatedData = truncateLargeContent(configData, {
    maxStringLength: 200,
    maxArrayPreview: 3,
    detectBase64: true,
    detectImages: true
  });
  
  const stats = getJsonStats(truncatedData);
  const originalStats = getJsonStats(configData);
  
  const displayData = showTruncated ? truncatedData : configData;
  const jsonString = JSON.stringify(displayData, null, 2);

  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-3">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            {engineData._meta?.name || engineId}
          </h3>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {engineData._meta?.configPath} • {stats.lineCount} lines • {showTruncated ? stats.totalSizeFormatted : originalStats.totalSizeFormatted}
            {stats.truncatedStrings > 0 && (
              <span className="ml-2 text-yellow-600 dark:text-yellow-400">
                • {stats.truncatedStrings} truncated items
              </span>
            )}
          </div>
        </div>
        {stats.truncatedStrings > 0 && (
          <button
            onClick={() => setShowTruncated(!showTruncated)}
            className="px-3 py-1 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            title={showTruncated ? 'Show full content (may be very large)' : 'Show truncated content'}
          >
            {showTruncated ? 'Show Full' : 'Show Less'}
          </button>
        )}
      </div>
      {!showTruncated && originalStats.totalSize > 500000 && (
        <div className="mb-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
          <div className="flex items-center text-yellow-800 dark:text-yellow-200">
            <span className="text-sm">
              ⚠️ Large file ({originalStats.totalSizeFormatted}) - This may cause browser performance issues
            </span>
          </div>
        </div>
      )}
      <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 border w-full overflow-hidden">
        <pre className="text-xs text-gray-800 dark:text-gray-200 whitespace-pre-wrap break-words overflow-x-auto max-h-96 overflow-y-auto w-full">
          {jsonString}
        </pre>
      </div>
    </div>
  );
}

export function RawView({ engines }: RawViewProps) {
  return (
    <div className="w-full">
      <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Raw Configuration</h2>
      {engines.map(([engineId, engineData]) => (
        <RawEngineCard
          key={engineId}
          engineId={engineId}
          engineData={engineData}
        />
      ))}
    </div>
  );
}