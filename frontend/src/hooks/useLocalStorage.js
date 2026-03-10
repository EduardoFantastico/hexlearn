import { useState, useEffect } from "react";

/**
 * useLocalStorage
 * A generic hook that syncs a state value with localStorage.
 * Falls back to `initialValue` when the key is not set or the stored JSON is invalid.
 *
 * @param {string} key           localStorage key
 * @param {*}      initialValue  default value (plain JS, not a function)
 * @returns [value, setValue]    same API as useState
 */
export function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item !== null ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(storedValue));
    } catch {
      // Quota exceeded or private-mode restrictions — fail silently
    }
  }, [key, storedValue]);

  return [storedValue, setStoredValue];
}
