import { GameEvent, getHousekeepingSceneStartAt, getHousekeepingSceneStatus, HousekeepingStatus, setHousekeepingScene, setHousekeepingSceneStartAt, setHousekeepingSceneStatus, } from "../housekeeping";

export const handleSceneEnd = async (housekeepingStatus: HousekeepingStatus): Promise<GameEvent[]> => {
  if (getHousekeepingSceneStatus() === 0) {
    setHousekeepingSceneStatus(1);
    setHousekeepingSceneStartAt(Date.now());
  }
  const timeOffset = Date.now() - (getHousekeepingSceneStartAt() ?? 0);

  if (timeOffset> 1000 * 15) { // 15 seconds
    setHousekeepingScene(0);
  }
  return [];
};