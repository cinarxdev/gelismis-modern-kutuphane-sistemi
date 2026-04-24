export function leanOne<T extends Record<string, unknown>>(doc: unknown): T | null {
  if (doc == null || Array.isArray(doc)) return null;
  return doc as T;
}
