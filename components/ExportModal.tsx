import React, { useState, useEffect } from 'react';

type ExportFormat = 'json' | 'gml' | 'graphml' | 'png';

interface ExportModalProps {
  onExport: (format: ExportFormat, filename: string) => void;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({ onExport, onClose }) => {
  const [filename, setFilename] = useState('');

  useEffect(() => {
    // Set a default filename when the component mounts
    const date = new Date().toISOString().split('T')[0];
    setFilename(`GraphMind_Weaver_Export_${date}`);
  }, []);

  const handleExport = (format: ExportFormat) => {
    if (!filename.trim()) {
      return;
    }
    onExport(format, filename.trim());
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-2xl w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-white">Export Current Graph</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4 mb-6">
          <label htmlFor="filename" className="block text-sm font-medium text-gray-300">
            Filename (extension will be added automatically)
          </label>
          <input
            type="text"
            id="filename"
            value={filename}
            onChange={(e) => setFilename(e.target.value)}
            className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-4 text-gray-200 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition duration-200"
            autoFocus
          />
        </div>

        <p className="text-gray-300 mb-4">Select an export format:</p>

        <div className="space-y-3">
          <button
            onClick={() => handleExport('json')}
            disabled={!filename.trim()}
            className="w-full flex items-center justify-between px-4 py-3 bg-gray-700 hover:bg-gray-600/80 rounded-lg text-left transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div>
              <p className="font-semibold text-white">JSON</p>
              <p className="text-sm text-gray-400">Standard format, good for web and data exchange.</p>
            </div>
            <span className="text-cyan-400 font-mono text-sm">.json</span>
          </button>
          <button
            onClick={() => handleExport('gml')}
            disabled={!filename.trim()}
            className="w-full flex items-center justify-between px-4 py-3 bg-gray-700 hover:bg-gray-600/80 rounded-lg text-left transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div>
              <p className="font-semibold text-white">GML</p>
              <p className="text-sm text-gray-400">Graph Modelling Language, used by Gephi, NetworkX.</p>
            </div>
             <span className="text-cyan-400 font-mono text-sm">.gml</span>
          </button>
          <button
            onClick={() => handleExport('graphml')}
            disabled={!filename.trim()}
            className="w-full flex items-center justify-between px-4 py-3 bg-gray-700 hover:bg-gray-600/80 rounded-lg text-left transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div>
              <p className="font-semibold text-white">GraphML</p>
              <p className="text-sm text-gray-400">XML-based format, widely supported by graph tools.</p>
            </div>
             <span className="text-cyan-400 font-mono text-sm">.graphml</span>
          </button>
          <button
            onClick={() => handleExport('png')}
            disabled={!filename.trim()}
            className="w-full flex items-center justify-between px-4 py-3 bg-gray-700 hover:bg-gray-600/80 rounded-lg text-left transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div>
              <p className="font-semibold text-white">PNG Image</p>
              <p className="text-sm text-gray-400">Captures the current view of the graph.</p>
            </div>
             <span className="text-cyan-400 font-mono text-sm">.png</span>
          </button>
        </div>

        <div className="flex justify-end mt-8">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-md bg-gray-600 hover:bg-gray-500 text-white font-semibold transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};