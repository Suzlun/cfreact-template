output "core_database_id" {
  description = "D1 database identifier consumed by the core Wrangler configuration."
  value       = cloudflare_d1_database.core.id
}

output "core_database_name" {
  description = "D1 database name consumed by the core Wrangler configuration."
  value       = cloudflare_d1_database.core.name
}

output "main_kv_namespace_id" {
  description = "KV namespace identifier consumed by the main Wrangler configuration."
  value       = cloudflare_workers_kv_namespace.main.id
}

output "main_r2_bucket_name" {
  description = "R2 bucket name consumed by the main Wrangler configuration."
  value       = cloudflare_r2_bucket.main.name
}
