import 'dotenv/config';
import mongoose from 'mongoose';
import app from './app';

// 1. Fail-Fast Environment Variable Validation
const requiredEnvVars = ['JWT_SECRET', 'GOOGLE_CLIENT_ID', 'MONGODB_URI'];
for (const key of requiredEnvVars) {
    if (!process.env[key]) {
        console.error(`FATAL ERROR: Missing required env var: ${key}`);
        process.exit(1);
    }
}

const PORT = process.env.PORT || 4000;
const MONGODB_URI = process.env.MONGODB_URI as string;

// 2. Start Database and Server
let server: any;

mongoose.connect(MONGODB_URI).then(() => {
    console.log('MongoDB connected successfully.');
    
    server = app.listen(PORT, () => {
        console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}.`);
    });
}).catch(err => {
    console.error('MongoDB connection failed:', err);
    process.exit(1);
});

// 3. Graceful Shutdown
// Ensures active connections and database writes are completed before the server terminates.
const gracefulShutdown = () => {
    console.log('Initiating graceful shutdown...');
    if (server) {
        server.close(() => {
            console.log('HTTP server closed.');
            mongoose.connection.close(false).then(() => {
                console.log('MongoDB connection closed.');
                process.exit(0);
            });
        });
    } else {
        process.exit(0);
    }
};

process.on('SIGINT', gracefulShutdown);  // Triggered by manual termination (Ctrl+C)
process.on('SIGTERM', gracefulShutdown); // Triggered by cloud provider scaling down