resource "cloudflare_d1_database" "core" {
  account_id = var.cloudflare_account_id
  name       = var.core_database_name

  lifecycle {
    prevent_destroy = true
  }
}

resource "cloudflare_workers_kv_namespace" "main" {
  account_id = var.cloudflare_account_id
  title      = var.main_kv_namespace_name

  lifecycle {
    prevent_destroy = true
  }
}

resource "cloudflare_r2_bucket" "main" {
  account_id = var.cloudflare_account_id
  name       = var.main_r2_bucket_name

  lifecycle {
    prevent_destroy = true
  }
}
