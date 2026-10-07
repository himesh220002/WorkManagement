import { updateTag, revalidateTag, revalidatePath } from "next/cache";

export const CACHE_TAGS = {
  company: (companyId: string) => `company:${companyId}`,
  companies: () => "companies",
  project: (projectId: string) => `project:${projectId}`,
  projects: (companyId?: string) => (companyId ? `projects:${companyId}` : "projects"),
  team: (teamId: string) => `team:${teamId}`,
  teams: (projectId?: string) => (projectId ? `teams:${projectId}` : "teams"),
  task: (taskId: string) => `task:${taskId}`,
  tasks: (projectId?: string) => (projectId ? `tasks:${projectId}` : "tasks"),
  goal: (goalId: string) => `goal:${goalId}`,
  goals: (scopeId?: string) => (scopeId ? `goals:${scopeId}` : "goals"),
  pipeline: (pipelineId: string) => `pipeline:${pipelineId}`,
  pipelines: (projectId?: string) => (projectId ? `pipelines:${projectId}` : "pipelines"),
  deal: (dealId: string) => `deal:${dealId}`,
  deals: () => "deals",
  leads: () => "leads",
  resources: (projectId?: string) => (projectId ? `resources:${projectId}` : "resources"),
  metrics: (scopeId?: string) => (scopeId ? `metrics:${scopeId}` : "metrics"),
};

// Global in-memory high-performance TTL cache for fast page rendering and session lookups
declare global {
  // eslint-disable-next-line no-var
  var __appMemoryCache: Map<string, { data: any; expiresAt: number }> | undefined;
}

const memoryCache = global.__appMemoryCache || new Map<string, { data: any; expiresAt: number }>();
if (process.env.NODE_ENV !== "production") {
  global.__appMemoryCache = memoryCache;
}

/**
 * Retrieves a cached item if present and not expired
 */
export function getCached<T>(key: string): T | null {
  const entry = memoryCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    memoryCache.delete(key);
    return null;
  }
  return entry.data as T;
}

/**
 * Sets an item in the high-speed in-memory cache with a TTL (seconds)
 */
export function setCached<T>(key: string, data: T, ttlSeconds = 30): void {
  // Evict oldest entries if cache exceeds 3,000 keys to prevent memory leaks
  if (memoryCache.size > 3000) {
    const oldestKey = memoryCache.keys().next().value;
    if (oldestKey) memoryCache.delete(oldestKey);
  }
  memoryCache.set(key, {
    data,
    expiresAt: Date.now() + ttlSeconds * 1000,
  });
}

/**
 * Removes a specific key from the cache
 */
export function deleteCached(key: string): void {
  memoryCache.delete(key);
}

/**
 * Purges all keys starting with a given prefix (e.g. 'session:', 'documents:', 'projects:')
 */
export function invalidateCachePrefix(prefix: string): void {
  for (const key of memoryCache.keys()) {
    if (key.startsWith(prefix)) {
      memoryCache.delete(key);
    }
  }
}

/**
 * Invalidates all entity and query caches (preserving user authentication session)
 */
export function invalidateAllAppCaches(): void {
  for (const key of memoryCache.keys()) {
    if (!key.startsWith("session:")) {
      memoryCache.delete(key);
    }
  }
}

/**
 * Invalidate entity cache by Next.js cache tag and purge memory cache
 */
export function invalidateEntity(tag: string): void {
  invalidateAllAppCaches();
  try {
    (revalidateTag as any)(tag);
  } catch {}
}

/**
 * Transparent fetch-through wrapper: returns cached item or runs fetcher and caches result
 */
export async function fetchWithCache<T>(
  key: string,
  ttlSeconds: number,
  fetcher: () => Promise<T>
): Promise<T> {
  const cached = getCached<T>(key);
  if (cached !== null && cached !== undefined) {
    return cached;
  }
  const fresh = await fetcher();
  setCached(key, fresh, ttlSeconds);
  return fresh;
}
