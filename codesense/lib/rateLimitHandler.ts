/**
 * Rate Limit Handler
 * Manages API rate limits and implements caching/backoff strategies
 */

interface RateLimitInfo {
  remaining: number;
  limit: number;
  resetTime: number;
}

// Simple in-memory cache for diagrams
const diagramCache = new Map<string, string>();

export function getCachedDiagram(key: string): string | null {
  return diagramCache.get(key) || null;
}

export function setCachedDiagram(key: string, diagram: string): void {
  diagramCache.set(key, diagram);
}

export function clearDiagramCache(): void {
  diagramCache.clear();
}

/**
 * Parse rate limit info from response headers
 */
export function parseRateLimitHeaders(headers: Headers): RateLimitInfo {
  return {
    remaining: parseInt(headers.get("x-ratelimit-remaining") || "0", 10),
    limit: parseInt(headers.get("x-ratelimit-limit") || "0", 10),
    resetTime: parseInt(headers.get("x-ratelimit-reset") || "0", 10) * 1000,
  };
}

/**
 * Check if rate limit is exceeded
 */
export function isRateLimited(info: RateLimitInfo): boolean {
  return info.remaining === 0 || (info.resetTime && Date.now() < info.resetTime);
}

/**
 * Get time to wait before retry
 */
export function getRetryAfter(headers: Headers): number {
  const retryAfter = headers.get("retry-after");
  if (retryAfter) {
    // Could be seconds or HTTP-date
    const seconds = parseInt(retryAfter, 10);
    return isNaN(seconds) ? 60000 : seconds * 1000;
  }
  return 60000; // Default 1 minute
}

/**
 * Format cache key for a diagram request
 */
export function getDiagramCacheKey(
  owner: string,
  repo: string,
  diagramType: string
): string {
  return `${owner}/${repo}/${diagramType}`;
}

/**
 * Format cache key for analysis request
 */
export function getAnalysisCacheKey(repoUrl: string): string {
  return `analysis:${repoUrl}`;
}
