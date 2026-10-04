export type HeroClass = 'WARRIOR' | 'ROGUE' | 'MAGE';

export interface HeroData {
  id: HeroClass;
  name: string;
  title: string;
  baseHp: number;
  baseDiceCount: number;
  perkName: string;
  perkDesc: string;
  avatar: string;
  starterCards: string[];
}

export interface Die {
  id: string;
  value: number; // 1 ~ 6
  isUsed: boolean;
  isLocked: boolean;
  isRolling: boolean;
}

export type SocketType = 'ANY' | 'MIN' | 'MAX' | 'EVEN' | 'ODD' | 'PAIR' | 'SUM';

export interface SocketRule {
  type: SocketType;
  param?: number;
}

export interface SkillCard {
  id: string;
  name: string;
  heroClass: HeroClass | 'NEUTRAL';
  description: string;
  rule: SocketRule;
  maxDice: number;
  slottedDice: Die[];
  executeText: string;
}

export interface MonsterIntent {
  type: 'ATTACK' | 'DEFEND' | 'DEBUFF' | 'SPECIAL';
  value: number;
  name: string;
  description: string;
}

export interface Monster {
  id: string;
  name: string;
  act: number;
  maxHp: number;
  currentHp: number;
  block: number;
  poison: number;
  burn: number;
  intents: MonsterIntent[];
  currentIntentIdx: number;
  isBoss?: boolean;
  isElite?: boolean;
  avatar: string;
}

export interface Pact {
  id: string;
  name: string;
  title: string;
  benefitText: string;
  costText: string;
}

export type RoomType = 'COMBAT' | 'ELITE' | 'ALTAR' | 'CAMPFIRE' | 'BOSS';

export interface DungeonRoom {
  id: string;
  act: number;
  floor: number;
  type: RoomType;
  title: string;
  isCompleted: boolean;
  isCurrent: boolean;
  isAvailable: boolean;
  monsterId?: string;
}

export type GameState =
  | 'TITLE'
  | 'HALL_OF_SOULS'
  | 'HERO_SELECT'
  | 'MAP'
  | 'COMBAT'
  | 'ALTAR'
  | 'CAMPFIRE'
  | 'VICTORY'
  | 'GAME_OVER';

export interface TalentLevels {
  vitality: number; // 0 ~ 3 (+4 HP each)
  destiny: number;  // 0 ~ 1 (+1 free reroll per combat)
  fortune: number;  // 0 ~ 2 (+25 Gold each)
}

export interface GameSaveData {
  version: 1;
  timestamp: number;
  meta: {
    soulShards: number;
    unlockedHeroes: HeroClass[];
    unlockedPacts: string[];
    talents: TalentLevels;
    stats: {
      runsPlayed: number;
      runsWon: number;
      enemiesSlain: number;
      highestAct: number;
    };
  };
}
