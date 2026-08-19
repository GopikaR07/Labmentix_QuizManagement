# Quiwwz - Quiz Management & Online Assessment Platform

A full-stack quiz platform built with React, Express, and PostgreSQL. Admins create categories, build quizzes with multiple-choice questions, and publish them; students browse published quizzes, attempt them under a timer, and get instant scored results with a full answer review.

Built as an internship project.

## Features

**Admin**
- Role-based login (separate from student accounts — admins are seeded, not self-registered)
- Category management
- Quiz management — create, edit, delete, and publish/unpublish quizzes
- A quiz can't go live with zero questions (guarded server-side)
- Question management — each question has 2–6 options with exactly one correct answer, validated on save
- Dashboard with platform-wide stats: total students, total attempts, average score, published vs draft quizzes
- Top Performing Quizzes (attempts + average score per quiz)
- Attempts trend chart (last 14 days)
- Student management — view, activate/deactivate, delete accounts
- View and review every attempt across all students

**Student**
- Register, log in, browse published quizzes by category/difficulty
- Timed quiz attempts, submitted and scored server-side (correct answers are never sent to the client during the attempt)
- Max-attempts limit enforced per quiz
- Attempt history with pass/fail status
- Per-attempt answer review (your answer vs. the correct one, with explanations)
- Dashboard with personal stats
- Leaderboard (overall / weekly / monthly)

**Platform-wide**
- JWT authentication, bcrypt password hashing
- Forgot / reset password flow (token expires in 15 minutes, single-use)
- Rate limiting on auth routes
- Role enforcement on every protected route (`requireAdmin` middleware)

## Tech stack

| Layer     | Tech |
|-----------|------|
| Frontend  | React (Vite), React Router, Recharts, Axios |
| Backend   | Node.js, Express |
| Database  | PostgreSQL |
| Auth      | JWT, bcrypt |

## Project structure

```
Labmentix_QuizManagement/
├── client/               # React frontend (Vite)
│   └── src/
│       ├── pages/
│       │   ├── admin/    # Admin dashboard, quizzes, questions, categories, users, attempts
│       │   └── student/  # Student dashboard, quiz browsing, taking quizzes, attempts, leaderboard
│       ├── components/   # Layout (sidebar shell), ProtectedRoute
│       ├── context/      # AuthContext
│       └── api.js        # Axios instance with auth interceptor
│
└── server/                # Express backend
    ├── controllers/       # auth, quiz, question, category, attempt, admin, user, leaderboard
    ├── routes/
    ├── middleware/         # JWT auth, role guard, rate limiter
    ├── config/             # DB connection
    └── db/schema.sql       # Full PostgreSQL schema + seed admin account
```

## Getting started

### Prerequisites
- Node.js (v18+)
- PostgreSQL running locally

### 1. Clone the repo
```bash
git clone https://github.com/GopikaR07/Labmentix_QuizManagement.git
cd Labmentix_QuizManagement
```

### 2. Backend setup
```bash
cd server
npm install
```

Create the database and load the schema:
```bash
createdb quiz_platform
psql -U postgres -d quiz_platform -f db/schema.sql
```

Update `server/.env` with your own PostgreSQL credentials:
```
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=quiz_platform
DB_USER=postgres
DB_PASSWORD=your_password
JWT_SECRET=your_jwt_secret
```

Start the server:
```bash
npm run dev
```
Runs on `http://localhost:5000`.

The schema seeds one admin account:
- **Email:** `admin@quiz.com`
- **Password:** `Admin@123`

Change this before deploying anywhere real.

### 3. Frontend setup
```bash
cd client
npm install
npm run dev
```
Runs on `http://localhost:5173`.

## API overview

```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/forgot-password
POST   /api/auth/reset-password

GET    /api/categories
POST   /api/categories                  (admin)
PUT    /api/categories/:id              (admin)
DELETE /api/categories/:id              (admin)

GET    /api/quizzes                     (role-scoped)
GET    /api/quizzes/:id
POST   /api/quizzes                     (admin)
PUT    /api/quizzes/:id                 (admin)
PATCH  /api/quizzes/:id/publish         (admin)
DELETE /api/quizzes/:id                 (admin)

GET    /api/quizzes/:quizId/questions   (admin)
POST   /api/quizzes/:quizId/questions   (admin)
PUT    /api/questions/:id               (admin)
DELETE /api/questions/:id               (admin)

POST   /api/quizzes/:id/start           (student)
POST   /api/quizzes/:id/submit          (student)
GET    /api/attempts                    (student — own attempt history)
GET    /api/attempts/:id                (owner or admin)
GET    /api/attempts/stats/summary      (student)

GET    /api/admin/analytics             (admin)
GET    /api/admin/attempts              (admin — all students' attempts)
GET    /api/admin/attempts/:id          (admin — full review of one attempt)

GET    /api/users                       (admin)
GET    /api/users/:id                   (admin)
PUT    /api/users/:id                   (admin)
PATCH  /api/users/:id/status            (admin — activate/deactivate)
DELETE /api/users/:id                   (admin)

GET    /api/leaderboard
```

## Roadmap

- Quiz scheduling (start/end availability windows)
- Question/option randomization per attempt, negative marking
- Certificate generation
- Email delivery for password reset (currently returns the token directly for local testing)

## License

This project was built for internship/academic purposes.
