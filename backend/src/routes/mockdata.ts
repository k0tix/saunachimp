import { Request, Response, Router } from 'express';
import mockDataSequence from './mockdata.json';

const router = Router();

const startTime = Date.now();
const sequenceLength = mockDataSequence.length;
const getCurrentIndex = (): number => {
  const elapsedMs = Date.now() - startTime;
  const idx = Math.floor(elapsedMs / 10000); // 10s per step
  return Math.min(idx, sequenceLength - 1);
};

// GET single mock sensor data point (now sequential)
router.get('/sensor', (req: Request, res: Response) => {
  const currentIndex = getCurrentIndex();
  res.json({
    success: true,
    data: mockDataSequence[currentIndex]
  });
});

// GET multiple mock sensor data points (current + previous)
router.get('/sensor/batch/:count', (req: Request, res: Response) => {
  const requested = parseInt(req.params.count) || 10;
  if (requested > 100) {
    res.status(400).json({ success: false, message: 'Maximum batch size is 100' });
    return;
  }
  const currentIndex = getCurrentIndex();
  const startIndex = Math.max(0, currentIndex - requested + 1);
  const slice = mockDataSequence.slice(startIndex, currentIndex + 1);
  res.json({
    success: true,
    count: slice.length,
    data: slice
  });
});

export default router;

