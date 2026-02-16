# TaskCollab - Real-Time Task Collaboration Platform

A lightweight Trello/Notion-style task management app with real-time sync, built with React, Node.js, Express, MongoDB, and Socket.io.

## Demo Credentials

| Email | Password |
|-------|----------|
| demo@taskcollab.com | demo123 |
| alice@taskcollab.com | alice123 |

*Create these accounts via Signup if they don't exist.*

---

## Quick Start

### Prerequisites

- **Node.js** 18+
- **MongoDB** (local or URI)
- **npm** or **yarn**

### Setup

1. **Clone and install**

   ```bash
   cd project
   npm install
   cd backend && npm install
   cd ../frontend && npm install
   ```

2. **Backend configuration**

   ```bash
   cd backend
   cp .env.example .env
   # Edit .env: set MONGODB_URI if needed (default: mongodb://localhost:27017/task-collab)
   ```

3. **Run**

   ```bash
   # Terminal 1: Backend
   cd backend && npm run dev

   # Terminal 2: Frontend
   cd frontend && npm run dev
   ```

4. Open http://localhost:5173 and sign up / log in.

---

## Architecture

### Frontend Architecture

```
frontend/
├── src/
│   ├── api/           # API client (fetch wrappers)
│   ├── components/    # Reusable UI (BoardContent, ListColumn, TaskCard, ActivityPanel)
│   ├── context/       # AuthContext, SocketContext
│   ├── pages/         # Login, Signup, Boards, BoardView
│   └── main.jsx
```

- **Framework**: React 18 with Vite
- **State management**: React Context (Auth) + local state; server is source of truth
- **Real-time**: Socket.io client; joins `board:<id>` room on board view
- **Drag & drop**: @dnd-kit/core + @dnd-kit/sortable
- **Routing**: React Router v6
- **Styling**: CSS modules + CSS variables for theming

### Backend Architecture

```
backend/
├── src/
│   ├── config/        # MongoDB connection
│   ├── controllers/   # Auth, Board, List, Task, Activity, User
│   ├── middleware/    # auth (JWT), boardAccess
│   ├── models/        # User, Board, List, Task, Activity
│   ├── routes/        # REST route definitions
│   ├── services/      # socketEmitter
│   └── socket/        # Socket.io auth & room join/leave
```

- **Framework**: Express 4
- **Database**: MongoDB + Mongoose
- **Auth**: JWT (Bearer token)
- **Real-time**: Socket.io with room-based board updates
- **API style**: REST

---

## Database Schema

```
User
  - _id, email (unique), password (hashed), name, timestamps

Board
  - _id, title, description, createdBy (ref User), members (ref User[]), lists (ref List[]), timestamps

List
  - _id, title, board (ref Board), order, tasks (ref Task[]), timestamps

Task
  - _id, title, description, list (ref List), board (ref Board), assignedTo (ref User[]), order, status, dueDate, timestamps

Activity
  - _id, board (ref Board), user (ref User), action, entityType, entityId, details, previousData, timestamps
```

### Indexes

- User: `email`, `name` (text)
- Board: `createdBy`, `members`, `title`/`description` (text)
- List: `board`, `order`
- Task: `list`, `order`, `board`, `assignedTo`, `title`/`description` (text)
- Activity: `board` + `createdAt`, `user` + `createdAt`

---

## API Contract

Base URL: `http://localhost:5000/api`

### Auth

| Method | Endpoint | Body | Response |
|--------|----------|------|----------|
| POST | /auth/signup | `{ email, password, name }` | `{ token, user }` |
| POST | /auth/login | `{ email, password }` | `{ token, user }` |
| GET | /auth/me | - (Bearer) | `{ user }` |

### Boards

| Method | Endpoint | Body/Query | Response |
|--------|----------|------------|----------|
| GET | /boards | `?page=1&limit=10&search=` | `{ boards, total, page, totalPages }` |
| POST | /boards | `{ title, description? }` | Board |
| GET | /boards/:id | - | Board (with lists, tasks) |
| PATCH | /boards/:id | `{ title?, description? }` | Board |
| DELETE | /boards/:id | - | `{ message }` |

### Lists

| Method | Endpoint | Body | Response |
|--------|----------|------|----------|
| POST | /boards/:boardId/lists | `{ title }` | List |
| PATCH | /lists/:id | `{ title? }` | List |
| DELETE | /lists/:id | - | `{ message }` |

### Tasks

| Method | Endpoint | Body | Response |
|--------|----------|------|----------|
| POST | /lists/:listId/tasks | `{ title, description? }` | Task |
| PATCH | /tasks/:id | `{ title?, description? }` | Task |
| DELETE | /tasks/:id | - | `{ message }` |
| POST | /tasks/:taskId/move | `{ targetListId, newOrder? }` | Task |
| POST | /tasks/:taskId/assign | `{ userId }` | Task |
| POST | /tasks/:taskId/unassign | `{ userId }` | Task |

### Activity

| Method | Endpoint | Query | Response |
|--------|----------|-------|----------|
| GET | /boards/:boardId/activities | `?page=1&limit=20` | `{ activities, total, page, totalPages }` |

### Users

| Method | Endpoint | Query | Response |
|--------|----------|-------|----------|
| GET | /users/search | `?q=` | `{ users }` |

---

## Real-Time Sync Strategy

1. **Connection**: Client connects with JWT in `auth.token`. Server validates and attaches `userId` to the socket.
2. **Rooms**: On viewing a board, client emits `join_board` with `boardId`. Server adds socket to `board:<boardId>`.
3. **Broadcast**: On create/update/delete of boards, lists, or tasks, the server emits `board:updated` to the board room.
4. **Payload**: `{ type: 'create_task'|'update_task'|'delete_task'|'move_task'|... , task?, list?, ... }`
5. **Client**: On `board:updated`, the client refetches the board to stay in sync.

---

## Scalability Considerations

1. **Horizontal scaling**: Socket.io supports Redis adapter for multi-instance WebSocket scaling.
2. **Database**: MongoDB indexes support efficient queries; use connection pooling.
3. **Pagination**: All list endpoints support `page` and `limit`; frontend uses pagination for boards and activity.
4. **Rate limiting**: Add express-rate-limit or similar for production.
5. **Caching**: Optional Redis cache for board data to reduce DB load for hot boards.

---

## Assumptions & Trade-offs

- **Assumptions**
  - Single MongoDB instance for simplicity.
  - JWT stored in localStorage (no refresh token flow).
  - Boards visible only to creator and members; no public boards.

- **Trade-offs**
  - Full board refetch on real-time events (simplicity over granular patches).
  - Regex search for boards instead of full-text index (avoid index setup).
  - Client-side pagination for activity; server supports pagination.

---

## Project Structure

```
project/
├── backend/           # Express API + Socket.io
│   ├── src/
│   ├── __tests__/
│   ├── package.json
│   └── .env.example
├── frontend/          # React SPA
│   ├── src/
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
└── README.md
```

---

## Running Tests

```bash
cd backend
npm test
```

---

## Deployment Notes

- Set `NODE_ENV=production`
- Use strong `JWT_SECRET`
- Set `MONGODB_URI` to production MongoDB
- Set `FRONTEND_URL` to deployed frontend URL
- Serve frontend as static files or via separate hosting (Vercel, Netlify, etc.)
=======

