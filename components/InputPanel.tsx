import React, { useState, useEffect } from 'react';

interface InputPanelProps {
  onGenerate: (topic: string, customText: string, files: File[]) => void;
  isLoading: boolean;
  className?: string;
  isDefaultModelInUse: boolean;
}

const GenerateButton: React.FC<{
    onClick: () => void;
    disabled: boolean;
    isGenerating: boolean;
    text: string;
    className?: string;
}> = ({ onClick, disabled, isGenerating, text, className }) => (
    <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={`w-full text-white font-bold py-3 px-4 rounded-md transition duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-lg ${className}`}
    >
        {isGenerating ? (
            <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                Generating...
            </>
        ) : (text)}
    </button>
);


export const InputPanel: React.FC<InputPanelProps> = ({ onGenerate, isLoading, className, isDefaultModelInUse }) => {
  const [topic, setTopic] = useState('');
  const [customText, setCustomText] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [activeGenerator, setActiveGenerator] = useState<'topic' | 'content' | null>(null);

  useEffect(() => {
    if (!isLoading) {
        setActiveGenerator(null);
    }
  }, [isLoading]);

  const handleTopicSubmit = () => {
    if (isLoading || !topic.trim()) return;
    setActiveGenerator('topic');
    onGenerate(topic, '', []);
  };

  const handleContentSubmit = () => {
    if (isLoading || (!customText.trim() && files.length === 0)) return;
    setActiveGenerator('content');
    onGenerate('', customText, files);
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(prev => {
        const newFiles = Array.from(e.target.files);
        const allFiles = [...prev, ...newFiles];
        // Prevent duplicate files by checking name
        const uniqueFiles = allFiles.filter((file, index, self) =>
            index === self.findIndex((f) => f.name === file.name)
        );
        return uniqueFiles;
      });
    }
    // Reset the input value to allow re-uploading the same file if it was removed.
    e.target.value = '';
  };

  const removeFile = (fileName: string) => {
    setFiles(prev => prev.filter(file => file.name !== fileName));
  };

  const canGenerateTopic = !isLoading && !!topic.trim() && isDefaultModelInUse;
  const canGenerateContent = !isLoading && (!!customText.trim() || files.length > 0);

  return (
    <aside className={`bg-gray-900 flex-col overflow-hidden ${className}`}>
      <div className="flex-1 overflow-y-auto -mr-4 pr-4 space-y-8">
          {/* Topic Search */}
          <div className="space-y-4">
            <label htmlFor="topic" className="block text-sm font-medium text-cyan-400">
                1. Topic Search (Web)
            </label>
            <div className="relative">
                <input
                type="text"
                id="topic"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g., 'The History of AI'"
                className="w-full bg-gray-800 border border-gray-700 rounded-md py-2 pl-4 pr-10 text-gray-200 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition duration-200"
                disabled={isLoading || !isDefaultModelInUse}
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <svg className="h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </div>
            </div>
             <GenerateButton
                onClick={handleTopicSubmit}
                disabled={!canGenerateTopic}
                isGenerating={isLoading && activeGenerator === 'topic'}
                text="Search & Generate"
                className="bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 hover:shadow-indigo-500/30"
            />
            {!isDefaultModelInUse && <p className="text-xs text-yellow-400/80 text-center">Topic Search is disabled when using a custom model.</p>}
          </div>

          <div className="relative flex py-2 items-center"><div className="flex-grow border-t border-gray-700"></div><span className="flex-shrink mx-4 text-gray-500">OR</span><div className="flex-grow border-t border-gray-700"></div></div>
      
          {/* Content Input */}
          <div className="flex flex-col space-y-4">
              <label htmlFor="customText" className="block text-sm font-medium text-cyan-400">
              2. Your Content
              </label>
              <textarea
                id="customText"
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                placeholder="Paste an article or notes..."
                className="w-full h-40 bg-gray-800 border border-gray-700 rounded-md py-2 px-4 text-gray-200 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition duration-200 resize-none"
                disabled={isLoading}
              />
              <div>
                <label htmlFor="file-upload" className={`w-full text-sm font-medium rounded-md p-3 flex items-center justify-center transition-colors ${!isDefaultModelInUse ? 'bg-gray-800 text-gray-500 cursor-not-allowed' : 'text-gray-300 bg-gray-700 hover:bg-gray-600 cursor-pointer'}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg>
                    Upload PDF Files
                </label>
                <input id="file-upload" type="file" multiple accept="application/pdf" onChange={handleFileChange} className="hidden" disabled={isLoading || !isDefaultModelInUse}/>
                {!isDefaultModelInUse && <p className="text-xs text-yellow-400/80 text-center mt-2">File upload is disabled when using a custom model.</p>}
              </div>
              {files.length > 0 && (
                <div className="space-y-2 max-h-48 overflow-y-auto p-3 bg-gray-800 rounded-md border border-gray-700">
                    <h3 className="text-sm font-medium text-gray-400 mb-2">Uploaded Files:</h3>
                    {files.map((file) => (
                    <div key={file.name} className="flex items-center justify-between bg-gray-700/50 p-2 rounded-md text-sm">
                        <div className="flex items-center space-x-2 overflow-hidden">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-400 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" /></svg>
                            <span className="text-gray-300 truncate" title={file.name}>{file.name}</span>
                        </div>
                        <button onClick={() => removeFile(file.name)} disabled={isLoading} className="text-gray-500 hover:text-white p-1 rounded-full disabled:opacity-50"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                    </div>
                    ))}
                </div>
              )}
              <GenerateButton
                onClick={handleContentSubmit}
                disabled={!canGenerateContent}
                isGenerating={isLoading && activeGenerator === 'content'}
                text="Generate from Content"
                className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 hover:shadow-cyan-500/30"
            />
          </div>
      </div>
    </aside>
  );
};