import React, { useState, useEffect } from 'react';
import type { PortkeyConfig, Theme } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (newModel: string, useDefault: boolean, portkeyConfig: PortkeyConfig) => void;
  currentModel: string;
  availableModels: string[];
  useDefaultModel: boolean;
  portkeyConfig: PortkeyConfig;
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
}

const InputField: React.FC<{ label: string; id: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; type?: string; placeholder?: string; }> = 
({ label, id, value, onChange, type = 'text', placeholder }) => (
    <div>
        <label htmlFor={id} className="block text-sm font-medium text-gray-300 mb-2">{label}</label>
        <input
            id={id}
            type={type}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-gray-200 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition duration-200"
        />
    </div>
);


export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onSave, currentModel, availableModels, useDefaultModel, portkeyConfig, theme, onThemeChange }) => {
  const [selectedModel, setSelectedModel] = useState(currentModel);
  const [isDefaultChecked, setIsDefaultChecked] = useState(useDefaultModel);
  const [localPortkeyConfig, setLocalPortkeyConfig] = useState(portkeyConfig);

  useEffect(() => {
    setSelectedModel(currentModel);
    setIsDefaultChecked(useDefaultModel);
    setLocalPortkeyConfig(portkeyConfig);
  }, [currentModel, useDefaultModel, portkeyConfig, isOpen]);

  if (!isOpen) {
    return null;
  }

  const handleSave = () => {
    onSave(selectedModel, isDefaultChecked, localPortkeyConfig);
    onClose();
  };
  
  const handlePortkeyChange = (field: keyof PortkeyConfig, value: string) => {
    setLocalPortkeyConfig(prev => ({ ...prev, [field]: value }));
  };

  const hasChanges = isDefaultChecked !== useDefaultModel || 
                     (isDefaultChecked && selectedModel !== currentModel) || 
                     (!isDefaultChecked && JSON.stringify(localPortkeyConfig) !== JSON.stringify(portkeyConfig));
  
  const canSavePortkey = !isDefaultChecked && localPortkeyConfig.apiKey && localPortkeyConfig.virtualKey && localPortkeyConfig.model;


  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-2xl w-full max-w-md">
        <div className="flex justify-between items-center p-6 border-b border-gray-700">
          <h3 className="text-xl font-bold text-white">Settings</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-300">Theme</label>
            <div className="flex space-x-2 rounded-md bg-gray-900/50 p-1">
              <button
                onClick={() => onThemeChange('dark')}
                className={`w-full rounded py-1.5 text-sm font-semibold transition-colors ${theme === 'dark' ? 'bg-cyan-500 text-white shadow-sm' : 'text-gray-300 hover:bg-gray-700'}`}
              >
                Dark
              </button>
              <button
                onClick={() => onThemeChange('light')}
                className={`w-full rounded py-1.5 text-sm font-semibold transition-colors ${theme === 'light' ? 'bg-cyan-500 text-white shadow-sm' : 'text-gray-300 hover:bg-gray-700'}`}
              >
                Light
              </button>
            </div>
          </div>
          <div className="space-y-4 bg-gray-900/50 p-4 rounded-lg">
            <label className="flex items-center space-x-3 cursor-pointer">
                <input
                    type="checkbox"
                    checked={isDefaultChecked}
                    onChange={() => setIsDefaultChecked(p => !p)}
                    className="form-checkbox h-5 w-5 bg-gray-600 border-gray-500 rounded text-cyan-500 focus:ring-cyan-500"
                />
                <span className="text-gray-200 font-semibold">Use default Gemini model</span>
            </label>
            
            {isDefaultChecked ? (
                 <div>
                    {availableModels.length > 1 ? (
                        <select
                            id="model-select"
                            value={selectedModel}
                            onChange={(e) => setSelectedModel(e.target.value)}
                            className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-gray-200 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition duration-200 mt-2"
                        >
                            {availableModels.map(model => (
                            <option key={model} value={model}>{model}</option>
                            ))}
                        </select>
                    ) : (
                        <div className="w-full bg-gray-700/50 border border-gray-600 rounded-md py-2 px-3 text-gray-400 mt-2">
                            {currentModel}
                        </div>
                    )}
                     <p className="text-xs text-gray-400 mt-2">
                        Currently, <code className="bg-gray-700 p-1 rounded">gemini-2.5-flash</code> is optimized for all features in this application, including web search and file analysis.
                    </p>
                </div>
            ) : (
                <div className="space-y-4 pt-4 border-t border-gray-700/50">
                    <InputField label="PortKey API Key" id="portkey-api-key" type="password" value={localPortkeyConfig.apiKey} onChange={(e) => handlePortkeyChange('apiKey', e.target.value)} placeholder="pk_..."/>
                    <InputField label="PortKey Virtual Key" id="portkey-virtual-key" value={localPortkeyConfig.virtualKey} onChange={(e) => handlePortkeyChange('virtualKey', e.target.value)} placeholder="graphmind-weaver-prod"/>
                    <InputField label="Model Name" id="portkey-model" value={localPortkeyConfig.model} onChange={(e) => handlePortkeyChange('model', e.target.value)} placeholder="e.g., gpt-4o"/>
                    <InputField label="Base URL (Optional)" id="portkey-base-url" value={localPortkeyConfig.baseURL || ''} onChange={(e) => handlePortkeyChange('baseURL', e.target.value)} placeholder="https://api.portkey.ai/v1"/>
                     <p className="text-xs text-yellow-400/80 p-2 bg-yellow-900/20 rounded-md border border-yellow-400/30">
                        Note: When using a custom model, features requiring web search (Topic Search, Node Expansion) and file uploads will be disabled.
                    </p>
                </div>
            )}
          </div>
        </div>

        <div className="flex justify-end space-x-3 p-6 border-t border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-md bg-gray-600 hover:bg-gray-500 text-white font-semibold transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!hasChanges || (!isDefaultChecked && !canSavePortkey)}
            className="px-4 py-2 rounded-md bg-cyan-500 hover:bg-cyan-400 text-white font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};