import React from 'react';

interface PanelToggleButtonProps {
  isCollapsed: boolean;
  onToggle: () => void;
  side: 'left' | 'right';
}

export const PanelToggleButton: React.FC<PanelToggleButtonProps> = ({ isCollapsed, onToggle, side }) => {
  const isLeftPanelButton = side === 'left';

  const buttonPositionClasses = isLeftPanelButton ? '-right-4 rounded-r-lg' : '-left-4 rounded-l-lg';
  const iconPath = isLeftPanelButton ? "M15 19l-7-7 7-7" : "M9 5l7 7-7 7";
  const iconTransformClass = isCollapsed ? 'rotate-180' : '';

  return (
    <button
      onClick={onToggle}
      className={`hidden md:block absolute top-1/2 z-10 -translate-y-1/2 bg-gray-700 hover:bg-cyan-600 text-white w-8 h-16 transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500 ${buttonPositionClasses}`}
      title={isCollapsed ? "Show Panel" : "Hide Panel"}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className={`h-6 w-6 mx-auto transition-transform duration-300 ${iconTransformClass}`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d={iconPath} />
      </svg>
    </button>
  );
};