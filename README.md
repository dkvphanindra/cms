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
3. Create/update `backend/.env`:
   - `DATABASE_URL="postgresql://postgres:ZXasdqwer1!@localhost:5432/campus_credential?schema=public"`
   - `JWT_SECRET="change_this_to_a_long_random_secret"`
   - `PORT=5000`
4. Run migrations:
   - `npx prisma migrate dev --name init`
5. Generate Prisma client:
   - `npx prisma generate`
6. Seed admin and default document types:
   - `npm run prisma:seed`
7. Start backend:
   - `npm run start:dev`

Backend runs on: `http://localhost:5000`

Default admin from seed:
- Username: `admin`
- Password: `Admin@123`

## Frontend Setup

1. Go to frontend:
   - `cd frontend`
2. Install dependencies:
   - `npm install`
3. Start frontend:
   - `npm run dev`

Frontend runs on: `http://localhost:5173`

## Build Commands

- Backend build: `cd backend && npm run build`
- Frontend build: `cd frontend && npm run build`

## Production Notes

- Use HTTPS in production.
- Replace local upload storage with S3/Cloud storage for scale.
- Rotate JWT secrets and database credentials.
- Add regular database backups and monitoring.

