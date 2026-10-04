import { HeroData } from '../core/types';

export const HEROES: Record<string, HeroData> = {
  WARRIOR: {
    id: 'WARRIOR',
    name: '重甲鐵衛',
    title: '堅不可摧的鋼鐵要塞',
    baseHp: 50,
    baseDiceCount: 3,
    perkName: '重鎧防線',
    perkDesc: '偏好偶數骰。放入防禦卡槽時額外獲得 +3 護甲。',
    avatar: '🛡️',
    starterCards: ['W_SLASH', 'W_BLOCK', 'W_SLAM']
  },
  ROGUE: {
    id: 'ROGUE',
    name: '暗影盜賊',
    title: '匕首淬毒的敏捷獵手',
    baseHp: 40,
    baseDiceCount: 4,
    perkName: '靈巧匕首',
    perkDesc: '偏好小點數（1~3）。每回合可免費重擲 1 顆小點骰子。',
    avatar: '🗡️',
    starterCards: ['R_DAGGER', 'R_POISON', 'R_SHADOW_STEP']
  },
  MAGE: {
    id: 'MAGE',
    name: '符文秘術師',
    title: '掌握元素點陣的奧術大師',
    baseHp: 35,
    baseDiceCount: 3,
    perkName: '符文鏡面',
    perkDesc: '偏好合計點數。每回合可免費將 1 顆骰子翻轉對立面（1↔6, 2↔5, 3↔4）。',
    avatar: '🔮',
    starterCards: ['M_MISSILE', 'M_FROST_SHIELD', 'M_FIREBALL']
  }
};
