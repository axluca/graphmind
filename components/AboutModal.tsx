import React from 'react';

interface AboutModalProps {
  onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-2xl w-full max-w-lg">
        <div className="flex justify-between items-center p-6 border-b border-gray-700">
          <h3 className="text-xl font-bold text-white">About GraphMind Weaver</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-4 text-gray-300">
          <p>This application was created by <strong>Andrea Lucarelli</strong>.</p>
          <p>Contact: <a href="mailto:axluca@gmail.com" className="text-cyan-400 hover:underline">axluca@gmail.com</a></p>
          <p>
            It was developed with the powerful support of <strong>Gemini 2.5 Pro</strong> and <strong>Google AI Studio</strong>.
          </p>
          <div className="pt-4 mt-4 border-t border-gray-700">
             <p>Released under the <a href="/license.txt" target="_blank" rel="noopener noreferrer" className="font-bold text-cyan-400 hover:underline">MIT License</a>.</p>
             <p>
                The source code is available on GitHub:
                <a href="https://github.com/axluca/graphmind" target="_blank" rel="noopener noreferrer" className="block mt-1 text-cyan-400 hover:underline break-all">
                    https://github.com/axluca/graphmind
                </a>
            </p>
          </div>
        </div>

        <div className="flex justify-end p-4 bg-gray-800/50 rounded-b-xl border-t border-gray-700">
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

export default AboutModal;