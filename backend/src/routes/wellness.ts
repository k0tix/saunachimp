import { Request, Response, Router } from 'express';
import { query } from '../config/database';
import { RowDataPacket } from 'mysql2';

const router = Router();

interface WellnessRow extends RowDataPacket {
  id: number;
  session_id: string;
  wellness: string;
  sensor_timestamp: string; // stored as VARCHAR
}

// GET latest wellness result for a specific session_id
router.get('/session/:session_id', async (req: Request, res: Response) => {
  try {
    const { session_id } = req.params;
    const rows = await query(
      `
      SELECT id, session_id, wellness, sensor_timestamp
      FROM wellness_results
      WHERE session_id = ?
      ORDER BY CAST(sensor_timestamp AS UNSIGNED) DESC
      LIMIT 1
      `,
      [session_id]
    ) as WellnessRow[];

    if (rows.length === 0) {
      res.status(404).json({
        success: false,
        message: 'No wellness result found for session_id',
      });
      return;
    }

    res.json({
      success: true,
      data: rows[0],
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching wellness result',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// GET latest wellness result per session (one row per session_id)
router.get('/latest', async (_req: Request, res: Response) => {
  try {
    const rows = await query(
      `
      SELECT wr.id, wr.session_id, wr.wellness, wr.sensor_timestamp
      FROM wellness_results wr
      INNER JOIN (
        SELECT session_id, MAX(CAST(sensor_timestamp AS UNSIGNED)) AS max_ts
        FROM wellness_results
        GROUP BY session_id
      ) latest
        ON wr.session_id = latest.session_id
       AND CAST(wr.sensor_timestamp AS UNSIGNED) = latest.max_ts
      ORDER BY latest.max_ts DESC
      `
    ) as WellnessRow[];

    res.json({
      success: true,
      count: rows.length,
      data: rows,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching latest wellness results',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;

