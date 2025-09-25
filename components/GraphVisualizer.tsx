import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import * as d3 from 'd3';
import type { Simulation, SimulationNodeDatum, SimulationLinkDatum } from 'd3';
import type { GraphData, Node, Link, Theme } from '../types';

export interface ExportHandles {
  exportAsPNG: (filename: string) => void;
}

interface GraphVisualizerProps {
  data: GraphData;
  onNodeClick: (node: Node) => void;
  highlightedNodeId: string | null;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onNodeHighlight: (id: string | null) => void;
  theme: Theme;
}

// Explicitly add d3 simulation properties and a derived 'level' to the Node type.
interface GraphNode extends Node, SimulationNodeDatum {
    level?: number;
    index?: number;
    x?: number;
    y?: number;
    vx?: number;
    vy?: number;
    fx?: number | null;
    fy?: number | null;
}

// D3 simulation links require source and target to be nodes,
// but our initial data uses string IDs. This type accommodates
// the structure after d3-force initializes the links.
interface GraphLink extends SimulationLinkDatum<GraphNode> {
    label: string;
}

const GraphVisualizer = forwardRef<ExportHandles, GraphVisualizerProps>(({ data, onNodeClick, highlightedNodeId, searchQuery, setSearchQuery, onNodeHighlight, theme }, ref) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const simulationRef = useRef<Simulation<GraphNode, GraphLink> | null>(null);
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const [suggestions, setSuggestions] = useState<Node[]>([]);

  useImperativeHandle(ref, () => ({
    exportAsPNG: (filename: string) => {
        if (!svgRef.current || !containerRef.current) return;

        const svg = svgRef.current;
        const { width, height } = containerRef.current.getBoundingClientRect();

        const serializer = new XMLSerializer();
        let svgString = serializer.serializeToString(svg);
        
        if (!svgString.match(/^<svg[^>]+xmlns="http\:\/\/www\.w3\.org\/2000\/svg"/)) {
            svgString = svgString.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
        }

        const svgDataUrl = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgString)));

        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;
            
            ctx.drawImage(img, 0, 0);

            const pngDataUrl = canvas.toDataURL('image/png');

            const a = document.createElement('a');
            a.href = pngDataUrl;
            a.download = `${filename}.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        };
        img.onerror = (err) => {
            console.error("Failed to load SVG image for PNG conversion", err);
        };
        img.src = svgDataUrl;
    }
  }));

  useEffect(() => {
    if (searchQuery.trim() === '') {
        setSuggestions([]);
        return;
    }
    const query = searchQuery.trim().toLowerCase();
    const filteredNodes = data.nodes
        .filter(node => node.label.toLowerCase().includes(query) && node.label.toLowerCase() !== query)
        .slice(0, 10); // Limit suggestions for performance
    setSuggestions(filteredNodes);
  }, [searchQuery, data.nodes]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    if (highlightedNodeId) {
        onNodeHighlight(null); // Clear highlight while typing
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    onNodeHighlight(null);
    setSuggestions([]);
  };

  const handleSuggestionClick = (node: Node) => {
    setSearchQuery(node.label);
    onNodeHighlight(node.id);
    setSuggestions([]); // Hide suggestions
  };


  useEffect(() => {
    if (!svgRef.current || !containerRef.current || !data) return;

    // --- Theme Colors ---
    const isLightTheme = theme === 'light';
    const backgroundColor = isLightTheme ? '#FFFFFF' : '#111827';
    const linkColor = isLightTheme ? '#1f2937' : '#4b5563';
    const linkLabelColor = isLightTheme ? '#1f2937' : '#6b7280';
    const nodeLabelColor = isLightTheme ? '#111827' : '#d1d5db';
    const nodeStrokeColor = isLightTheme ? '#F3F4F6' : '#1f2937';

    // --- Data Sanitization ---
    // Ensure data integrity before passing to D3 to prevent crashes from
    // links pointing to non-existent nodes.
    const nodeIds = new Set(data.nodes.map(n => n.id));
    const sanitizedNodes = data.nodes.filter(n => n.id && nodeIds.has(n.id));
    const sanitizedLinks = data.links.filter(l => {
        const sourceExists = nodeIds.has(l.source);
        const targetExists = nodeIds.has(l.target);
        if (!sourceExists || !targetExists) {
            console.warn(`[GraphVisualizer] Filtering out link with missing node: ${l.source} -> ${l.target}. This indicates an upstream data issue.`);
        }
        return sourceExists && targetExists;
    });
    
    const graphNodes: GraphNode[] = sanitizedNodes.map(d => ({ ...d }));
    // A type assertion is used here because d3-force will mutate this array,
    // replacing string `source`/`target` IDs with `GraphNode` objects.
    const graphLinks: GraphLink[] = sanitizedLinks.map(d => ({ ...d })) as unknown as GraphLink[];

    // --- Level-based Coloring ---
    const levelColors = ['#F97316', '#3B82F6', '#EF4444', '#22C55E', '#A855F7', '#EC4899']; // Orange, Blue, Red, Green, Purple, Pink
    const levels = new Map<string, number>();
    
    if (graphNodes.length > 0) {
        // 1. Build adjacency list for easy traversal
        const adj = new Map<string, string[]>();
        graphNodes.forEach(node => adj.set(node.id, []));
        sanitizedLinks.forEach(link => {
            adj.get(link.source)!.push(link.target);
            adj.get(link.target)!.push(link.source);
        });

        // 2. BFS function to assign levels
        const visited = new Set<string>();
        const bfs = (startNodeId: string) => {
            if (visited.has(startNodeId)) return;

            const queue: { nodeId: string; level: number }[] = [{ nodeId: startNodeId, level: 0 }];
            visited.add(startNodeId);
            levels.set(startNodeId, 0);

            let head = 0;
            while(head < queue.length) {
                const { nodeId, level } = queue[head++];
                const neighbors = adj.get(nodeId) || [];
                for (const neighborId of neighbors) {
                    if (!visited.has(neighborId)) {
                        visited.add(neighborId);
                        levels.set(neighborId, level + 1);
                        queue.push({ nodeId: neighborId, level: level + 1 });
                    }
                }
            }
        };
        
        // 3. Find the main root node (highest degree) and start BFS
        const degrees = new Map<string, number>();
        graphNodes.forEach(node => degrees.set(node.id, 0));
        sanitizedLinks.forEach(link => {
            degrees.set(link.source, (degrees.get(link.source) || 0) + 1);
            degrees.set(link.target, (degrees.get(link.target) || 0) + 1);
        });

        let rootNodeId: string | undefined;
        let maxDegree = -1;
        degrees.forEach((degree, nodeId) => {
            if (degree > maxDegree) {
                maxDegree = degree;
                rootNodeId = nodeId;
            }
        });

        if (rootNodeId) {
            bfs(rootNodeId);
        }

        // 4. Handle disconnected components by finding their own local root
        graphNodes.forEach(node => {
            if (!visited.has(node.id)) {
                bfs(node.id); // Treat as root of its own component
            }
        });

        graphNodes.forEach(node => {
            node.level = levels.get(node.id);
        });
    }


    const { width, height } = containerRef.current.getBoundingClientRect();
    const svg = d3.select(svgRef.current).attr('width', width).attr('height', height);

    svg.selectAll("*").remove(); // Clear previous graph

    svg.append('rect')
        .attr('width', width)
        .attr('height', height)
        .attr('fill', backgroundColor);

    const g = svg.append("g");

    const link = g.append("g")
      .attr("stroke", linkColor)
      .attr("stroke-opacity", 0.6)
      .selectAll("line")
      .data(graphLinks)
      .join("line")
      .attr("stroke-width", 1.5);

    const linkLabel = g.append("g")
      .selectAll("text")
      .data(graphLinks)
      .join("text")
      .attr("fill", linkLabelColor)
      .attr("font-size", "10px")
      .attr("text-anchor", "middle")
      .text(d => d.label);

    const node = g.append("g")
      .selectAll("g")
      .data(graphNodes, (d: any) => d.id)
      .join("g")
      .attr("class", "node-group") // Add a class for reliable selection
      .attr("cursor", "pointer")
      .on("click", (event, d) => {
        onNodeClick(d);
        if (simulationRef.current) {
          simulationRef.current.alphaTarget(0).restart();
        }
      });

    node.append("circle")
      .attr("r", 12)
      .attr("fill", d => (d.level !== undefined) ? levelColors[d.level % levelColors.length] : '#6B7280')
      .attr("stroke", nodeStrokeColor)
      .attr("stroke-width", 2);
      
    node.append("text")
      .attr("x", 16)
      .attr("y", 5)
      .text(d => d.label)
      .attr("fill", nodeLabelColor)
      .attr("font-size", "12px")
      .attr("font-weight", "normal");

    if (simulationRef.current) {
        simulationRef.current.stop();
    }
    
    const simulation = d3.forceSimulation<GraphNode>(graphNodes)
      .force("link", d3.forceLink<GraphNode, GraphLink>(graphLinks).id(d => d.id).distance(150))
      .force("charge", d3.forceManyBody().strength(-400))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collide", d3.forceCollide().radius(30));

    simulationRef.current = simulation;

    simulation.on("tick", () => {
      // Add optional chaining and nullish coalescing as a failsafe
      // to prevent crashes if source/target/x/y are somehow not defined.
      link
        .attr("x1", d => (d.source as GraphNode)?.x ?? 0)
        .attr("y1", d => (d.source as GraphNode)?.y ?? 0)
        .attr("x2", d => (d.target as GraphNode)?.x ?? 0)
        .attr("y2", d => (d.target as GraphNode)?.y ?? 0);
      
      linkLabel
        .attr("x", d => (((d.source as GraphNode)?.x ?? 0) + ((d.target as GraphNode)?.x ?? 0)) / 2)
        .attr("y", d => (((d.source as GraphNode)?.y ?? 0) + ((d.target as GraphNode)?.y ?? 0)) / 2);

      node.attr("transform", d => `translate(${d.x ?? 0}, ${d.y ?? 0})`);
    });
    
    const drag = (sim: typeof simulation) => {
      function dragstarted(event: d3.D3DragEvent<SVGGElement, GraphNode, GraphNode>, d: GraphNode) {
        if (!event.active) sim.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      }
      function dragged(event: d3.D3DragEvent<SVGGElement, GraphNode, GraphNode>, d: GraphNode) {
        d.fx = event.x;
        d.fy = event.y;
      }
      function dragended(event: d3.D3DragEvent<SVGGElement, GraphNode, GraphNode>, d: GraphNode) {
        if (!event.active) sim.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      }
      return d3.drag<SVGGElement, GraphNode>().on("start", dragstarted).on("drag", dragged).on("end", dragended);
    }

    node.call(drag(simulation));

    const zoomHandler = d3.zoom<SVGSVGElement, unknown>().on("zoom", (event) => {
        g.attr("transform", event.transform);
    });

    svg.call(zoomHandler as any);
    zoomRef.current = zoomHandler;

    return () => {
        simulation.stop();
    };

  }, [data, onNodeClick, theme]);


  // Effect for handling highlighting and auto-zoom
  useEffect(() => {
    if (!svgRef.current || !containerRef.current || !data) return;
    
    const svg = d3.select(svgRef.current);
    const g = svg.select<SVGGElement>('g');
    const nodeStrokeColor = theme === 'light' ? '#F3F4F6' : '#1f2937';
    
    // Reset all nodes to default appearance using the robust class selector
    g.selectAll<SVGGElement, GraphNode>('.node-group')
      .transition().duration(200)
      .select('circle')
      .attr('r', 12)
      .attr('stroke', nodeStrokeColor)
      .attr('stroke-width', 2);
    
    g.selectAll<SVGGElement, GraphNode>('.node-group')
      .select('text')
      .attr('font-size', '12px')
      .attr('font-weight', 'normal');

    if (highlightedNodeId) {
      // Find the specific node to highlight using the robust class selector
      const nodeToHighlight = g.selectAll<SVGGElement, GraphNode>('.node-group')
        .filter(d => d.id === highlightedNodeId);

      // CRASH FIX: Ensure the node exists in the selection before acting on it
      if (!nodeToHighlight.empty()) {
          // Apply highlight styles
          nodeToHighlight.select('circle')
            .transition().duration(200)
            .attr('r', 18)
            .attr('stroke', '#FBBF24') // amber-400
            .attr('stroke-width', 4);
          
          nodeToHighlight.select('text')
            .attr('font-size', '14px')
            .attr('font-weight', 'bold');

          // Pan and zoom to the highlighted node
          const nodeData = nodeToHighlight.datum();
          if (nodeData && nodeData.x !== undefined && nodeData.y !== undefined && zoomRef.current) {
            const { width, height } = containerRef.current.getBoundingClientRect();
            const transform = d3.zoomIdentity
              .translate(width / 2, height / 2)
              .scale(1.2) // Zoom in slightly
              .translate(-nodeData.x, -nodeData.y);
            
            svg.transition()
              .duration(750)
              .call(zoomRef.current.transform, transform);
          }
      }
    }
  }, [highlightedNodeId, data, theme]);

  return (
    <div ref={containerRef} className="w-full h-full absolute inset-0">
      <svg ref={svgRef}></svg>
      <div className="absolute top-4 left-4 z-10">
        <div className="relative">
            <input
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder="Find a node..."
                className={`w-48 md:w-64 backdrop-blur-sm border rounded-md py-2 pl-10 pr-10 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition duration-200 ${
                    theme === 'light'
                    ? 'bg-white/80 border-gray-300 text-gray-800 placeholder-gray-500'
                    : 'bg-gray-800/80 border-gray-600 text-gray-200 placeholder-gray-400'
                }`}
            />
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <svg className={`h-5 w-5 ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>
            {searchQuery && (
            <button
                onClick={handleClearSearch}
                className={`absolute inset-y-0 right-0 flex items-center pr-3 ${theme === 'light' ? 'text-gray-500 hover:text-gray-800' : 'text-gray-400 hover:text-white'}`}
                aria-label="Clear search"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
            </button>
            )}
            {suggestions.length > 0 && (
                <div className={`absolute top-full mt-2 w-full backdrop-blur-sm border rounded-md shadow-lg max-h-60 overflow-y-auto z-20 ${
                    theme === 'light'
                    ? 'bg-white/90 border-gray-300'
                    : 'bg-gray-800/90 border-gray-600'
                }`}>
                    {suggestions.map(node => (
                        <div
                            key={node.id}
                            onClick={() => handleSuggestionClick(node)}
                            className={`px-4 py-2 hover:bg-cyan-600/50 cursor-pointer transition-colors ${
                                theme === 'light'
                                ? 'text-gray-800 hover:text-white'
                                : 'text-gray-200'
                            }`}
                        >
                            {node.label}
                        </div>
                    ))}
                </div>
            )}
        </div>
      </div>
    </div>
  );
});

export default GraphVisualizer;