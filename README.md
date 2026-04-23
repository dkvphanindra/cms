# Certificates Management Portal (CMP)

A centralized document and certification management system for students and college administration.

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

## Deployment Guide

### Backend (Deploying to Render)

1. **Database**: Create a free PostgreSQL database on Render or Supabase.
2. **Web Service**: Create a new Web Service on Render and connect your GitHub repository.
3. **Configuration**:
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install && npx prisma generate && npm run build`
   - **Start Command**: `npm run start`
4. **Environment Variables**:
   - `DATABASE_URL`: Your PostgreSQL connection string.
   - `JWT_SECRET`: A long random string.
   - `NODE_ENV`: `production`
   - `PORT`: `5001` (or whatever Render assigns).
   - `FRONTEND_ORIGIN`: Your Vercel frontend URL (e.g., `https://your-app.vercel.app`).

### **CRITICAL: Fix for "Can't reach database server at localhost"**
If your logs show an error connecting to `localhost:5000` on Render, it's because your `.env` file was accidentally committed to Git. Follow these steps:
1. Open your terminal in the project root.
2. Run: `git rm --cached backend/.env`
3. Run: `git commit -m "Remove local env from tracking"`
4. Run: `git push origin main`
5. Render will re-deploy, and this time it will use the environment variables you set in the Render Dashboard.
5. **Disk (Optional but Recommended)**: Since this project uses local file storage, files will be lost on redeploy on Render's free tier. For persistent storage:
   - Go to the **Disk** tab in Render.
   - Add a Disk with Mount Path: `/opt/render/project/src/backend/uploads`.
   - Update `backend/src/main.ts` to use this absolute path if necessary.

### Frontend (Deploying to Vercel)

1. **New Project**: Create a new project on Vercel and connect your GitHub repository.
2. **Configuration**:
   - **Root Directory**: `frontend`
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
3. **Environment Variables**:
   - `VITE_API_BASE_URL`: `/api`
4. **Proxy Setup**:
   - A `vercel.json` file has been added to the `frontend` folder. 
   - **IMPORTANT**: Update the `destination` in `frontend/vercel.json` to point to your actual Render backend URL (e.g., `https://your-backend.onrender.com/:path*`).

---

## Production Notes

- Use HTTPS in production.
- Replace local upload storage with S3/Cloud storage for scale.
- Rotate JWT secrets and database credentials.
- Add regular database backups and monitoring.

