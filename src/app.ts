import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { errorMiddleware } from './middleware/error.middleware';
import routes from './routes';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

import { setupSwagger } from './config/swagger';

// Routes
app.use('/api', routes); // Using /api prefix as per document

setupSwagger(app);

// Error handling middleware
app.use(errorMiddleware as any);

export default app;
