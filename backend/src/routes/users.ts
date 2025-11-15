import { Request, Response, Router } from 'express';
import { query } from '../config/database';
import { RowDataPacket } from 'mysql2';

const router = Router();

interface User extends RowDataPacket {
  id: string;
  username: string;
  email: string;
  money: number;
  created_at: Date;
  updated_at: Date;
}

// GET user by ID
router.get('/:user_id', async (req: Request, res: Response) => {
  try {
    const { user_id } = req.params;

    const users = await query('SELECT * FROM users WHERE id = ?', [user_id]) as User[];

    if (users.length === 0) {
      res.status(404).json({
        success: false,
        message: 'User not found',
      });
      return;
    }

    res.json({
      success: true,
      data: users[0],
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching user',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;

