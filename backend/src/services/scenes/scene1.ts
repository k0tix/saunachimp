import { GameEvent, HousekeepingStatus } from "../housekeeping";

export const handleScene1 = async (HousekeepingStatus: HousekeepingStatus): Promise<GameEvent> => {
  return {
    event_type: 'START_SCENE_1',
    run_at: Date.now(),
  };
};