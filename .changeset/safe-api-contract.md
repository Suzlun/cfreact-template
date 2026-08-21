---
'@cfreact-template/backend': minor
'@cfreact-template/frontend': minor
'@cfreact-template/typespec': minor
---

`TypeSpec`をバックエンドとフロントエンドの唯一のAPI契約とし、生成クライアントを安全な`{ code, message }`形式のエラー応答へ統一しました。ユーザー作成時のメールアドレス重複を`409`、不正なリクエストを安全な`400`として扱います。
