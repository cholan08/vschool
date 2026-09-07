import express from 'express';
import cors from 'cors';
import 'express-async-errors';
import authRoutes from './routes/authRoutes.js';
import errorHandler from './middleware/errorMiddleware.js';

const app = express();

// CORS — update origin for production
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
);

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/auth', authRoutes);

// 404 handler for unmatched routes
app.use((_req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Centralized error handler (must be last)
app.use(errorHandler);

export default app;
