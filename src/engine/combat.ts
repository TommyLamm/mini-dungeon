import { store } from '../core/state';
import { canSocketDie, isCardReady, rollDicePool, flipDie, rerollDie } from './dice';
import { sound } from '../audio/sound-manager';
import { SkillCard } from '../core/types';

export class CombatEngine {
  public startPlayerTurn(): void {
    const run = store.run;
    if (!run || !run.combat) return;

    if (run.combat.isEnding) return;

    // Reset block
    run.block = 0;
    if (run.activePacts.includes('P_GLASS')) {
      run.block = 0;
    }

    // Reset turn flags
    run.combat.riposteActive = false;
    if (run.combat.monster.frozenReduction) {
      run.combat.monster.frozenReduction = 0;
    }

    // Determine cursed dice count
    let cursedCount = 0;
    if (run.combat.monster.id === 'BOSS_LICH' && run.combat.turn >= 2) {
      cursedCount = 1;
    }

    // Roll new dice with permanent bonus
    const diceCount = store.getEffectiveDiceCount();
    run.combat.dice = rollDicePool(diceCount, cursedCount, run.permanentDieBonus);
    run.combat.selectedDieId = null;

    // Reset card slotted dice
    run.combat.cards.forEach((c) => {
      c.slottedDice = [];
    });

    // Reset perks
    run.combat.freeRerollsUsed = 0;
    run.combat.freeFlipsUsed = 0;

    // Audio
    sound.playDiceRoll();

    if (cursedCount > 0) {
      run.combat.log.unshift(`☠️【巫妖詛咒】暗黑死氣侵蝕了你的骰子！生成了詛咒骰！`);
    }

    // Check P_GAMBLER curse: 1s deal 3 self damage
    if (run.activePacts.includes('P_GAMBLER')) {
      const onesCount = run.combat.dice.filter((d) => d.value === 1 && !d.isCursed).length;
      if (onesCount > 0) {
        const selfDmg = onesCount * 3;
        run.hp = Math.max(1, run.hp - selfDmg);
        run.combat.log.unshift(`⚠️【狂徒雙子骰】擲出了 ${onesCount} 個「1」！受到 ${selfDmg} 點反噬傷害！`);
        sound.playAttackHit();
      }
    }

    store.notify();
  }

  public getEffectiveDieValue(value: number): number {
    const run = store.run;
    if (!run) return value;
    // P_IRON_WILL: 1 and 2 are treated as 6
    if (run.activePacts.includes('P_IRON_WILL') && (value === 1 || value === 2)) {
      return 6;
    }
    return value;
  }

  public selectDie(dieId: string): void {
    const run = store.run;
    if (!run || !run.combat || run.combat.isEnding) return;
    run.combat.selectedDieId = run.combat.selectedDieId === dieId ? null : dieId;
    store.notify();
  }

  public socketDieToCard(cardId: string, dieId: string): boolean {
    const run = store.run;
    if (!run || !run.combat || run.combat.isEnding) return false;

    const die = run.combat.dice.find((d) => d.id === dieId);
    const card = run.combat.cards.find((c) => c.id === cardId);
    if (!die || !card) return false;

    const effValue = this.getEffectiveDieValue(die.value);
    if (!canSocketDie(die, card, effValue)) return false;

    // Check Cursed Die backlash
    if (die.isCursed) {
      const curseDmg = 4;
      run.hp = Math.max(1, run.hp - curseDmg);
      run.combat.log.unshift(`💀【巫妖詛咒】骰子釋放死靈反噬，受到 ${curseDmg} 點暗影真實傷害！`);
      sound.playAttackHit();
    }

    // Put die in card
    card.slottedDice.push({
      ...die,
      value: effValue
    });
    die.isUsed = true;
    run.combat.selectedDieId = null;

    sound.playDiceSocket();

    // Auto-execute if card is ready!
    if (isCardReady(card)) {
      this.executeCard(card);
    }

    store.notify();
    return true;
  }

  public autoSlotDie(dieId: string): boolean {
    const run = store.run;
    if (!run || !run.combat || run.combat.isEnding) return false;
    const die = run.combat.dice.find((d) => d.id === dieId);
    if (!die || die.isUsed) return false;

    const effVal = this.getEffectiveDieValue(die.value);
    for (const card of run.combat.cards) {
      if (canSocketDie(die, card, effVal)) {
        return this.socketDieToCard(card.id, dieId);
      }
    }
    return false;
  }

  public unslotDiceFromCard(cardId: string): void {
    const run = store.run;
    if (!run || !run.combat || run.combat.isEnding) return;
    const card = run.combat.cards.find((c) => c.id === cardId);
    if (!card || card.slottedDice.length === 0) return;

    card.slottedDice.forEach((slotted) => {
      const orig = run.combat?.dice.find((d) => d.id === slotted.id);
      if (orig) orig.isUsed = false;
    });
    card.slottedDice = [];
    store.notify();
  }

  public executeCard(card: SkillCard): void {
    const run = store.run;
    if (!run || !run.combat || run.combat.isEnding) return;

    const monster = run.combat.monster;
    let damage = 0;
    let block = 0;
    let poison = 0;

    const diceValues = card.slottedDice.map((d) => d.value);
    const firstVal = diceValues[0] || 0;
    const sumVal = diceValues.reduce((a, b) => a + b, 0);

    // Compute base effect based on card id
    switch (card.id) {
      // 鋼鐵守衛 (Knight / Warrior)
      case 'W_SLASH':
        damage = firstVal;
        break;
      case 'W_BLOCK':
        block = firstVal + 4;
        break;
      case 'W_RIPOSTE':
        damage = firstVal + 2;
        run.combat.riposteActive = true;
        run.combat.log.unshift(`⚔️ 架起【反擊姿態】！本回合格擋攻擊時將反震傷害給敵方！`);
        break;
      case 'W_SLAM':
        damage = Math.max(firstVal, run.block);
        break;
      case 'W_CLEAVE':
        damage = sumVal + 6;
        break;

      // 影刃刺客 (Rogue)
      case 'R_DAGGER':
        damage = firstVal + 3;
        poison = 3;
        break;
      case 'R_BACKSTAB': {
        const d1 = diceValues[0] || 1;
        const d2 = diceValues[1] || 1;
        const diff = Math.abs(d1 - d2);
        damage = Math.max(5, diff * 5);
        run.combat.log.unshift(`🗡️【弱點背刺】精準相減差值為 [${diff}]，爆發 ${damage} 點致命暴擊！`);
        break;
      }
      case 'R_SHADOW_STEP':
        block = firstVal + 3;
        if (run.combat.freeRerollsUsed > 0) {
          run.combat.freeRerollsUsed -= 1;
        }
        break;
      case 'R_EXECUTE':
        damage = 20;
        break;

      // 秘術法師 (Mage)
      case 'M_MISSILE':
        damage = firstVal + 3;
        break;
      case 'M_FROST_FREEZE':
        block = firstVal + 3;
        monster.frozenReduction = (monster.frozenReduction || 0) + firstVal;
        sound.playFreeze();
        run.combat.log.unshift(`❄️【元素冰封】凝結極寒冰霜，使敵方意圖攻擊力下降 ${firstVal} 點！`);
        break;
      case 'M_FIREBALL':
        damage = 22;
        break;
      case 'M_ARCANE_BLAST':
        damage = sumVal * 2;
        break;

      default:
        damage = firstVal;
        break;
    }

    // Apply Knight Perk: extra +3 block on defense
    if (run.heroClass === 'WARRIOR' && block > 0) {
      block += 3;
    }

    // Apply P_GLASS: damage +6, block = 0
    if (run.activePacts.includes('P_GLASS')) {
      if (damage > 0) damage += 6;
      block = 0;
    }

    // Apply Block to Player
    if (block > 0) {
      run.block += block;
      sound.playShieldBlock();
      run.combat.log.unshift(`🛡️ 發動【${card.name}】，獲得了 ${block} 點護盾！`);
    }

    // Apply Poison to Monster
    if (poison > 0) {
      monster.poison += poison;
      run.combat.log.unshift(`☠️ 發動【${card.name}】，給敵人施加了 ${poison} 層劇毒！`);
    }

    // Apply Damage to Monster
    if (damage > 0) {
      let finalDmg = damage;
      if (monster.block > 0) {
        if (monster.block >= finalDmg) {
          monster.block -= finalDmg;
          finalDmg = 0;
        } else {
          finalDmg -= monster.block;
          monster.block = 0;
        }
      }
      monster.currentHp = Math.max(0, monster.currentHp - finalDmg);
      sound.playSlash();
      run.combat.log.unshift(`⚔️ 發動【${card.name}】，對【${monster.name}】造成 ${damage} 點傷害！`);
    }

    // Clear slotted dice from this card
    card.slottedDice = [];

    // Check monster defeated or Lich Phylactery
    if (monster.currentHp <= 0) {
      if (monster.hasPhylactery && !monster.isPhylacteryBroken) {
        monster.isPhylacteryBroken = true;
        monster.currentHp = Math.floor(monster.maxHp * 0.5);
        monster.block = 20;
        sound.playLichResurrect();
        run.combat.log.unshift(`💥【靈魂護命匣】破碎！亡靈巫妖汲取冥界死氣，以 50% 生命浴火重生！`);
        store.notify();
        return;
      }

      this.handleMonsterDeath();
      return;
    }

    store.notify();
  }

  public handleMonsterDeath(): void {
    const run = store.run;
    if (!run || !run.combat || run.combat.isEnding) return;

    // 嚴格同歸於盡邊界檢查：若玩家 HP 已歸零，必須判定戰敗，絕不判定勝利
    if (run.hp <= 0) {
      run.combat.isEnding = true;
      sound.playDefeat();
      run.combat.log.unshift(`💀 雙方同歸於盡！然而英雄倒下了，冒險宣告終結...`);
      setTimeout(() => {
        store.gameOver();
      }, 1200);
      return;
    }

    run.combat.isEnding = true;
    sound.playVictory();
    run.combat.log.unshift(`🎉 成功擊敗了【${run.combat.monster.name}】！`);

    // P_SOUL_EATER: Heal 25% max HP on kill
    if (run.activePacts.includes('P_SOUL_EATER')) {
      const heal = Math.floor(run.maxHp * 0.25);
      run.hp = Math.min(run.maxHp, run.hp + heal);
      run.combat.log.unshift(`🩸【噬魂者之約】吸取殘魂，回復了 ${heal} 點生命值！`);
    }

    // Rewards
    let goldGain = 14 + Math.floor(Math.random() * 8);
    let soulsGain = 10 + run.act * 5;
    if (run.combat.monster.isElite) {
      goldGain += 18;
      soulsGain += 15;
    }
    if (run.combat.monster.isBoss) {
      goldGain += 35;
      soulsGain += 35;
    }

    // P_GREED: +100% Gold and Souls
    if (run.activePacts.includes('P_GREED')) {
      goldGain *= 2;
      soulsGain *= 2;
    }

    run.gold += goldGain;
    run.soulsEarned += soulsGain;
    store.save.meta.stats.enemiesSlain += 1;

    // Boss 3 (Mephisto) directly triggers victory
    if (run.act === 3 && run.combat.monster.isBoss) {
      setTimeout(() => {
        store.completeCurrentRoom();
      }, 1200);
      return;
    }

    // Other rooms offer the Altar of Fate for dice empowerment!
    setTimeout(() => {
      store.offerAltarOfFate();
    }, 1200);
  }

  // Hero manipulation perks
  public useRerollPerk(dieId: string): boolean {
    const run = store.run;
    if (!run || !run.combat || run.combat.isEnding) return false;
    if (run.activePacts.includes('P_IRON_WILL')) return false;

    const die = run.combat.dice.find((d) => d.id === dieId);
    if (!die || die.isUsed) return false;

    const destinyBonus = store.save.meta.talents.destiny;
    const maxRerolls = (run.heroClass === 'ROGUE' ? 2 : 1) + destinyBonus + run.bonusRerollsPerCombat;

    if (run.combat.freeRerollsUsed >= maxRerolls) return false;

    // Execute reroll
    const newDie = rerollDie(die, run.permanentDieBonus);
    die.value = newDie.value;
    die.isCursed = false; // 淨化詛咒
    run.combat.freeRerollsUsed += 1;
    sound.playDiceRoll();
    run.combat.log.unshift(`🎲 重擲了一顆骰子，新點數為【${die.value}】！`);
    store.notify();
    return true;
  }

  public useFlipPerk(dieId: string): boolean {
    const run = store.run;
    if (!run || !run.combat || run.combat.isEnding) return false;
    if (run.activePacts.includes('P_IRON_WILL')) return false;
    if (run.heroClass !== 'MAGE') return false;

    const die = run.combat.dice.find((d) => d.id === dieId);
    if (!die || die.isUsed) return false;
    if (run.combat.freeFlipsUsed >= 1) return false;

    const newDie = flipDie(die);
    die.value = newDie.value;
    die.isCursed = false; // 淨化詛咒
    run.combat.freeFlipsUsed += 1;
    sound.playDiceSocket();
    run.combat.log.unshift(`🔮【符文鏡面】將骰子翻面為【${die.value}】！`);
    store.notify();
    return true;
  }

  public endPlayerTurn(): void {
    const run = store.run;
    if (!run || !run.combat || run.combat.isEnding) return;

    const monster = run.combat.monster;
    run.combat.turn += 1;

    // 1. Monster poison tick
    if (monster.poison > 0) {
      monster.currentHp = Math.max(0, monster.currentHp - monster.poison);
      run.combat.log.unshift(`☠️【${monster.name}】受到 ${monster.poison} 點中毒傷害！`);
      monster.poison = Math.max(0, monster.poison - 1);
      if (monster.currentHp <= 0) {
        if (monster.hasPhylactery && !monster.isPhylacteryBroken) {
          monster.isPhylacteryBroken = true;
          monster.currentHp = Math.floor(monster.maxHp * 0.5);
          monster.block = 20;
          sound.playLichResurrect();
          run.combat.log.unshift(`💥【靈魂護命匣】破碎！亡靈巫妖汲取冥界死氣，以 50% 生命浴火重生！`);
        } else {
          this.handleMonsterDeath();
          return;
        }
      }
    }

    // 2. Enemy action based on intent
    const intent = monster.intents[monster.currentIntentIdx];
    monster.block = 0; // Reset monster block

    if (intent.type === 'ATTACK') {
      let incoming = intent.value;

      // Apply Mage freeze reduction
      if (monster.frozenReduction && monster.frozenReduction > 0) {
        const reduced = Math.min(incoming, monster.frozenReduction);
        incoming = Math.max(0, incoming - reduced);
        run.combat.log.unshift(`❄️ 極寒冰霜生效，減免了 ${reduced} 點怪物攻擊傷害！`);
      }

      let blockedAmount = 0;
      if (run.block > 0) {
        if (run.block >= incoming) {
          blockedAmount = incoming;
          run.block -= incoming;
          incoming = 0;
          sound.playShieldBlock();
        } else {
          blockedAmount = run.block;
          incoming -= run.block;
          run.block = 0;
          sound.playAttackHit();
        }
      } else {
        sound.playAttackHit();
      }

      // Knight Riposte: counter-attack when blocking
      if (run.combat.riposteActive && blockedAmount > 0) {
        const counterDmg = blockedAmount;
        monster.currentHp = Math.max(0, monster.currentHp - counterDmg);
        run.combat.log.unshift(`💥【反擊斬】鋼鐵格擋反震，對【${monster.name}】造成 ${counterDmg} 點反擊傷害！`);
        sound.playSlash();

        if (monster.currentHp <= 0) {
          if (monster.hasPhylactery && !monster.isPhylacteryBroken) {
            monster.isPhylacteryBroken = true;
            monster.currentHp = Math.floor(monster.maxHp * 0.5);
            monster.block = 20;
            sound.playLichResurrect();
            run.combat.log.unshift(`💥【靈魂護命匣】破碎！亡靈巫妖汲取冥界死氣重生！`);
          } else {
            this.handleMonsterDeath();
            return;
          }
        }
      }

      run.hp = Math.max(0, run.hp - incoming);
      run.combat.log.unshift(`⚔️【${monster.name}】發動【${intent.name}】，造成 ${intent.value} 點傷害！`);

      // 檢查同歸於盡與玩家死亡
      if (run.hp <= 0) {
        run.combat.isEnding = true;
        sound.playDefeat();
        run.combat.log.unshift(`💀 你在戰鬥中倒下了...`);
        setTimeout(() => {
          store.gameOver();
        }, 1200);
        return;
      }
    } else if (intent.type === 'DEFEND') {
      monster.block += intent.value;
      sound.playShieldBlock();
      run.combat.log.unshift(`🛡️【${monster.name}】發動【${intent.name}】，獲得了 ${intent.value} 點護盾！`);
    } else if (intent.type === 'DEBUFF') {
      run.hp = Math.max(0, run.hp - intent.value);
      sound.playAttackHit();
      run.combat.log.unshift(`☠️【${monster.name}】發動【${intent.name}】，造成 ${intent.value} 點穿甲傷害！`);
      if (run.hp <= 0) {
        run.combat.isEnding = true;
        sound.playDefeat();
        run.combat.log.unshift(`💀 你在戰鬥中倒下了...`);
        setTimeout(() => {
          store.gameOver();
        }, 1200);
        return;
      }
    } else {
      run.combat.log.unshift(`⚡【${monster.name}】正在全力蓄力！`);
    }

    // Advance intent
    monster.currentIntentIdx = (monster.currentIntentIdx + 1) % monster.intents.length;

    // Start next player turn
    this.startPlayerTurn();
  }
}

export const combat = new CombatEngine();
