import {
  GameState,
  HeroClass,
  Die,
  SkillCard,
  Monster,
  DungeonRoom,
  GameSaveData
} from './types';
import { HEROES } from '../data/heroes';
import { createCardInstance } from '../data/cards';
import { loadGameSave, saveGameData } from './save-manager';
import { generateActRooms } from '../engine/dungeon';
import { createMonsterInstance } from '../data/monsters';
import { Playroom } from '../playroom-sdk';

export interface CombatState {
  monster: Monster;
  dice: Die[];
  selectedDieId: string | null;
  cards: SkillCard[];
  freeRerollsUsed: number;
  freeFlipsUsed: number;
  turn: number;
  log: string[];
}

export interface RunState {
  heroClass: HeroClass;
  hp: number;
  maxHp: number;
  block: number;
  baseDiceCount: number;
  gold: number;
  soulsEarned: number;
  activePacts: string[];
  cards: SkillCard[];
  act: number;
  rooms: DungeonRoom[];
  currentRoomIdx: number;
  combat: CombatState | null;
  playroomRunId?: string;
}

export class GameStore {
  public state: GameState = 'TITLE';
  public save: GameSaveData;
  public run: RunState | null = null;
  public lastScore: number = 0;
  private startRunPromise: Promise<{ runId: string } | null> | null = null;
  private listeners: (() => void)[] = [];

  constructor() {
    this.save = loadGameSave();
  }

  public subscribe(fn: () => void): () => void {
    this.listeners.push(fn);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== fn);
    };
  }

  public notify(): void {
    this.listeners.forEach((fn) => fn());
  }

  public setState(newState: GameState): void {
    this.state = newState;
    this.notify();
  }

  public startRun(heroId: HeroClass): void {
    const hero = HEROES[heroId];
    const vitalityBonus = this.save.meta.talents.vitality * 4;
    const fortuneBonus = this.save.meta.talents.fortune * 25;
    const maxHp = hero.baseHp + vitalityBonus;

    const cards = hero.starterCards.map((id) => createCardInstance(id));
    const rooms = generateActRooms(1);

    this.run = {
      heroClass: heroId,
      hp: maxHp,
      maxHp,
      block: 0,
      baseDiceCount: hero.baseDiceCount,
      gold: 15 + fortuneBonus,
      soulsEarned: 0,
      activePacts: [],
      cards,
      act: 1,
      rooms,
      currentRoomIdx: 0,
      combat: null
    };

    this.save.meta.stats.runsPlayed += 1;
    saveGameData(this.save);

    // 非阻塞呼叫 Playroom.startRun() 取得局次 ID
    this.startRunPromise = Playroom.startRun()
      .then((res) => {
        if (res?.runId && this.run) {
          this.run.playroomRunId = res.runId;
        }
        return res;
      })
      .catch((err) => {
        console.warn('Playroom startRun error (non-fatal):', err);
        return null;
      });

    this.setState('MAP');
  }

  public getEffectiveDiceCount(): number {
    if (!this.run) return 3;
    let count = this.run.baseDiceCount;
    if (this.run.activePacts.includes('P_GAMBLER')) {
      count += 1; // 狂徒雙子骰 +1 骰
    }
    return Math.min(count, 6);
  }

  public enterCurrentRoom(): void {
    if (!this.run) return;
    const room = this.run.rooms[this.run.currentRoomIdx];
    if (!room) return;

    if (room.type === 'COMBAT' || room.type === 'ELITE' || room.type === 'BOSS') {
      const monsterId = room.monsterId || 'M_SKELETON';
      const monster = createMonsterInstance(monsterId);
      // P_SOUL_EATER effect: +25% monster damage
      if (this.run.activePacts.includes('P_SOUL_EATER')) {
        monster.intents.forEach((intent) => {
          if (intent.type === 'ATTACK') {
            intent.value = Math.ceil(intent.value * 1.25);
          }
        });
      }

      // Clone run cards for this combat
      const combatCards = this.run.cards.map((c) => ({
        ...c,
        slottedDice: []
      }));

      this.run.block = 0;
      this.run.combat = {
        monster,
        dice: [],
        selectedDieId: null,
        cards: combatCards,
        freeRerollsUsed: 0,
        freeFlipsUsed: 0,
        turn: 1,
        log: [`戰鬥開始！遭遇了【${monster.name}】！`]
      };

      this.setState('COMBAT');
    } else if (room.type === 'ALTAR') {
      this.setState('ALTAR');
    } else if (room.type === 'CAMPFIRE') {
      this.setState('CAMPFIRE');
    }
  }

  public completeCurrentRoom(): void {
    if (!this.run) return;
    const room = this.run.rooms[this.run.currentRoomIdx];
    if (room) {
      room.isCompleted = true;
      room.isCurrent = false;
    }

    this.run.currentRoomIdx += 1;

    // Check if act finished
    if (this.run.currentRoomIdx >= this.run.rooms.length) {
      if (this.run.act < 3) {
        // Proceed to next act
        this.run.act += 1;
        this.run.rooms = generateActRooms(this.run.act);
        this.run.currentRoomIdx = 0;
        this.run.rooms[0].isCurrent = true;
        this.run.rooms[0].isAvailable = true;
        if (this.run.act > this.save.meta.stats.highestAct) {
          this.save.meta.stats.highestAct = this.run.act;
          saveGameData(this.save);
        }
        this.setState('MAP');
      } else {
        // Run Victory!
        this.save.meta.stats.runsWon += 1;
        this.run.soulsEarned += 100; // Big win bonus
        this.save.meta.soulShards += this.run.soulsEarned;
        saveGameData(this.save);
        const finalScore = this.calculateCurrentScore(true);
        this.reportScore(finalScore);
        this.setState('VICTORY');
      }
    } else {
      // Next room in current act
      const nextRoom = this.run.rooms[this.run.currentRoomIdx];
      if (nextRoom) {
        nextRoom.isCurrent = true;
        nextRoom.isAvailable = true;
      }
      this.setState('MAP');
    }
  }

  public calculateCurrentScore(isVictory: boolean = false): number {
    if (!this.run) return 0;
    const completedActs = Math.max(0, this.run.act - 1);
    const completedRooms = this.run.currentRoomIdx;
    let score =
      this.run.soulsEarned * 10 +
      this.run.gold * 2 +
      completedActs * 300 +
      completedRooms * 50;

    if (isVictory) {
      score += 500 + this.run.hp * 2;
    }

    return Math.max(0, Math.floor(score));
  }

  public reportScore(score: number): void {
    this.lastScore = score;
    const promise = this.startRunPromise;
    if (!promise) return;

    promise
      .then((runInfo) => {
        const runId = runInfo?.runId || this.run?.playroomRunId;
        if (runId) {
          return Playroom.finishRun({ runId, score });
        }
        return null;
      })
      .then((result) => {
        if (result) {
          console.log('Playroom leaderboard score reported successfully:', result);
        }
      })
      .catch((err) => {
        console.warn('Playroom finishRun error (non-fatal):', err);
      });
  }

  public signPact(pactId: string): void {
    if (!this.run || this.run.activePacts.includes(pactId)) return;
    this.run.activePacts.push(pactId);

    // Apply immediate cost
    if (pactId === 'P_GREED') {
      // -25% Max HP
      this.run.maxHp = Math.max(10, Math.floor(this.run.maxHp * 0.75));
      this.run.hp = Math.min(this.run.hp, this.run.maxHp);
    }

    this.completeCurrentRoom();
  }

  public restAtCampfire(choice: 'HEAL' | 'TRAIN'): void {
    if (!this.run) return;
    if (choice === 'HEAL') {
      const healAmount = Math.floor(this.run.maxHp * 0.4);
      this.run.hp = Math.min(this.run.maxHp, this.run.hp + healAmount);
    } else {
      // TRAIN: max hp +5
      this.run.maxHp += 5;
      this.run.hp += 5;
    }
    this.completeCurrentRoom();
  }

  public gameOver(): void {
    if (this.run) {
      this.save.meta.soulShards += this.run.soulsEarned;
      saveGameData(this.save);
      const finalScore = this.calculateCurrentScore(false);
      this.reportScore(finalScore);
    }
    this.setState('GAME_OVER');
  }

  public upgradeTalent(talent: 'vitality' | 'destiny' | 'fortune'): boolean {
    const costs: Record<'vitality' | 'destiny' | 'fortune', number[]> = {
      vitality: [20, 40, 70],
      destiny: [50],
      fortune: [25, 50]
    };

    const currentLvl = this.save.meta.talents[talent];
    const costArray = costs[talent];
    if (currentLvl >= costArray.length) return false;

    const cost = costArray[currentLvl];
    if (this.save.meta.soulShards < cost) return false;

    this.save.meta.soulShards -= cost;
    this.save.meta.talents[talent] += 1;
    saveGameData(this.save);
    this.notify();
    return true;
  }

  public unlockHero(heroId: HeroClass, cost: number): boolean {
    if (this.save.meta.unlockedHeroes.includes(heroId)) return true;
    if (this.save.meta.soulShards < cost) return false;

    this.save.meta.soulShards -= cost;
    this.save.meta.unlockedHeroes.push(heroId);
    saveGameData(this.save);
    this.notify();
    return true;
  }
}

export const store = new GameStore();
