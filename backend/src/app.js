const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config({ override: true });

const app = express();

// Middleware
app.use(helmet());
app.use(cors({
    origin: (origin, callback) => {
        const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173').split(',');

        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);

        // Check allowed origins list
        if (allowedOrigins.indexOf(origin) !== -1) {
            return callback(null, true);
        }

        // Allow Vercel preview/production deployments
        if (origin.endsWith('.vercel.app')) {
            return callback(null, true);
        }

        // Development mode fallback
        if (process.env.NODE_ENV !== 'production') {
            return callback(null, true);
        }

        console.log('Blocked by CORS:', origin); // Log blocked origin for debugging
        callback(new Error('Not allowed by CORS'));
    },
    credentials: true
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Basic Route - Moved to /api
app.get('/api', (req, res) => {
    res.json({ message: 'Carpentry Workshop API is running' });
});

// API Routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/customers', require('./routes/customers.routes'));
app.use('/api/orders', require('./routes/orders.routes'));
app.use('/api/materials', require('./routes/materials.routes'));
app.use('/api/reports', require('./routes/reports.routes'));

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: 'Internal Server Error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

module.exports = app;
