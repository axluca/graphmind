import React, { useState } from 'react';
import { GraphFilterControls } from './GraphFilterControls';

interface HeaderProps {
  onSave: () => void;
  onToggleGraphsPanel: () => void;
  isSaveDisabled: boolean;
  onExport: () => void;
  isExportDisabled: boolean;
  onImportClick: () => void;
  onHelp: () => void;
  onSettings: () => void;
  onAbout: () => void;
  isFilterVisible: boolean;
  nodeTypes: string[];
  linkLabels: string[];
  activeNodeTypeFilters: string[];
  activeLinkLabelFilters: string[];
  onNodeTypeFilterChange: (filters: string[]) => void;
  onLinkLabelFilterChange: (filters: string[]) => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  onSave, onToggleGraphsPanel, isSaveDisabled, onExport, isExportDisabled, onImportClick, onHelp, onSettings, onAbout,
  isFilterVisible, nodeTypes, linkLabels, activeNodeTypeFilters, activeLinkLabelFilters, onNodeTypeFilterChange, onLinkLabelFilterChange
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const createMenuAction = (action: (e?: any) => void) => (e?: any) => {
    action(e);
    setIsMenuOpen(false);
  };
  
  const ActionButtons: React.FC<{ isMobile?: boolean }> = ({ isMobile = false }) => {
    const commonButtonClass = "flex items-center space-x-2 px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed";
    const desktopButtonClass = `${commonButtonClass} bg-gray-700/50 hover:bg-gray-600/50 rounded-md text-cyan-300`;
    const mobileButtonClass = `${commonButtonClass} w-full text-left text-gray-200 hover:bg-gray-700`;

    const buttonClass = isMobile ? mobileButtonClass : desktopButtonClass;

    return (
      <>
         <button 
          onClick={createMenuAction(onImportClick)} 
          className={buttonClass}
          title="Import graph from file"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg>
          <span>Import</span>
        </button>
         <button 
          onClick={createMenuAction(onExport)} 
          disabled={isExportDisabled}
          className={buttonClass}
          title="Export current graph"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
          <span>Export</span>
        </button>
        <button 
          onClick={createMenuAction(onSave)} 
          disabled={isSaveDisabled}
          className={buttonClass}
          title="Save current graph"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M7.707 10.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V6h5a2 2 0 012 2v7a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2h5v5.586l-1.293-1.293zM9 4a1 1 0 012 0v2H9V4z" /></svg>
          <span>Save</span>
        </button>
        <button 
          onClick={createMenuAction(onToggleGraphsPanel)} 
          className={`${buttonClass} ${isMobile ? '' : 'text-gray-300'}`}
          title="View saved graphs"
        >
           <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M5 3a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 5h10v10H5V5z" /><path d="M7 7h6v2H7V7zM7 11h6v2H7v-2z" /></svg>
          <span>Saved Graphs</span>
        </button>
        <button
          onClick={createMenuAction(onSettings)}
          className={`${buttonClass} ${isMobile ? '' : 'text-gray-300'}`}
          title="Settings"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span>Settings</span>
        </button>
        <button
          onClick={createMenuAction(onHelp)}
          className={`${buttonClass} ${isMobile ? '' : 'text-gray-300'}`}
          title="Help & Walkthrough"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <span>Help</span>
        </button>
        <button
          onClick={createMenuAction(onAbout)}
          className={`${buttonClass} ${isMobile ? '' : 'text-gray-300'}`}
          title="About GraphMind Weaver"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>About</span>
        </button>
      </>
    );
  };
  
  return (
    <header className="bg-gray-900/80 backdrop-blur-md border-b border-gray-700/50 p-4 shadow-lg z-20">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-cyan-400 mr-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2a10 10 0 1 0 10 10" />
            <path d="M12 12a5 5 0 1 0-5-5" />
            <path d="M12 2v10" />
            <path d="M12 12l-4 4" />
            <path d="M12 12l5 3" />
          </svg>
          <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
            GraphMind Weaver
          </h1>
        </div>

        {/* Desktop Buttons */}
        <div className="hidden md:flex items-center space-x-4">
          {isFilterVisible && (
            <GraphFilterControls 
              nodeTypes={nodeTypes}
              linkLabels={linkLabels}
              activeNodeTypeFilters={activeNodeTypeFilters}
              activeLinkLabelFilters={activeLinkLabelFilters}
              onNodeTypeFilterChange={onNodeTypeFilterChange}
              onLinkLabelFilterChange={onLinkLabelFilterChange}
            />
          )}
          <ActionButtons />
        </div>
        
        {/* Mobile Menu */}
        <div className="md:hidden">
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)} 
            className="p-2 rounded-md text-gray-300 hover:bg-gray-700 transition-colors"
            aria-label="Open menu"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
            </svg>
          </button>

          {isMenuOpen && (
             <div 
              className="absolute top-20 right-4 w-64 bg-gray-800 border border-gray-700 rounded-md shadow-lg z-50 flex flex-col"
              role="menu"
            >
              <div className="py-2 space-y-1">
                <ActionButtons isMobile={true} />
              </div>
            </div>
          )}
        </div>

      </div>
    </header>
  );
};