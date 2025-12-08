# Carpentry Workshop Management System

A full-stack web application for managing a carpentry workshop, including customers, orders, materials, and reports.

## Tech Stack

-   **Frontend**: React (Vite), React Router, Lucide Icons
-   **Backend**: Node.js, Express, PostgreSQL (Neon)
-   **Authentication**: JWT (JSON Web Tokens)

## Prerequisites

-   Node.js (v16+)
-   PostgreSQL Database (or Neon account)

## Local Setup

### 1. Clone the repository

```bash
git clone <repository-url>
cd carpentry-management
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in the `backend` directory based on `.env.example`:

```env
DATABASE_URL=postgresql://user:password@host:port/dbname
PORT=5000
JWT_SECRET=super_secret_key
FRONTEND_URL=http://localhost:5173
```

Run database migrations (if applicable) or ensure schema is applied using `schema.sql`.

Start the backend server:

```bash
npm run dev
```

### 3. Frontend Setup

```bash
cd frontend
npm install
```

Create a `.env` file in the `frontend` directory based on `.env.example`:

```env
VITE_API_URL=http://localhost:5000/api
```

Start the frontend development server:

```bash
npm run dev
```

## Deployment Guide

### Backend (Railway/Heroku/Render)

1.  Connect your repository to the deployment platform.
2.  Set the Root Directory to `backend`.
3.  Set the Build Command to `npm install`.
4.  Set the Start Command to `npm start`.
5.  Add the Environment Variables defined in `backend/.env`.
    -   **Important**: Update `FRONTEND_URL` to your production frontend URL (e.g., `https://my-app.vercel.app`).

### Frontend (Vercel/Netlify)

1.  Connect your repository.
2.  Set the Root Directory to `frontend`.
3.  The build command (`npm run build`) and output directory (`dist`) should be auto-detected.
4.  Add Environment Variables:
    -   `VITE_API_URL`: Your production backend URL (e.g., `https://my-api.railway.app/api`).

## Usage

-   **Admin User**: You will need to manually seed an admin user in the database or use a registration endpoint if enabled for setup.
-   **Dashboard**: View summary stats, recent orders, and upcoming deliveries.
-   **Reports**: Export order data to CSV.