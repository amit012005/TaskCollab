# Database Schema

## Entity Relationship Diagram

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│    User     │       │   Board     │       │    List     │
├─────────────┤       ├─────────────┤       ├─────────────┤
│ _id         │───┐   │ _id         │       │ _id         │
│ email       │   │   │ title       │───┐   │ title       │
│ password    │   │   │ description │   │   │ board ──────┼───► Board
│ name        │   │   │ createdBy ──┼───┘   │ order       │
│ timestamps  │   │   │ members[] ──┼───┐   │ tasks[]     │
└─────────────┘   │   │ lists[] ────┼───┼───┼──► Task[]   │
                  │   │ timestamps  │   │   │ timestamps  │
                  │   └─────────────┘   │   └─────────────┘
                  │                     │
                  │   ┌─────────────┐   │   ┌─────────────┐
                  │   │   Task      │   │   │  Activity   │
                  └──►├─────────────┤   └──►├─────────────┤
                      │ _id         │       │ _id         │
                      │ title       │       │ board       │
                      │ description │       │ user        │
                      │ list        │       │ action      │
                      │ board       │       │ entityType  │
                      │ assignedTo[]│◄──────│ entityId    │
                      │ order       │       │ details     │
                      │ status      │       │ previousData│
                      │ dueDate     │       │ timestamps  │
                      │ timestamps  │       └─────────────┘
                      └─────────────┘
```

## Collections

### users
| Field     | Type     | Index | Notes                    |
|-----------|----------|-------|--------------------------|
| _id       | ObjectId | PK    |                          |
| email     | String   | unique| lowercase, trimmed       |
| password  | String   | -     | bcrypt hashed, select:false |
| name      | String   | text  |                          |
| createdAt | Date     | -     |                          |
| updatedAt | Date     | -     |                          |

### boards
| Field      | Type       | Index   | Notes          |
|------------|------------|---------|----------------|
| _id        | ObjectId   | PK      |                |
| title      | String     | text    |                |
| description| String     | text    | default ''     |
| createdBy  | ObjectId   | ref User|                |
| members    | ObjectId[] | ref User|                |
| lists      | ObjectId[] | ref List|                |
| createdAt  | Date       | -       |                |
| updatedAt  | Date       | -       |                |

### lists
| Field     | Type     | Index        | Notes    |
|-----------|----------|--------------|----------|
| _id       | ObjectId | PK           |          |
| title     | String   | -            |          |
| board     | ObjectId | ref Board    |          |
| order     | Number   | board+order  | default 0|
| tasks     | ObjectId[]| ref Task    |          |
| createdAt | Date     | -            |          |
| updatedAt | Date     | -            |          |

### tasks
| Field      | Type       | Index       | Notes        |
|------------|------------|-------------|--------------|
| _id        | ObjectId   | PK          |              |
| title      | String     | text        |              |
| description| String     | text        | default ''   |
| list       | ObjectId   | ref List    |              |
| board      | ObjectId   | ref Board   |              |
| assignedTo | ObjectId[] | ref User    |              |
| order      | Number     | list+order  | default 0    |
| status     | String     | enum        | todo/in_progress/done |
| dueDate    | Date       | -           | nullable     |
| createdAt  | Date       | -           |              |
| updatedAt  | Date       | -           |              |

### activities
| Field       | Type     | Index        | Notes                 |
|-------------|----------|--------------|-----------------------|
| _id         | ObjectId | PK           |                       |
| board       | ObjectId | ref Board    | board+createdAt       |
| user        | ObjectId | ref User     | user+createdAt        |
| action      | String   | enum         | create/update/delete/move/assign |
| entityType  | String   | enum         | board/list/task       |
| entityId    | ObjectId | -            |                       |
| details     | Mixed    | -            | additional payload    |
| previousData| Mixed    | -            | for updates           |
| createdAt   | Date     | -            |                       |
| updatedAt   | Date     | -            |                       |
