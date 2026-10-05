/**
 * Converts a lean Mongoose document (or array of documents) into plain JSON-serializable DTOs
 * by converting ObjectId instances to strings and dates to ISO strings.
 */
export function serializeDoc<T = Record<string, unknown>>(doc: unknown): T {
  if (!doc) return doc as T;
  return JSON.parse(JSON.stringify(doc)) as T;
}

export function serializeDocs<T = Record<string, unknown>>(docs: unknown[]): T[] {
  if (!Array.isArray(docs)) return [];
  return docs.map((d) => serializeDoc<T>(d));
}
