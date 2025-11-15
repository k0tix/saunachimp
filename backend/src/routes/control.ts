import { Request, Response, Router } from 'express';
import { getHousekeepingEvents, getHousekeepingScene, getHousekeepingStatus, setHousekeepingEnabled, setHousekeepingScene } from '../services/housekeeping';

const router = Router();

// GET current housekeeping status
router.get('/status', (req: Request, res: Response) => {
  const status = getHousekeepingStatus();
  res.json({
    success: true,
    data: {
      scene: getHousekeepingScene(),
      enabled: status.enabled,
      runCount: status.runCount,
      lastRunTime: status.lastRunTime,
      intervalMs: status.intervalMs,
      info: status.info,
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

router.post('/scene/start/:scene_id', (req: Request, res: Response) => {
  const scene_id = req.params.scene_id;
  setHousekeepingScene(parseInt(scene_id));
  res.json({
    success: true,
    message: `Scene ${scene_id} started`, 
  });
});

router.get('/scene/events', (req: Request, res: Response) => {
  const events = getHousekeepingEvents()
  res.json({
    success: true,
    data: events,
  });
});

export default router;

