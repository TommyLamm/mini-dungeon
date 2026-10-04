import { Monster } from '../core/types';

export const MONSTERS: Record<string, Monster> = {
  // 第一幕：古代墓穴
  M_SKELETON: {
    id: 'M_SKELETON',
    name: '骷髏小卒',
    act: 1,
    maxHp: 24,
    currentHp: 24,
    block: 0,
    poison: 0,
    burn: 0,
    avatar: '💀',
    currentIntentIdx: 0,
    intents: [
      { type: 'ATTACK', value: 6, name: '生鏽骨刀', description: '造成 6 點傷害' },
      { type: 'DEFEND', value: 6, name: '舉骨盾', description: '獲得 6 點護甲' },
      { type: 'ATTACK', value: 8, name: '突刺猛砍', description: '造成 8 點傷害' }
    ]
  },
  M_SPIDER: {
    id: 'M_SPIDER',
    name: '墓穴腐蛛',
    act: 1,
    maxHp: 30,
    currentHp: 30,
    block: 0,
    poison: 0,
    burn: 0,
    avatar: '🕷️',
    currentIntentIdx: 0,
    intents: [
      { type: 'DEBUFF', value: 2, name: '毒囊噴射', description: '施加 2 層中毒' },
      { type: 'ATTACK', value: 7, name: '螯牙咬擊', description: '造成 7 點傷害' },
      { type: 'ATTACK', value: 10, name: '致命撕咬', description: '造成 10 點傷害' }
    ]
  },
  M_BANDIT: {
    id: 'M_BANDIT',
    name: '墓園劫掠者',
    act: 1,
    maxHp: 48,
    currentHp: 48,
    block: 5,
    poison: 0,
    burn: 0,
    isElite: true,
    avatar: '🥷',
    currentIntentIdx: 0,
    intents: [
      { type: 'ATTACK', value: 11, name: '重砍猛擊', description: '造成 11 點傷害' },
      { type: 'DEFEND', value: 10, name: '暗影格擋', description: '獲得 10 點護盾' },
      { type: 'ATTACK', value: 15, name: '劫掠斬首', description: '造成 15 點致命傷害' }
    ]
  },
  BOSS_WARDEN: {
    id: 'BOSS_WARDEN',
    name: '墓穴騎士領主',
    act: 1,
    maxHp: 75,
    currentHp: 75,
    block: 10,
    poison: 0,
    burn: 0,
    isBoss: true,
    avatar: '👑',
    currentIntentIdx: 0,
    intents: [
      { type: 'DEFEND', value: 12, name: '亡靈壁壘', description: '獲得 12 點護盾' },
      { type: 'ATTACK', value: 14, name: '死靈重劍', description: '造成 14 點傷害' },
      { type: 'DEFEND', value: 8, name: '骨骸復甦', description: '獲得 8 點護盾' },
      { type: 'ATTACK', value: 18, name: '破壞打擊', description: '造成 18 點高額傷害' }
    ]
  },

  // 第二幕：熔岩裂隙
  M_IMP: {
    id: 'M_IMP',
    name: '熔岩火鬼',
    act: 2,
    maxHp: 38,
    currentHp: 38,
    block: 0,
    poison: 0,
    burn: 0,
    avatar: '👺',
    currentIntentIdx: 0,
    intents: [
      { type: 'ATTACK', value: 10, name: '熾熱爪擊', description: '造成 10 點傷害' },
      { type: 'ATTACK', value: 13, name: '烈焰噴射', description: '造成 13 點火焰傷害' }
    ]
  },
  M_GOLEM: {
    id: 'M_GOLEM',
    name: '熔岩石像',
    act: 2,
    maxHp: 68,
    currentHp: 68,
    block: 10,
    poison: 0,
    burn: 0,
    isElite: true,
    avatar: '🗿',
    currentIntentIdx: 0,
    intents: [
      { type: 'DEFEND', value: 16, name: '黑曜石護體', description: '獲得 16 點護盾' },
      { type: 'SPECIAL', value: 0, name: '大地震顫蓄力', description: '全力聚能準備下回擊' },
      { type: 'ATTACK', value: 24, name: '天崩地裂', description: '造成 24 點毀滅傷害' }
    ]
  },
  BOSS_DRAGON: {
    id: 'BOSS_DRAGON',
    name: '熔火巨龍',
    act: 2,
    maxHp: 115,
    currentHp: 115,
    block: 15,
    poison: 0,
    burn: 0,
    isBoss: true,
    avatar: '🐉',
    currentIntentIdx: 0,
    intents: [
      { type: 'ATTACK', value: 16, name: '狂暴龍爪', description: '造成 16 點傷害' },
      { type: 'DEBUFF', value: 3, name: '熔岩火海', description: '施加 3 層灼熱傷害' },
      { type: 'DEFEND', value: 20, name: '龍鱗壁壘', description: '獲得 20 點護甲' },
      { type: 'ATTACK', value: 26, name: '滅世龍息', description: '造成 26 點高溫傷害' }
    ]
  },

  // 第三幕：虛空聖所
  M_VOID_EYE: {
    id: 'M_VOID_EYE',
    name: '虛空眼魔',
    act: 3,
    maxHp: 52,
    currentHp: 52,
    block: 0,
    poison: 0,
    burn: 0,
    avatar: '👁️',
    currentIntentIdx: 0,
    intents: [
      { type: 'ATTACK', value: 14, name: '精神鞭笞', description: '造成 14 點傷害' },
      { type: 'DEFEND', value: 12, name: '異次元屏障', description: '獲得 12 點護盾' },
      { type: 'ATTACK', value: 19, name: '虛空裂解光束', description: '造成 19 點傷害' }
    ]
  },
  M_TEMPLAR: {
    id: 'M_TEMPLAR',
    name: '墮落聖殿騎士',
    act: 3,
    maxHp: 82,
    currentHp: 82,
    block: 15,
    poison: 0,
    burn: 0,
    isElite: true,
    avatar: '⚔️',
    currentIntentIdx: 0,
    intents: [
      { type: 'ATTACK', value: 18, name: '罪孽審判', description: '造成 18 點傷害' },
      { type: 'DEFEND', value: 20, name: '神聖護甲', description: '獲得 20 點護盾' },
      { type: 'ATTACK', value: 24, name: '無情處決', description: '造成 24 點傷害' }
    ]
  },
  BOSS_MEPHISTO: {
    id: 'BOSS_MEPHISTO',
    name: '契約之主·墨菲斯',
    act: 3,
    maxHp: 160,
    currentHp: 160,
    block: 20,
    poison: 0,
    burn: 0,
    isBoss: true,
    avatar: '👿',
    currentIntentIdx: 0,
    intents: [
      { type: 'ATTACK', value: 20, name: '靈魂契約斬', description: '造成 20 點傷害' },
      { type: 'DEBUFF', value: 4, name: '命運詛咒', description: '施加 4 層虛空詛咒' },
      { type: 'DEFEND', value: 28, name: '至高神殿庇護', description: '獲得 28 點護盾' },
      { type: 'ATTACK', value: 34, name: '終末裁決', description: '造成 34 點極致破壞傷害' }
    ]
  }
};

export function createMonsterInstance(id: string): Monster {
  const t = MONSTERS[id] || MONSTERS['M_SKELETON'];
  return {
    ...t,
    currentHp: t.maxHp,
    block: t.block || 0,
    poison: 0,
    burn: 0,
    currentIntentIdx: 0
  };
}
