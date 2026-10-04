import { store } from '../core/state';
import { canSocketDie, isCardReady, rollDicePool, flipDie, rerollDie } from './dice';
import { sound } from '../audio/sound-manager';

export class CombatEngine {
  public startPlayerTurn(): void {
    const run = store.run;
    if (!run || !run.combat) return;

    // Reset block unless retained
    run.block = 0;
    if (run.activePacts.includes('P_GLASS')) {
      run.block = 0;
    }

    // Roll new dice
    const diceCount = store.getEffectiveDiceCount();
    run.combat.dice = rollDicePool(diceCount);
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

    // Check P_GAMBLER curse: 1s deal 3 self damage
    if (run.activePacts.includes('P_GAMBLER')) {
      const onesCount = run.combat.dice.filter((d) => d.value === 1).length;
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
    if (!run || !run.combat) return;
    run.combat.selectedDieId = run.combat.selectedDieId === dieId ? null : dieId;
    store.notify();
  }

  public socketDieToCard(cardId: string, dieId: string): boolean {
    const run = store.run;
    if (!run || !run.combat) return false;

    const die = run.combat.dice.find((d) => d.id === dieId);
    const card = run.combat.cards.find((c) => c.id === cardId);
    if (!die || !card) return false;

    const effValue = this.getEffectiveDieValue(die.value);
    if (!canSocketDie(die, card, effValue)) return false;

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

  public unslotDiceFromCard(cardId: string): void {
    const run = store.run;
    if (!run || !run.combat) return;
    const card = run.combat.cards.find((c) => c.id === cardId);
    if (!card || card.slottedDice.length === 0) return;

    card.slottedDice.forEach((slotted) => {
      const orig = run.combat?.dice.find((d) => d.id === slotted.id);
      if (orig) orig.isUsed = false;
    });
    card.slottedDice = [];
    store.notify();
  }

  public executeCard(card: (typeof store.run extends null ? never : NonNullable<typeof store.run>['combat'] extends null ? never : NonNullable<NonNullable<typeof store.run>['combat']>['cards'][0])): void {
    const run = store.run;
    if (!run || !run.combat) return;

    const monster = run.combat.monster;
    let damage = 0;
    let block = 0;
    let poison = 0;

    const diceValues = card.slottedDice.map((d) => d.value);
    const firstVal = diceValues[0] || 0;
    const sumVal = diceValues.reduce((a, b) => a + b, 0);

    // Compute base effect based on card id
    switch (card.id) {
      // 戰士
      case 'W_SLASH':
        damage = firstVal;
        break;
      case 'W_BLOCK':
        block = firstVal + 4;
        break;
      case 'W_SLAM':
        damage = Math.max(firstVal, run.block);
        break;
      case 'W_CLEAVE':
        damage = sumVal + 6;
        break;

      // 盜賊
      case 'R_DAGGER':
        damage = firstVal + 4;
        break;
      case 'R_POISON':
        damage = 3;
        poison = firstVal;
        break;
      case 'R_SHADOW_STEP':
        block = firstVal + 3;
        break;
      case 'R_EXECUTE':
        damage = 18;
        break;

      // 法師
      case 'M_MISSILE':
        damage = firstVal + 2;
        break;
      case 'M_FROST_SHIELD':
        block = firstVal + 4;
        break;
      case 'M_FIREBALL':
        damage = 20;
        break;
      case 'M_ARCANE_BLAST':
        damage = sumVal * 2;
        break;

      default:
        damage = firstVal;
        break;
    }

    // Apply Warrior Perk: extra +3 block on defense
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
      run.combat.log.unshift(`☠️ 發動【${card.name}】，給敵人施加了 ${poison} 層中毒！`);
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
      sound.playAttackHit();
      run.combat.log.unshift(`⚔️ 發動【${card.name}】，對【${monster.name}】造成 ${damage} 點傷害！`);
    }

    // Clear slotted dice from this card
    card.slottedDice = [];

    // Check monster defeated
    if (monster.currentHp <= 0) {
      this.handleMonsterDeath();
      return;
    }

    store.notify();
  }

  public handleMonsterDeath(): void {
    const run = store.run;
    if (!run || !run.combat) return;

    sound.playVictory();
    run.combat.log.unshift(`🎉 成功擊敗了【${run.combat.monster.name}】！`);

    // P_SOUL_EATER: Heal 25% max HP on kill
    if (run.activePacts.includes('P_SOUL_EATER')) {
      const heal = Math.floor(run.maxHp * 0.25);
      run.hp = Math.min(run.maxHp, run.hp + heal);
      run.combat.log.unshift(`🩸【噬魂者之約】吸取殘魂，回復了 ${heal} 點生命值！`);
    }

    // Rewards
    let goldGain = 12 + Math.floor(Math.random() * 8);
    let soulsGain = 8 + run.act * 4;
    if (run.combat.monster.isElite) {
      goldGain += 15;
      soulsGain += 12;
    }
    if (run.combat.monster.isBoss) {
      goldGain += 30;
      soulsGain += 30;
      // If defeated Boss 1, unlock Rogue; if Boss 2, unlock Mage!
      if (run.act === 1 && !store.save.meta.unlockedHeroes.includes('ROGUE')) {
        store.save.meta.unlockedHeroes.push('ROGUE');
      }
      if (run.act === 2 && !store.save.meta.unlockedHeroes.includes('MAGE')) {
        store.save.meta.unlockedHeroes.push('MAGE');
      }
    }

    // P_GREED: +100% Gold and Souls
    if (run.activePacts.includes('P_GREED')) {
      goldGain *= 2;
      soulsGain *= 2;
    }

    run.gold += goldGain;
    run.soulsEarned += soulsGain;
    store.save.meta.stats.enemiesSlain += 1;

    setTimeout(() => {
      store.completeCurrentRoom();
    }, 1200);
  }

  // Hero manipulation perks
  public useRerollPerk(dieId: string): boolean {
    const run = store.run;
    if (!run || !run.combat) return false;
    // P_IRON_WILL forbids reroll and nudge
    if (run.activePacts.includes('P_IRON_WILL')) return false;

    const die = run.combat.dice.find((d) => d.id === dieId);
    if (!die || die.isUsed) return false;

    const destinyBonus = store.save.meta.talents.destiny; // 0 or 1
    const maxRerolls = (run.heroClass === 'ROGUE' ? 2 : 1) + destinyBonus;

    if (run.combat.freeRerollsUsed >= maxRerolls) return false;

    // Execute reroll
    const newDie = rerollDie(die);
    die.value = newDie.value;
    run.combat.freeRerollsUsed += 1;
    sound.playDiceRoll();
    run.combat.log.unshift(`🎲 重擲了一顆骰子，新點數為【${die.value}】！`);
    store.notify();
    return true;
  }

  public useFlipPerk(dieId: string): boolean {
    const run = store.run;
    if (!run || !run.combat) return false;
    if (run.activePacts.includes('P_IRON_WILL')) return false;
    if (run.heroClass !== 'MAGE') return false;

    const die = run.combat.dice.find((d) => d.id === dieId);
    if (!die || die.isUsed) return false;
    if (run.combat.freeFlipsUsed >= 1) return false;

    const newDie = flipDie(die);
    die.value = newDie.value;
    run.combat.freeFlipsUsed += 1;
    sound.playDiceSocket();
    run.combat.log.unshift(`🔮【符文鏡面】將骰子翻面為【${die.value}】！`);
    store.notify();
    return true;
  }

  public endPlayerTurn(): void {
    const run = store.run;
    if (!run || !run.combat) return;

    const monster = run.combat.monster;
    run.combat.turn += 1;

    // Monster poison tick
    if (monster.poison > 0) {
      monster.currentHp = Math.max(0, monster.currentHp - monster.poison);
      run.combat.log.unshift(`☠️【${monster.name}】受到 ${monster.poison} 點中毒傷害！`);
      monster.poison = Math.max(0, monster.poison - 1);
      if (monster.currentHp <= 0) {
        this.handleMonsterDeath();
        return;
      }
    }

    // Enemy action based on intent
    const intent = monster.intents[monster.currentIntentIdx];
    monster.block = 0; // Reset monster block

    if (intent.type === 'ATTACK') {
      let incoming = intent.value;
      if (run.block > 0) {
        if (run.block >= incoming) {
          run.block -= incoming;
          incoming = 0;
          sound.playShieldBlock();
        } else {
          incoming -= run.block;
          run.block = 0;
          sound.playAttackHit();
        }
      } else {
        sound.playAttackHit();
      }

      run.hp = Math.max(0, run.hp - incoming);
      run.combat.log.unshift(`⚔️【${monster.name}】發動【${intent.name}】，造成 ${intent.value} 點傷害！`);

      if (run.hp <= 0) {
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
      run.hp = Math.max(1, run.hp - intent.value);
      sound.playAttackHit();
      run.combat.log.unshift(`☠️【${monster.name}】發動【${intent.name}】，造成 ${intent.value} 點穿甲傷害！`);
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
