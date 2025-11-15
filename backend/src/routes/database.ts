import { Request, Response, Router } from 'express';
import { readFileSync } from 'fs';
import { join } from 'path';
import pool from '../config/database';

const router = Router();

// POST reinitialize database from init.sql
router.post('/reset', async (req: Request, res: Response) => {
  try {
    // Read init.sql file
    const initSqlPath = join(__dirname, '../../init.sql');
    const initSql = readFileSync(initSqlPath, 'utf8');
    
    // Split by semicolons and filter out empty statements
    const statements = initSql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    // Execute each statement
    const connection = await pool.getConnection();
    
    try {
      for (const statement of statements) {
        await connection.query(statement);
      }
      
      connection.release();
      
      res.json({
        success: true,
        message: 'Database reinitialized successfully',
        statementsExecuted: statements.length,
      });
    } catch (error) {
      connection.release();
      throw error;
    }
  } catch (error) {
    console.error('Database reset error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reinitialize database',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;

