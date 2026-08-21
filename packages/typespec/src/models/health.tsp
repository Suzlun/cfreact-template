namespace CfreactTemplate;

/**
 * サービスの稼働確認 API が返す成功 payload。
 */
model HealthResponse {
  status: "ok";
  timestamp: utcDateTime;
}
