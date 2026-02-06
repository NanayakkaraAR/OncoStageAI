import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pool from './config/database';
import authRoutes from './routes/auth.routes';
import protectedRoutes from './routes/protected.routes';

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.get('/', (req: Request, res: Response) => {
  res.json({ message: 'OncoStage AI API is running' });
});

// Auth routes
app.use('/api/auth', authRoutes);

// Protected routes
app.use('/api', protectedRoutes);

app.get('/api/health', async (req: Request, res: Response) => {
  try {
    // Test database connection
    const result = await pool.query('SELECT NOW()');
    res.json({ 
      status: 'healthy', 
      timestamp: new Date().toISOString(),
      database: 'connected',
      dbTime: result.rows[0].now
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'unhealthy', 
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Database test route
app.get('/api/db-test', async (req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT version()');
    res.json({ 
      success: true,
      postgresVersion: result.rows[0].version 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: error instanceof Error ? error.message : 'Database connection failed'
    });
  }
});

// Start server
app.listen(port, () => {
  console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
});
