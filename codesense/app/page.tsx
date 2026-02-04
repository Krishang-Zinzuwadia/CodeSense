import { RepoSearchBar } from "@/components/RepoSearchBar"
import { RepoCard } from "@/components/RepoCard"
import { BookOpen, Zap, Code2 } from "lucide-react"

const FEATURED_REPOS = [
  {
    owner: "vercel",
    name: "next.js",
    description: "The React Framework for the Web. Build full-stack applications with automatic optimization.",
    stars: 128000,
    forks: 26500,
    language: "TypeScript",
    languageColor: "#3178c6",
  },
  {
    owner: "facebook",
    name: "react",
    description: "A declarative, efficient, and flexible JavaScript library for building user interfaces.",
    stars: 232000,
    forks: 47500,
    language: "JavaScript",
    languageColor: "#f7df1e",
  },
  {
    owner: "microsoft",
    name: "vscode",
    description: "Visual Studio Code - Code editing redefined. Free and built on open source.",
    stars: 168000,
    forks: 30200,
    language: "TypeScript",
    languageColor: "#3178c6",
  },
  {
    owner: "tailwindlabs",
    name: "tailwindcss",
    description: "A utility-first CSS framework for rapid UI development with modern design patterns.",
    stars: 85000,
    forks: 4300,
    language: "TypeScript",
    languageColor: "#3178c6",
  },
  {
    owner: "openai",
    name: "openai-cookbook",
    description: "Examples and guides for using the OpenAI API effectively in your applications.",
    stars: 62000,
    forks: 10200,
    language: "Jupyter Notebook",
    languageColor: "#f37626",
  },
  {
    owner: "langchain-ai",
    name: "langchain",
    description: "Building applications with LLMs through composability. Chains, agents, and memory.",
    stars: 98000,
    forks: 15800,
    language: "Python",
    languageColor: "#3572A5",
  },
]

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-lg text-foreground">CodeSense</span>
          </div>
          <nav className="flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#" className="hover:text-foreground transition-colors">Docs</a>
            <a href="#" className="hover:text-foreground transition-colors">API</a>
            <a 
              href="https://github.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors"
            >
              GitHub
            </a>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-24 md:py-32 relative overflow-hidden">
        {/* Subtle grid background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,var(--background)_70%)]" />
        
        <div className="container mx-auto px-4 relative">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 text-balance">
              Make your first open source contribution
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-12 text-pretty max-w-2xl mx-auto">
              Paste a repository URL and get AI powered analysis, feedback, and potential pull requests to be made.
            </p>
            
            <RepoSearchBar size="large" className="max-w-2xl mx-auto mb-8" />
            
            <p className="text-sm text-muted-foreground">
              Try or paste any <code className="px-2 py-1 bg-secondary rounded text-foreground">github</code> URL
            </p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 border-t border-border">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center mb-4">
                <BookOpen className="w-6 h-6 text-foreground" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Auto Documentation</h3>
              <p className="text-sm text-muted-foreground">
                AI-generated documentation that explains the architecture and key concepts.
              </p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-foreground" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Instant PR Suggestion</h3>
              <p className="text-sm text-muted-foreground">
                Get comprehensive insights about any issues or potential improvements to be made
              </p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center mb-4">
                <Code2 className="w-6 h-6 text-foreground" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Smart Q&A</h3>
              <p className="text-sm text-muted-foreground">
                Ask questions about the codebase and get context aware answers.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Repos */}
      <section className="py-16 border-t border-border">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
              Explore popular repositories
            </h2>
            <p className="text-muted-foreground">
              Start exploring with these popular open-source projects
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-6xl mx-auto">
            {FEATURED_REPOS.map((repo) => (
              <RepoCard key={`${repo.owner}/${repo.name}`} {...repo} />
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>Powered by DeepWiki MCP</p>
        </div>
      </footer>
    </main>
  )
}
