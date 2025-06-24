import React, { useState } from 'react';
import { useCore } from './hooks/useCore';
import { EngineCard } from './components/EngineCard';
import { SettingsCard } from './components/SettingsCard';
import { ProjectsView } from './components/ProjectsView';
import { RawView } from './components/RawView';

type View = 'global' | 'projects' | 'raw';

function App() {
  const { state, loading, error, patch } = useCore();
  const [currentView, setCurrentView] = useState<View>('global');
  const [darkMode, setDarkMode] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error' | 'warning'>('idle');
  const [lastResult, setLastResult] = useState<{ errors: string[]; warnings: string[] } | null>(null);

  React.useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const handleToggle = async (engineId: string, key: string, value: boolean) => {
    setSaveStatus('saving');
    
    const patchObj = {
      [engineId]: {
        [key]: value
      }
    };
    
    const result = await patch(patchObj);
    setLastResult(result);
    
    if (result.success) {
      if (result.warnings && result.warnings.length > 0) {
        setSaveStatus('warning');
        setTimeout(() => setSaveStatus('idle'), 4000);
      } else {
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      }
    } else {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 5000);
    }
  };

  const handleArrayUpdate = async (engineId: string, key: string, value: string[]) => {
    setSaveStatus('saving');
    
    const patchObj = {
      [engineId]: {
        [key]: value
      }
    };
    
    const result = await patch(patchObj);
    setLastResult(result);
    
    if (result.success) {
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } else {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 5000);
    }
  };

  const handleStringUpdate = async (engineId: string, key: string, value: string) => {
    setSaveStatus('saving');
    
    const patchObj = {
      [engineId]: {
        [key]: value
      }
    };
    
    const result = await patch(patchObj);
    setLastResult(result);
    
    if (result.success) {
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } else {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 5000);
    }
  };

  const handleProjectUpdate = async (engineId: string, projectPath: string, updates: any) => {
    setSaveStatus('saving');
    
    const patchObj = {
      [engineId]: {
        projects: {
          [projectPath]: updates
        }
      }
    };
    
    const result = await patch(patchObj);
    setLastResult(result);
    
    if (result.success) {
      if (result.warnings && result.warnings.length > 0) {
        setSaveStatus('warning');
        setTimeout(() => setSaveStatus('idle'), 4000);
      } else {
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      }
    } else {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 5000);
    }
  };

  const handleExportConfig = () => {
    const configData = {
      timestamp: new Date().toISOString(),
      engines: Object.fromEntries(
        Object.entries(state).filter(([key]) => !key.startsWith('_'))
      )
    };
    
    const dataStr = JSON.stringify(configData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `snowfort-config-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    setSaveStatus('saved');
    setTimeout(() => setSaveStatus('idle'), 2000);
  };

  const handleImportConfig = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const configData = JSON.parse(e.target?.result as string);
        
        if (configData.engines) {
          setSaveStatus('saving');
          
          // Import each engine's configuration
          let hasWarnings = false;
          for (const [engineId, engineData] of Object.entries(configData.engines)) {
            const result = await patch({ [engineId]: engineData });
            setLastResult(result);
            if (result.warnings && result.warnings.length > 0) {
              hasWarnings = true;
            }
          }
          
          if (hasWarnings) {
            setSaveStatus('warning');
            setTimeout(() => setSaveStatus('idle'), 4000);
          } else {
            setSaveStatus('saved');
            setTimeout(() => setSaveStatus('idle'), 2000);
          }
        } else {
          setSaveStatus('error');
          setTimeout(() => setSaveStatus('idle'), 3000);
        }
      } catch (error) {
        setSaveStatus('error');
        setTimeout(() => setSaveStatus('idle'), 3000);
      }
    };
    reader.readAsText(file);
    
    // Reset the input
    event.target.value = '';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading configurations...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-xl font-semibold text-red-600 dark:text-red-400 mb-2">Error</h1>
          <p className="text-gray-600 dark:text-gray-400">{error}</p>
        </div>
      </div>
    );
  }

  const engines = Object.entries(state).filter(([key]) => !key.startsWith('_'));

  return (
    <div className="min-h-screen w-full bg-gray-50 dark:bg-gray-900 transition-colors" style={{width: '100%', minWidth: '100%', maxWidth: 'none'}}>
      <nav className="sticky top-0 z-50 w-full bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="w-full px-6">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                Snowfort Config
              </h1>
            </div>
            
            <div className="flex items-center gap-4">
              {saveStatus !== 'idle' && (
                <div className={`relative text-sm px-3 py-1 rounded-full cursor-pointer ${
                  saveStatus === 'saving' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                  saveStatus === 'saved' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                  saveStatus === 'warning' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                  'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                }`}
                  title={
                    lastResult && (saveStatus === 'error' || saveStatus === 'warning') 
                      ? [...(lastResult.errors || []), ...(lastResult.warnings || [])].join('\n')
                      : undefined
                  }
                >
                  {saveStatus === 'saving' ? 'Saving...' :
                   saveStatus === 'saved' ? 'Saved!' :
                   saveStatus === 'warning' ? 'Saved with warnings' :
                   'Save failed'}
                </div>
              )}
              
              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportConfig}
                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  title="Export configuration"
                >
                  Export
                </button>
                
                <label className="px-3 py-1 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors cursor-pointer">
                  Import
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportConfig}
                    className="hidden"
                  />
                </label>
              </div>
              
              <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                {['global', 'projects', 'raw'].map((view) => (
                  <button
                    key={view}
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      setCurrentView(view as View);
                    }}
                    className={`px-3 py-1 text-sm font-medium rounded-md transition-colors capitalize ${
                      currentView === view
                        ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    {view}
                  </button>
                ))}
              </div>
              
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
              >
                {darkMode ? '☀️' : '🌙'}
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="w-full max-w-none px-6 py-8" style={{width: '100%'}}>
        {currentView === 'global' && (
          <div className="w-full">
            <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Global Configuration</h2>
            {engines.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 dark:text-gray-400">No AI CLI tools detected</p>
              </div>
            ) : (
              engines.map(([engineId, engineData]) => {
                // Use SettingsCard for settings engines, EngineCard for others
                if (engineId.includes('settings')) {
                  return (
                    <SettingsCard
                      key={engineId}
                      engineId={engineId}
                      engineData={engineData}
                      onToggle={handleToggle}
                      onArrayUpdate={handleArrayUpdate}
                      onStringUpdate={handleStringUpdate}
                    />
                  );
                } else {
                  return (
                    <EngineCard
                      key={engineId}
                      engineId={engineId}
                      engineData={engineData}
                      onToggle={handleToggle}
                    />
                  );
                }
              })
            )}
          </div>
        )}

        {currentView === 'projects' && (
          <div className="w-full">
            <ProjectsView engines={engines} onProjectUpdate={handleProjectUpdate} />
          </div>
        )}

        {currentView === 'raw' && (
          <RawView engines={engines} />
        )}
      </main>
    </div>
  );
}

export default App;