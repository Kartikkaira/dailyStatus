import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from './config/env';
import authRoutes from './routes/authRoutes';
import dayRoutes from './routes/dayRoutes';
import { errorHandler } from './middlewares/errorHandler';

const app = express();

// Configure CORS for frontend origin only with credentials support
const allowedOrigins = [
  env.FRONTEND_URL,
  'http://localhost:3000',
  'http://127.0.0.1:3000',
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, server-to-server) or matching allowed origins
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS blocked for origin: ${origin}`));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Welcome & API Status route
app.get('/', (req, res) => {
  res.status(200).json({
    name: 'Day Status Tracker API',
    status: 'online',
    frontend_url: env.FRONTEND_URL,
    message: 'Welcome to Day Status Tracker API! To view the user interface, open ' + env.FRONTEND_URL + ' in your browser.',
    endpoints: {
      health: '/api/health',
      days: '/api/days',
      auth: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login',
        refresh: 'POST /api/auth/refresh',
        logout: 'POST /api/auth/logout',
      },
    },
  });
});

// Health Check route
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Day Status Tracker API',
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/days', dayRoutes);

// 404 Route Handler
app.use((req, res) => {
  res.status(404).json({ error: `Cannot ${req.method} ${req.path}` });
});

// Centralized Error Handling Middleware
app.use(errorHandler);

// Start Server
const server = app.listen(env.PORT, () => {
  console.log(`🚀 Day Status Tracker Backend running on http://localhost:${env.PORT}`);
  console.log(`🔒 Allowed CORS origins: ${allowedOrigins.join(', ')}`);
});

export default app;
