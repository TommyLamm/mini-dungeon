import { Die, SkillCard } from '../core/types';

export function createRandomDie(id: string, isCursed: boolean = false, bonusValue: number = 0): Die {
  const rawVal = isCursed ? 1 : Math.floor(Math.random() * 6) + 1;
  const finalVal = isCursed ? 1 : Math.min(6, rawVal + bonusValue);
  return {
    id,
    value: finalVal,
    isUsed: false,
    isLocked: false,
    isRolling: true,
    isCursed
  };
}

export function rollDicePool(count: number, cursedCount: number = 0, bonusValue: number = 0): Die[] {
  const dice: Die[] = [];
  for (let i = 0; i < count; i++) {
    const isCursed = i < cursedCount;
    dice.push(
      createRandomDie(
        `die-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 6)}`,
        isCursed,
        bonusValue
      )
    );
  }
  return dice;
}

export function canSocketDie(die: Die, card: SkillCard, effectiveValue: number): boolean {
  if (die.isUsed || die.isLocked) return false;
  if (card.slottedDice.length >= card.maxDice) return false;

  const rule = card.rule;
  const val = effectiveValue;

  switch (rule.type) {
    case 'ANY':
      return true;
    case 'MIN':
      return val >= (rule.param || 1);
    case 'MAX':
      return val <= (rule.param || 6);
    case 'EVEN':
      return val % 2 === 0;
    case 'ODD':
      return val % 2 === 1;
    case 'PAIR':
      if (card.slottedDice.length === 0) return true;
      return val === card.slottedDice[0].value;
    case 'SUM':
      return true; // Any die can be placed towards the sum
    case 'SUB_DIFF':
      return true; // Any 2 dice can be placed for difference
    default:
      return true;
  }
}

export function isCardReady(card: SkillCard): boolean {
  if (card.slottedDice.length === 0) return false;

  const rule = card.rule;
  switch (rule.type) {
    case 'ANY':
    case 'MIN':
    case 'MAX':
    case 'EVEN':
    case 'ODD':
      return card.slottedDice.length === 1;
    case 'PAIR':
      return card.slottedDice.length === 2 && card.slottedDice[0].value === card.slottedDice[1].value;
    case 'SUM': {
      const sum = card.slottedDice.reduce((acc, d) => acc + d.value, 0);
      return sum >= (rule.param || 9);
    }
    case 'SUB_DIFF':
      return card.slottedDice.length === 2;
    default:
      return card.slottedDice.length > 0;
  }
}

export function flipDie(die: Die): Die {
  return {
    ...die,
    value: 7 - die.value,
    isCursed: false // 翻轉淨化詛咒
  };
}

export function rerollDie(die: Die, bonusValue: number = 0): Die {
  const newVal = Math.min(6, Math.floor(Math.random() * 6) + 1 + bonusValue);
  return {
    ...die,
    value: newVal,
    isCursed: false, // 重擲淨化詛咒
    isRolling: true
  };
}
