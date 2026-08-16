# Quiz Platform — Backend

## Setup

1. Install Postgres locally, then create the database:
   ```
   createdb quiz_platform
   ```
2. Check `server/.env` has your real DB credentials (already set to your local Postgres).
3. Install dependencies and load the schema:
   ```
   cd server
   npm install
   psql -U postgres -d quiz_platform -f db/schema.sql
   ```
   This creates all tables and seeds one admin account:
   - **Email:** admin@quiz.com
   - **Password:** Admin@123

   Change that password after your first login (there's no "change password"
   endpoint yet — for now, just update it directly in Postgres, or wait until
   we build the reset-password flow).

4. Run the server:
   ```
   npm run dev
   ```
   Server runs on `http://localhost:5000`.

## What's implemented (Step 1 of the rebuild)

- **Schema** (`db/schema.sql`): users, categories, quizzes, questions,
  options, attempts, answers — matching the DB design in the spec doc.
- **Auth**: register (always creates a STUDENT — admins are seeded directly,
  per the spec's "admin accounts created manually" rule), login, JWT.
  Login also checks `status = 'ACTIVE'` so a deactivated account can't sign in.
- **Role enforcement**: `authenticateUser` + `requireAdmin` middleware.
  Every quiz/question/category write route now actually checks the role —
  previously any logged-in user could hit those endpoints.
- **Categories**: full CRUD, admin-only writes.
- **Quizzes**:
  - Admin-only create/update/delete.
  - New quizzes always start as `DRAFT` (even if you try to set another
    status on create — you have to publish explicitly).
  - `PATCH /api/quizzes/:id/publish` with `{ "status": "PUBLISHED" | "UNPUBLISHED" | "DRAFT" }`
    — this is the publish/unpublish control you were missing.
  - **Guard rail**: a quiz can't be published if it has zero questions.
  - Students only ever see `PUBLISHED` quizzes in listings, and get a 404
    (not 403) if they try to open a draft directly by ID — so drafts aren't
    even discoverable by guessing IDs.
- **Questions**: proper `options` table (not a single `correct_answer`
  string). Each question needs 2–6 options with exactly one marked correct
  — validated server-side. Question CRUD is admin-only. Students currently
  cannot see any question data at all (that endpoint returns 403 for them —
  the student-facing "take quiz" endpoint that strips correct answers comes
  in the next step).

## API endpoints so far

```
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/profile              (any logged-in user)

GET    /api/categories                (any logged-in user)
POST   /api/categories                (admin)
PUT    /api/categories/:id            (admin)
DELETE /api/categories/:id            (admin)

GET    /api/quizzes                   (scoped by role; ?status= ?category_id= ?search=)
GET    /api/quizzes/:id               (scoped by role)
POST   /api/quizzes                   (admin)
PUT    /api/quizzes/:id               (admin)
PATCH  /api/quizzes/:id/publish       (admin)
DELETE /api/quizzes/:id               (admin)

GET    /api/quizzes/:quizId/questions (admin — includes correct answers)
POST   /api/quizzes/:quizId/questions (admin)
PUT    /api/questions/:id             (admin)
DELETE /api/questions/:id             (admin)
```

## Security additions (latest update)

- **express-rate-limit** — a general limiter on all `/api` routes (300 req/15min),
  and a tighter shared limiter on `/api/auth/*` (10 req/15min per IP) since
  login/register/forgot-password are the endpoints worth protecting from
  brute-forcing
- **Forgot/reset password**:
  ```
  POST /api/auth/forgot-password   { email }
  POST /api/auth/reset-password    { token, new_password }
  ```
  Token is SHA-256 hashed in the DB, expires in 15 minutes, and is
  single-use (cleared after a successful reset). The response never reveals
  whether an email is registered.

  ⚠️ **No email service is wired up yet.** `forgot-password` currently
  returns the raw token directly in the response as `dev_reset_token` so you
  can test the flow. Before this goes live, connect an email provider (e.g.
  nodemailer + SMTP, or a service like Resend/SendGrid) to actually email
  the reset link, and delete the `dev_reset_token` field from the response.

## Not built yet (next steps, per the spec)

- The React frontend (currently just the default Vite starter — nothing
  built yet). This is the biggest remaining piece.
- Actual email sending for password reset (see above)
- Quiz scheduling (start/end date availability window) — spec's "Advanced Features"
- Question/option randomization per attempt, negative marking — also "Advanced Features"
- Certificate generation, email notifications — also "Advanced Features"
- Automated tests / Postman collection
