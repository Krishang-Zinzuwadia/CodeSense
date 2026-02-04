"use client"

import React from "react"

import { useParams } from "next/navigation"
import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { ArrowLeft, BookOpen, FolderTree, MessageSquare, Loader2, ExternalLink, RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { RepoSearchBar } from "@/components/RepoSearchBar"

interface WikiStructure {
  title: string
  pages: { id: string; title: string }[]
}

interface AnalysisState {
  status: "idle" | "loading" | "streaming" | "complete" | "error"
  structure: WikiStructure | null
  analysis: string
  error: string | null
}

export default function RepoPage() {
  const params = useParams()
  const slug = params.slug as string[]
  const owner = slug?.[0] || ""
  const name = slug?.[1] || ""
  const repoPath = `${owner}/${name}`

  const [state, setState] = useState<AnalysisState>({
    status: "idle",
    structure: null,
    analysis: "",
    error: null,
  })

  const [activeTab, setActiveTab] = useState<"overview" | "structure" | "ask">("overview")
  const [question, setQuestion] = useState("")
  const [isAskingQuestion, setIsAskingQuestion] = useState(false)
  const [questionAnswer, setQuestionAnswer] = useState("")

  const fetchAnalysis = useCallback(async () => {
    if (!owner || !name) return

    setState({ status: "loading", structure: null, analysis: "", error: null })

    try {
      // Fetch wiki structure first
      const structureRes = await fetch("/api/deepwiki/structure", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ owner, name }),
      })

      if (!structureRes.ok) {
        throw new Error("Failed to fetch repository structure")
      }

      const structureData = await structureRes.json()
      setState((prev) => ({ ...prev, structure: structureData }))

      // Stream the analysis
      setState((prev) => ({ ...prev, status: "streaming" }))
      
      const analysisRes = await fetch("/api/deepwiki/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ owner, name }),
      })

      if (!analysisRes.ok) {
        throw new Error("Failed to analyze repository")
      }

      const reader = analysisRes.body?.getReader()
      if (!reader) throw new Error("No response body")

      const decoder = new TextDecoder()
      let fullText = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        fullText += chunk
        setState((prev) => ({ ...prev, analysis: fullText }))
      }

      setState((prev) => ({ ...prev, status: "complete" }))
    } catch (error) {
      setState((prev) => ({
        ...prev,
        status: "error",
        error: error instanceof Error ? error.message : "An error occurred",
      }))
    }
  }, [owner, name])

  useEffect(() => {
    fetchAnalysis()
  }, [fetchAnalysis])

  const handleAskQuestion = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!question.trim() || isAskingQuestion) return

    setIsAskingQuestion(true)
    setQuestionAnswer("")

    try {
      const res = await fetch("/api/deepwiki/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ owner, name, question }),
      })

      if (!res.ok) throw new Error("Failed to get answer")

      const reader = res.body?.getReader()
      if (!reader) throw new Error("No response body")

      const decoder = new TextDecoder()
      let fullText = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        fullText += chunk
        setQuestionAnswer(fullText)
      }
    } catch (error) {
      setQuestionAnswer("Sorry, I couldn't answer that question. Please try again.")
    } finally {
      setIsAskingQuestion(false)
    }
  }

  if (!owner || !name) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Invalid repository path</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-foreground">CodeSense</span>
          </Link>
          
          <div className="flex-1 max-w-md mx-auto">
            <RepoSearchBar size="default" />
          </div>
          
          <a
            href={`https://github.com/${repoPath}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            View on GitHub
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </header>

      {/* Repo Info */}
      <div className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <span>{owner}</span>
                <span>/</span>
              </div>
              <h1 className="text-3xl font-bold text-foreground mb-2">{name}</h1>
              <p className="text-muted-foreground">
                AI-powered analysis and documentation
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchAnalysis}
              disabled={state.status === "loading" || state.status === "streaming"}
            >
              <RefreshCw className={cn("w-4 h-4 mr-2", (state.status === "loading" || state.status === "streaming") && "animate-spin")} />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <div className="container mx-auto px-4">
          <nav className="flex gap-1">
            {[
              { id: "overview", label: "Overview", icon: BookOpen },
              { id: "structure", label: "Structure", icon: FolderTree },
              { id: "ask", label: "Ask", icon: MessageSquare },
            ].map(({ id, label, icon: Icon }) => (
              <button
                type="button"
                key={id}
                onClick={() => setActiveTab(id as typeof activeTab)}
                className={cn(
                  "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors -mb-px",
                  activeTab === id
                    ? "text-foreground border-primary"
                    : "text-muted-foreground border-transparent hover:text-foreground hover:border-muted-foreground/50"
                )}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <main className="container mx-auto px-4 py-8">
        {state.status === "error" && (
          <div className="max-w-3xl mx-auto">
            <div className="rounded-xl border border-destructive/50 bg-destructive/10 p-6 text-center">
              <p className="text-destructive mb-4">{state.error}</p>
              <Button onClick={fetchAnalysis} variant="outline">
                Try Again
              </Button>
            </div>
          </div>
        )}

        {(state.status === "loading" || (state.status === "streaming" && !state.analysis)) && (
          <div className="max-w-3xl mx-auto">
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {state.status === "loading" ? "Fetching repository information..." : "Generating analysis..."}
              </p>
            </div>
          </div>
        )}

        {activeTab === "overview" && (state.status === "streaming" || state.status === "complete") && (
          <div className="max-w-3xl mx-auto">
            <div className="prose prose-invert max-w-none">
              <div className="rounded-xl border border-border bg-card p-6 md:p-8">
                <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  Repository Analysis
                </h2>
                <div className="text-foreground leading-relaxed whitespace-pre-wrap">
                  {state.analysis || "Analyzing..."}
                  {state.status === "streaming" && (
                    <span className="inline-block w-2 h-5 bg-primary ml-1 animate-pulse" />
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "structure" && state.structure && (
          <div className="max-w-3xl mx-auto">
            <div className="rounded-xl border border-border bg-card p-6 md:p-8">
              <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                <FolderTree className="w-5 h-5" />
                Documentation Structure
              </h2>
              <div className="space-y-2">
                {state.structure.pages.map((page) => (
                  <div
                    key={page.id}
                    className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors"
                  >
                    <BookOpen className="w-4 h-4 text-muted-foreground" />
                    <span className="text-foreground">{page.title}</span>
                  </div>
                ))}
                {state.structure.pages.length === 0 && (
                  <p className="text-muted-foreground text-center py-8">
                    No documentation structure available
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === "structure" && !state.structure && state.status !== "loading" && (
          <div className="max-w-3xl mx-auto">
            <div className="rounded-xl border border-border bg-card p-6 md:p-8 text-center">
              <FolderTree className="w-8 h-8 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Loading structure...</p>
            </div>
          </div>
        )}

        {activeTab === "ask" && (
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="rounded-xl border border-border bg-card p-6 md:p-8">
              <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Ask about this repository
              </h2>
              <form onSubmit={handleAskQuestion} className="space-y-4">
                <textarea
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Ask anything about this repository... (e.g., 'What authentication methods are supported?' or 'How does the routing work?')"
                  className="w-full h-32 p-4 rounded-lg border border-border bg-input text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-1 focus:ring-muted-foreground"
                />
                <Button type="submit" disabled={!question.trim() || isAskingQuestion}>
                  {isAskingQuestion ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Thinking...
                    </>
                  ) : (
                    "Ask Question"
                  )}
                </Button>
              </form>
            </div>

            {questionAnswer && (
              <div className="rounded-xl border border-border bg-card p-6 md:p-8">
                <h3 className="text-lg font-semibold text-foreground mb-4">Answer</h3>
                <div className="text-foreground leading-relaxed whitespace-pre-wrap">
                  {questionAnswer}
                  {isAskingQuestion && (
                    <span className="inline-block w-2 h-5 bg-primary ml-1 animate-pulse" />
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
