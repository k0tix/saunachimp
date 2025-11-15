import { GameEvent, getHousekeepingSceneStartAt, getHousekeepingSceneStatus, HousekeepingStatus, setHousekeepingScene, setHousekeepingSceneStartAt, setHousekeepingSceneStatus, } from "../housekeeping";

export const handleScene1 = async (HousekeepingStatus: HousekeepingStatus): Promise<GameEvent[]> => {
  if (getHousekeepingSceneStatus() === 0) {
    setHousekeepingSceneStatus(1);
    setHousekeepingSceneStartAt(Date.now());
    return [
        {
            event_type: 'START_SCENE',
            run_at: Date.now(),
        },
        {
            event_type: 'SCENE_WIN',
            run_at: Date.now() + 5*60*1000, // 5 minutes
        },
    ];
  }
  const timeOffset = Date.now() - (getHousekeepingSceneStartAt() ?? 0);

  if (HousekeepingStatus.info.loyly) {
    // add update user money
    setHousekeepingSceneStatus(getHousekeepingSceneStatus() + 1);

    return [{
      event_type: 'THROW_LOYLY',
      run_at: Date.now(),   
    }];
  }
  return [];
};


const shouldThrowLoyly = (timeOffset: number, sceneStatus: number): boolean => {
  if (timeOffset < 0 && timeOffset < 10000 && sceneStatus === 1) {
    return true;
  }
  return false;
}