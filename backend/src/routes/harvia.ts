import { Request, Response, Router } from 'express';
import  { getLatestData } from '../services/harvia';

const router = Router();

// GET current sauna status
router.get('/data', async (req: Request, res: Response) => {
  try {

    const result = await getLatestData();
    
    if (!result.ok) {
      res.status(500).json({
        success: false,
        message: 'Failed to get sauna status',
        error: result.statusText,
      });
      return;
    }
    const data = await result.json();

    res.json({
      success: true,
      data: data,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching sauna status',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;

