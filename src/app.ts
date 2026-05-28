import express from 'express';
import cors from 'cors';
import mongoSanitize from 'express-mongo-sanitize';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';

// Middleware Imports
import { authLimiter, apiLimiter } from './middleware/rateLimitMiddleware';
import { errorHandler } from './middleware/errorHandler';

// Route Imports
import userRoutes from './api/user/userRoute';
import authRoutes from './api/auth/authRoute';
import documentRoutes from './api/document/documentRoute';
import likeRoutes from './api/like/likeRoute';
import characterRoutes from './api/character/characterRoute';
import uploadRoutes from './api/upload/uploadRoute';
import exportRoutes from './api/export/exportRoute';

const app = express();

// 1. Performance & Logging Middlewares
app.use(compression()); // Compresses JSON responses for optimized payload delivery
app.use(morgan('dev')); // HTTP request logging for monitoring traffic

// 2. Parsers
app.use(express.json());

// 3. Global Security Middleware
app.use(helmet());
app.use(cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
}));
app.use(mongoSanitize());

// 4. Rate Limiting
// Apply the strict IP limiter exclusively to login and registration
app.use('/api/auth', authLimiter);

// Apply the identity-based limiter to all other API requests
app.use('/api', apiLimiter);

// 5. Routes
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes); // Auth routes are protected by authLimiter above
app.use('/api/documents', documentRoutes);
app.use('/api/likes', likeRoutes);
app.use('/api/characters', characterRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/export', exportRoutes);

// 6. Global Error Handler
app.use(errorHandler);

export default app;