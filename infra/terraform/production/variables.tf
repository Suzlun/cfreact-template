variable "cloudflare_account_id" {
  description = "Cloudflare account that owns the production resources."
  type        = string
}

variable "core_database_name" {
  description = "D1 database owned by the core Worker."
  type        = string
  default     = "cfreact-template-db-production"
}

variable "main_kv_namespace_name" {
  description = "KV namespace bound to the main Worker."
  type        = string
  default     = "cfreact-template-main-production"
}

variable "main_r2_bucket_name" {
  description = "R2 bucket bound to the main Worker."
  type        = string
  default     = "cfreact-template-bucket-production"
}
