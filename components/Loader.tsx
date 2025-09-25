import React, { useState, useEffect } from 'react';

const statusMessages = [
  "Performing a deep web search...",
  "Analyzing search results...",
  "Identifying key entities...",
  "Building relationships...",
  "Finalizing graph structure...",
];

export const Loader: React.FC = () => {
  const [elapsedTime, setElapsedTime] = useState(0);
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

  useEffect(() => {
    // Timer for elapsed time
    const timer = setInterval(() => {
      setElapsedTime(prevTime => prevTime + 1);
    }, 1000);

    // Timer for cycling through status messages
    const messageTimer = setInterval(() => {
        setCurrentMessageIndex(prevIndex => (prevIndex + 1) % statusMessages.length);
    }, 3500); // Change message every 3.5 seconds

    // Cleanup timers on component unmount
    return () => {
      clearInterval(timer);
      clearInterval(messageTimer);
    };
  }, []); // Empty dependency array ensures this runs only once on mount

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  return (
    <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm flex flex-col items-center justify-center z-20 text-center p-4">
      <div className="w-16 h-16 border-4 border-cyan-400 border-dashed rounded-full animate-spin"></div>
      <p className="mt-4 text-lg text-gray-300 font-semibold min-h-[28px]">
        {statusMessages[currentMessageIndex]}
      </p>
      <p className="mt-2 text-sm text-gray-400 font-mono tracking-wider">
        Elapsed Time: {formatTime(elapsedTime)}
      </p>
    </div>
  );
};
