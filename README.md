# Campus Credential Portal

Campus document and certification management system for students and college administration.

## Features

- Student login using roll number and password
- Student password change support
- Mandatory and optional document type support
- Document upload with visibility control (`SHARED` or `PRIVATE`)
- Certification upload with visibility control (`SHARED` or `PRIVATE`)
- Admin can create student accounts
- Admin can filter students by batch, branch, 10th percentage, and certification keyword
- Admin sees only student-shared documents and certifications

## Tech Stack

- Frontend: React + TypeScript + Vite
- Backend: NestJS + TypeScript
- Database: PostgreSQL + Prisma ORM
- Auth: JWT
- File upload: Multer (local filesystem)

## Prerequisites

- Node.js 18+ (recommended 20+)
- PostgreSQL running

## Backend Setup

1. Go to backend:
   - `cd backend`
2. Install dependencies:
   - `npm install`
3. Create `backend/.env` from `backend/.env.example` and update values:
   - `DATABASE_URL` (set the correct PostgreSQL port for your machine)
   - `JWT_SECRET`
   - `PORT=5001`
   - `FRONTEND_ORIGIN=http://localhost:5173`
4. Run migrations:
   - `npx prisma migrate dev --name init`
5. Generate Prisma client:
   - `npx prisma generate`
6. Seed admin and default document types:
   - `npm run prisma:seed`
7. Start backend:
   - `npm run start:dev`

Backend runs on: `http://localhost:5001`

If backend shows Prisma `P1000`/`P1001`, fix `DATABASE_URL` in `backend/.env` (host/port/user/password).

Default admin from seed:
- Username: `admin`
- Password: `Admin@123`

## Frontend Setup

1. Go to frontend:
   - `cd frontend`
2. Install dependencies:
   - `npm install`
3. Create `frontend/.env` from `frontend/.env.example`:
   - `VITE_API_BASE_URL=/api`
   - `VITE_API_PROXY_TARGET=http://localhost:5001`
4. Start frontend:
   - `npm run dev`

Frontend runs on: `http://localhost:5173`

The frontend uses Vite proxy (`/api`) in development to avoid CORS issues.

## Build Commands

- Backend build: `cd backend && npm run build`
- Frontend build: `cd frontend && npm run build`

## Production Notes

- Use HTTPS in production.
- Replace local upload storage with S3/Cloud storage for scale.
- Rotate JWT secrets and database credentials.
- Add regular database backups and monitoring.

