import { SkillCard } from '../core/types';

export const ALL_CARDS: Record<string, Omit<SkillCard, 'slottedDice'>> = {
  // ================= 鋼鐵守衛 (Knight / Warrior) =================
  W_SLASH: {
    id: 'W_SLASH',
    name: '鋼鐵斬擊',
    heroClass: 'WARRIOR',
    description: '揮舞厚重鋼劍斬擊。造成等同於骰子點數的傷害。',
    rule: { type: 'ANY' },
    maxDice: 1,
    executeText: '造成 [點數] 傷害'
  },
  W_BLOCK: {
    id: 'W_BLOCK',
    name: '重甲壁壘',
    heroClass: 'WARRIOR',
    description: '舉起巨型鋼盾護身。獲得點數 + 4 的護盾（偶數專用）。',
    rule: { type: 'EVEN' },
    maxDice: 1,
    executeText: '獲得 [點數 + 4] 護盾'
  },
  W_RIPOSTE: {
    id: 'W_RIPOSTE',
    name: '反擊斬',
    heroClass: 'WARRIOR',
    description: '以攻代守的架刀反擊。造成點數 + 2 傷害，並架構反震姿態（受到攻擊格擋時反擊怪物）。',
    rule: { type: 'EVEN' },
    maxDice: 1,
    executeText: '造成 [點數 + 2] 傷害並進入反擊姿態'
  },
  W_SLAM: {
    id: 'W_SLAM',
    name: '盾牌猛擊',
    heroClass: 'WARRIOR',
    description: '凝聚重甲之威猛烈衝撞。造成目前護甲數值的傷害（需 5 點以上）。',
    rule: { type: 'MIN', param: 5 },
    maxDice: 1,
    executeText: '造成等同目前護甲值的傷害'
  },
  W_CLEAVE: {
    id: 'W_CLEAVE',
    name: '雙刃橫掃',
    heroClass: 'WARRIOR',
    description: '旋風猛砍。放入兩顆相同點數的骰子，造成總和 + 6 的傷害。',
    rule: { type: 'PAIR' },
    maxDice: 2,
    executeText: '造成 [兩骰總和 + 6] 傷害'
  },

  // ================= 秘術法師 (Mage) =================
  M_MISSILE: {
    id: 'M_MISSILE',
    name: '奧術飛彈',
    heroClass: 'MAGE',
    description: '凝聚純淨奧術能量發射導引飛彈。造成點數 + 3 傷害。',
    rule: { type: 'ANY' },
    maxDice: 1,
    executeText: '造成 [點數 + 3] 傷害'
  },
  M_FROST_FREEZE: {
    id: 'M_FROST_FREEZE',
    name: '元素冰封',
    heroClass: 'MAGE',
    description: '召喚極度寒霜凍結目標。獲得點數 + 3 護盾，並【凍結怪物點數】，使其當前意圖攻擊減少 [點數]（奇數專用）。',
    rule: { type: 'ODD' },
    maxDice: 1,
    executeText: '獲得 [點數 + 3] 護盾並凍結怪物 [點數] 傷害'
  },
  M_FIREBALL: {
    id: 'M_FIREBALL',
    name: '炎爆術',
    heroClass: 'MAGE',
    description: '吟唱毀滅烈焰爆擊。放入多顆骰子且總和 ≥ 9，造成 22 點火焰爆發傷害。',
    rule: { type: 'SUM', param: 9 },
    maxDice: 3,
    executeText: '造成 22 點毀滅火焰傷害'
  },
  M_ARCANE_BLAST: {
    id: 'M_ARCANE_BLAST',
    name: '符文共鳴',
    heroClass: 'MAGE',
    description: '引發雙重奧術共鳴。放入對子，造成點數總和 × 2 點傷害。',
    rule: { type: 'PAIR' },
    maxDice: 2,
    executeText: '造成 [兩骰總和 × 2] 傷害'
  },

  // ================= 影刃刺客 (Rogue) =================
  R_DAGGER: {
    id: 'R_DAGGER',
    name: '劇毒匕首',
    heroClass: 'ROGUE',
    description: '幽暗中的淬毒刺擊。放入 1~3 點骰子，造成點數 + 3 傷害並附加 3 層劇毒。',
    rule: { type: 'MAX', param: 3 },
    maxDice: 1,
    executeText: '造成 [點數 + 3] 傷害，附加 3 層中毒'
  },
  R_BACKSTAB: {
    id: 'R_BACKSTAB',
    name: '弱點背刺',
    heroClass: 'ROGUE',
    description: '【點數精確相減機制】洞悉敵方空隙。放入兩顆任意骰子，造成 (大骰 - 小骰) × 5 點弱點暴擊傷害！',
    rule: { type: 'SUB_DIFF' },
    maxDice: 2,
    executeText: '造成 [(點數相減差值) × 5] 暴擊傷害'
  },
  R_SHADOW_STEP: {
    id: 'R_SHADOW_STEP',
    name: '暗影步伐',
    heroClass: 'ROGUE',
    description: '隱沒於煙幕之中。獲得點數 + 3 護盾，並立即刷新 1 次重擲次數。',
    rule: { type: 'ANY' },
    maxDice: 1,
    executeText: '獲得 [點數 + 3] 護盾並獲得 1 次重擲'
  },
  R_EXECUTE: {
    id: 'R_EXECUTE',
    name: '致命處決',
    heroClass: 'ROGUE',
    description: '終結性命的精準刺殺。需要 6 點，造成 20 點高額傷害。',
    rule: { type: 'MIN', param: 6 },
    maxDice: 1,
    executeText: '造成 20 點暴擊傷害'
  }
};

export function createCardInstance(cardId: string): SkillCard {
  const template = ALL_CARDS[cardId] || ALL_CARDS['W_SLASH'];
  return {
    ...template,
    slottedDice: []
  };
}
