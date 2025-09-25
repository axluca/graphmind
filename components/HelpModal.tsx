import React, { useState } from 'react';

interface HelpModalProps {
  onClose: () => void;
}

const TabButton: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode }> = ({ active, onClick, children }) => (
    <button
        onClick={onClick}
        className={`px-4 py-2 text-sm font-semibold rounded-t-lg transition-colors ${
            active 
                ? 'bg-gray-700 text-cyan-400 border-b-2 border-cyan-400' 
                : 'text-gray-400 hover:bg-gray-700/50 hover:text-gray-200'
        }`}
    >
        {children}
    </button>
);

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="mb-6">
        <h4 className="text-lg font-semibold text-cyan-400 mb-2">{title}</h4>
        <div className="text-gray-300 space-y-2 text-base">{children}</div>
    </div>
);

const HowToUseContent: React.FC = () => (
    <>
        <Section title="1. Generating a Graph">
            <p>You have two primary ways to create a knowledge graph:</p>
            <ul className="list-disc list-inside space-y-1 pl-2">
                <li><strong>Topic Search (Web):</strong> Enter a topic (e.g., "The History of AI") and click "Search & Generate". The app performs a deep web search to gather information and build the graph.</li>
                <li><strong>Your Content:</strong> Paste text directly into the text area or upload your own PDF files. Click "Generate from Content" to create a graph based on the provided material.</li>
            </ul>
        </Section>
        <Section title="2. Interacting with the Graph">
            <ul className="list-disc list-inside space-y-1 pl-2">
                <li><strong>Click a Node:</strong> Click any node (circle) to open the side panel and view its details, including a summary, definition, and source context.</li>
                <li><strong>Pan & Zoom:</strong> Click and drag the background to move the graph. Use your mouse wheel or trackpad to zoom in and out.</li>
                <li><strong>Move Nodes:</strong> Click and drag any node to reposition it manually.</li>
            </ul>
        </Section>
        <Section title="3. Expanding a Node">
            <p>When you have a node selected in the side panel, click the "Search & Expand" button. This performs a new, targeted web search for information related to that specific node, finding new entities and relationships to add to your existing graph.</p>
        </Section>
         <Section title="4. Managing Graphs">
            <ul className="list-disc list-inside space-y-1 pl-2">
                <li><strong>Save:</strong> Click the "Save" button in the header to store the current graph in your browser's local storage. You will be prompted to give it a name.</li>
                <li><strong>Saved Graphs:</strong> Click "Saved Graphs" to open a panel listing all your saved work. From there, you can load, export, or delete any graph.</li>
                <li><strong>Import:</strong> Use the "Import" button to load a graph from a file (`.json`, `.gml`, `.graphml`).</li>
                <li><strong>Export:</strong> The "Export" button allows you to save the current graph to a file in various formats, making it compatible with other graph analysis tools.</li>
            </ul>
        </Section>
        <Section title="5. Filtering">
            <p>If your graph becomes complex, use the "Filter" button in the header. This opens a menu where you can show or hide nodes and links based on their type, helping you focus on specific parts of the graph.</p>
        </Section>
    </>
);

const WalkthroughContent: React.FC = () => (
    <>
        <Section title="Step 1: Generate Your First Graph">
            <p>Let's start by exploring a topic. In the "Topic Search" input on the left panel, type <strong>"The Roman Empire"</strong> and click the "Search & Generate" button. Wait a few moments while GraphMind Weaver scours the web and builds your graph.</p>
        </Section>
        <Section title="Step 2: Explore the Graph">
            <p>You should now see a web of interconnected nodes. Click on a central node like "Roman_Empire". The side panel will open, showing you a summary and definition. Look for other nodes like "Julius_Caesar" or "Augustus" and click on them to see their details.</p>
        </Section>
        <Section title="Step 3: Expand Your Knowledge">
            <p>With the "Julius_Caesar" node selected in the side panel, click the <strong>"Search & Expand"</strong> button at the bottom. The app will find new information related to Julius Caesar and add new nodes and connections to the graph, such as "Gallic_Wars" or "Cleopatra".</p>
        </Section>
        <Section title="Step 4: Save Your Work">
            <p>Happy with your expanded graph? Go to the header at the top and click the <strong>"Save"</strong> button. Enter a name like "My Roman History Graph" and save it. You can now access it anytime from the "Saved Graphs" panel.</p>
        </Section>
        <Section title="Step 5: Experiment!">
            <p>You're all set! Try generating graphs from your own notes, importing sample files, or expanding different nodes to see what you can discover. The possibilities are endless.</p>
        </Section>
    </>
);

const AboutContent: React.FC = () => (
    <>
        <Section title="Creator & Acknowledgements">
            <p>This application was created by <strong>Andrea Lucarelli</strong>.</p>
            <p>Contact: <a href="mailto:axluca@gmail.com" className="text-cyan-400 hover:underline">axluca@gmail.com</a></p>
            <p>
                It was developed with the powerful support of <strong>Gemini 2.5 Pro</strong> and <strong>Google AI Studio</strong>.
            </p>
        </Section>
        <Section title="License & Source Code">
             <p>Released under the <a href="/license.txt" target="_blank" rel="noopener noreferrer" className="font-bold text-cyan-400 hover:underline">MIT License</a>.</p>
             <p>
                The source code is available on GitHub:
                <a href="https://github.com/axluca/graphmind" target="_blank" rel="noopener noreferrer" className="block mt-1 text-cyan-400 hover:underline break-all">
                    https://github.com/axluca/graphmind
                </a>
            </p>
        </Section>
    </>
);


export const HelpModal: React.FC<HelpModalProps> = ({ onClose }) => {
    const [activeTab, setActiveTab] = useState<'how-to' | 'walkthrough' | 'about'>('how-to');

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-2xl w-full max-w-3xl h-full max-h-[80vh] flex flex-col">
                <div className="flex justify-between items-center p-4 border-b border-gray-700">
                    <h3 className="text-xl font-bold text-white">Help Center</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="border-b border-gray-700 px-4">
                    <nav className="flex space-x-2">
                        <TabButton active={activeTab === 'how-to'} onClick={() => setActiveTab('how-to')}>
                            How to Use
                        </TabButton>
                        <TabButton active={activeTab === 'walkthrough'} onClick={() => setActiveTab('walkthrough')}>
                            Tool Walkthrough
                        </TabButton>
                        <TabButton active={activeTab === 'about'} onClick={() => setActiveTab('about')}>
                            About
                        </TabButton>
                    </nav>
                </div>
                
                <div className="overflow-y-auto flex-1 p-6">
                    {activeTab === 'how-to' && <HowToUseContent />}
                    {activeTab === 'walkthrough' && <WalkthroughContent />}
                    {activeTab === 'about' && <AboutContent />}
                </div>

                <div className="flex justify-end p-4 border-t border-gray-700">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-md bg-gray-600 hover:bg-gray-500 text-white font-semibold transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};