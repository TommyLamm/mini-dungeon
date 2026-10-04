import { Pact } from '../core/types';

export const ALL_PACTS: Record<string, Pact> = {
  P_GREED: {
    id: 'P_GREED',
    name: '貪婪血契',
    title: '以鮮血換取暴利的古老盟約',
    benefitText: '✦ 戰鬥勝利時獲得的金幣與靈魂碎片 +100%',
    costText: '✖ 當前與最大生命值立即降低 25%'
  },
  P_GAMBLER: {
    id: 'P_GAMBLER',
    name: '狂徒雙子骰',
    title: '命運賭徒的極限豪賭',
    benefitText: '✦ 每回合開始時額外獲得 +1 顆可用骰子',
    costText: '✖ 任何骰子投出點數「1」，立即受到 3 點反噬真實傷害'
  },
  P_GLASS: {
    id: 'P_GLASS',
    name: '破釜沉舟',
    title: '捨棄所有退路的純粹殺戮',
    benefitText: '✦ 所有技能造成之直接傷害固定 +6',
    costText: '✖ 每回合結束時獲得之護盾歸零，無法累積防禦'
  },
  P_IRON_WILL: {
    id: 'P_IRON_WILL',
    name: '命運翻轉',
    title: '將劣勢強制扭轉的霸道意志',
    benefitText: '✦ 點數「1」與「2」在所有技能槽中自動視為「6」',
    costText: '✖ 封印所有【重擲】與【微調】戰術能力'
  },
  P_SOUL_EATER: {
    id: 'P_SOUL_EATER',
    name: '噬魂者之約',
    title: '吞噬敵方魂魄以延續殘命',
    benefitText: '✦ 擊敗任何敵人時，立即回復 25% 最大生命值',
    costText: '✖ 地下城所有怪物的攻擊意圖傷害永久提升 25%'
  }
};
