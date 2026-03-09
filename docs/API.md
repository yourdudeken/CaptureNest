# CaptureNest API Documentation

## Authentication

### Register
```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "user",
  "password": "password"
}

Response: {
  "token": "jwt-token",
  "refresh": "refresh-token",
  "user": { "id": "uuid", "username": "user" }
}
```

### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "user",
  "password": "password"
}

Response: {
  "token": "jwt-token",
  "refresh": "refresh-token",
  "user": { "id": "uuid", "username": "user" }
}
```

## Media

### Upload Media
```http
POST /api/upload/file
Authorization: Bearer <token>
Content-Type: multipart/form-data

FormData: { media: File }

Response: {
  "id": "uuid",
  "filename": "timestamp-uuid-filename.ext"
}
```

### Gallery
```http
GET /api/gallery?userId=<uuid>

Response: [
  {
    "id": "uuid",
    "filename": "...",
    "url": "/media/...",
    "content_type": "image/png",
    "created_at": "2025-11-19T..."
  }
]
```

```http
DELETE /api/gallery/:id
Authorization: Bearer <token>

Response: {
  "success": true,
  "message": "Media deleted successfully"
}
```
