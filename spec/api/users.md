# Users API

## GET /api/users

Retrieve all users from the database.

### Request

No parameters required.

### Response

**Status Code:** 200 OK

**Content-Type:** application/json

**Body:**

```json
[
  {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "createdAt": "2025-11-13T08:00:00.000Z"
  }
]
```

### Example

```bash
curl http://localhost:8787/api/users
```

---

## POST /api/users

Create a new user in the database.

### Request

**Content-Type:** application/json

**Body:**

```json
{
  "name": "Jane Smith",
  "email": "jane@example.com"
}
```

### Fields

| Field | Type   | Required | Description                           |
| ----- | ------ | -------- | ------------------------------------- |
| name  | string | Yes      | User's full name                      |
| email | string | Yes      | User's email address (must be unique) |

### Response

**Status Code:** 201 Created

**Content-Type:** application/json

**Body:**

```json
{
  "id": 2,
  "name": "Jane Smith",
  "email": "jane@example.com",
  "createdAt": "2025-11-13T08:30:00.000Z"
}
```

### Error Response

**Status Code:** 400 Bad Request

```json
{
  "error": "Name and email are required"
}
```

### Example

```bash
curl -X POST http://localhost:8787/api/users \
  -H "Content-Type: application/json" \
  -d '{"name":"Jane Smith","email":"jane@example.com"}'
```

---

## GET /api/users/:id

Retrieve a specific user by ID.

### Request

**Path Parameters:**

| Parameter | Type    | Description |
| --------- | ------- | ----------- |
| id        | integer | User ID     |

### Response

**Status Code:** 200 OK

**Content-Type:** application/json

**Body:**

```json
{
  "id": 1,
  "name": "John Doe",
  "email": "john@example.com",
  "createdAt": "2025-11-13T08:00:00.000Z"
}
```

### Error Response

**Status Code:** 404 Not Found

```json
{
  "error": "User not found"
}
```

### Example

```bash
curl http://localhost:8787/api/users/1
```
