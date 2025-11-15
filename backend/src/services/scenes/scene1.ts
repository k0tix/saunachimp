import { GameEvent, getHousekeepingSceneStatus, HousekeepingStatus, setHousekeepingScene, setHousekeepingSceneStatus, } from "../housekeeping";

export const handleScene1 = async (HousekeepingStatus: HousekeepingStatus): Promise<GameEvent> => {
  if (getHousekeepingSceneStatus() === 0) {
    setHousekeepingSceneStatus(1);
    return {
        event_type: 'START_SCENE',
        run_at: Date.now(),
    };
  }

  // ja kun loppuevent
  setHousekeepingScene(0);
  return {
    event_type: 'LOSS',// WIN or LOSS
    run_at: Date.now(),
  };
};