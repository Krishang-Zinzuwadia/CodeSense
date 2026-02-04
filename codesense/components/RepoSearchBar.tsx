"use client"

import React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Search } from "lucide-react"
import { cn } from "@/lib/utils"

interface RepoSearchBarProps {
  className?: string
  size?: "default" | "large"
}

export function RepoSearchBar({ className, size = "default" }: RepoSearchBarProps) {
  const [url, setUrl] = useState("")
  const [isFocused, setIsFocused] = useState(false)
  const router = useRouter()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const repoPath = extractRepoPath(url)
    if (repoPath) {
      router.push(`/repo/${repoPath}`)
    }
  }

  const extractRepoPath = (input: string): string | null => {
    // Handle full GitHub URLs
    const githubUrlMatch = input.match(/github\.com\/([^\/]+\/[^\/]+)/i)
    if (githubUrlMatch) {
      return githubUrlMatch[1].replace(/\.git$/, "")
    }
    // Handle owner/repo format
    const repoMatch = input.match(/^([^\/\s]+\/[^\/\s]+)$/)
    if (repoMatch) {
      return repoMatch[1]
    }
    return null
  }

  const isValidInput = extractRepoPath(url) !== null

  return (
    <form onSubmit={handleSubmit} className={cn("w-full", className)}>
      <div
        className={cn(
          "relative flex items-center w-full rounded-xl border bg-input transition-all duration-200",
          isFocused ? "border-muted-foreground ring-1 ring-muted-foreground/20" : "border-border",
          size === "large" ? "h-16 text-lg" : "h-12 text-base"
        )}
      >
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="Enter GitHub repository URL or owner/repo..."
          className={cn(
            "flex-1 bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground",
            size === "large" ? "px-6 text-lg" : "px-4 text-base"
          )}
        />
        <button
          type="submit"
          disabled={!isValidInput}
          className={cn(
            "flex items-center justify-center rounded-lg transition-all duration-200",
            size === "large" ? "w-12 h-12 mr-2" : "w-10 h-10 mr-1",
            isValidInput
              ? "bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer"
              : "bg-muted text-muted-foreground cursor-not-allowed"
          )}
        >
          <Search className={size === "large" ? "w-5 h-5" : "w-4 h-4"} />
        </button>
      </div>
    </form>
  )
}
