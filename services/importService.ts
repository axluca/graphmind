import type { GraphData, Node, Link } from '../types';

// Basic validation for parsed JSON
function isValidGraphData(data: any): data is GraphData {
    return (
        data &&
        Array.isArray(data.nodes) &&
        Array.isArray(data.links) &&
        data.nodes.every((n: any) => n && typeof n.id === 'string' && typeof n.label === 'string') &&
        data.links.every((l: any) => l && typeof l.source === 'string' && typeof l.target === 'string')
    );
}

// Common validation function to ensure data integrity
function validateGraphData(nodes: Node[], links: Link[], importType: string): GraphData {
    // 1. Filter nodes: must exist, have a non-empty string ID.
    const validNodes = nodes.filter(node => {
        const isValid = node && typeof node.id === 'string' && node.id.trim().length > 0;
        if (!isValid) {
            console.warn(`[${importType} Import] Filtering out invalid node:`, node);
        }
        return isValid;
    });

    const nodeIds = new Set(validNodes.map(node => node.id));
    
    // 2. Filter links: must exist, have string source/target, and point to existing nodes.
    const validLinks = links.filter(link => {
        const isWellFormed = link && typeof link.source === 'string' && typeof link.target === 'string';
        if (!isWellFormed) {
             console.warn(`[${importType} Import] Filtering out malformed link:`, link);
            return false;
        }
        const sourceExists = nodeIds.has(link.source);
        const targetExists = nodeIds.has(link.target);
        if (!sourceExists || !targetExists) {
            console.warn(`[${importType} Import] Filtering out link with missing node: ${link.source} -> ${link.target}.`);
            return false;
        }
        return true;
    });

    return { nodes: validNodes, links: validLinks };
}


export function parseJson(content: string): GraphData {
    const data = JSON.parse(content);
    if (!data || !Array.isArray(data.nodes) || !Array.isArray(data.links)) {
        throw new Error('Invalid JSON format. Expected an object with "nodes" and "links" arrays.');
    }
    return validateGraphData(data.nodes, data.links, 'JSON');
}

export function parseGml(content: string): GraphData {
    const nodes: Node[] = [];
    const links: Link[] = [];
    const lines = content.split('\n');

    let currentObject: any = null;
    let objectType: 'node' | 'edge' | null = null;

    for (const line of lines) {
        const trimmedLine = line.trim();
        if (trimmedLine.startsWith('node [')) {
            currentObject = { properties: {} };
            objectType = 'node';
        } else if (trimmedLine.startsWith('edge [')) {
            currentObject = {};
            objectType = 'edge';
        } else if (trimmedLine === ']') {
            if (objectType === 'node' && currentObject.id && currentObject.label) {
                // GML doesn't have a standard way to store nested properties, so we unpack them.
                const { id, label, type, ...properties } = currentObject;
                nodes.push({ id: String(id), label: String(label), type: String(type || 'Concept'), properties });
            } else if (objectType === 'edge' && currentObject.source && currentObject.target) {
                links.push({
                    source: String(currentObject.source),
                    target: String(currentObject.target),
                    label: String(currentObject.label || ''),
                });
            }
            currentObject = null;
            objectType = null;
        } else if (currentObject && objectType) {
            const parts = trimmedLine.match(/^(\S+)\s+(.*)$/);
            if (parts) {
                const [, key, value] = parts;
                // GML values can be quoted strings.
                const unquotedValue = value.startsWith('"') && value.endsWith('"')
                    ? value.substring(1, value.length - 1)
                    : value;

                try {
                     currentObject[key] = JSON.parse(unquotedValue);
                } catch {
                     currentObject[key] = unquotedValue;
                }
            }
        }
    }

    return validateGraphData(nodes, links, 'GML');
}

export function parseGraphml(content: string): GraphData {
    const nodes: Node[] = [];
    const links: Link[] = [];
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(content, "application/xml");

    const errorNode = xmlDoc.querySelector('parsererror');
    if (errorNode) {
        throw new Error('Failed to parse GraphML file.');
    }
    
    // 1. Map key IDs to attribute names
    const keyMap = new Map<string, { name: string; for: 'node' | 'edge' }>();
    xmlDoc.querySelectorAll('key').forEach(keyEl => {
        const id = keyEl.getAttribute('id');
        const name = keyEl.getAttribute('attr.name');
        const target = keyEl.getAttribute('for');
        if (id && name && (target === 'node' || target === 'edge')) {
            keyMap.set(id, { name, for: target });
        }
    });

    // 2. Parse nodes
    xmlDoc.querySelectorAll('graph > node').forEach(nodeEl => {
        const id = nodeEl.getAttribute('id');
        if (!id) return;

        const node: Node = { id, label: '', type: 'Concept', properties: {} };

        nodeEl.querySelectorAll('data').forEach(dataEl => {
            const keyId = dataEl.getAttribute('key');
            if (!keyId) return;
            const keyDef = keyMap.get(keyId);
            if (!keyDef || keyDef.for !== 'node') return;
            
            const value = dataEl.textContent || '';
            
            if (keyDef.name === 'label') {
                node.label = value;
            } else if (keyDef.name === 'type') {
                node.type = value;
            } else {
                // Try to parse if it's a JSON stringified object
                try {
                    node.properties[keyDef.name] = JSON.parse(value);
                } catch {
                    node.properties[keyDef.name] = value;
                }
            }
        });

        // Fallback if label is not defined via a key
        if (!node.label) node.label = id;

        nodes.push(node);
    });

    // 3. Parse edges
    xmlDoc.querySelectorAll('graph > edge').forEach(edgeEl => {
        const source = edgeEl.getAttribute('source');
        const target = edgeEl.getAttribute('target');
        if (!source || !target) return;

        const link: Link = { source, target, label: '' };

        edgeEl.querySelectorAll('data').forEach(dataEl => {
            const keyId = dataEl.getAttribute('key');
             if (!keyId) return;
            const keyDef = keyMap.get(keyId);
            if (keyDef && keyDef.for === 'edge' && keyDef.name === 'label') {
                link.label = dataEl.textContent || '';
            }
        });
        links.push(link);
    });

    return validateGraphData(nodes, links, 'GraphML');
}