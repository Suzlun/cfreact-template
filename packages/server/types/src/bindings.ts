/** Cloudflare bindings consumed by the worker. */
export interface Bindings {
  DB: D1Database;
  KV: KVNamespace;
  R2: R2Bucket;
}
