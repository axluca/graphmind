import React, { useState, useRef, useEffect } from 'react';

// A single checkbox item
const CheckboxItem: React.FC<{ label: string; isChecked: boolean; onToggle: () => void; }> = ({ label, isChecked, onToggle }) => (
  <label className="flex items-center space-x-3 cursor-pointer p-2 rounded-md hover:bg-gray-700/50">
    <input
      type="checkbox"
      checked={isChecked}
      onChange={onToggle}
      className="form-checkbox h-4 w-4 bg-gray-600 border-gray-500 rounded text-cyan-500 focus:ring-cyan-500"
    />
    <span className="text-gray-300 text-sm truncate" title={label}>{label}</span>
  </label>
);

// A group of checkboxes with Select All/None controls
const FilterGroup: React.FC<{
    title: string;
    items: string[];
    activeItems: string[];
    onChange: (newActiveItems: string[]) => void;
}> = ({ title, items, activeItems, onChange }) => {
    const activeSet = new Set(activeItems);

    const handleToggle = (item: string) => {
        const newActive = new Set(activeItems);
        if (newActive.has(item)) {
            newActive.delete(item);
        } else {
            newActive.add(item);
        }
        onChange(Array.from(newActive));
    };

    return (
        <div>
            <div className="px-3 py-2 flex justify-between items-center">
                <h4 className="text-sm font-semibold text-gray-400">{title}</h4>
                <div className="space-x-2">
                    <button onClick={() => onChange(items)} className="text-xs text-cyan-400 hover:underline">All</button>
                    <button onClick={() => onChange([])} className="text-xs text-cyan-400 hover:underline">None</button>
                </div>
            </div>
            <div className="max-h-40 overflow-y-auto px-1">
                {items.map(item => (
                    <CheckboxItem
                        key={item}
                        label={item}
                        isChecked={activeSet.has(item)}
                        onToggle={() => handleToggle(item)}
                    />
                ))}
            </div>
        </div>
    );
};

interface GraphFilterControlsProps {
    nodeTypes: string[];
    linkLabels: string[];
    activeNodeTypeFilters: string[];
    activeLinkLabelFilters: string[];
    onNodeTypeFilterChange: (filters: string[]) => void;
    onLinkLabelFilterChange: (filters: string[]) => void;
}

export const GraphFilterControls: React.FC<GraphFilterControlsProps> = ({
    nodeTypes,
    linkLabels,
    activeNodeTypeFilters,
    activeLinkLabelFilters,
    onNodeTypeFilterChange,
    onLinkLabelFilterChange,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Close on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [wrapperRef]);

    const hasActiveFilters = nodeTypes.length !== activeNodeTypeFilters.length || linkLabels.length !== activeLinkLabelFilters.length;

    return (
        <div className="relative" ref={wrapperRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center space-x-2 px-4 py-2 text-sm font-semibold transition-colors rounded-md ${hasActiveFilters ? 'bg-cyan-600/50 text-cyan-300 hover:bg-cyan-500/50' : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50'}`}
                title="Filter graph nodes and links"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
                </svg>
                <span>Filter</span>
            </button>

            {isOpen && (
                <div className="absolute top-full right-0 mt-2 w-64 bg-gray-800 border border-gray-700 rounded-lg shadow-2xl z-50 divide-y divide-gray-700">
                    <FilterGroup
                        title="Node Types"
                        items={nodeTypes}
                        activeItems={activeNodeTypeFilters}
                        onChange={onNodeTypeFilterChange}
                    />
                    <FilterGroup
                        title="Link Types"
                        items={linkLabels}
                        activeItems={activeLinkLabelFilters}
                        onChange={onLinkLabelFilterChange}
                    />
                </div>
            )}
        </div>
    );
};
