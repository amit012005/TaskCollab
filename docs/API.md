# API Documentation

Base URL: `http://localhost:5000/api`

All protected endpoints require: `Authorization: Bearer <token>`

---

## Authentication

### POST /auth/signup

Create a new user account.

**Request**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe"
}
```

**Response** `201`
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "64a1b2c3d4e5f6789",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

**Errors**
- `400` Email already registered / Validation error

---

### POST /auth/login

Authenticate and receive JWT.

**Request**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response** `200`
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "64a1b2c3d4e5f6789",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

**Errors**
- `401` Invalid email or password

---

### GET /auth/me

Get current user (requires auth).

**Response** `200`
```json
{
  "user": {
    "id": "64a1b2c3d4e5f6789",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

---

## Boards

### GET /boards

List boards for the authenticated user. Supports pagination and search.

**Query**
- `page` (number, default 1)
- `limit` (number, default 10)
- `search` (string) – search in title and description

**Response** `200`
```json
{
  "boards": [
    {
      "_id": "...",
      "title": "My Board",
      "description": "",
      "createdBy": { "_id": "...", "name": "...", "email": "..." },
      "members": [],
      "lists": [],
      "createdAt": "...",
      "updatedAt": "..."
    }
  ],
  "total": 1,
  "page": 1,
  "totalPages": 1
}
```

---

### POST /boards

Create a board.

**Request**
```json
{
  "title": "New Board",
  "description": "Optional description"
}
```

**Response** `201` – Full board object

---

### GET /boards/:id

Get a single board with populated lists and tasks.

**Response** `200` – Board with nested lists and tasks (including assignedTo for tasks)

**Errors**
- `404` Board not found
- `403` Access denied

---

### PATCH /boards/:id

Update board title/description.

**Request**
```json
{
  "title": "Updated Title",
  "description": "Updated description"
}
```

**Response** `200` – Updated board

---

### DELETE /boards/:id

Delete board and all its lists, tasks, and activities.

**Response** `200` `{ "message": "Board deleted" }`

---

## Lists

### POST /boards/:boardId/lists

Create a list in a board.

**Request**
```json
{
  "title": "To Do"
}
```

**Response** `201` – List object

---

### PATCH /lists/:id

Update list title.

**Request**
```json
{
  "title": "In Progress"
}
```

**Response** `200` – Updated list

---

### DELETE /lists/:id

Delete list and all its tasks.

**Response** `200` `{ "message": "List deleted" }`

---

## Tasks

### POST /lists/:listId/tasks

Create a task in a list.

**Request**
```json
{
  "title": "Task title",
  "description": "Optional description"
}
```

**Response** `201` – Task with populated assignedTo

---

### PATCH /tasks/:id

Update task fields.

**Request**
```json
{
  "title": "Updated title",
  "description": "Updated description",
  "status": "in_progress"
}
```

**Response** `200` – Updated task with populated assignedTo

---

### DELETE /tasks/:id

Delete a task.

**Response** `200` `{ "message": "Task deleted" }`

---

### POST /tasks/:taskId/move

Move a task to another list or reorder within the same list.

**Request**
```json
{
  "targetListId": "list_id_here",
  "newOrder": 0
}
```

**Response** `200` – Updated task

---

### POST /tasks/:taskId/assign

Assign a user to a task.

**Request**
```json
{
  "userId": "user_id_here"
}
```

**Response** `200` – Task with updated assignedTo

---

### POST /tasks/:taskId/unassign

Remove a user from a task.

**Request**
```json
{
  "userId": "user_id_here"
}
```

**Response** `200` – Task with updated assignedTo

---

## Activity

### GET /boards/:boardId/activities

Get activity feed for a board.

**Query**
- `page` (number, default 1)
- `limit` (number, default 20)

**Response** `200`
```json
{
  "activities": [
    {
      "_id": "...",
      "board": "...",
      "user": { "_id": "...", "name": "...", "email": "..." },
      "action": "create_task",
      "entityType": "task",
      "entityId": "...",
      "details": { "title": "New task" },
      "createdAt": "..."
    }
  ],
  "total": 1,
  "page": 1,
  "totalPages": 1
}
```

---

## Users

### GET /users/search

Search users by name or email (for assignment).

**Query**
- `q` (string) – search term
- `limit` (number, default 10)

**Response** `200`
```json
{
  "users": [
    {
      "_id": "...",
      "name": "John Doe",
      "email": "john@example.com"
    }
  ]
}
```

---

## Health

### GET /api/health

**Response** `200` `{ "status": "ok" }`
