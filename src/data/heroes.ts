import { HeroData } from '../core/types';

export const HEROES: Record<string, HeroData> = {
  WARRIOR: {
    id: 'WARRIOR',
    name: '鋼鐵守衛 (Knight)',
    title: '堅不可摧的重甲堡壘',
    baseHp: 52,
    baseDiceCount: 3,
    perkName: '重鎧防線 & 反擊',
    perkDesc: '偏好偶數骰。防禦卡額外獲得 +3 護甲；精通經典重甲格擋與反擊斬。',
    avatar: '🛡️',
    starterCards: ['W_SLASH', 'W_BLOCK', 'W_RIPOSTE', 'W_SLAM']
  },
  MAGE: {
    id: 'MAGE',
    name: '秘術法師 (Mage)',
    title: '掌握元素與符文的奧術導師',
    baseHp: 38,
    baseDiceCount: 3,
    perkName: '符文鏡面',
    perkDesc: '專屬奧術飛彈與元素冰封（凍結怪物攻擊點數）；每回合可免費將 1 顆骰子翻面 (7-x)。',
    avatar: '🔮',
    starterCards: ['M_MISSILE', 'M_FROST_FREEZE', 'M_FIREBALL']
  },
  ROGUE: {
    id: 'ROGUE',
    name: '影刃刺客 (Rogue)',
    title: '匕首淬毒與弱點洞悉者',
    baseHp: 42,
    baseDiceCount: 4,
    perkName: '靈巧身手',
    perkDesc: '專屬劇毒匕首與弱點背刺（精確相減機制）；每回合可重擲小點骰（≤3）最多 2 次。',
    avatar: '🗡️',
    starterCards: ['R_DAGGER', 'R_BACKSTAB', 'R_SHADOW_STEP']
  }
};
