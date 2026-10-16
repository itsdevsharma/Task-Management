# API Documentation

## Authentication

### POST /api/auth/register
- Authentication: Not required
- Request body:
  ```json
  {
    "name": "Dev Sharma",
    "email": "dev@example.com",
    "password": "StrongPassword123"
  }
  ```
- Success response: `201`
- Error responses: `400`, `409`

### POST /api/auth/login
- Authentication: Not required
- Request body:
  ```json
  {
    "email": "dev@example.com",
    "password": "StrongPassword123"
  }
  ```
- Success response: `200` with JWT token
- Error responses: `400`, `401`

### POST /api/auth/logout
- Authentication: Not required (stateless acknowledgement)
- Success response: `200`
- Clients must remove their token and user state. This endpoint does not revoke
  issued tokens; they remain valid until expiration.

## Tasks

### GET /api/tasks
- Authentication: Required
- Query parameters: `page`, `limit`, `status`, `priority`, `search`, `sortBy`, `order`
- Example:
  ```http
  GET /api/tasks?page=1&limit=10&status=pending&priority=high&search=report&sortBy=dueDate&order=asc
  ```
- Success response: `200` with task list and pagination

### POST /api/tasks
- Authentication: Required
- Request body:
  ```json
  {
    "title": "Finish MERN assessment",
    "description": "Implement CRUD and auth",
    "status": "in-progress",
    "priority": "high",
    "dueDate": "2026-10-20"
  }
  ```
- Success response: `201`

### GET /api/tasks/:id
- Authentication: Required
- Success response: `200`
- Error responses: `400`, `404`

### PUT /api/tasks/:id
- Authentication: Required
- Success response: `200`
- Error responses: `400`, `404`

### DELETE /api/tasks/:id
- Authentication: Required
- Success response: `200`
- Error responses: `400`, `404`

### GET /api/tasks/stats
- Authentication: Required
- Success response:
  ```json
  {
    "success": true,
    "data": {
      "total": 12,
      "pending": 4,
      "inProgress": 5,
      "completed": 3
    }
  }
  ```

## Validation and authorization

All task endpoints require a valid, unexpired bearer JWT. Missing/invalid tokens
return `401`. A nonexistent task or a task belonging to another user returns
`404`. Malformed task IDs return `400`.

Titles must be strings of 1–120 characters after trimming; descriptions must be
strings of at most 2000 characters. Status is `pending`, `in-progress`, or
`completed`; priority is `low`, `medium`, or `high`. Dates must be parseable date
strings; send `null` to clear a due date. Unknown owner fields cannot reassign a task.
Invalid fields and malformed list queries return `400`.

`page` and `limit` must be positive integers; the maximum limit is 50. Defaults
are page 1, limit 10, sortBy `createdAt`, order `desc`. Supported sorting fields
are `createdAt` and `dueDate`; order is `asc` or `desc`. Search matches literal,
case-insensitive title text. Sorting uses task ID to resolve ties. An empty list
reports `totalPages: 1`; pages beyond the last page return an empty list.

`GET /api/health` is public and returns `200` when the HTTP API is running.
