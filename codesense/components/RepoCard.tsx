"use client"

import { useRouter } from "next/navigation"
import { Star, GitFork, ExternalLink } from "lucide-react"
import { cn } from "@/lib/utils"

interface RepoCardProps {
  owner: string
  name: string
  description: string
  stars?: number
  forks?: number
  language?: string
  languageColor?: string
  className?: string
}

export function RepoCard({
  owner,
  name,
  description,
  stars,
  forks,
  language,
  languageColor = "#3178c6",
  className,
}: RepoCardProps) {
  const router = useRouter()

  const handleClick = () => {
    router.push(`/repo/${owner}/${name}`)
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        "group relative flex flex-col items-start text-left w-full p-6 rounded-xl border border-border bg-card transition-all duration-300 hover:border-muted-foreground/50 hover:bg-accent/30 hover:-translate-y-1 hover:shadow-lg hover:shadow-black/20 cursor-pointer",
        className
      )}
    >
      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
        <ExternalLink className="w-4 h-4 text-muted-foreground" />
      </div>

      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-sm font-medium text-foreground">
          {owner[0].toUpperCase()}
        </div>
        <div className="flex flex-col">
          <span className="text-xs text-muted-foreground">{owner}</span>
          <span className="text-base font-semibold text-foreground group-hover:text-primary transition-colors">
            {name}
          </span>
        </div>
      </div>

      <p className="text-sm text-muted-foreground line-clamp-2 mb-4 text-balance">
        {description}
      </p>

      <div className="flex items-center gap-4 mt-auto text-xs text-muted-foreground">
        {language && (
          <div className="flex items-center gap-1.5">
            <span
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: languageColor }}
            />
            <span>{language}</span>
          </div>
        )}
        {stars !== undefined && (
          <div className="flex items-center gap-1">
            <Star className="w-3.5 h-3.5" />
            <span>{formatNumber(stars)}</span>
          </div>
        )}
        {forks !== undefined && (
          <div className="flex items-center gap-1">
            <GitFork className="w-3.5 h-3.5" />
            <span>{formatNumber(forks)}</span>
          </div>
        )}
      </div>
    </button>
  )
}

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}k`
  }
  return num.toString()
}
