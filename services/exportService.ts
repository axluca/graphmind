import type { GraphData } from '../types';

function escapeGMLString(str: string): string {
    return `"${str.replace(/"/g, '\\"')}"`;
}

export function convertToGML(graphData: GraphData): string {
    const { nodes, links } = graphData;
    let gml = 'graph [\n';
    gml += '  directed 0\n'; // Assuming undirected for visualization purposes

    nodes.forEach(node => {
        gml += '  node [\n';
        gml += `    id ${escapeGMLString(node.id)}\n`;
        gml += `    label ${escapeGMLString(node.label)}\n`;
        gml += `    type ${escapeGMLString(node.type)}\n`;
        Object.entries(node.properties).forEach(([key, value]) => {
            const propValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
            gml += `    ${key.replace(/\s+/g, '_')} ${escapeGMLString(propValue)}\n`;
        });
        gml += '  ]\n';
    });

    links.forEach(link => {
        gml += '  edge [\n';
        gml += `    source ${escapeGMLString(link.source)}\n`;
        gml += `    target ${escapeGMLString(link.target)}\n`;
        gml += `    label ${escapeGMLString(link.label)}\n`;
        gml += '  ]\n';
    });

    gml += ']';
    return gml;
}

function escapeXML(str: string): string {
    if (typeof str !== 'string') {
        str = String(str);
    }
    return str.replace(/[<>&'"]/g, (c) => {
        switch (c) {
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '&': return '&amp;';
            case '\'': return '&apos;';
            case '"': return '&quot;';
            default: return c;
        }
    });
}

export function convertToGraphML(graphData: GraphData): string {
    const { nodes, links } = graphData;

    let graphml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    graphml += '<graphml xmlns="http://graphml.graphdrawing.org/xmlns"\n';
    graphml += '    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"\n';
    graphml += '    xsi:schemaLocation="http://graphml.graphdrawing.org/xmlns http://graphml.graphdrawing.org/xmlns/1.0/graphml.xsd">\n';

    // Define keys for node attributes
    graphml += '  <key id="d_label" for="node" attr.name="label" attr.type="string"/>\n';
    graphml += '  <key id="d_type" for="node" attr.name="type" attr.type="string"/>\n';
    
    // Dynamically create keys for properties
    const nodePropertyKeys = new Set<string>();
    nodes.forEach(node => {
        Object.keys(node.properties).forEach(key => nodePropertyKeys.add(key));
    });
    const propertyKeyMap: Record<string, string> = {};
    Array.from(nodePropertyKeys).forEach((key, i) => {
        const keyId = `d_prop_${i}`;
        propertyKeyMap[key] = keyId;
        graphml += `  <key id="${keyId}" for="node" attr.name="${escapeXML(key)}" attr.type="string"/>\n`;
    });
    
    // Define key for edge attribute
    graphml += '  <key id="e_label" for="edge" attr.name="label" attr.type="string"/>\n';

    graphml += '  <graph id="G" edgedefault="undirected">\n';

    // Add nodes
    nodes.forEach(node => {
        graphml += `    <node id="${escapeXML(node.id)}">\n`;
        graphml += `      <data key="d_label">${escapeXML(node.label)}</data>\n`;
        graphml += `      <data key="d_type">${escapeXML(node.type)}</data>\n`;
        Object.entries(node.properties).forEach(([key, value]) => {
            const propValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
            graphml += `      <data key="${propertyKeyMap[key]}">${escapeXML(propValue)}</data>\n`;
        });
        graphml += '    </node>\n';
    });

    // Add edges
    links.forEach((link, i) => {
        graphml += `    <edge id="e${i}" source="${escapeXML(link.source)}" target="${escapeXML(link.target)}">\n`;
        graphml += `      <data key="e_label">${escapeXML(link.label)}</data>\n`;
        graphml += '    </edge>\n';
    });

    graphml += '  </graph>\n';
    graphml += '</graphml>';

    return graphml;
}
