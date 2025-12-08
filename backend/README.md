# Carpentry Management Backend

Backend API server for the Carpentry Workshop Management System.

## Installation

```bash
npm install
```

## Environment Setup

Create a `.env` file in the root directory:

```
# Database
DATABASE_URL=postgresql://username:password@host:port/database
DB_HOST=your-neon-host.neon.tech
DB_PORT=5432
DB_NAME=carpentry_db
DB_USER=your-username
DB_PASSWORD=your-password

# JWT Authentication
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_EXPIRES_IN=7d

# Server
PORT=5000
NODE_ENV=development

# CORS
FRONTEND_URL=http://localhost:3000
```

## Running the Server

```bash
# Development
npm run dev

# Production
npm start
```

## Database Setup

```bash
# Run migrations
npm run migrate

# Seed database with sample data
npm run seed
```

## API Documentation

See [API Endpoints](../planning.md#backend-api-endpoints) in the planning document.