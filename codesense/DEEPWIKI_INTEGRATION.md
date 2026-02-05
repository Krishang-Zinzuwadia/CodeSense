# CodeSense - DeepWiki MCP Integration

## Architecture Overview

CodeSense is a unified application that analyzes GitHub repositories using AI-powered DeepWiki analysis. The system is divided into three main components:

### 1. **Frontend Pages**
- **Home Page** (`/app/page.tsx`): Landing page with featured repositories and search interface
- **Core Page** (`/app/core/page.tsx`): Server-side analysis interface for testing DeepWiki
- **Repository Analysis Page** (`/app/repo/[...slug]/page.tsx`): Client-side detailed analysis with tabs for overview, structure, and Q&A

### 2. **API Routes** (`/app/api/deepwiki/`)
All routes share the unified `analyzeRepositoryWithDeepWiki` logic:
- **`/analyze`**: Accepts `owner/name` or `repoUrl` and returns streamed analysis
- **`/structure`**: Returns repository wiki structure (placeholder)
- **`/ask`**: Accepts questions about the repository and provides context-aware answers

### 3. **Core Intelligence** (`/app/core/`)
- **`mcp/deepwikiClient.ts`**: Central analysis logic with two modes:
  - **Gemini Live Mode**: Uses Google Gemini API when `GEMINI_API_KEY` is set
  - **Stub Mode**: Falls back to safe defaults when API is unavailable
- **`deepwiki-mcp-server/server.ts`**: Standalone MCP server for external integration

## How It Works

### Analysis Flow

1. **User submits GitHub URL** on any page (home, /core, or /repo)
2. **API route receives request** with owner/name or direct repoUrl
3. **API route calls shared `analyzeRepositoryWithDeepWiki()`**
4. **Analysis logic:**
   - If `GEMINI_API_KEY` is set: Call Gemini API with repository context
   - If API fails or key missing: Return safe stub response
5. **Response is streamed** back to client for better UX

### Key Files Summary

| File | Purpose |
|------|---------|
| `/app/page.tsx` | Home/landing page with concise copy and featured repos |
| `/app/core/page.tsx` | Server-side test page for DeepWiki (reads from API) |
| `/app/repo/[...slug]/page.tsx` | Client-side analysis with interactive tabs |
| `/app/core/mcp/deepwikiClient.ts` | Unified analysis logic (Gemini + Stub) |
| `/app/api/deepwiki/analyze/route.ts` | Main analysis API endpoint |
| `/app/api/deepwiki/structure/route.ts` | Repository structure endpoint |
| `/app/api/deepwiki/ask/route.ts` | Q&A endpoint |
| `/app/core/deepwiki-mcp-server/server.ts` | Standalone MCP server |

## Setup & Running

### Prerequisites
```bash
# Set environment variables
export GEMINI_API_KEY="your-gemini-api-key"
```

### Development
```bash
# Install dependencies
npm install

# Run Next.js dev server
npm run dev
```

### Building Standalone MCP Server
```bash
cd app/core/deepwiki-mcp-server

# Install dependencies
npm install

# Build
npm run build

# Start
npm start
```

## API Integration

Both pages use the same unified API endpoints:

### Analyze Repository
```bash
# From /core page format
POST /api/deepwiki/analyze
{ "repoUrl": "https://github.com/owner/repo" }

# From /repo page format
POST /api/deepwiki/analyze
{ "owner": "owner", "name": "repo" }
```

### Get Repository Structure
```bash
POST /api/deepwiki/structure
{ "owner": "owner", "name": "repo" }
```

### Ask Question
```bash
POST /api/deepwiki/ask
{ "owner": "owner", "name": "repo", "question": "What are the main contributions?" }
```

## Configuration

### Environment Variables
- `GEMINI_API_KEY`: Google Gemini API key (optional, enables live analysis)

### Modes
- **Production**: Uses Gemini API when key is available
- **Development**: Falls back to stub if API fails
- **Stub Mode**: Always available as fallback for reliability

## Recent Changes (Unified Release)

✅ Consolidated duplicate analysis logic from /core and /repo pages
✅ Merged API endpoints to share unified deepwikiClient
✅ Shortened and simplified copy on /core page
✅ Updated home page with concise messaging
✅ Ensured full API compatibility between both interfaces
✅ Standalone MCP server ready for external integration

## Next Steps

- [ ] Deploy standalone MCP server for production use
- [ ] Add real wiki structure parsing
- [ ] Enhance Q&A with context awareness
- [ ] Add caching for repeated queries
- [ ] Implement rate limiting
