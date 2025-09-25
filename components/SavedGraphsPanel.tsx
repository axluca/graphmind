import React from 'react';
import type { SavedGraphMeta } from '../types';

interface SavedGraphsPanelProps {
  isOpen: boolean;
  graphs: SavedGraphMeta[];
  onLoad: (id: number) => void;
  onDelete: (id: number) => void;
  onExport: (id: number) => void;
  onClose: () => void;
}

const SavedGraphsPanel: React.FC<SavedGraphsPanelProps> = ({ isOpen, graphs, onLoad, onDelete, onExport, onClose }) => {
  if (!isOpen) return null;

  return (
    <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30"
        onClick={onClose}
    >
        <div 
            className="absolute top-0 right-0 h-full w-full max-w-md bg-gray-800/95 border-l border-gray-700 shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
        >
            <div className="flex justify-between items-center p-4 border-b border-gray-700">
                <h2 className="text-xl font-bold text-white">Saved Graphs</h2>
                <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
            <div className="flex-1 overflow-y-auto">
                {graphs.length === 0 ? (
                    <p className="text-gray-500 text-center p-8">No saved graphs yet.</p>
                ) : (
                    <ul className="divide-y divide-gray-700">
                        {graphs.map(graph => (
                            <li key={graph.id} className="p-4 hover:bg-gray-700/50 transition-colors">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <h3 className="font-semibold text-gray-200">{graph.name}</h3>
                                        <p className="text-sm text-gray-400">
                                            Saved: {new Date(graph.createdAt).toLocaleString()}
                                        </p>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                       <button onClick={() => onExport(graph.id)} title="Export as JSON" className="p-2 text-gray-400 hover:text-blue-400 transition-colors rounded-full hover:bg-gray-600/50">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                                        </button>
                                        <button onClick={() => onDelete(graph.id)} title="Delete" className="p-2 text-gray-400 hover:text-red-400 transition-colors rounded-full hover:bg-gray-600/50">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                                        </button>
                                        <button onClick={() => onLoad(graph.id)} className="px-4 py-1.5 text-sm font-semibold bg-cyan-600 hover:bg-cyan-500 rounded-md text-white transition-colors">
                                            Load
                                        </button>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    </div>
  );
};

export default SavedGraphsPanel;