import React from 'react';
import type { Node } from '../types';
import { PanelToggleButton } from './PanelToggleButton';

interface NodeSidePanelProps {
  node: Node | null;
  onClose: () => void;
  onExpand: (node: Node) => void;
  isLoading: boolean;
  isCollapsed: boolean;
  onToggle: () => void;
  isDefaultModelInUse: boolean;
}

const typeColors = {
  'Person': 'bg-emerald-400 text-slate-900 font-semibold',
  'Organization': 'bg-sky-400 text-slate-900 font-semibold',
  'Location': 'bg-red-400 text-slate-900 font-semibold',
  'Concept': 'bg-yellow-400 text-slate-900 font-semibold',
  'Event': 'bg-purple-400 text-slate-900 font-semibold',
  'Default': 'bg-slate-400 text-slate-900 font-semibold',
};

export const NodeSidePanel: React.FC<NodeSidePanelProps> = ({ node, onClose, onExpand, isLoading, isCollapsed, onToggle, isDefaultModelInUse }) => {
  
  if (!node) {
      return null;
  }

  const { label, type, properties } = node;
  const typeColorClass = typeColors[type as keyof typeof typeColors] || typeColors.Default;
  
  const backdropVisible = !isCollapsed;

  const DetailCard: React.FC<{title: string; content: any;}> = ({title, content}) => {
    if (!content) return null;
    return (
        <div className="bg-slate-800 p-4 rounded-xl">
            <h4 className="text-sm font-semibold text-sky-400 capitalize mb-2">{title.replace(/_/g, ' ')}</h4>
            <p className="text-slate-300 text-base whitespace-pre-wrap">{String(content)}</p>
        </div>
    );
  };
  
  const ReferenceCard: React.FC<{references: any[] | undefined}> = ({ references }) => {
      if (!references || references.length === 0) return null;
      
      // Check format of the first item to determine how to render for backward compatibility.
      const isObjectFormat = typeof references[0] === 'object' && references[0] !== null && 'url' in references[0] && 'title' in references[0];

      return (
        <div className="bg-slate-800 p-4 rounded-xl">
            <h4 className="text-sm font-semibold text-sky-400 capitalize mb-3">References</h4>
            <ul className="space-y-3">
                {references.map((ref, index) => (
                    <li key={index}>
                        {isObjectFormat ? (
                            <a href={ref.url} target="_blank" rel="noopener noreferrer" className="group block">
                                <p className="text-blue-400 group-hover:text-blue-300 group-hover:underline break-words text-sm font-medium transition-colors">
                                    {ref.title || ref.url}
                                </p>
                                <p className="text-slate-500 group-hover:text-slate-400 text-xs truncate transition-colors">
                                    {ref.url}
                                </p>
                            </a>
                        ) : (
                             <div className="flex items-start space-x-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-500 mt-1 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
                                </svg>
                                <a href={String(ref)} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 break-all text-sm underline transition-colors">
                                    {String(ref)}
                                </a>
                             </div>
                        )}
                    </li>
                ))}
            </ul>
        </div>
      );
  }

  return (
    <>
      <div 
        className={`fixed inset-0 z-30 transition-colors duration-300 ${backdropVisible ? 'bg-black/60 backdrop-blur-sm' : 'bg-transparent pointer-events-none'}`}
        onClick={backdropVisible ? onClose : undefined}
      />
      <div 
        className={`absolute top-0 right-0 h-full w-full max-w-md z-40 transition-transform duration-300 ease-in-out ${isCollapsed ? 'translate-x-full' : 'translate-x-0'}`}
      >
        <PanelToggleButton
          isCollapsed={isCollapsed}
          onToggle={onToggle}
          side="right"
        />
        <div 
          className="h-full bg-slate-900 border-l border-slate-700 shadow-2xl grid grid-rows-[auto_1fr_auto]"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center p-6 border-b border-slate-700">
            <h2 className="text-xl font-bold text-slate-100">Node Details</h2>
            <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="overflow-y-auto min-h-0 p-6 space-y-4">
            <div>
              <span className={`inline-block px-3 py-1 text-xs rounded-full ${typeColorClass} mb-3`}>
                {type}
              </span>
              <h3 className="text-4xl font-bold text-white tracking-tight">{label}</h3>
            </div>
            <DetailCard title="Summary" content={properties.summary} />
            <DetailCard title="Definition" content={properties.definition} />
            <DetailCard title="Source Context" content={properties.source_context} />
            <ReferenceCard references={properties.references} />
            
            {Object.entries(properties)
              .filter(([key]) => !['summary', 'definition', 'source_context', 'references'].includes(key))
              .map(([key, value]) => (
                <DetailCard key={key} title={key} content={value} />
            ))}
          </div>
          <div className="p-6 border-t border-slate-700 bg-slate-900">
              <button
                  onClick={() => onExpand(node)}
                  disabled={isLoading || !isDefaultModelInUse}
                  title={!isDefaultModelInUse ? "Node Expansion requires the default Gemini model" : "Search for new related nodes"}
                  className="w-full text-white font-bold py-3 px-4 rounded-md transition duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-lg bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700"
              >
                  {isLoading ? (
                  <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                      Expanding...
                  </>
                  ) : (
                  <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path d="M9 9a2 2 0 114 0 2 2 0 01-4 0z" /><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a4 4 0 00-3.446 6.032l-2.261 2.26a1 1 0 101.414 1.414l2.26-2.26A4 4 0 1011 5z" clipRule="evenodd" /></svg>
                      <span>Search & Expand</span>
                  </>
                  )}
              </button>
          </div>
        </div>
      </div>
    </>
  );
};