import { Request, Response, Router } from 'express';
import mockDataSequence from './mockdata.json';

const router = Router();

// Configurable interval between advancing to next datapoint (ms)
let stepIntervalMs = 10000; // default 10s

// Steam event state
interface SteamEvent {
  start: number;
  peakValue: number;
  peakDurationMs: number;
  decayDurationMs: number;
}
let steamEvent: SteamEvent | null = null;

const startTime = Date.now();
const sequenceLength = mockDataSequence.length;
const getCurrentIndex = (): number => {
  const elapsedMs = Date.now() - startTime;
  const idx = Math.floor(elapsedMs / stepIntervalMs);
  return Math.min(idx, sequenceLength - 1);
};

// Compute humidity with steam effect for a datapoint index (index maps to a simulated timestamp)
const computeHumidity = (baseHum: number, index: number, useRealTime: boolean = false): number => {
  if (!steamEvent) return baseHum;
  const event = steamEvent;
  const nowForPoint = useRealTime ? Date.now() : (startTime + index * stepIntervalMs);
  const elapsed = nowForPoint - event.start;
  if (elapsed < 0) return baseHum;

  let addition = 0;
  if (elapsed < event.peakDurationMs) {
    addition = event.peakValue;
  } else if (elapsed < event.peakDurationMs + event.decayDurationMs) {
    const decayElapsed = elapsed - event.peakDurationMs;
    addition = event.peakValue * (1 - decayElapsed / event.decayDurationMs);
  } else {
    addition = 0;
  }
  if (addition < 0) addition = 0;
  const adjusted = baseHum + addition;
  return Math.min(Math.max(adjusted, 0), 100);
};

// Trigger steam throw
router.post('/sensor/steam', (req: Request, res: Response) => {
  const {
    peakValue = 25,
    peakDurationSeconds = 10,
    decayDurationSeconds = 30
  } = req.body || {};

  if (peakValue <= 0 || peakDurationSeconds <= 0 || decayDurationSeconds < 0) {
    res.status(400).json({ success: false, message: 'Invalid steam parameters' });
    return;
  }

  steamEvent = {
    start: Date.now(),
    peakValue,
    peakDurationMs: peakDurationSeconds * 1000,
    decayDurationMs: decayDurationSeconds * 1000
  };

  res.json({ success: true, steamEvent });
});

// Set interval between datapoints
router.post('/sensor/interval', (req: Request, res: Response) => {
  const { intervalSeconds } = req.body || {};
  const seconds = Number(intervalSeconds);
  if (!seconds || seconds <= 0) {
    res.status(400).json({ success: false, message: 'intervalSeconds must be > 0' });
    return;
  }
  stepIntervalMs = seconds * 1000;
  res.json({ success: true, stepIntervalMs });
});

// GET single mock sensor data point (sequential + steam humidity effect)
router.get('/sensor', (req: Request, res: Response) => {
  const currentIndex = getCurrentIndex();
  const base = mockDataSequence[currentIndex];
  // Clone shallow to avoid mutating original sequence
  const enriched = { ...base, data: { ...base.data } };
  enriched.data.hum = computeHumidity(base.data.hum, currentIndex, true);
  res.json({
    success: true,
    data: enriched
  });
});

// GET multiple mock sensor data points (current + previous, humidity per historical index)
router.get('/sensor/batch/:count', (req: Request, res: Response) => {
  const requested = parseInt(req.params.count) || 10;
  if (requested > 100) {
    res.status(400).json({ success: false, message: 'Maximum batch size is 100' });
    return;
  }
  const currentIndex = getCurrentIndex();
  const startIndex = Math.max(0, currentIndex - requested + 1);
  const slice = mockDataSequence.slice(startIndex, currentIndex + 1).map((dp, i) => {
    const idx = startIndex + i;
    const clone = { ...dp, data: { ...dp.data } };
    clone.data.hum = computeHumidity(dp.data.hum, idx);
    return clone;
  });
  res.json({
    success: true,
    count: slice.length,
    data: slice
  });
});

export default router;

