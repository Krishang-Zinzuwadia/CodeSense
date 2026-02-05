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
          className="flex items-center justify-center rounded-2xl transition-all duration-200 mr-2 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          style={
            isValidInput
              ? {
                  width: size === "large" ? '48px' : '40px',
                  height: size === "large" ? '48px' : '40px',
                  background: 'radial-gradient(circle 80px at 80% -10%, #ffffff, #181b1b)',
                  boxShadow: '0 0 20px #ffffff38',
                  padding: '2px',
                }
              : {
                  width: size === "large" ? '48px' : '40px',
                  height: size === "large" ? '48px' : '40px',
                  background: '#374151',
                }
          }
        >
          <div
            className="flex items-center justify-center w-full h-full rounded-[14px]"
            style={
              isValidInput
                ? {
                    background: 'radial-gradient(circle 80px at 80% -50%, #777777, #0f1111)',
                    color: '#fff',
                  }
                : {
                    background: 'transparent',
                    color: '#9ca3af',
                  }
            }
          >
            <Search className={size === "large" ? "w-5 h-5" : "w-4 h-4"} />
          </div>
        </button>
      </div>
    </form>
  )
}
