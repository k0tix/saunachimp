import { query } from '../config/database';
import { handleScene1 } from './scenes/scene1';

const HUM_CHANGE_THRESHOLD = 10;
interface SensorData {
  heapSize: number;
  rssi: number;
  tempEsp: number;
  targetTemp: number;
  presence: number;
  temp: number;
  saunaStatus: number;
  batteryLoadV: number;
  resetCnt: number;
  hum: number;
  batteryVoltage: number;
  timeToTarget: number;
}

interface MockDataResponse {
  success: boolean;
  data: {
    deviceId: string;
    shadowName: string;
    subId: string;
    type: string;
    organization: string;
    sessionId: string;
    data: SensorData;
    timestamp: string;
  };
}

export interface GameEvent {
  event_type: string;
  run_at: number;
}

export interface HousekeepingStatus {
  enabled: boolean;
  runCount: number;
  lastRunTime: string | null;
  intervalMs: number;
  info: {
    temp: number;
    humidity: number;
    presence: boolean;
    loyly: boolean;
  };
  game: {
    scene_config: {
      status: number;
      id: number;
      start_at: number | null;
    };
    event_queue: GameEvent[];
  };
}

// Housekeeping state
let housekeepingState: HousekeepingStatus = {
  enabled: true,
  runCount: 0,
  lastRunTime: null,
  intervalMs: 10000,
  info: {
    temp: 0,
    humidity: 0,
    presence: false,
    loyly: false,
  },
  game: {
    scene_config: {
      id: 0,
      status: 0,
      start_at: null,
    },
    event_queue: [],
  },
};

// Get current housekeeping status
export const getHousekeepingStatus = (): HousekeepingStatus => {
  return { ...housekeepingState };
};

// Set housekeeping enabled/disabled
export const setHousekeepingEnabled = (enabled: boolean): void => {
  housekeepingState.enabled = enabled;
  console.log(`🔧 Housekeeping ${enabled ? 'ENABLED' : 'DISABLED'}`);
};
export const setHousekeepingScene = (scene_id: number): void => {
  housekeepingState.game.scene_config.id = scene_id;
  housekeepingState.game.scene_config.status = 0;
  console.log(`🔧 Scene ${scene_id} set`);
};
export const setHousekeepingSceneStatus = (status: number): void => {
  housekeepingState.game.scene_config.status = status;
  console.log(`🔧 Scene ${status} set`);
};
export const getHousekeepingSceneStatus = (): number => {
  return housekeepingState.game.scene_config.status;
};
export const getHousekeepingScene = (): number => {
  return housekeepingState.game.scene_config.id;
};
export const setHousekeepingSceneStartAt = (start_at: number): void => {
  housekeepingState.game.scene_config.start_at = start_at;
  console.log(`🔧 Scene start at ${start_at} set`);
};
export const getHousekeepingSceneStartAt = (): number | null => {
  return housekeepingState.game.scene_config.start_at;
};
export const getHousekeepingEvents = (): GameEvent[] => {
  const events = housekeepingState.game.event_queue.filter((event) => event.run_at <= Date.now());
  housekeepingState.game.event_queue = housekeepingState.game.event_queue.filter((event) => event.run_at > Date.now());
  return events;
};

// Fetch mock sensor data from API and log to database
const fetchAndLogSensorData = async () => {
  try {
    const PORT = process.env.PORT || 3000;
    const response = await fetch(`http://localhost:${PORT}/api/mockdata/sensor`);
    
    if (!response.ok) {
      console.error(`❌ Failed to fetch mock data: ${response.status}`);
      return;
    }

    const result = await response.json() as MockDataResponse;
    
    if (!result.success || !result.data) {
      console.error('❌ Invalid mock data response');
      return;
    }

    const { data } = result;
    housekeepingState.info = {
      temp: data.data.temp,
      humidity: data.data.hum,
      presence: data.data.presence > 0,
      loyly: false,
    };

    try {
      const last_hum_data = await query(
        `SELECT hum from sensor_logs order by id desc limit 1`,
      ) as any[];
      const last_hum = (last_hum_data as any)[0].hum ?? 0;
      if ( data.data.hum-last_hum > HUM_CHANGE_THRESHOLD) {
        housekeepingState.info.loyly = true;
      }
    } catch (error) {
      console.error('❌ Error fetching last humidity data:', error);
    }
    // Insert sensor data into database
    await query(
      `INSERT INTO sensor_logs (
        device_id, shadow_name, sub_id, type, organization, session_id,
        heap_size, rssi, temp_esp, target_temp, presence, temp,
        sauna_status, battery_load_v, reset_cnt, hum, battery_voltage,
        time_to_target, sensor_timestamp
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.deviceId,
        data.shadowName,
        data.subId,
        data.type,
        data.organization,
        data.sessionId,
        data.data.heapSize,
        data.data.rssi,
        data.data.tempEsp,
        data.data.targetTemp,
        data.data.presence,
        data.data.temp,
        data.data.saunaStatus,
        data.data.batteryLoadV,
        data.data.resetCnt,
        data.data.hum,
        data.data.batteryVoltage,
        data.data.timeToTarget,
        data.timestamp
      ]
    );

    console.log(`📊 Logged sensor data: temp=${data.data.temp}°C, status=${data.data.saunaStatus}, presence=${data.data.presence}`);
  } catch (error) {
    console.error('❌ Error fetching and logging sensor data:', error);
  }
};
const checkGameEnd = () => {
  if(
    housekeepingState
      .game
      .event_queue
      .filter(
        (event) =>
          event.run_at <= Date.now()
          && (event.event_type === 'SCENE_WIN' || event.event_type === 'SCENE_LOSS')
      ).length > 0
    ) {
      setHousekeepingScene(0);
      }
};
// Main housekeeping runner
export const runHousekeeping = async () => {
  // Check if housekeeping is enabled
  if (!housekeepingState.enabled) {
    return; // Skip if disabled
  }

  try {
    housekeepingState.runCount++;
    housekeepingState.lastRunTime = new Date().toISOString();
    await fetchAndLogSensorData();


    switch (housekeepingState.game.scene_config.id) {
      case 0:
        return;
      case 1:
        housekeepingState.game.event_queue = [...housekeepingState.game.event_queue, ...(await handleScene1(housekeepingState))] ;
        break;
      default:
        return;
    }
    checkGameEnd()


  } catch (error) {
    console.error('❌ Housekeeping error:', error);
  }
};

// Start the housekeeping interval loop
export const startHousekeeping = (intervalMs: number = 10000) => {
  housekeepingState.intervalMs = intervalMs;
  console.log(`🔄 Starting housekeeping loop (every ${intervalMs}ms)`);
  
  // Run immediately on startup
  runHousekeeping();
  
  // Then run at regular intervals
  setInterval(() => {
    runHousekeeping();
  }, intervalMs);
};

