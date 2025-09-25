import type { GraphData, Node, PortkeyConfig } from '../types';

interface GenerationConfig {
    useDefault: boolean;
    defaultModel: string;
    portkey: PortkeyConfig;
}


/**
 * Extracts a JSON string from a model's text response.
 * It looks for markdown code blocks and falls back to trimming the string to the first and last curly braces.
 * @param text The raw text response from the model.
 * @returns A string that is likely to be JSON.
 */
function extractJsonFromResponse(text: string): string {
    let jsonString = text.trim();

    // Try to find a markdown JSON block, non-greedily
    const markdownMatch = jsonString.match(/```(?:json)?\s*([\s\S]+?)\s*```/);
    if (markdownMatch && markdownMatch[1]) {
        return markdownMatch[1].trim();
    }

    // Fallback for cases where the JSON is not in a code block
    const firstBracket = jsonString.indexOf('{');
    if (firstBracket > -1) {
        const lastBracket = jsonString.lastIndexOf('}');
        if (lastBracket > firstBracket) {
            return jsonString.substring(firstBracket, lastBracket + 1);
        }
    }
    
    // If no clear JSON object is found, return the trimmed string and let the parser decide.
    return jsonString;
}

/**
 * Converts a File object to a GoogleGenerativeAI.Part object for multimodal prompting.
 * @param file The file to convert.
 * @returns A Promise that resolves to a Part object with inlineData.
 */
async function fileToGenerativePart(file: File) {
  const base64EncodedDataPromise = new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (reader.result) {
        resolve((reader.result as string).split(',')[1]);
      } else {
        reject(new Error("Failed to read file."));
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
  
  const data = await base64EncodedDataPromise;
  
  return {
    inlineData: {
      data,
      mimeType: file.type,
    },
  };
}

async function generateGraphWithPortkey(customText: string, portkeyConfig: PortkeyConfig): Promise<GraphData> {
    const systemInstruction = `You are an expert in knowledge graph generation. Analyze the provided context from user-provided text. Your task is to identify key entities (people, places, concepts, organizations, etc.) and the relationships between them.
- Your entire response MUST be a single, valid JSON object. Do not include any other text, explanations, or markdown formatting like \`\`\`json.
- The JSON object must have two top-level keys: "nodes" and "links".
- "nodes" should be an array of objects. Each node object must have: "id" (string, snake_case), "label" (string), "type" (string), and a "properties" object.
- The "properties" object must include: "summary" (string), "definition" (string), and "source_context" (string, a quote from the source). The "references" property should be an empty array [].
- "links" should be an array of objects. Each link object must have: "source" (string, matching a node id), "target" (string, matching a node id), and "label" (string).
- The graph should be comprehensive but focused on the most significant entities and relationships.`;
    
    const userPrompt = `Based on the following context, generate a knowledge graph. Text: "${customText}"`;
    
    const response = await fetch(`${portkeyConfig.baseURL || 'https://api.portkey.ai/v1'}/chat/completions`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-portkey-api-key': portkeyConfig.apiKey,
            'x-portkey-virtual-key': portkeyConfig.virtualKey,
        },
        body: JSON.stringify({
            model: portkeyConfig.model,
            messages: [
                { role: 'system', content: systemInstruction },
                { role: 'user', content: userPrompt }
            ],
            response_format: { type: 'json_object' }
        })
    });
    
    if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`PortKey API Error: ${response.status} ${response.statusText} - ${errorBody}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    if (!content) {
        throw new Error("Received an empty response from the model via PortKey.");
    }
    
    const parsedData = JSON.parse(content);
    
    if (!parsedData.nodes || !Array.isArray(parsedData.nodes) || !parsedData.links || !Array.isArray(parsedData.links)) {
        throw new Error("Invalid data structure received from API. Expected 'nodes' and 'links' arrays.");
    }

    const validNodes = parsedData.nodes.filter((node: any) => node && typeof node.id === 'string' && node.id.trim().length > 0);
    const nodeIds = new Set(validNodes.map((node: Node) => node.id));
    const validLinks = parsedData.links.filter((link: any) => {
        if (!link || typeof link.source !== 'string' || typeof link.target !== 'string') {
            console.warn(`[Portkey] Filtering malformed link:`, link);
            return false;
        }
        const sourceExists = nodeIds.has(link.source);
        const targetExists = nodeIds.has(link.target);
        if (!sourceExists || !targetExists) {
            console.warn(`[Portkey] Filtering link with missing node: ${link.source} -> ${link.target}.`);
        }
        return sourceExists && targetExists;
    });
    
    return { nodes: validNodes, links: validLinks } as GraphData;
}


export async function generateGraphData(topic: string, customText: string, files: File[], config: GenerationConfig): Promise<GraphData> {
    
    if (!config.useDefault) {
        if (topic.trim().length > 0) {
            throw new Error("Topic Search (Web) is only available when using the default Gemini model.");
        }
        if (files.length > 0) {
            throw new Error("File uploads are only available when using the default Gemini model.");
        }
        if (!config.portkey.apiKey || !config.portkey.virtualKey || !config.portkey.model) {
            throw new Error("PortKey is not configured. Please provide API Key, Virtual Key, and Model Name in Settings.");
        }
        return generateGraphWithPortkey(customText, config.portkey);
    }
    
    // --- Default Gemini Logic ---
    const { GoogleGenAI, Type } = await import('@google/genai');
      
    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        nodes: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING, description: "A unique identifier for the node (e.g., the entity name in snake_case)." },
              label: { type: Type.STRING, description: "A concise, human-readable label for the node." },
              type: { type: Type.STRING, description: "The category or type of the entity (e.g., Person, Organization, Concept)." },
              properties: {
                type: Type.OBJECT,
                description: "A key-value map of additional details or attributes about the node.",
                properties: {
                    summary: { type: Type.STRING, description: "A brief summary of the entity." },
                    definition: { type: Type.STRING, description: "A concise, dictionary-style definition of the entity's label." },
                    source_context: { type: Type.STRING, description: "A direct quote or relevant snippet from the source material that justifies the creation of this node and provides context." },
                    references: { 
                        type: Type.ARRAY, 
                        items: { 
                            type: Type.OBJECT,
                            properties: {
                                url: { type: Type.STRING, description: "The source URL for the information." },
                                title: { type: Type.STRING, description: "The title of the source webpage." }
                            },
                            required: ["url", "title"]
                        }, 
                        description: "An array of source objects (URL and title) from the web search that provided information for this entity. This should be empty if the source is not from the web." 
                    }
                },
                additionalProperties: true,
                required: ["summary", "definition", "source_context"],
              },
            },
            required: ["id", "label", "type", "properties"],
          },
        },
        links: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              source: { type: Type.STRING, description: "The id of the source node for the relationship. MUST match an 'id' from the 'nodes' list." },
              target: { type: Type.STRING, description: "The id of the target node for the relationship. MUST match an 'id' from the 'nodes' list." },
              label: { type: Type.STRING, description: "A description of the relationship between the source and target nodes." },
            },
            required: ["source", "target", "label"],
          },
        },
      },
      required: ["nodes", "links"],
    };

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    
    const hasTopic = topic.trim().length > 0;
    const hasCustomText = customText.trim().length > 0;
    const hasFiles = files.length > 0;
    
    const systemInstruction = `You are an expert in knowledge graph generation. Analyze the provided context, which may come from a web search, user-provided text, or uploaded files. Your task is to identify key entities (people, places, concepts, organizations, etc.) and the relationships between them.
    - Entities should be nodes in the graph. Each node must have a unique ID (e.g., in snake_case), a label, a type, and a properties object.
    - The properties object must include a 'summary', a concise 'definition', and a 'source_context' which is a quote from the source material providing evidence for the node.
    - If the context is from a web search, the properties object should ALSO include a 'references' array. Each item in the array should be an object containing the 'url' and 'title' of the source webpage. If not from the web, this array can be empty.
    - Relationships should be links (edges) connecting two nodes. Each link must have a source ID and a target ID that EXACTLY MATCH an 'id' from the 'nodes' list.
    - The graph should be comprehensive but focused on the most significant entities and relationships.
    - Output ONLY the structured JSON data according to the provided schema. Do not include any other text or markdown formatting.`;

    let prompt: string;
    const genAIConfig: any = {};
    let contents: any;

    if (hasTopic) {
      prompt = `
        Based on a web search for the topic "${topic}", generate a knowledge graph.
        Extract the key entities and their relationships. For each entity (node), provide a summary, a definition, a source_context quote, and an array of reference objects in the 'references' property. Each reference object must contain a 'url' and a 'title' from the web search. Structure everything as a single JSON object with 'nodes' and 'links'.
      `;
      contents = prompt;
      genAIConfig.systemInstruction = systemInstruction;
      genAIConfig.tools = [{ googleSearch: {} }];
    } else {
       prompt = `
        Based on the following context, generate a knowledge graph.
        
        ${hasCustomText ? `User-Provided Text: "${customText}"` : ''}
        ${hasFiles ? `Content from ${files.length} uploaded file(s) is also provided.` : ''}
        
        Extract the key entities and their relationships and structure them as a JSON object with 'nodes' and 'links'.
        If analyzing files, summarize the collective information to build the graph. The 'references' property for nodes should be an empty array.
        `;
      genAIConfig.systemInstruction = systemInstruction;
      genAIConfig.responseMimeType = "application/json";
      genAIConfig.responseSchema = responseSchema;
      
      const parts: any[] = [{ text: prompt }];
      if (hasFiles) {
        const fileParts = await Promise.all(files.map(fileToGenerativePart));
        parts.push(...fileParts);
      }
      contents = { parts };
    }
      
    const response = await ai.models.generateContent({
      model: config.defaultModel,
      contents: contents,
      config: genAIConfig,
    });
    
    const jsonString = extractJsonFromResponse(response.text);
    const parsedData = JSON.parse(jsonString);

    if (!parsedData.nodes || !Array.isArray(parsedData.nodes) || !parsedData.links || !Array.isArray(parsedData.links)) {
        throw new Error("Invalid data structure received from API. Expected 'nodes' and 'links' arrays.");
    }
    
    // Validate nodes: must exist and have a non-empty string ID.
    const validNodes = parsedData.nodes.filter((node: any) => {
        const isValid = node && typeof node.id === 'string' && node.id.trim().length > 0;
        if (!isValid) {
            console.warn("[Gemini] Filtering out invalid node:", node);
        }
        return isValid;
    });

    const nodeIds = new Set(validNodes.map((node: Node) => node.id));

    // Validate links: must exist, have string source/target, and point to existing nodes.
    const validLinks = parsedData.links.filter((link: any) => {
        const isWellFormed = link && typeof link.source === 'string' && typeof link.target === 'string';
        if (!isWellFormed) {
            console.warn("[Gemini] Filtering out malformed link:", link);
            return false;
        }
        const sourceExists = nodeIds.has(link.source);
        const targetExists = nodeIds.has(link.target);
        if (!sourceExists || !targetExists) {
            console.warn(`[Gemini] Filtering out link with missing node: ${link.source} -> ${link.target}.`);
            return false;
        }
        return true;
    });
    
    return {
        nodes: validNodes,
        links: validLinks,
    } as GraphData;
}

export async function expandGraphFromNode(sourceNode: Node, config: GenerationConfig): Promise<GraphData> {
    if (!config.useDefault) {
        throw new Error("Node expansion (Search & Expand) is only available when using the default Gemini model.");
    }

    const { GoogleGenAI } = await import('@google/genai');
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

    const systemInstruction = `You are an expert in knowledge graph expansion. You will be given a 'source node' from an existing graph. Your task is to perform a targeted web search to find entities and concepts directly related to this source node, and then generate a new, smaller graph fragment to be merged into the main graph.
    - The source node is provided with its ID, label, and summary.
    - Identify new, relevant entities (people, places, concepts, etc.) connected to the source node. These will be the new nodes.
    - The most important rule: Create relationships (links) that connect these NEW nodes to the ORIGINAL source node's ID. You can also create links between the new nodes themselves.
    - The 'source' or 'target' of a link pointing to the original node MUST use the exact ID provided: "${sourceNode.id}".
    - Each new node must have a unique ID, label, type, and a properties object containing at least a 'summary', 'definition', 'source_context', and a 'references' array. Each item in the 'references' array should be an object containing the 'url' and 'title' of the source webpage.
    - Output ONLY a structured JSON object with 'nodes' and 'links' keys for the new fragment. Do not include the original source node in your 'nodes' list. Do not include markdown formatting.
    - If you cannot find any new, relevant information, you MUST respond with an empty JSON object: {}`;

    const prompt = `
        Expand the knowledge graph from the following source node:
        - ID: "${sourceNode.id}"
        - Label: "${sourceNode.label}"
        - Summary: "${sourceNode.properties.summary}"
        
        Perform a web search to find related information, and generate a JSON object containing a list of new 'nodes' and new 'links' that connect to the source node or to each other.
    `;

    const response = await ai.models.generateContent({
      model: config.defaultModel,
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        tools: [{ googleSearch: {} }],
      }
    });

    const jsonString = extractJsonFromResponse(response.text);
    // Handle empty response for expansion
    if (jsonString.trim() === '' || jsonString.trim() === '{}') {
         throw new Error("No new information was found to expand the graph.");
    }
    const parsedData = JSON.parse(jsonString);

    if (!parsedData.nodes || !Array.isArray(parsedData.nodes) || !parsedData.links || !Array.isArray(parsedData.links)) {
        throw new Error("Invalid data structure for expansion. Expected 'nodes' and 'links' arrays.");
    }

    const validNewNodes = parsedData.nodes.filter((node: any) => node && typeof node.id === 'string' && node.id.trim().length > 0);

    if (validNewNodes.length === 0) {
        throw new Error("No new information was found to expand the graph.");
    }

    // A link is valid if its source and target exist within the new nodes OR is the original source node.
    const validNodeIds = new Set(validNewNodes.map((node: Node) => node.id));
    validNodeIds.add(sourceNode.id);

    const validLinks = parsedData.links.filter((link: any) => {
        const isWellFormed = link && typeof link.source === 'string' && typeof link.target === 'string';
        if (!isWellFormed) {
            console.warn(`[Expansion] Filtering out malformed link:`, link);
            return false;
        }
        const sourceExists = validNodeIds.has(link.source);
        const targetExists = validNodeIds.has(link.target);
        if (!sourceExists || !targetExists) {
            console.warn(`[Expansion] Filtering out link with missing node: ${link.source} -> ${link.target}.`);
            return false;
        }
        return true;
    });

    return {
        nodes: validNewNodes,
        links: validLinks,
    } as GraphData;
}