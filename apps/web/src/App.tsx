import React, { useState, useEffect } from 'react';
import { useCore } from './hooks/useCore';
import { Sidebar } from './components/Sidebar';
import { MainContent } from './components/MainContent';
import { UpdateNotification } from './components/UpdateNotification';

function App() {
  const { state, loading, error, patch } = useCore();
  const [selectedEngine, setSelectedEngine] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [darkMode, setDarkMode] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error' | 'warning'>('idle');
  const [lastResult, setLastResult] = useState<{ errors: string[]; warnings: string[] } | null>(null);

  // Initialize theme on mount with localStorage and system preference
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const shouldBeDark = savedTheme ? savedTheme === 'dark' : systemPrefersDark;
    
    setDarkMode(shouldBeDark);
    applyTheme(shouldBeDark);
    setMounted(true);
  }, []);

  // Apply theme changes
  useEffect(() => {
    if (mounted) {
      applyTheme(darkMode);
      localStorage.setItem('theme', darkMode ? 'dark' : 'light');
    }
  }, [darkMode, mounted]);

  const applyTheme = (isDark: boolean) => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    }
    document.documentElement.style.colorScheme = isDark ? 'dark' : 'light';
  };

  const engines = Object.entries(state).filter(([key]) => !key.startsWith('_'));

  // Auto-select first available engine on load
  React.useEffect(() => {
    if (!selectedEngine && engines.length > 0) {
      const claudeCode = engines.find(([id, data]) => id === 'claude-code' && data._meta?.detected);
      const codex = engines.find(([id, data]) => id === 'codex' && data._meta?.detected);
      const gemini = engines.find(([id, data]) => id === 'gemini' && data._meta?.detected);
      
      if (claudeCode) {
        setSelectedEngine('claude-code');
        setSelectedItem('updates-version'); // Auto-select first subsection
      } else if (codex) {
        setSelectedEngine('codex');
        setSelectedItem('model-provider'); // Auto-select first subsection
      } else if (gemini) {
        setSelectedEngine('gemini');
        setSelectedItem('core-settings'); // Auto-select first subsection
      }
    }
  }, [engines, selectedEngine]);

  // Reset selectedItem when engine changes and auto-select appropriate first item
  React.useEffect(() => {
    if (selectedEngine) {
      // Reset to appropriate first item when engine changes
      if (selectedEngine === 'claude-code') {
        setSelectedItem('updates-version');
      } else if (selectedEngine === 'codex') {
        setSelectedItem('model-provider');
      } else if (selectedEngine === 'gemini') {
        setSelectedItem('core-settings');
      }
    } else {
      setSelectedItem(null);
    }
  }, [selectedEngine]);

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

  const handleObjectUpdate = async (engineId: string, updates: any) => {
    setSaveStatus('saving');
    
    const patchObj = {
      [engineId]: updates
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
    
    return result;
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

  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* Update Notification */}
      <UpdateNotification />
      
      {/* Save Status Notification */}
      {saveStatus !== 'idle' && (
        <div className="fixed top-4 right-4 z-50">
          <div className={`px-4 py-2 rounded-lg shadow-lg ${
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
        </div>
      )}

      <Sidebar
        engines={engines}
        selectedEngine={selectedEngine}
        onEngineSelect={setSelectedEngine}
        selectedItem={selectedItem}
        onItemSelect={setSelectedItem}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
      />
      
      <MainContent
        selectedEngine={selectedEngine}
        selectedItem={selectedItem}
        engines={engines}
        onToggle={handleToggle}
        onArrayUpdate={handleArrayUpdate}
        onStringUpdate={handleStringUpdate}
        onProjectUpdate={handleProjectUpdate}
        onObjectUpdate={handleObjectUpdate}
      />
    </div>
  );
}

export default App;