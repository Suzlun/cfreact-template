# Hello API

## GET /api/hello

Simple health check endpoint that returns a greeting message.

### Request

No parameters required.

### Response

**Status Code:** 200 OK

**Content-Type:** application/json

**Body:**

```json
{
  "message": "Hello from Hono + Cloudflare Workers",
  "timestamp": "2025-11-13T12:00:00.000Z"
}
```

### Fields

| Field     | Type   | Description                        |
| --------- | ------ | ---------------------------------- |
| message   | string | Greeting message from the server   |
| timestamp | string | ISO 8601 timestamp of the response |

### Example

```bash
curl http://localhost:8787/api/hello
```

### Response Example

```json
{
  "message": "Hello from Hono + Cloudflare Workers",
  "timestamp": "2025-11-13T08:30:45.123Z"
}
```
