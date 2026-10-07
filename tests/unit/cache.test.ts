import { describe, it, expect, beforeEach } from "vitest";
import {
  getCached,
  setCached,
  deleteCached,
  invalidateCachePrefix,
  invalidateAllAppCaches,
  fetchWithCache,
} from "@/lib/cache";

describe("In-Memory TTL Server Cache Engine", () => {
  beforeEach(() => {
    invalidateAllAppCaches();
  });

  it("stores and retrieves a cached value before expiration", () => {
    setCached("test_key", { value: 42 }, 10);
    const cached = getCached<{ value: number }>("test_key");
    expect(cached).toEqual({ value: 42 });
  });

  it("returns null for non-existent keys", () => {
    expect(getCached("missing_key")).toBeNull();
  });

  it("deletes a cached key properly", () => {
    setCached("delete_me", "hello", 10);
    deleteCached("delete_me");
    expect(getCached("delete_me")).toBeNull();
  });

  it("invalidates all keys starting with a prefix", () => {
    setCached("tenant_projects:1", ["proj1"], 10);
    setCached("tenant_projects:2", ["proj2"], 10);
    setCached("tenant_users:1", ["user1"], 10);

    invalidateCachePrefix("tenant_projects:");

    expect(getCached("tenant_projects:1")).toBeNull();
    expect(getCached("tenant_projects:2")).toBeNull();
    expect(getCached("tenant_users:1")).toEqual(["user1"]);
  });

  it("invalidates all app caches except session keys", () => {
    setCached("session:user_123", { name: "Alice" }, 30);
    setCached("projects_data:corp1", { name: "Project X" }, 30);
    setCached("teams_list:corp1", { count: 5 }, 30);

    invalidateAllAppCaches();

    expect(getCached("projects_data:corp1")).toBeNull();
    expect(getCached("teams_list:corp1")).toBeNull();
    expect(getCached("session:user_123")).toEqual({ name: "Alice" });
  });

  it("fetches through cache transparently", async () => {
    let callCount = 0;
    const fetcher = async () => {
      callCount++;
      return { answer: 100 * callCount };
    };

    const first = await fetchWithCache("fetch_key", 5, fetcher);
    expect(first).toEqual({ answer: 100 });
    expect(callCount).toBe(1);

    // Second call should return cached value without executing fetcher
    const second = await fetchWithCache("fetch_key", 5, fetcher);
    expect(second).toEqual({ answer: 100 });
    expect(callCount).toBe(1);
  });
});
