import { GameEvent, getHousekeepingSceneStartAt, getHousekeepingSceneStatus, HousekeepingStatus, setHousekeepingSceneStartAt, setHousekeepingSceneStatus } from "../housekeeping";

export const handleSceneGuitarHero = async (housekeepingStatus: HousekeepingStatus): Promise<GameEvent[]> => {
  // Initialize on first run
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
        run_at: Date.now() + 30 * 1000, // 30 seconds for the game
      },
    ];
  }

  const timeOffset = Date.now() - (getHousekeepingSceneStartAt() ?? 0);

  // Optional: React to löyly throws during the game (can be used for future features)
  if (housekeepingStatus.info.loyly) {
    setHousekeepingSceneStatus(getHousekeepingSceneStatus() + 1);
    return [{
      event_type: 'THROW_LOYLY',
      run_at: Date.now(),
    }];
  }

  return [];
};
