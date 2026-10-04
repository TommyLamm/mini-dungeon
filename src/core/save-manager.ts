import { GameSaveData, HeroClass } from './types';

const SAVE_KEY = 'mini-dungeon:save:v1';

export function getDefaultSave(): GameSaveData {
  return {
    version: 1,
    timestamp: Date.now(),
    meta: {
      soulShards: 0,
      unlockedHeroes: ['WARRIOR'] as HeroClass[],
      unlockedPacts: ['P_GREED', 'P_GAMBLER', 'P_GLASS'],
      talents: {
        vitality: 0,
        destiny: 0,
        fortune: 0
      },
      stats: {
        runsPlayed: 0,
        runsWon: 0,
        enemiesSlain: 0,
        highestAct: 1
      }
    }
  };
}

export function loadGameSave(): GameSaveData {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) {
      const initial = getDefaultSave();
      saveGameData(initial);
      return initial;
    }
    const data = JSON.parse(raw);
    if (data.version !== 1) {
      console.warn('[SaveManager] 存檔版本遷移中...');
      return migrateSave(data);
    }
    // Ensure all required properties exist
    if (!data.meta) data.meta = getDefaultSave().meta;
    if (!data.meta.talents) data.meta.talents = getDefaultSave().meta.talents;
    if (!data.meta.stats) data.meta.stats = getDefaultSave().meta.stats;
    return data;
  } catch (e) {
    console.error('[SaveManager] 讀取存檔失敗，初始化為預設值', e);
    return getDefaultSave();
  }
}

export function saveGameData(data: GameSaveData): void {
  try {
    data.timestamp = Date.now();
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('[SaveManager] 儲存至 localStorage 失敗', e);
  }
}

function migrateSave(legacy: any): GameSaveData {
  const fresh = getDefaultSave();
  if (typeof legacy?.soulShards === 'number') {
    fresh.meta.soulShards = legacy.soulShards;
  }
  saveGameData(fresh);
  return fresh;
}
