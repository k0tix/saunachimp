import express, { Express, Request, Response } from 'express';
import dotenv from 'dotenv';
import { testConnection } from './config/database';
import productRoutes from './routes/products';
import mockDataRoutes from './routes/mockdata';
import controlRoutes from './routes/control';
import databaseRoutes from './routes/database';
import harviaRoutes from './routes/harvia';
import ownedProductsRoutes from './routes/owned-products';
import { startHousekeeping } from './services/housekeeping';

// Load environment variables
dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/products', productRoutes);
app.use('/api/mockdata', mockDataRoutes);
app.use('/api/control', controlRoutes);
app.use('/api/database', databaseRoutes);
app.use('/api/harvia', harviaRoutes);
app.use('/api/owned-products', ownedProductsRoutes);

// Root endpoint
app.get('/', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Welcome to the API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      products: '/api/products',
      mockData: '/api/mockdata/sensor',
      housekeepingControl: '/api/control',
      databaseReset: '/api/database/reset',
      harviaSauna: '/api/harvia',
      ownedProducts: '/api/owned-products',
    },
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

// Start server
const startServer = async () => {
  try {
    // Test database connection
    const dbConnected = await testConnection();
    
    if (!dbConnected) {
      console.error('Failed to connect to database. Exiting...');
      process.exit(1);
    }

    app.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
      console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
    });

    // Start housekeeping loop (runs every 10 seconds)
    startHousekeeping(10000);
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;

