import { Request, Response, Router } from 'express';
import { getHousekeepingStatus, setHousekeepingEnabled } from '../services/housekeeping';

const router = Router();

// GET current housekeeping status
router.get('/status', (req: Request, res: Response) => {
  const status = getHousekeepingStatus();
  res.json({
    success: true,
    data: {
      enabled: status.enabled,
      runCount: status.runCount,
      lastRunTime: status.lastRunTime,
      intervalMs: status.intervalMs,
    },
  });
});

// POST toggle housekeeping on/off
router.post('/toggle', (req: Request, res: Response) => {
  const currentStatus = getHousekeepingStatus();
  const newEnabled = !currentStatus.enabled;
  
  setHousekeepingEnabled(newEnabled);
  
  res.json({
    success: true,
    message: `Housekeeping ${newEnabled ? 'enabled' : 'disabled'}`,
    data: {
      enabled: newEnabled,
    },
  });
});

// PUT set housekeeping state explicitly
router.put('/enable', (req: Request, res: Response) => {
  const { enabled } = req.body;
  
  if (typeof enabled !== 'boolean') {
    res.status(400).json({
      success: false,
      message: 'enabled must be a boolean value',
    });
    return;
  }
  
  setHousekeepingEnabled(enabled);
  
  res.json({
    success: true,
    message: `Housekeeping ${enabled ? 'enabled' : 'disabled'}`,
    data: {
      enabled,
    },
  });
});

export default router;

