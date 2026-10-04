import { Die, SkillCard } from '../core/types';

export function createRandomDie(id: string): Die {
  return {
    id,
    value: Math.floor(Math.random() * 6) + 1,
    isUsed: false,
    isLocked: false,
    isRolling: false
  };
}

export function rollDicePool(count: number): Die[] {
  const dice: Die[] = [];
  for (let i = 0; i < count; i++) {
    dice.push(createRandomDie(`die-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 6)}`));
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
    default:
      return card.slottedDice.length > 0;
  }
}

export function flipDie(die: Die): Die {
  return {
    ...die,
    value: 7 - die.value
  };
}

export function rerollDie(die: Die): Die {
  return {
    ...die,
    value: Math.floor(Math.random() * 6) + 1
  };
}
