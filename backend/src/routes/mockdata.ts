import { Request, Response, Router } from 'express';

const router = Router();

// Helper function to generate random values within a range
const randomBetween = (min: number, max: number, decimals: number = 2): number => {
  return Number((Math.random() * (max - min) + min).toFixed(decimals));
};

// Helper function to generate random integer
const randomInt = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

// GET single mock sensor data point
router.get('/sensor', (req: Request, res: Response) => {
  const saunaStatuses = [1, 2, 3]; // 1: cooling down, 2: heating up, 3: at temperature
  const saunaStatus = saunaStatuses[randomInt(0, saunaStatuses.length - 1)];
  
  // Generate data based on sauna status
  let temp: number;
  let presence: number;
  let timeToTarget: number;
  
  if (saunaStatus === 1) {
    // Cooling down
    temp = randomBetween(70, 80);
    presence = 0;
    timeToTarget = 0;
  } else if (saunaStatus === 2) {
    // Heating up
    temp = randomBetween(40, 75);
    presence = 0;
    timeToTarget = randomInt(10, 180);
  } else {
    // At temperature
    temp = randomBetween(78, 82);
    presence = randomInt(0, 1);
    timeToTarget = 0;
  }

  const mockData = {
    deviceId: "f3673bfa-d2c5-4571-9268-5dbd7f9272e0",
    shadowName: "C1",
    subId: "C1",
    type: "SaunaSensor",
    organization: "ORG/prod:0:1190:1",
    sessionId: `f3673bfa-d2c5-4571-9268-5dbd7f9272e0_${Math.floor(Date.now() / 1000) - randomInt(0, 3600)}`,
    data: {
      heapSize: 85212,
      rssi: randomInt(-70, -60),
      tempEsp: randomBetween(42, 46, 1),
      targetTemp: 80.0,
      presence: presence,
      temp: temp,
      saunaStatus: saunaStatus,
      batteryLoadV: randomBetween(10.1, 10.2, 3),
      resetCnt: 2,
      hum: randomBetween(12, 52, 2),
      batteryVoltage: randomBetween(10.4, 10.5, 3),
      timeToTarget: timeToTarget
    },
    timestamp: Date.now().toString()
  };

  res.json({
    success: true,
    data: mockData
  });
});

// GET multiple mock sensor data points
router.get('/sensor/batch/:count', (req: Request, res: Response) => {
  const count = parseInt(req.params.count) || 10;
  
  if (count > 100) {
    res.status(400).json({
      success: false,
      message: 'Maximum batch size is 100'
    });
    return;
  }

  const mockDataPoints = [];
  const baseTimestamp = Date.now();

  for (let i = 0; i < count; i++) {
    const saunaStatuses = [1, 2, 3];
    const saunaStatus = saunaStatuses[randomInt(0, saunaStatuses.length - 1)];
    
    let temp: number;
    let presence: number;
    let timeToTarget: number;
    
    if (saunaStatus === 1) {
      temp = randomBetween(70, 80);
      presence = 0;
      timeToTarget = 0;
    } else if (saunaStatus === 2) {
      temp = randomBetween(40, 75);
      presence = 0;
      timeToTarget = randomInt(10, 180);
    } else {
      temp = randomBetween(78, 82);
      presence = randomInt(0, 1);
      timeToTarget = 0;
    }

    mockDataPoints.push({
      deviceId: "f3673bfa-d2c5-4571-9268-5dbd7f9272e0",
      shadowName: "C1",
      subId: "C1",
      type: "SaunaSensor",
      organization: "ORG/prod:0:1190:1",
      sessionId: `f3673bfa-d2c5-4571-9268-5dbd7f9272e0_${Math.floor(baseTimestamp / 1000) - randomInt(0, 3600)}`,
      data: {
        heapSize: 85212,
        rssi: randomInt(-70, -60),
        tempEsp: randomBetween(42, 46, 1),
        targetTemp: 80.0,
        presence: presence,
        temp: temp,
        saunaStatus: saunaStatus,
        batteryLoadV: randomBetween(10.1, 10.2, 3),
        resetCnt: 2,
        hum: randomBetween(12, 52, 2),
        batteryVoltage: randomBetween(10.4, 10.5, 3),
        timeToTarget: timeToTarget
      },
      timestamp: (baseTimestamp - (i * 10000)).toString()
    });
  }

  res.json({
    success: true,
    count: mockDataPoints.length,
    data: mockDataPoints
  });
});

export default router;

