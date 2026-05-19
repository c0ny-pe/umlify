import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const NODE_ENV = process.env.NODE_ENV || 'development';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

/**
 * CORS configuration: restricts requests to trusted origins
 * Development: allows localhost ports (frontend dev server)
 * Production: only allows specified FRONTEND_URL
 */
export const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:5173', // default Vite port
      'http://127.0.0.1:5173',
      FRONTEND_URL,
    ];

    // Allow requests with no origin (like mobile apps, curl, etc.)
    if (!origin || NODE_ENV === 'development') {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 3600, // 1 hour
};

export default cors(corsOptions);
