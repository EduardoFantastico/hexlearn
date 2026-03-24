import LZString from "lz-string";

const BASE_URL = "https://hexlearn.app";

/**
 * Encodes a catalog object into a share URL.
 * The catalog data is LZ-compressed and embedded directly in the URL —
 * no server required.
 */
export function encodeCatalogToUrl(catalog) {
  const json = JSON.stringify(catalog);
  const compressed = LZString.compressToEncodedURIComponent(json);
  return `${BASE_URL}/?data=${compressed}`;
}

/**
 * Extracts and decodes a catalog from a share URL.
 * Returns the catalog object or null if the URL is invalid.
 */
export function decodeCatalogFromUrl(url) {
  try {
    const parsed = new URL(url);
    const data = parsed.searchParams.get("data");
    if (!data) return null;
    const json = LZString.decompressFromEncodedURIComponent(data);
    if (!json) return null;
    return JSON.parse(json);
  } catch {
    return null;
  }
}
