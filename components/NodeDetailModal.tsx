
import React from 'react';
import type { Node } from '../types';

interface NodeDetailModalProps {
  node: Node;
  onClose: () => void;
}

const typeColors = {
  'Person': 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50',
  'Organization': 'bg-blue-500/20 text-blue-300 border-blue-500/50',
  'Location': 'bg-red-500/20 text-red-300 border-red-500/50',
  'Concept': 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50',
  'Event': 'bg-purple-500/20 text-purple-300 border-purple-500/50',
  'Default': 'bg-gray-500/20 text-gray-300 border-gray-500/50',
};

export const NodeDetailModal: React.FC<NodeDetailModalProps> = ({ node, onClose }) => {
  const { label, type, properties } = node;
  const typeColorClass = typeColors[type as keyof typeof typeColors] || typeColors.Default;
  
  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-gray-800/80 border border-gray-700 rounded-xl shadow-2xl w-full max-w-lg max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex justify-between items-start">
            <div>
              <span className={`inline-block px-3 py-1 text-sm font-semibold rounded-full ${typeColorClass} mb-2`}>
                {type}
              </span>
              <h2 className="text-3xl font-bold text-white mb-2">{label}</h2>
            </div>
            <button 
              onClick={onClose} 
              className="text-gray-400 hover:text-white transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="mt-4 space-y-4">
            {Object.entries(properties).map(([key, value]) => (
                <div key={key} className="bg-gray-900/50 p-4 rounded-lg">
                    <h4 className="text-sm font-semibold text-cyan-400 capitalize mb-1">{key.replace(/_/g, ' ')}</h4>
                    <p className="text-gray-300 text-base">{typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}</p>
                </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
