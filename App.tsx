import React, { useState, useCallback, useEffect, lazy, Suspense, useRef } from 'react';
import { Header } from './components/Header';
import { InputPanel } from './components/InputPanel';
import { NodeSidePanel } from './components/NodeSidePanel';
import { Loader } from './components/Loader';
import { ViewToggler } from './components/ViewToggler';
import { PanelToggleButton } from './components/PanelToggleButton';
import type { GraphData, Node, SavedGraphMeta, PortkeyConfig, Theme } from './types';
import * as dbService from './services/dbService';
import { ExportModal } from './components/ExportModal';
import { HelpModal } from './components/HelpModal';
import { SettingsModal } from './components/SettingsModal';
import * as exportService from './services/exportService';
import * as importService from './services/importService';
import type { ExportHandles } from './components/GraphVisualizer';

const GraphVisualizer = lazy(() => import('./components/GraphVisualizer'));
const SavedGraphsPanel = lazy(() => import('./components/SavedGraphsPanel'));
const AboutModal = lazy(() => import('./components/AboutModal'));

// --- Constants for settings ---
const MODEL_STORAGE_KEY = 'graphmind_weaver_model';
const AVAILABLE_MODELS = ['gemini-2.5-flash'];
const DEFAULT_MODEL = 'gemini-2.5-flash';
const USE_DEFAULT_MODEL_STORAGE_KEY = 'graphmind_weaver_use_default_model';
const PORTKEY_CONFIG_STORAGE_KEY = 'graphmind_weaver_portkey_config';
const THEME_STORAGE_KEY = 'graphmind_weaver_theme';


// --- Modals ---

const ConfirmationModal: React.FC<{ title: string; message: string; onConfirm: () => void; onDeny: () => void; onCancel: () => void; confirmText?: string; denyText?: string; }> = 
({ title, message, onConfirm, onDeny, onCancel, confirmText = "Yes", denyText = "No" }) => (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
            <p className="text-gray-300 mb-6">{message}</p>
            <div className="flex justify-end space-x-3">
                <button onClick={onCancel} className="px-4 py-2 rounded-md bg-gray-600 hover:bg-gray-500 text-white font-semibold transition-colors">Cancel</button>
                <button onClick={onDeny} className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-colors">{denyText}</button>
                <button onClick={onConfirm} className="px-4 py-2 rounded-md bg-cyan-500 hover:bg-cyan-400 text-white font-semibold transition-colors">{confirmText}</button>
            </div>
        </div>
    </div>
);

const SaveGraphModal: React.FC<{ onSave: (name: string) => void; onClose: () => void; }> = ({ onSave, onClose }) => {
    const [name, setName] = useState('');
    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <form onSubmit={(e) => { e.preventDefault(); if (name.trim()) onSave(name.trim()); }} className="bg-gray-800 border border-gray-700 rounded-xl shadow-2xl w-full max-w-md p-6">
                <h3 className="text-xl font-bold text-white mb-4">Save Graph</h3>
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter a name for your graph..."
                    className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-4 text-gray-200 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition duration-200"
                    autoFocus
                />
                <div className="flex justify-end space-x-3 mt-6">
                    <button type="button" onClick={onClose} className="px-4 py-2 rounded-md bg-gray-600 hover:bg-gray-500 text-white font-semibold transition-colors">Cancel</button>
                    <button type="submit" disabled={!name.trim()} className="px-4 py-2 rounded-md bg-cyan-500 hover:bg-cyan-400 text-white font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed">Save</button>
                </div>
            </form>
        </div>
    );
};


// --- Main App Component ---

const App: React.FC = () => {
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [isCurrentGraphSaved, setIsCurrentGraphSaved] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  
  // State for saved graphs feature
  const [savedGraphs, setSavedGraphs] = useState<SavedGraphMeta[]>([]);
  const [isGraphsPanelOpen, setIsGraphsPanelOpen] = useState<boolean>(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState<boolean>(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState<boolean>(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);
  const [isAboutModalOpen, setIsAboutModalOpen] = useState<boolean>(false);
  const [isUnsavedChangesModalOpen, setIsUnsavedChangesModalOpen] = useState<boolean>(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  // State for filtering
  const [filteredGraphData, setFilteredGraphData] = useState<GraphData | null>(null);
  const [allNodeTypes, setAllNodeTypes] = useState<string[]>([]);
  const [allLinkLabels, setAllLinkLabels] = useState<string[]>([]);
  const [activeNodeTypeFilters, setActiveNodeTypeFilters] = useState<string[]>([]);
  const [activeLinkLabelFilters, setActiveLinkLabelFilters] = useState<string[]>([]);

  // State for search
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedNodeId, setHighlightedNodeId] = useState<string | null>(null);
  
  // State for settings
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem(THEME_STORAGE_KEY) as Theme) || 'dark');
  const [geminiModel, setGeminiModel] = useState<string>(() => {
    return localStorage.getItem(MODEL_STORAGE_KEY) || DEFAULT_MODEL;
  });
  const [useDefaultModel, setUseDefaultModel] = useState<boolean>(() => {
    const stored = localStorage.getItem(USE_DEFAULT_MODEL_STORAGE_KEY);
    return stored ? JSON.parse(stored) : true;
  });
  const [portkeyConfig, setPortkeyConfig] = useState<PortkeyConfig>(() => {
    const stored = localStorage.getItem(PORTKEY_CONFIG_STORAGE_KEY);
    return stored ? JSON.parse(stored) : { apiKey: '', virtualKey: '', model: '', baseURL: 'https://api.portkey.ai/v1' };
  });


  // Responsiveness state
  const [mobileView, setMobileView] = useState<'input' | 'graph'>('input');
  const [isInputPanelCollapsed, setIsInputPanelCollapsed] = useState(false);
  const [isNodePanelCollapsed, setIsNodePanelCollapsed] = useState(false);

  // Centralized refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const graphVisualizerRef = useRef<ExportHandles>(null);

  const refreshSavedGraphs = useCallback(async () => {
    const graphs = await dbService.getSavedGraphsMeta();
    setSavedGraphs(graphs);
  }, []);

  useEffect(() => {
    refreshSavedGraphs();
  }, [refreshSavedGraphs]);

  // Effect to extract filterable types from graph data
  useEffect(() => {
    if (graphData) {
        const nodeTypes = [...new Set(graphData.nodes.map(n => n.type))].sort();
        const linkLabels = [...new Set(graphData.links.map(l => l.label))].sort();
        setAllNodeTypes(nodeTypes);
        setAllLinkLabels(linkLabels);
        // By default, all types are active
        setActiveNodeTypeFilters(nodeTypes);
        setActiveLinkLabelFilters(linkLabels);
        setSearchQuery(''); // Reset search on new graph
    } else {
        // Reset when there's no graph
        setAllNodeTypes([]);
        setAllLinkLabels([]);
        setActiveNodeTypeFilters([]);
        setActiveLinkLabelFilters([]);
        setSearchQuery('');
    }
  }, [graphData]);

  // Effect to apply filters to graph data
  useEffect(() => {
    if (!graphData) {
        setFilteredGraphData(null);
        return;
    }

    const activeNodeTypeSet = new Set(activeNodeTypeFilters);
    const activeLinkLabelSet = new Set(activeLinkLabelFilters);

    const currentFilteredNodes = graphData.nodes.filter(node => activeNodeTypeSet.has(node.type));
    const currentFilteredNodeIds = new Set(currentFilteredNodes.map(node => node.id));

    const currentFilteredLinks = graphData.links.filter(link => 
        activeLinkLabelSet.has(link.label) &&
        currentFilteredNodeIds.has(link.source as string) &&
        currentFilteredNodeIds.has(link.target as string)
    );

    setFilteredGraphData({
        nodes: currentFilteredNodes,
        links: currentFilteredLinks,
    });

  }, [graphData, activeNodeTypeFilters, activeLinkLabelFilters]);
  
  const handleThemeChange = useCallback((newTheme: Theme) => {
    setTheme(newTheme);
    localStorage.setItem(THEME_STORAGE_KEY, newTheme);
  }, []);

  const handleSaveSettings = (newModel: string, newUseDefault: boolean, newPortkeyConfig: PortkeyConfig) => {
    setUseDefaultModel(newUseDefault);
    localStorage.setItem(USE_DEFAULT_MODEL_STORAGE_KEY, JSON.stringify(newUseDefault));
    
    if (newUseDefault) {
        if (AVAILABLE_MODELS.includes(newModel)) {
            setGeminiModel(newModel);
            localStorage.setItem(MODEL_STORAGE_KEY, newModel);
        }
    } else {
        setPortkeyConfig(newPortkeyConfig);
        localStorage.setItem(PORTKEY_CONFIG_STORAGE_KEY, JSON.stringify(newPortkeyConfig));
    }
  };

  const executeActionWithUnsavedCheck = (action: () => void) => {
    if (graphData && !isCurrentGraphSaved) {
        setPendingAction(() => action);
        setIsUnsavedChangesModalOpen(true);
    } else {
        action();
    }
  };

  const handleGenerateGraph = useCallback(async (topic: string, customText: string, files: File[]) => {
    const generationFn = async () => {
        setIsLoading(true);
        setError(null);
        setGraphData(null);
        setSelectedNode(null);
        setIsUnsavedChangesModalOpen(false);

        try {
            if (!topic.trim() && !customText.trim() && files.length === 0) {
                throw new Error("Please provide a topic, custom text, or files to generate a graph.");
            }
            const { generateGraphData } = await import('./services/geminiService');
            const data = await generateGraphData(topic, customText, files, {
              useDefault: useDefaultModel,
              defaultModel: geminiModel,
              portkey: portkeyConfig,
            });
            setGraphData(data);
            setIsCurrentGraphSaved(false);
            if (window.matchMedia('(max-width: 767px)').matches) {
                setMobileView('graph');
            }

        } catch (err) {
            console.error(err);
            if (err instanceof Error && (err.message.includes('API key not valid') || err.message.includes('process is not defined'))) {
                setError('The API key is missing or invalid. Please ensure it is configured correctly.');
            } else if (err instanceof Error) {
                setError(err.message);
            } else {
                setError('An unknown error occurred while generating the graph.');
            }
        } finally {
            setIsLoading(false);
            setPendingAction(null);
        }
    };
    
    executeActionWithUnsavedCheck(generationFn);

  }, [graphData, isCurrentGraphSaved, useDefaultModel, geminiModel, portkeyConfig]);

  const handleImportGraph = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    // Reset file input to allow re-uploading the same file
    if(event.target) event.target.value = ''; 
    if (!file) return;

    const importFn = async () => {
        setIsLoading(true);
        setError(null);
        setGraphData(null);
        setSelectedNode(null);
        setIsUnsavedChangesModalOpen(false);

        try {
            const content = await file.text();
            const extension = file.name.split('.').pop()?.toLowerCase();
            let data: GraphData;

            switch (extension) {
                case 'json':
                    data = importService.parseJson(content);
                    break;
                case 'gml':
                    data = importService.parseGml(content);
                    break;
                case 'graphml':
                    data = importService.parseGraphml(content);
                    break;
                default:
                    throw new Error(`Unsupported file format: .${extension}`);
            }

            setGraphData(data);
            setIsCurrentGraphSaved(false); // Imported graph is unsaved by default
            if (window.matchMedia('(max-width: 767px)').matches) {
                setMobileView('graph');
            }
        } catch (err) {
            console.error("Import error:", err);
            const message = err instanceof Error ? err.message : 'An unknown error occurred during import.';
            setError(`Failed to import graph: ${message}`);
        } finally {
            setIsLoading(false);
            setPendingAction(null);
        }
    };

    executeActionWithUnsavedCheck(importFn);

  }, [graphData, isCurrentGraphSaved]);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleNodeClick = useCallback((node: Node) => {
    setSelectedNode(node);
    setIsNodePanelCollapsed(false);
  }, []);

  const handleClosePanel = useCallback(() => {
    setSelectedNode(null);
  }, []);

  const handleExpandNode = useCallback(async (nodeToExpand: Node) => {
    if (!graphData) return;

    setIsLoading(true);
    setError(null);
    setSelectedNode(null); // Close panel immediately for better UX

    try {
        const { expandGraphFromNode } = await import('./services/geminiService');
        const expansionData = await expandGraphFromNode(nodeToExpand, {
          useDefault: useDefaultModel,
          defaultModel: geminiModel,
          portkey: portkeyConfig,
        });

        setGraphData(prevData => {
            if (!prevData) return null;

            // Filter out new nodes that already exist in the graph by ID
            const existingNodeIds = new Set(prevData.nodes.map(n => n.id));
            const uniqueNewNodes = expansionData.nodes.filter(newNode => !existingNodeIds.has(newNode.id));
            
            if (expansionData.nodes.length !== uniqueNewNodes.length) {
                console.warn('Duplicate nodes found during expansion were ignored.');
            }

            // Combine nodes and links
            const combinedNodes = [...prevData.nodes, ...uniqueNewNodes];
            const combinedLinks = [...prevData.links, ...expansionData.links];
            
            // De-duplicate links based on a composite key
            const uniqueLinks = Array.from(
                new Map(combinedLinks.map(link => [`${link.source}-${link.target}-${link.label}`, link])).values()
            );

            return {
                nodes: combinedNodes,
                links: uniqueLinks
            };
        });
        setIsCurrentGraphSaved(false); // The graph has changed
    } catch (err) {
        console.error("Expansion error:", err);
        const message = err instanceof Error ? err.message : 'An unknown error occurred during expansion.';
        setError(`Failed to expand graph: ${message}`);
        setSelectedNode(nodeToExpand); // Re-open panel on error
    } finally {
        setIsLoading(false);
    }
  }, [graphData, useDefaultModel, geminiModel, portkeyConfig]);
  
  // --- Graph Persistence Handlers ---

  const handleSaveCurrentGraph = (name: string) => {
    if (!graphData) return;
    dbService.saveGraph({ name, graphData, createdAt: new Date() }).then(() => {
        setIsSaveModalOpen(false);
        setIsCurrentGraphSaved(true);
        refreshSavedGraphs();
        if (pendingAction) {
            pendingAction();
        }
    });
  };

  const handleLoadGraph = async (id: number) => {
    const savedGraph = await dbService.getGraphById(id);
    if (savedGraph) {
        setGraphData(savedGraph.graphData);
        setIsCurrentGraphSaved(true);
        setIsGraphsPanelOpen(false);
        setError(null);
        setSelectedNode(null);
        if (window.matchMedia('(max-width: 767px)').matches) {
            setMobileView('graph');
        }
    }
  };

  const handleDeleteGraph = async (id: number) => {
    if (window.confirm('Are you sure you want to permanently delete this graph?')) {
        await dbService.deleteGraph(id);
        refreshSavedGraphs();
    }
  };
  
  const handleExportSavedGraph = async (id: number) => {
      const savedGraph = await dbService.getGraphById(id);
      if(savedGraph) {
        const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(savedGraph.graphData, null, 2))}`;
        const link = document.createElement("a");
        link.href = jsonString;
        link.download = `${savedGraph.name.replace(/\s+/g, '_')}.json`;
        link.click();
      }
  }
  
  const handleExportCurrentGraph = (format: 'json' | 'gml' | 'graphml' | 'png', filename: string) => {
    if (!graphData) return;

    if (format === 'png') {
        graphVisualizerRef.current?.exportAsPNG(filename);
        setIsExportModalOpen(false);
        return;
    }

    let content: string;
    let mimeType: string;
    let fileExtension: string;

    switch (format) {
      case 'gml':
        content = exportService.convertToGML(graphData);
        mimeType = 'text/plain;charset=utf-8';
        fileExtension = 'gml';
        break;
      case 'graphml':
        content = exportService.convertToGraphML(graphData);
        mimeType = 'application/xml;charset=utf-8';
        fileExtension = 'graphml';
        break;
      case 'json':
      default:
        content = JSON.stringify(graphData, null, 2);
        mimeType = 'application/json;charset=utf-8';
        fileExtension = 'json';
        break;
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const finalFileName = `${filename}.${fileExtension}`;
    link.download = finalFileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setIsExportModalOpen(false);
};

  // --- Unsaved Changes Modal Handlers ---
  const onUnsavedConfirm = () => {
    setIsUnsavedChangesModalOpen(false);
    setIsSaveModalOpen(true); // This will then trigger the pending function
  };
  
  const onUnsavedDeny = () => {
    setIsUnsavedChangesModalOpen(false);
    if(pendingAction) {
        pendingAction();
    }
  };

  const onUnsavedCancel = () => {
    setIsUnsavedChangesModalOpen(false);
    setPendingAction(null);
  };


  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans flex flex-col">
      <Header 
        onSave={() => graphData && setIsSaveModalOpen(true)}
        onToggleGraphsPanel={() => setIsGraphsPanelOpen(!isGraphsPanelOpen)}
        isSaveDisabled={!graphData || isCurrentGraphSaved}
        onExport={() => setIsExportModalOpen(true)}
        isExportDisabled={!graphData}
        onImportClick={handleImportClick}
        onHelp={() => setIsHelpModalOpen(true)}
        onSettings={() => setIsSettingsModalOpen(true)}
        onAbout={() => setIsAboutModalOpen(true)}
        isFilterVisible={!!graphData}
        nodeTypes={allNodeTypes}
        linkLabels={allLinkLabels}
        activeNodeTypeFilters={activeNodeTypeFilters}
        activeLinkLabelFilters={activeLinkLabelFilters}
        onNodeTypeFilterChange={setActiveNodeTypeFilters}
        onLinkLabelFilterChange={setActiveLinkLabelFilters}
      />
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImportGraph}
        className="hidden"
        accept=".json,.gml,.graphml"
      />
      <div className="flex flex-1 flex-col md:flex-row overflow-hidden">
        <div className="relative flex-shrink-0">
          <InputPanel 
            onGenerate={handleGenerateGraph} 
            isLoading={isLoading}
            isDefaultModelInUse={useDefaultModel}
            className={`${
              mobileView === 'input' ? 'flex w-full p-6' : 'hidden'
            } md:flex md:p-6 transition-all duration-300 ease-in-out ${
              isInputPanelCollapsed ? 'md:w-0 md:p-0' : 'md:w-96'
            }`}
          />
           <PanelToggleButton
            isCollapsed={isInputPanelCollapsed}
            onToggle={() => setIsInputPanelCollapsed(p => !p)}
            side="left"
          />
        </div>
        <main className={`flex-1 md:border-l border-gray-700/50 flex items-center justify-center relative overflow-hidden ${mobileView === 'graph' ? 'flex' : 'hidden md:flex'} ${theme === 'light' ? 'bg-white' : 'bg-gray-900'}`}>
          {isLoading && <Loader />}
          {error && <div className="text-red-400 bg-red-900/50 p-4 rounded-lg z-10">{error}</div>}
          {!isLoading && !error && !graphData && (
            <div className={`text-center z-10 p-8 max-w-2xl mx-auto ${theme === 'light' ? 'text-gray-600' : 'text-gray-500'}`}>
              <h2 className={`text-3xl font-bold mb-3 ${theme === 'light' ? 'text-gray-800' : 'text-gray-300'}`}>Welcome to GraphMind Weaver</h2>
              <p className={`text-lg mb-8 ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>Use the panel on the left to generate a new graph, <br /> or import an existing one to get started.</p>
              <div className="flex items-center justify-center">
                  <button onClick={handleImportClick} className="flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 text-base font-semibold text-white bg-cyan-600 hover:bg-cyan-500 rounded-lg shadow-md transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-opacity-75">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg>
                      Import Graph
                  </button>
              </div>
            </div>
          )}
          {filteredGraphData && (
            <Suspense fallback={<Loader />}>
              <GraphVisualizer
                ref={graphVisualizerRef}
                data={filteredGraphData}
                onNodeClick={handleNodeClick}
                highlightedNodeId={highlightedNodeId}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                onNodeHighlight={setHighlightedNodeId}
                theme={theme}
              />
            </Suspense>
          )}
           <NodeSidePanel 
             node={selectedNode} 
             onClose={handleClosePanel} 
             onExpand={handleExpandNode} 
             isLoading={isLoading} 
             isCollapsed={isNodePanelCollapsed}
             onToggle={() => setIsNodePanelCollapsed(p => !p)}
             isDefaultModelInUse={useDefaultModel}
            />
          <Suspense fallback={null}>
            <SavedGraphsPanel
                isOpen={isGraphsPanelOpen}
                graphs={savedGraphs}
                onLoad={handleLoadGraph}
                onDelete={handleDeleteGraph}
                onExport={handleExportSavedGraph}
                onClose={() => setIsGraphsPanelOpen(false)}
            />
          </Suspense>
        </main>
      </div>
      
      {graphData && <ViewToggler currentView={mobileView} onToggle={() => setMobileView(p => p === 'input' ? 'graph' : 'input')} />}
      {isSaveModalOpen && <SaveGraphModal onSave={handleSaveCurrentGraph} onClose={() => { setIsSaveModalOpen(false); if (pendingAction) onUnsavedCancel(); }} />}
      {isExportModalOpen && <ExportModal onExport={handleExportCurrentGraph} onClose={() => setIsExportModalOpen(false)} />}
      {isHelpModalOpen && <HelpModal onClose={() => setIsHelpModalOpen(false)} />}
      {isSettingsModalOpen && (
        <SettingsModal 
            isOpen={isSettingsModalOpen}
            onClose={() => setIsSettingsModalOpen(false)}
            onSave={handleSaveSettings}
            currentModel={geminiModel}
            availableModels={AVAILABLE_MODELS}
            useDefaultModel={useDefaultModel}
            portkeyConfig={portkeyConfig}
            theme={theme}
            onThemeChange={handleThemeChange}
        />
      )}
      {isAboutModalOpen && (
        <Suspense fallback={null}>
            <AboutModal onClose={() => setIsAboutModalOpen(false)} />
        </Suspense>
      )}
      {isUnsavedChangesModalOpen && <ConfirmationModal title="Unsaved Changes" message="You have an unsaved graph. Do you want to save it before generating a new one?" onConfirm={onUnsavedConfirm} onDeny={onUnsavedDeny} onCancel={onUnsavedCancel} confirmText="Save and Continue" denyText="Continue without Saving" />}
    </div>
  );
};

export default App;