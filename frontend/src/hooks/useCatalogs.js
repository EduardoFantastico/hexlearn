import { useCallback } from "react";
import { useLocalStorage } from "./useLocalStorage";

const STORAGE_KEY = "hexlearn_catalogs";

/**
 * useCatalogs
 *
 * Persists the list of uploaded question catalogs in localStorage so they
 * survive page reloads.
 *
 * Each catalog entry shape:
 *   {
 *     id:        string   — unique ID (timestamp-based)
 *     name:      string   — display name (filename without .json)
 *     questions: Question[]
 *     addedAt:   number   — Date.now() on first import
 *     lastUsed:  number | null
 *   }
 */
export function useCatalogs() {
  const [catalogs, setCatalogs] = useLocalStorage(STORAGE_KEY, []);

  /** Add or replace a catalog by name. Returns the final catalog object. */
  const addCatalog = useCallback(
    ({ name, questions }) => {
      let result;
      setCatalogs((prev) => {
        const existing = prev.find((c) => c.name === name);
        if (existing) {
          result = { ...existing, questions };
          return prev.map((c) => (c.name === name ? result : c));
        }
        result = {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          name,
          questions,
          addedAt: Date.now(),
          lastUsed: null,
        };
        return [...prev, result];
      });
      return result;
    },
    [setCatalogs],
  );

  /** Mark a catalog (or multiple) as recently used. */
  const markUsed = useCallback(
    (ids) => {
      const idSet = new Set(Array.isArray(ids) ? ids : [ids]);
      setCatalogs((prev) =>
        prev.map((c) => (idSet.has(c.id) ? { ...c, lastUsed: Date.now() } : c)),
      );
    },
    [setCatalogs],
  );

  /** Remove a catalog by id. */
  const removeCatalog = useCallback(
    (id) => {
      setCatalogs((prev) => prev.filter((c) => c.id !== id));
    },
    [setCatalogs],
  );

  /** Clear all catalogs. */
  const clearCatalogs = useCallback(() => {
    setCatalogs([]);
  }, [setCatalogs]);

  /** Catalog sorted: most-recently-used first, then by addedAt desc. */
  const sorted = [...catalogs].sort((a, b) => {
    const aTime = a.lastUsed ?? a.addedAt;
    const bTime = b.lastUsed ?? b.addedAt;
    return bTime - aTime;
  });

  return {
    catalogs: sorted,
    addCatalog,
    markUsed,
    removeCatalog,
    clearCatalogs,
  };
}
