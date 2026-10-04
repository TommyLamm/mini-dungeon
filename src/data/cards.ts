import { SkillCard } from '../core/types';

export const ALL_CARDS: Record<string, Omit<SkillCard, 'slottedDice'>> = {
  // 戰士卡牌
  W_SLASH: {
    id: 'W_SLASH',
    name: '鐵劍斬擊',
    heroClass: 'WARRIOR',
    description: '揮舞重劍斬向敵人。造成等同於骰子點數的傷害。',
    rule: { type: 'ANY' },
    maxDice: 1,
    executeText: '造成 [點數] 傷害'
  },
  W_BLOCK: {
    id: 'W_BLOCK',
    name: '重盾壁壘',
    heroClass: 'WARRIOR',
    description: '舉起重盾阻擋衝擊。獲得點數 + 4 的護甲（偶數專用）。',
    rule: { type: 'EVEN' },
    maxDice: 1,
    executeText: '獲得 [點數 + 4] 護盾'
  },
  W_SLAM: {
    id: 'W_SLAM',
    name: '盾牌猛擊',
    heroClass: 'WARRIOR',
    description: '凝聚全身力量將巨盾砸下。造成目前護甲數值的傷害（需 5 點以上）。',
    rule: { type: 'MIN', param: 5 },
    maxDice: 1,
    executeText: '造成目前護甲值的傷害'
  },
  W_CLEAVE: {
    id: 'W_CLEAVE',
    name: '雙刃橫掃',
    heroClass: 'WARRIOR',
    description: '迴旋猛砍。放入兩顆相同點數的骰子，造成總和 + 6 的傷害。',
    rule: { type: 'PAIR' },
    maxDice: 2,
    executeText: '造成 [兩骰總和 + 6] 傷害'
  },

  // 盜賊卡牌
  R_DAGGER: {
    id: 'R_DAGGER',
    name: '輕巧刺殺',
    heroClass: 'ROGUE',
    description: '以極快速度刺擊。放入 1~3 點骰子，造成點數 + 4 傷害。',
    rule: { type: 'MAX', param: 3 },
    maxDice: 1,
    executeText: '造成 [點數 + 4] 傷害'
  },
  R_POISON: {
    id: 'R_POISON',
    name: '淬毒飛刀',
    heroClass: 'ROGUE',
    description: '射出浸滿腐蝕毒液的飛刀。造成 3 傷害並施加等同點數的中毒。',
    rule: { type: 'ODD' },
    maxDice: 1,
    executeText: '造成 3 傷害，施加 [點數] 層中毒'
  },
  R_SHADOW_STEP: {
    id: 'R_SHADOW_STEP',
    name: '暗影步伐',
    heroClass: 'ROGUE',
    description: '隱沒於黑暗之中。獲得點數 + 3 護盾。',
    rule: { type: 'ANY' },
    maxDice: 1,
    executeText: '獲得 [點數 + 3] 護盾'
  },
  R_EXECUTE: {
    id: 'R_EXECUTE',
    name: '致命處決',
    heroClass: 'ROGUE',
    description: '瞄準目標咽喉的致命一擊。需要 6 點，造成 18 點高額傷害。',
    rule: { type: 'MIN', param: 6 },
    maxDice: 1,
    executeText: '造成 18 點暴擊傷害'
  },

  // 法師卡牌
  M_MISSILE: {
    id: 'M_MISSILE',
    name: '奧術飛彈',
    heroClass: 'MAGE',
    description: '凝聚奧術能量發射導引飛彈。造成點數 + 2 傷害。',
    rule: { type: 'ANY' },
    maxDice: 1,
    executeText: '造成 [點數 + 2] 傷害'
  },
  M_FROST_SHIELD: {
    id: 'M_FROST_SHIELD',
    name: '寒霜結界',
    heroClass: 'MAGE',
    description: '召喚冰晶護盾。獲得點數 + 4 護盾（奇數專用）。',
    rule: { type: 'ODD' },
    maxDice: 1,
    executeText: '獲得 [點數 + 4] 護盾'
  },
  M_FIREBALL: {
    id: 'M_FIREBALL',
    name: '炎爆術',
    heroClass: 'MAGE',
    description: '引導巨大的爆裂火球。放入多顆骰子且總和 ≥ 9，造成 20 點爆發傷害。',
    rule: { type: 'SUM', param: 9 },
    maxDice: 3,
    executeText: '造成 20 點火焰傷害'
  },
  M_ARCANE_BLAST: {
    id: 'M_ARCANE_BLAST',
    name: '符文共鳴',
    heroClass: 'MAGE',
    description: '引發雙重符文共鳴。放入對子，造成點數總和 × 2 點傷害。',
    rule: { type: 'PAIR' },
    maxDice: 2,
    executeText: '造成 [兩骰總和 × 2] 傷害'
  }
};

export function createCardInstance(cardId: string): SkillCard {
  const template = ALL_CARDS[cardId] || ALL_CARDS['W_SLASH'];
  return {
    ...template,
    slottedDice: []
  };
}
