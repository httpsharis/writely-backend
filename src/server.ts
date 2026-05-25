import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import mongoSanitize from 'express-mongo-sanitize';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';

// Route and Middleware Imports
import userRoutes from './api/user/userRoute';
import authRoutes from './api/auth/authRoute'; 
import documentRoutes from './api/document/documentRoute';

import { errorHandler } from './middleware/errorHandler';

// 1. Fail-Fast Environment Variable Validation
const requiredEnvVars = ['JWT_SECRET', 'GOOGLE_CLIENT_ID', 'MONGODB_URI'];
for (const key of requiredEnvVars) {
    if (!process.env[key]) {
        throw new Error(`Missing required env var: ${key}`);
    }
}

const app = express();

// 2. Parsers
app.use(express.json());

// 3. Global Security Middleware
app.use(helmet());

app.use(cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true, 
}));

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { error: "Too many requests from this IP, try again later." }
});
app.use('/api', limiter); 

app.use(mongoSanitize());

// 4. Routes
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/documents', documentRoutes);

// 5. Global Error Handler (MUST be after routes)
app.use(errorHandler);

// 6. Database and Server Initialization
const PORT = process.env.PORT || 4000;
const MONGODB_URI = process.env.MONGODB_URI as string;

mongoose.connect(MONGODB_URI).then(() => {
    console.log('MongoDB connected');
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}).catch(err => console.log(err));