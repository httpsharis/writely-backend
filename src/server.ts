import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import userRoutes from './api/user/userRoute'; 

const app = express();
app.use(express.json());

// --- ROUTES ---
// Any request starting with /api/users gets sent to the user router
app.use('/api/users', userRoutes); 
// --------------

const PORT = process.env.PORT || 4000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/writely';

mongoose.connect(MONGODB_URI).then(() => {
  console.log('MongoDB connected');
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}).catch(err => console.log(err));