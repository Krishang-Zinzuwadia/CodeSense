/**
 * Generate architecture diagrams from code analysis
 * Uses Gemini to understand code structure and creates Mermaid diagrams
 */

import { getCachedDiagram, setCachedDiagram, getDiagramCacheKey } from "./rateLimitHandler";
import { GeminiKeyManager } from "./geminiKeyManager";

interface DiagramRequest {
  owner: string;
  repo: string;
  fileStructure?: any;
  codeContext?: { [path: string]: string };
  diagramType?: "flowchart" | "architecture" | "dependency";
}

async function generateDiagramWithGemini(
  owner: string,
  repo: string,
  fileStructure: string,
  codeContext: string,
  diagramType: string = "architecture"
): Promise<string> {
  // Check cache first
  const cacheKey = getDiagramCacheKey(owner, repo, diagramType);
  const cached = getCachedDiagram(cacheKey);
  if (cached) {
    console.log(`[Cache HIT] Returning cached diagram for ${cacheKey}`);
    return cached;
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    // Return a simple fallback diagram
    const fallback = getDefaultDiagram(owner, repo, diagramType);
    setCachedDiagram(cacheKey, fallback);
    return fallback;
  }

  const prompts = {
    architecture: `Create a Mermaid flowchart for this repository's architecture.

Repository: ${owner}/${repo}

File Structure:
${fileStructure}

Code:
${codeContext}

CRITICAL RULES - MUST FOLLOW:
1. NO HTML tags like <br/> - causes syntax errors
2. NO emojis - causes rendering failures
3. Use ONLY plain ASCII text
4. Keep labels SHORT (2-4 words)
5. Use ["Label"] format for nodes

Requirements:
- 20-30 nodes minimum
- Show: Input, Router, Auth, Logic, Services, Database, Output
- Use flowchart TD

Return ONLY valid Mermaid code starting with: flowchart TD`,

    flowchart: `Create a Mermaid flowchart for this repository's execution flow.

Repository: ${owner}/${repo}

Code:
${fileStructure}
${codeContext}

CRITICAL RULES - MUST FOLLOW:
1. NO HTML tags like <br/> - causes syntax errors
2. NO emojis - causes rendering failures
3. Use ONLY plain ASCII text
4. Keep labels SHORT (2-4 words)
5. Use ["Label"] format for nodes

Requirements:
- 25-35 nodes minimum
- Show decision points with {Decision?}
- Include error handling
- Use flowchart TD

Return ONLY valid Mermaid code starting with: flowchart TD`,

    dependency: `Create a Mermaid dependency diagram for this repository.

Repository: ${owner}/${repo}

Structure:
${fileStructure}

Code:
${codeContext}

CRITICAL RULES - MUST FOLLOW:
1. NO HTML tags like <br/> - causes syntax errors
2. NO emojis - causes rendering failures
3. Use ONLY plain ASCII text
4. Keep labels SHORT (2-4 words)
5. Use ["Label"] format for nodes

Requirements:
- 20-30 nodes minimum
- Show all module dependencies
- Use flowchart LR

Return ONLY valid Mermaid code starting with: flowchart LR`,
  };

  const selectedPrompt = prompts[diagramType as keyof typeof prompts] || prompts.architecture;

  try {
    // Use key manager with fallback
    const diagramCode = await GeminiKeyManager.callWithFallback(async (apiKey) => {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(
          apiKey
        )}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: selectedPrompt }] }],
          }),
        }
      );

      if (!response.ok) {
        // Handle rate limiting
        if (response.status === 429) {
          console.warn(`[Rate Limited] Gemini API returned 429. Trying next key...`);
          throw new Error("Rate limit exceeded");
        }
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const json = (await response.json()) as any;
      let code =
        json?.candidates?.[0]?.content?.parts?.[0]?.text ??
        "graph TD\n  A[No diagram generated]";

      // Clean up the response - remove markdown code blocks if present
      code = code
        .replace(/```mermaid\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();

      // CRITICAL: Sanitize for Mermaid v10.9.5 compatibility
      // Remove HTML tags like <br/> which cause syntax errors
      code = code
        .replace(/<br\s*\/?>/gi, " ")
        .replace(/<[^>]+>/g, " ")
        // Remove emojis that can cause encoding issues
        .replace(/[\u{1F300}-\u{1F9FF}]/gu, "")
        .replace(/[\u{2600}-\u{26FF}]/gu, "")
        .replace(/[\u{2700}-\u{27BF}]/gu, "")
        // Clean up multiple spaces
        .replace(/\s+/g, " ")
        // Fix any broken node labels from sanitization
        .replace(/\[\s+/g, "[")
        .replace(/\s+\]/g, "]")
        .replace(/\{\s+/g, "{")
        .replace(/\s+\}/g, "}")
        .replace(/\(\s+/g, "(")
        .replace(/\s+\)/g, ")")
        .trim();

      // Validate it's a proper Mermaid diagram
      if (!code.match(/^(graph|flowchart|classDiagram|sequenceDiagram)/)) {
        throw new Error("Invalid Mermaid diagram format");
      }

      return code;
    });

    // Cache successful result
    setCachedDiagram(cacheKey, diagramCode);
    return diagramCode;
  } catch (error) {
    console.error("Error generating diagram with Gemini:", error);
    const fallback = getDefaultDiagram(owner, repo, diagramType);
    setCachedDiagram(cacheKey, fallback);
    return fallback;
  }
}

function getDefaultDiagram(owner: string, repo: string, type: string): string {
  // Mermaid v10.9.5 compatible diagrams - NO HTML tags like <br/> in labels
  const diagrams: Record<string, Record<string, string>> = {
    architecture: {
      default: `flowchart TD
  User["User/Client"]
  Request["HTTP Request"]
  Gateway["API Gateway"]
  Router["Route Handler"]
  Middleware["Middleware Stack"]
  Auth["Authentication"]
  Validation["Input Validation"]
  Business["Business Logic"]
  Services["Service Layer"]
  DataAccess["Data Access"]
  Cache["Cache Layer"]
  Database[("Database")]
  ErrorHandler["Error Handler"]
  ResponseFormatter["Response Formatter"]
  Response["HTTP Response"]
  Logging["Logging"]
  Output["Client Response"]
  
  User --> Request
  Request --> Gateway
  Gateway --> Router
  Router --> Middleware
  Middleware --> Auth
  Auth --> Validation
  Validation --> Business
  Business --> Services
  Services --> DataAccess
  DataAccess --> Cache
  Cache --> Database
  DataAccess --> Logging
  Business --> ErrorHandler
  ErrorHandler --> ResponseFormatter
  Services --> ResponseFormatter
  ResponseFormatter --> Response
  Response --> Output
  
  style User fill:#e8f5e9
  style Gateway fill:#bbdefb
  style Auth fill:#f8bbd0
  style Business fill:#fff9c4
  style Database fill:#ffccbc
  style ErrorHandler fill:#ffcdd2
  style Output fill:#e8f5e9`,

      nextjs: `flowchart TD
  Browser["Browser"]
  Request["Request"]
  Middleware["Middleware"]
  Router["App Router"]
  Auth["Authentication"]
  Page["Page Component"]
  DataFetch["Data Fetching"]
  APIRoute["API Route"]
  Service["Service"]
  Database[("Database")]
  Cache["Cache/ISR"]
  Render["Server Rendering"]
  Stream["Stream Response"]
  ClientCode["Client JS"]
  Hydration["Hydration"]
  Interactive["Interactive UI"]
  ErrorBoundary["Error Boundary"]
  
  Browser --> Request
  Request --> Middleware
  Middleware --> Router
  Router --> Auth
  Auth --> Page
  Page --> DataFetch
  DataFetch --> APIRoute
  APIRoute --> Service
  Service --> Database
  Database --> Cache
  Cache --> Render
  Render --> Stream
  Stream --> Browser
  Browser --> ClientCode
  ClientCode --> Hydration
  Hydration --> Interactive
  Interactive --> ErrorBoundary
  
  style Browser fill:#e8f5e9
  style Page fill:#fff9c4
  style Database fill:#ffccbc
  style Cache fill:#ffe0b2
  style Interactive fill:#e8f5e9`,

      default_fallback: `flowchart TD
  A["Client Request"]
  B["Network Layer"]
  C["Gateway"]
  D["Authentication"]
  E["Validation"]
  F["Business Logic"]
  G["Service Layer"]
  H["Data Access"]
  I["Cache Layer"]
  J[("Database")]
  K["External APIs"]
  L["Logging"]
  M["Error Handler"]
  N["Response Formatter"]
  O["HTTP Response"]
  
  A --> B
  B --> C
  C --> D
  D --> E
  E --> F
  F --> G
  G --> H
  H --> I
  I --> J
  G --> K
  D --> L
  F --> L
  E --> M
  M --> N
  N --> O
  
  style A fill:#c8e6c9
  style O fill:#c8e6c9
  style D fill:#f8bbd0
  style F fill:#fff9c4
  style J fill:#ffccbc
  style I fill:#ffe0b2
  style M fill:#ffcdd2`,
    },
    
    flowchart: {
      default: `flowchart TD
  Start(["Start"]) --> Init["Initialize"]
  Init --> LoadDB["Load Database"]
  LoadDB --> LoadCache["Load Cache"]
  LoadCache --> LoadServices["Load Services"]
  LoadServices --> StartServer["Start Server"]
  StartServer --> Listen["Listen"]
  
  Listen --> Receive["Receive Request"]
  Receive --> Parse["Parse Data"]
  Parse --> Validate{Valid?}
  Validate -->|No| Err1["Error"]
  Validate -->|Yes| Auth["Authenticate"]
  Auth --> AuthOK{OK?}
  AuthOK -->|No| Err2["Auth Error"]
  AuthOK -->|Yes| Authorize["Authorize"]
  Authorize --> AuthzOK{OK?}
  AuthzOK -->|No| Err3["Forbidden"]
  AuthzOK -->|Yes| Logic["Business Logic"]
  Logic --> Query["Query Data"]
  Query --> Cache["Check Cache"]
  Cache --> CacheHit{Hit?}
  CacheHit -->|Yes| Transform["Transform"]
  CacheHit -->|No| FetchDB["Fetch DB"]
  FetchDB --> Transform
  Transform --> Format["Format Response"]
  Format --> Return["Return"]
  
  Err1 --> Return
  Err2 --> Return
  Err3 --> Return
  Return --> Listen
  
  style Start fill:#c8e6c9
  style Listen fill:#fff9c4
  style Err1 fill:#ffcdd2
  style Err2 fill:#ffcdd2
  style Err3 fill:#ffcdd2
  style Return fill:#c8e6c9`,

      default_fallback: `flowchart TD
  Start(["Start"]) --> Init["Initialize"]
  Init --> Load["Load Config"]
  Load --> Connect["Connect DB"]
  Connect --> Listen["Listen"]
  
  Listen --> Receive["Receive"]
  Receive --> Parse["Parse"]
  Parse --> Valid{Valid?}
  Valid -->|No| Err["Error"]
  Valid -->|Yes| Auth["Auth"]
  Auth --> AuthOK{OK?}
  AuthOK -->|No| Err
  AuthOK -->|Yes| Logic["Logic"]
  Logic --> Query["Query"]
  Query --> Transform["Transform"]
  Transform --> Format["Format"]
  Format --> Return["Return"]
  
  Err --> Return
  Return --> Listen
  
  style Start fill:#c8e6c9
  style Logic fill:#fff9c4
  style Query fill:#ffccbc
  style Return fill:#c8e6c9`,
    },
    
    dependency: {
      default: `flowchart LR
  API["API Layer"]
  Router["Router"]
  Middleware["Middleware"]
  Auth["Auth"]
  Controller["Controllers"]
  Service["Services"]
  Validator["Validator"]
  Logger["Logger"]
  Cache["Cache"]
  DataAccess["Data Access"]
  Models["Models"]
  Database[("Database")]
  Queue["Queue"]
  Email["Email"]
  External["External APIs"]
  Config["Config"]
  Utils["Utils"]
  
  API --> Middleware
  Middleware --> Auth
  Middleware --> Router
  Router --> Controller
  Controller --> Service
  Service --> Validator
  Service --> Logger
  Service --> Cache
  Service --> DataAccess
  DataAccess --> Models
  Models --> Database
  Service --> Queue
  Queue --> Email
  Service --> External
  Config -.-> API
  Config -.-> Service
  Utils -.-> Service
  
  style API fill:#bbdefb
  style Service fill:#fff9c4
  style Database fill:#ffccbc
  style Auth fill:#f8bbd0
  style Cache fill:#ffe0b2`,

      default_fallback: `flowchart LR
  API["API"]
  Router["Router"]
  Middleware["Middleware"]
  Auth["Auth"]
  Controller["Controllers"]
  Service["Services"]
  Validator["Validator"]
  Logger["Logger"]
  Cache["Cache"]
  DataAccess["Data Access"]
  Models["Models"]
  Database[("Database")]
  External["External"]
  Config["Config"]
  Utils["Utils"]
  
  API --> Middleware
  Middleware --> Auth
  Middleware --> Router
  Router --> Controller
  Controller --> Service
  Service --> Validator
  Service --> Logger
  Service --> Cache
  Service --> DataAccess
  DataAccess --> Models
  Models --> Database
  Service --> External
  Config -.-> Service
  Utils -.-> Service
  
  style API fill:#bbdefb
  style Service fill:#fff9c4
  style Database fill:#ffccbc
  style Auth fill:#f8bbd0`,
    },
  };

  const typeDiagrams = diagrams[type as keyof typeof diagrams] || diagrams.architecture;
  return typeDiagrams.default || typeDiagrams.default_fallback;
}

export { generateDiagramWithGemini, getDefaultDiagram };
export type { DiagramRequest };
