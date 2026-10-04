import { DungeonRoom } from '../core/types';

export function generateActRooms(act: number): DungeonRoom[] {
  if (act === 1) {
    return [
      {
        id: 'r-1-1',
        act: 1,
        floor: 1,
        type: 'COMBAT',
        title: '墓穴入口：骷髏守衛',
        isCompleted: false,
        isCurrent: true,
        isAvailable: true,
        monsterId: 'M_SKELETON'
      },
      {
        id: 'r-1-2',
        act: 1,
        floor: 2,
        type: 'COMBAT',
        title: '腐朽甬道：毒蛛巢穴',
        isCompleted: false,
        isCurrent: false,
        isAvailable: false,
        monsterId: 'M_SPIDER'
      },
      {
        id: 'r-1-3',
        act: 1,
        floor: 3,
        type: 'ALTAR',
        title: '鮮血祭壇：命運契約',
        isCompleted: false,
        isCurrent: false,
        isAvailable: false
      },
      {
        id: 'r-1-4',
        act: 1,
        floor: 4,
        type: 'CAMPFIRE',
        title: '避難所：微光營火',
        isCompleted: false,
        isCurrent: false,
        isAvailable: false
      },
      {
        id: 'r-1-5',
        act: 1,
        floor: 5,
        type: 'ELITE',
        title: '深層墓塚：墓園劫掠者',
        isCompleted: false,
        isCurrent: false,
        isAvailable: false,
        monsterId: 'M_BANDIT'
      },
      {
        id: 'r-1-6',
        act: 1,
        floor: 6,
        type: 'BOSS',
        title: '王座之間：騎士領主',
        isCompleted: false,
        isCurrent: false,
        isAvailable: false,
        monsterId: 'BOSS_WARDEN'
      }
    ];
  }

  if (act === 2) {
    return [
      {
        id: 'r-2-1',
        act: 2,
        floor: 1,
        type: 'COMBAT',
        title: '熔岩裂隙：熾熱火鬼',
        isCompleted: false,
        isCurrent: true,
        isAvailable: true,
        monsterId: 'M_IMP'
      },
      {
        id: 'r-2-2',
        act: 2,
        floor: 2,
        type: 'ALTAR',
        title: '熾熱祭壇：狂徒契約',
        isCompleted: false,
        isCurrent: false,
        isAvailable: false
      },
      {
        id: 'r-2-3',
        act: 2,
        floor: 3,
        type: 'COMBAT',
        title: '火山岩洞：熔岩狂魔',
        isCompleted: false,
        isCurrent: false,
        isAvailable: false,
        monsterId: 'M_IMP'
      },
      {
        id: 'r-2-4',
        act: 2,
        floor: 4,
        type: 'CAMPFIRE',
        title: '溫泉營火：休養生息',
        isCompleted: false,
        isCurrent: false,
        isAvailable: false
      },
      {
        id: 'r-2-5',
        act: 2,
        floor: 5,
        type: 'ELITE',
        title: '核心巨石：熔岩石像',
        isCompleted: false,
        isCurrent: false,
        isAvailable: false,
        monsterId: 'M_GOLEM'
      },
      {
        id: 'r-2-6',
        act: 2,
        floor: 6,
        type: 'BOSS',
        title: '巨龍巢穴：熔火巨龍',
        isCompleted: false,
        isCurrent: false,
        isAvailable: false,
        monsterId: 'BOSS_DRAGON'
      }
    ];
  }

  // Act 3
  return [
    {
      id: 'r-3-1',
      act: 3,
      floor: 1,
      type: 'COMBAT',
      title: '虛空門戶：凝視眼魔',
      isCompleted: false,
      isCurrent: true,
      isAvailable: true,
      monsterId: 'M_VOID_EYE'
    },
    {
      id: 'r-3-2',
      act: 3,
      floor: 2,
      type: 'ALTAR',
      title: '虛空祭壇：終末盟約',
      isCompleted: false,
      isCurrent: false,
      isAvailable: false
    },
    {
      id: 'r-3-3',
      act: 3,
      floor: 3,
      type: 'CAMPFIRE',
      title: '寧靜營火：最後休整',
      isCompleted: false,
      isCurrent: false,
      isAvailable: false
    },
    {
      id: 'r-3-4',
      act: 3,
      floor: 4,
      type: 'ELITE',
      title: '審判殿堂：墮落聖殿騎士',
      isCompleted: false,
      isCurrent: false,
      isAvailable: false,
      monsterId: 'M_TEMPLAR'
    },
    {
      id: 'r-3-5',
      act: 3,
      floor: 5,
      type: 'CAMPFIRE',
      title: '決戰前夕：聖火淨化',
      isCompleted: false,
      isCurrent: false,
      isAvailable: false
    },
    {
      id: 'r-3-6',
      act: 3,
      floor: 6,
      type: 'BOSS',
      title: '契約王座：契約之主·墨菲斯',
      isCompleted: false,
      isCurrent: false,
      isAvailable: false,
      monsterId: 'BOSS_MEPHISTO'
    }
  ];
}
