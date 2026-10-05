import { store } from '../core/state';
import { combat } from '../engine/combat';
import { sound } from '../audio/sound-manager';
import { HEROES } from '../data/heroes';
import { ALL_PACTS } from '../data/pacts';
import { HeroClass, Die } from '../core/types';
import { canSocketDie } from '../engine/dice';

export class UIRenderer {
  private container: HTMLElement;
  private selectedHero: HeroClass = 'WARRIOR';
  private ghostDie: HTMLElement | null = null;
  private currentSnappedCardId: string | null = null;

  constructor(container: HTMLElement) {
    this.container = container;
  }

  public render(): void {
    const state = store.state;
    this.container.innerHTML = '';

    // Create FX layer
    const fxLayer = document.createElement('div');
    fxLayer.id = 'fx-layer';
    fxLayer.className = 'fx-layer';
    this.container.appendChild(fxLayer);

    switch (state) {
      case 'TITLE':
        this.renderTitle();
        break;
      case 'HERO_SELECT':
        this.renderHeroSelect();
        break;
      case 'MAP':
        this.renderMap();
        break;
      case 'COMBAT':
        this.renderCombat();
        break;
      case 'ALTAR':
        this.renderAltar();
        break;
      case 'ALTAR_OF_FATE':
        this.renderAltarOfFate();
        break;
      case 'CAMPFIRE':
        this.renderCampfire();
        break;
      case 'VICTORY':
        this.renderVictory();
        break;
      case 'GAME_OVER':
        this.renderGameOver();
        break;
      case 'HALL_OF_SOULS':
        this.renderHallOfSouls();
        break;
    }
  }

  // 頂部狀態列
  private createTopBar(): HTMLElement {
    const bar = document.createElement('div');
    bar.className = 'top-bar';

    const run = store.run;
    if (run) {
      const stats = document.createElement('div');
      stats.className = 'top-bar-stats';
      stats.innerHTML = `
        <div class="stat-badge" title="生命值">❤️ ${run.hp}/${run.maxHp}</div>
        <div class="stat-badge" title="護盾值">🛡️ ${run.block}</div>
        <div class="stat-badge" title="黃金">💰 ${run.gold}</div>
        <div class="stat-badge" title="靈魂碎片">✨ ${run.soulsEarned}</div>
        ${run.permanentDieBonus > 0 ? `<div class="stat-badge" style="color: #ffd166;" title="永恆祭煉加成">🎲 +${run.permanentDieBonus}</div>` : ''}
      `;
      bar.appendChild(stats);
    } else {
      const title = document.createElement('div');
      title.style.fontWeight = 'bold';
      title.style.color = '#c89b53';
      title.textContent = '微型地下城：骰子契約';
      bar.appendChild(title);
    }

    const actions = document.createElement('div');
    actions.className = 'top-bar-actions';

    const soundBtn = document.createElement('button');
    soundBtn.className = 'icon-btn';
    soundBtn.textContent = sound.getMuted() ? '🔇' : '🔊';
    soundBtn.title = '切換音效';
    soundBtn.onclick = () => {
      sound.toggleMute();
      soundBtn.textContent = sound.getMuted() ? '🔇' : '🔊';
    };
    actions.appendChild(soundBtn);

    bar.appendChild(actions);
    return bar;
  }

  // 1. 標題畫面
  private renderTitle(): void {
    this.container.appendChild(this.createTopBar());

    const screen = document.createElement('div');
    screen.className = 'screen-container title-screen';
    screen.innerHTML = `
      <div style="font-size: 56px; margin-bottom: 8px; filter: drop-shadow(0 4px 12px rgba(200, 155, 83, 0.4));">🎲⚔️</div>
      <h1 class="game-title">微型地下城：骰子契約</h1>
      <p class="game-subtitle">投擲命運之骰 · 嵌合職業戰技 · 簽訂深淵終末盟約</p>
      
      <div class="title-actions">
        <button id="btn-start-run" class="btn btn-block">選擇職業啟程</button>
        <button id="btn-hall-souls" class="btn btn-secondary btn-block">靈魂殿堂 (${store.save.meta.soulShards} 碎片)</button>
        <button id="btn-rules" class="btn btn-secondary btn-block">冒險者指南</button>
      </div>

      <div style="margin-top: 24px; font-size: 12px; color: var(--text-dim); text-align: center;">
        v1.2.0 · 三大特色職業 · 命運祭壇 · 亡靈巫妖 · 支援直向/橫向觸控
      </div>
    `;

    this.container.appendChild(screen);

    screen.querySelector('#btn-start-run')?.addEventListener('click', () => {
      sound.ensureContext();
      store.setState('HERO_SELECT');
    });

    screen.querySelector('#btn-hall-souls')?.addEventListener('click', () => {
      sound.ensureContext();
      store.setState('HALL_OF_SOULS');
    });

    screen.querySelector('#btn-rules')?.addEventListener('click', () => {
      alert(
        '【微型地下城：骰子契約 冒險指南】\n\n' +
        '1. 職業特色：\n' +
        '  - 鋼鐵守衛 (Knight)：經典重甲格擋與反擊斬，擅長偶數。\n' +
        '  - 秘術法師 (Mage)：專屬奧術飛彈與元素冰封（凍結怪物攻擊點數）。\n' +
        '  - 影刃刺客 (Rogue)：劇毒匕首與弱點背刺（點數精確相減機制）。\n\n' +
        '2. 操作手感：\n' +
        '  - 點擊骰子自動高亮相容卡牌，可直接點擊卡牌一鍵填槽！\n' +
        '  - 支援觸控磁吸拖曳，靠近卡槽自動吸附對齊。\n\n' +
        '3. 命運祭壇 (Altar of Fate)：\n' +
        '  - 通關戰鬥後可選擇命運重洗、雙子分裂（增加骰池）或永恆淬煉（點數永久+1）。\n\n' +
        '4. 迎戰亡靈巫妖：小心靈魂護命匣重生與詛咒骰！'
      );
    });
  }

  // 2. 英雄職業選擇 (三大英雄全部直接可選)
  private renderHeroSelect(): void {
    this.container.appendChild(this.createTopBar());

    const screen = document.createElement('div');
    screen.className = 'screen-container';
    screen.innerHTML = `
      <h2 style="text-align: center; color: var(--border-gold); margin-bottom: 6px;">選擇冒險者職業</h2>
      <p style="text-align: center; font-size: 13px; color: var(--text-dim); margin-bottom: 16px;">三大獨特職業體系，各有專屬骰子機制與戰鬥風格</p>
      <div class="hero-select-grid" id="hero-grid"></div>
      <div style="display: flex; gap: 12px; max-width: 440px; margin: 20px auto 0; width: 100%;">
        <button id="btn-hero-back" class="btn btn-secondary" style="flex: 1;">返回標題</button>
        <button id="btn-hero-confirm" class="btn" style="flex: 2;">以該職業啟程</button>
      </div>
    `;

    const grid = screen.querySelector('#hero-grid')!;
    Object.values(HEROES).forEach((hero) => {
      const card = document.createElement('div');
      card.className = `hero-card ${this.selectedHero === hero.id ? 'selected' : ''}`;

      card.innerHTML = `
        <div class="hero-header">
          <div class="hero-avatar">${hero.avatar}</div>
          <div>
            <div style="font-size: 16px; font-weight: bold; color: var(--text-main);">${hero.name}</div>
            <div style="font-size: 12px; color: var(--text-dim);">${hero.title}</div>
          </div>
        </div>
        <div style="font-size: 13px; color: var(--text-dim); margin-bottom: 4px;">
          基礎生命值: <b style="color: #ff7b72;">${hero.baseHp}</b> | 基礎骰池: <b style="color: #ffd166;">${hero.baseDiceCount} 顆</b>
        </div>
        <div style="background: #181310; padding: 8px 10px; border-radius: 6px; border: 1px solid var(--border-gold-dim); font-size: 12px;">
          <div style="font-weight: bold; color: var(--border-gold); margin-bottom: 3px;">⚡ 職業特長：${hero.perkName}</div>
          <div style="color: var(--text-dim); line-height: 1.4;">${hero.perkDesc}</div>
        </div>
      `;

      card.onclick = () => {
        this.selectedHero = hero.id;
        sound.playDiceSocket();
        this.render();
      };

      grid.appendChild(card);
    });

    this.container.appendChild(screen);

    screen.querySelector('#btn-hero-back')?.addEventListener('click', () => {
      store.setState('TITLE');
    });

    screen.querySelector('#btn-hero-confirm')?.addEventListener('click', () => {
      sound.ensureContext();
      store.startRun(this.selectedHero);
    });
  }

  // 3. 地牢地圖
  private renderMap(): void {
    this.container.appendChild(this.createTopBar());

    const run = store.run;
    if (!run) return;

    const screen = document.createElement('div');
    screen.className = 'screen-container';

    const actNames = ['', '第一幕：古代墓穴', '第二幕：熔岩禁地與亡靈聖所', '第三幕：虛空聖所'];
    screen.innerHTML = `
      <div style="text-align: center; margin-bottom: 16px;">
        <h2 style="color: var(--border-gold);">${actNames[run.act] || '地下城'}</h2>
        <div style="font-size: 13px; color: var(--text-dim);">當前進度：第 ${run.currentRoomIdx + 1} / ${run.rooms.length} 區域</div>
      </div>
      <div class="dungeon-map" id="map-nodes"></div>
    `;

    const nodesContainer = screen.querySelector('#map-nodes')!;
    run.rooms.forEach((room, idx) => {
      const node = document.createElement('div');
      const isCurrent = idx === run.currentRoomIdx;
      const isCompleted = idx < run.currentRoomIdx;

      node.className = `map-node ${isCurrent ? 'available' : ''} ${isCompleted ? 'completed' : ''}`;

      let icon = '⚔️';
      if (room.type === 'ELITE') icon = '💀';
      if (room.type === 'ALTAR') icon = '📜';
      if (room.type === 'CAMPFIRE') icon = '🔥';
      if (room.type === 'BOSS') icon = '👑';

      node.innerHTML = `
        <div style="display: flex; align-items: center; gap: 12px;">
          <div style="font-size: 22px;">${icon}</div>
          <div>
            <div style="font-weight: bold; color: ${isCurrent ? 'var(--border-gold)' : 'var(--text-main)'}; font-size: 14px;">${room.title}</div>
            <div style="font-size: 11px; color: var(--text-dim);">${isCompleted ? '已探索完畢' : isCurrent ? '當前前進目標' : '未抵達'}</div>
          </div>
        </div>
        <div>
          ${isCurrent ? `<button class="btn" style="min-height: 38px; padding: 6px 14px; font-size: 13px;">進入探索</button>` : ''}
          ${isCompleted ? `<span style="font-size: 18px; color: #4ea8de;">✔</span>` : ''}
        </div>
      `;

      if (isCurrent) {
        node.onclick = () => {
          sound.ensureContext();
          store.enterCurrentRoom();
        };
      }

      nodesContainer.appendChild(node);
    });

    this.container.appendChild(screen);
  }

  // 4. 戰鬥畫面 (含 3D 骰子、觸控拖曳磁吸、劍氣破屏、鋼鐵光盾、怪物受傷紅光震顫)
  private renderCombat(): void {
    this.container.appendChild(this.createTopBar());

    const run = store.run;
    if (!run || !run.combat) return;
    const cState = run.combat;
    const monster = cState.monster;

    const screen = document.createElement('div');
    screen.className = 'screen-container combat-screen';

    // 怪物區
    const hpPercent = Math.max(0, Math.min(100, Math.floor((monster.currentHp / monster.maxHp) * 100)));
    const intent = monster.intents[monster.currentIntentIdx];

    let intentIcon = '⚔️';
    if (intent.type === 'DEFEND') intentIcon = '🛡️';
    if (intent.type === 'DEBUFF') intentIcon = '☠️';
    if (intent.type === 'SPECIAL') intentIcon = '⚡';

    let displayDamage = intent.value;
    if (monster.frozenReduction && monster.frozenReduction > 0) {
      displayDamage = Math.max(0, displayDamage - monster.frozenReduction);
    }

    const monsterSection = document.createElement('div');
    monsterSection.className = 'monster-section';
    monsterSection.id = 'monster-section';
    monsterSection.innerHTML = `
      <div class="monster-header">
        <div class="monster-avatar" id="monster-avatar">${monster.avatar}</div>
        <div class="monster-info">
          <div class="monster-name">
            ${monster.name} ${monster.isBoss ? '【首領】' : monster.isElite ? '【精英】' : ''}
          </div>
          <div class="hp-bar-container">
            <div class="hp-bar-fill" style="width: ${hpPercent}%;"></div>
            <div class="hp-bar-text">${monster.currentHp} / ${monster.maxHp} ${monster.block > 0 ? `(+🛡️${monster.block})` : ''}</div>
          </div>
          <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-top: 4px;">
            ${monster.hasPhylactery ? `
              <div class="phylactery-badge ${monster.isPhylacteryBroken ? 'broken' : ''}">
                🏺 護命匣: ${monster.isPhylacteryBroken ? '已擊破 💥' : '守護中 ✨'}
              </div>
            ` : ''}
            ${monster.poison > 0 ? `<div style="font-size: 11px; color: #8ce09e;">☠️ 中毒: ${monster.poison}</div>` : ''}
            ${monster.frozenReduction && monster.frozenReduction > 0 ? `
              <div style="font-size: 11px; color: #70c4ff;">❄️ 冰封減傷: -${monster.frozenReduction}</div>
            ` : ''}
          </div>
        </div>
      </div>
      <div class="monster-intent-badge">
        <span>預告意圖:</span>
        <b>${intentIcon} ${intent.name} (${intent.type === 'ATTACK' && monster.frozenReduction ? `威力 ${displayDamage} [冰封減傷]` : intent.description})</b>
      </div>
    `;
    screen.appendChild(monsterSection);

    // 技能卡牌網格
    const cardsGrid = document.createElement('div');
    cardsGrid.className = 'cards-grid';
    cardsGrid.id = 'cards-grid';

    const selectedDie = cState.dice.find((d) => d.id === cState.selectedDieId);

    cState.cards.forEach((card) => {
      const cardEl = document.createElement('div');
      cardEl.className = 'skill-card';
      cardEl.dataset.cardId = card.id;

      // Compatibility highlight for selected die
      if (selectedDie && !selectedDie.isUsed) {
        const effVal = combat.getEffectiveDieValue(selectedDie.value);
        if (canSocketDie(selectedDie, card, effVal)) {
          cardEl.classList.add('highlight-compatible');
        }
      }

      let ruleDesc = '任意點數';
      if (card.rule.type === 'MIN') ruleDesc = `需 ≥ ${card.rule.param} 點`;
      if (card.rule.type === 'MAX') ruleDesc = `需 ≤ ${card.rule.param} 點`;
      if (card.rule.type === 'EVEN') ruleDesc = '需偶數 (2, 4, 6)';
      if (card.rule.type === 'ODD') ruleDesc = '需奇數 (1, 3, 5)';
      if (card.rule.type === 'PAIR') ruleDesc = '需兩顆相同點數';
      if (card.rule.type === 'SUM') ruleDesc = `多骰合計 ≥ ${card.rule.param}`;
      if (card.rule.type === 'SUB_DIFF') ruleDesc = '需 2 顆骰 (差值×5暴擊)';

      cardEl.innerHTML = `
        <div>
          <div class="skill-card-name">${card.name}</div>
          <div class="skill-card-desc">${card.description}</div>
        </div>
        <div class="card-socket ${card.slottedDice.length > 0 ? 'ready' : ''}" id="socket-${card.id}" data-card-id="${card.id}">
          ${card.slottedDice.length === 0 ? `<span class="socket-rule-hint">${ruleDesc}</span>` : ''}
        </div>
        <div style="font-size: 11px; color: var(--border-gold); font-weight: bold; text-align: right;">
          ${card.executeText}
        </div>
      `;

      // Render slotted dice into socket
      const socketEl = cardEl.querySelector(`#socket-${card.id}`)!;
      card.slottedDice.forEach((d) => {
        const dEl = this.renderDieElement(d, false);
        socketEl.appendChild(dEl);
      });

      // 直接點選卡牌/卡槽自動填槽 (單手極度舒適)
      cardEl.addEventListener('click', (e) => {
        // If clicking slotted dice to remove
        if ((e.target as HTMLElement).closest('.die-element') && card.slottedDice.length > 0) {
          combat.unslotDiceFromCard(card.id);
          return;
        }

        if (cState.selectedDieId) {
          const success = combat.socketDieToCard(card.id, cState.selectedDieId);
          if (success) {
            this.triggerCardVisualEffect(card.id);
          }
        } else if (card.slottedDice.length > 0) {
          combat.unslotDiceFromCard(card.id);
        }
      });

      cardsGrid.appendChild(cardEl);
    });
    screen.appendChild(cardsGrid);

    // 戰鬥即時日誌
    const logBar = document.createElement('div');
    logBar.className = 'combat-log-bar';
    logBar.textContent = cState.log[0] || '戰鬥進行中，請分配骰子...';
    screen.appendChild(logBar);

    // 底部控制區與骰池
    const bottomBar = document.createElement('div');
    bottomBar.className = 'combat-bottom-bar';

    // 戰術微調欄
    const perksBar = document.createElement('div');
    perksBar.className = 'perks-bar';

    let perkText = '';
    let perkBtnText = '';
    let canUsePerk = false;

    if (run.heroClass === 'ROGUE') {
      const maxR = 2 + store.save.meta.talents.destiny + run.bonusRerollsPerCombat;
      perkText = `靈巧重擲 (剩餘 ${Math.max(0, maxR - cState.freeRerollsUsed)} 次)`;
      perkBtnText = '重擲小骰 (≤3)';
      canUsePerk = cState.freeRerollsUsed < maxR && selectedDie !== undefined && selectedDie.value <= 3;
    } else if (run.heroClass === 'MAGE') {
      perkText = `符文鏡面 (剩餘 ${1 - cState.freeFlipsUsed} 次)`;
      perkBtnText = '骰子翻面 (7-x)';
      canUsePerk = cState.freeFlipsUsed < 1 && selectedDie !== undefined && !selectedDie.isUsed;
    } else {
      const maxR = 1 + store.save.meta.talents.destiny + run.bonusRerollsPerCombat;
      perkText = `重鎧防線 (剩餘重擲 ${Math.max(0, maxR - cState.freeRerollsUsed)} 次)`;
      perkBtnText = '戰術重擲';
      canUsePerk = cState.freeRerollsUsed < maxR && selectedDie !== undefined && !selectedDie.isUsed;
    }

    perksBar.innerHTML = `<span style="font-size: 12px; color: var(--text-dim);">${perkText}</span>`;

    const btnGroup = document.createElement('div');
    btnGroup.style.display = 'flex';
    btnGroup.style.gap = '8px';

    if (selectedDie && !selectedDie.isUsed) {
      // 快捷智慧填槽按鈕
      const autoBtn = document.createElement('button');
      autoBtn.className = 'btn';
      autoBtn.style.minHeight = '34px';
      autoBtn.style.padding = '4px 10px';
      autoBtn.style.fontSize = '12px';
      autoBtn.textContent = '⚡ 磁吸填槽';
      autoBtn.onclick = () => {
        combat.autoSlotDie(selectedDie.id);
      };
      btnGroup.appendChild(autoBtn);
    }

    if (canUsePerk) {
      const pBtn = document.createElement('button');
      pBtn.className = 'btn btn-secondary';
      pBtn.style.minHeight = '34px';
      pBtn.style.padding = '4px 10px';
      pBtn.style.fontSize = '12px';
      pBtn.textContent = perkBtnText;
      pBtn.onclick = () => {
        if (!cState.selectedDieId) return;
        if (run.heroClass === 'MAGE') {
          combat.useFlipPerk(cState.selectedDieId);
        } else {
          combat.useRerollPerk(cState.selectedDieId);
        }
      };
      btnGroup.appendChild(pBtn);
    }

    perksBar.appendChild(btnGroup);
    bottomBar.appendChild(perksBar);

    // 骰池
    const poolContainer = document.createElement('div');
    poolContainer.className = 'dice-pool-container';
    poolContainer.id = 'dice-pool';

    cState.dice.forEach((die) => {
      const dEl = this.renderDieElement(die, die.id === cState.selectedDieId);

      // 單手觸控/滑鼠拖曳與點選
      this.attachDiceDragAndClick(dEl, die);

      poolContainer.appendChild(dEl);
    });
    bottomBar.appendChild(poolContainer);

    // 結束回合按鈕
    const endTurnBtn = document.createElement('button');
    endTurnBtn.className = 'btn btn-block';
    endTurnBtn.style.fontSize = '16px';
    endTurnBtn.textContent = '結束玩家回合 (End Turn)';
    endTurnBtn.onclick = () => {
      combat.endPlayerTurn();
    };
    bottomBar.appendChild(endTurnBtn);

    screen.appendChild(bottomBar);
    this.container.appendChild(screen);

    // Initial roll if empty
    if (cState.dice.length === 0) {
      combat.startPlayerTurn();
    }
  }

  // 骰子渲染器 (擬真 3D 投影翻滾效果、象牙與詛咒紋理)
  private renderDieElement(die: Die, isSelected: boolean): HTMLElement {
    const el = document.createElement('div');
    el.className = `die-element ${isSelected ? 'selected' : ''} ${die.isUsed ? 'used' : ''} ${die.isCursed ? 'cursed' : ''} ${die.isRolling ? 'rolling' : ''}`;
    el.dataset.dieId = die.id;

    // 清除滾動動畫標誌
    if (die.isRolling) {
      setTimeout(() => {
        die.isRolling = false;
        el.classList.remove('rolling');
      }, 650);
    }

    // 經典骨骰/象牙點陣
    const positions: Record<number, number[]> = {
      1: [4],
      2: [0, 8],
      3: [0, 4, 8],
      4: [0, 2, 6, 8],
      5: [0, 2, 4, 6, 8],
      6: [0, 2, 3, 5, 6, 8]
    };

    const activeIndices = positions[die.value] || [4];
    for (let i = 0; i < 9; i++) {
      if (activeIndices.includes(i)) {
        const dot = document.createElement('div');
        dot.className = `die-dot ${die.value === 1 ? 'dot-center-red' : ''}`;
        el.appendChild(dot);
      } else {
        const empty = document.createElement('div');
        el.appendChild(empty);
      }
    }

    // 詛咒骰骷髏微光
    if (die.isCursed) {
      const curseBadge = document.createElement('div');
      curseBadge.className = 'die-curse-mark';
      curseBadge.textContent = '💀';
      el.appendChild(curseBadge);
    }

    return el;
  }

  // 觸控拖曳優化與磁吸對齊 (Magnetic Snap)
  private attachDiceDragAndClick(dEl: HTMLElement, die: Die): void {
    if (die.isUsed) return;

    let startX = 0;
    let startY = 0;
    let isDragging = false;
    let lastTapTime = 0;

    dEl.style.touchAction = 'none';

    const onPointerDown = (e: PointerEvent) => {
      startX = e.clientX;
      startY = e.clientY;
      isDragging = false;

      // Double-tap or double-click to auto-slot
      const now = Date.now();
      if (now - lastTapTime < 300) {
        combat.autoSlotDie(die.id);
        return;
      }
      lastTapTime = now;

      dEl.setPointerCapture(e.pointerId);

      const onPointerMove = (ev: PointerEvent) => {
        const dist = Math.hypot(ev.clientX - startX, ev.clientY - startY);
        if (dist > 8 && !isDragging) {
          isDragging = true;
          combat.selectDie(die.id);

          // Create floating ghost die
          this.ghostDie = dEl.cloneNode(true) as HTMLElement;
          this.ghostDie.classList.add('ghost-die');
          this.ghostDie.style.left = `${ev.clientX - 26}px`;
          this.ghostDie.style.top = `${ev.clientY - 26}px`;
          document.body.appendChild(this.ghostDie);
        }

        if (isDragging && this.ghostDie) {
          this.ghostDie.style.left = `${ev.clientX - 26}px`;
          this.ghostDie.style.top = `${ev.clientY - 26}px`;

          // 磁吸對齊計算 (Magnetic Snap)
          this.handleMagneticSnap(ev.clientX, ev.clientY, die);
        }
      };

      const onPointerUp = (ev: PointerEvent) => {
        dEl.releasePointerCapture(ev.pointerId);
        dEl.removeEventListener('pointermove', onPointerMove);
        dEl.removeEventListener('pointerup', onPointerUp);
        dEl.removeEventListener('pointercancel', onPointerUp);

        if (this.ghostDie) {
          this.ghostDie.remove();
          this.ghostDie = null;
        }

        if (isDragging) {
          isDragging = false;

          // Check if dropped onto snapped card
          if (this.currentSnappedCardId) {
            combat.socketDieToCard(this.currentSnappedCardId, die.id);
            this.clearSnapHighlights();
          }
        } else {
          // Just a single click: select or toggle
          combat.selectDie(die.id);
        }
      };

      dEl.addEventListener('pointermove', onPointerMove);
      dEl.addEventListener('pointerup', onPointerUp);
      dEl.addEventListener('pointercancel', onPointerUp);
    };

    dEl.addEventListener('pointerdown', onPointerDown);
  }

  private handleMagneticSnap(x: number, y: number, die: Die): void {
    const sockets = document.querySelectorAll('.card-socket');
    let nearestSocket: HTMLElement | null = null;
    let minDistance = 70; // 磁吸閾值 (Snap radius)

    sockets.forEach((s) => {
      const el = s as HTMLElement;
      const rect = el.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const dist = Math.hypot(x - centerX, y - centerY);

      if (dist < minDistance) {
        minDistance = dist;
        nearestSocket = el;
      }
    });

    this.clearSnapHighlights();

    if (nearestSocket) {
      const cardId = (nearestSocket as HTMLElement).dataset.cardId;
      if (cardId) {
        const card = store.run?.combat?.cards.find((c) => c.id === cardId);
        if (card) {
          const effVal = combat.getEffectiveDieValue(die.value);
          if (canSocketDie(die, card, effVal)) {
            (nearestSocket as HTMLElement).classList.add('magnetic-snapped');
            this.currentSnappedCardId = cardId;
            return;
          }
        }
      }
    }

    this.currentSnappedCardId = null;
  }

  private clearSnapHighlights(): void {
    document.querySelectorAll('.card-socket.magnetic-snapped').forEach((el) => {
      el.classList.remove('magnetic-snapped');
    });
  }

  // 觸發戰鬥特效 (斬擊破屏劃痕、鋼鐵光盾火花、怪物受傷紅光震顫)
  private triggerCardVisualEffect(cardId: string): void {
    if (cardId.includes('SLASH') || cardId.includes('DAGGER') || cardId.includes('BACKSTAB') || cardId.includes('EXECUTE')) {
      this.triggerSlashFX();
      this.triggerMonsterHitFX();
    } else if (cardId.includes('BLOCK') || cardId.includes('SHIELD') || cardId.includes('RIPOSTE')) {
      this.triggerShieldSparksFX();
    }
  }

  private triggerSlashFX(): void {
    const fxLayer = document.getElementById('fx-layer');
    if (!fxLayer) return;

    const slash = document.createElement('div');
    slash.className = 'slash-fx-anim';
    fxLayer.appendChild(slash);

    // Screen Shake
    document.body.classList.add('screen-shake');
    setTimeout(() => {
      document.body.classList.remove('screen-shake');
      slash.remove();
    }, 450);
  }

  private triggerShieldSparksFX(): void {
    const fxLayer = document.getElementById('fx-layer');
    if (!fxLayer) return;

    const shield = document.createElement('div');
    shield.className = 'shield-sparks-fx';
    shield.innerHTML = `
      <div class="shield-aura">🛡️</div>
      <div class="sparks-burst"></div>
    `;
    fxLayer.appendChild(shield);

    setTimeout(() => {
      shield.remove();
    }, 600);
  }

  private triggerMonsterHitFX(): void {
    const avatar = document.getElementById('monster-avatar');
    const section = document.getElementById('monster-section');
    if (avatar) {
      avatar.classList.add('monster-damaged-hit');
      setTimeout(() => avatar.classList.remove('monster-damaged-hit'), 400);
    }
    if (section) {
      section.classList.add('monster-damaged-shake');
      setTimeout(() => section.classList.remove('monster-damaged-shake'), 400);
    }
  }

  // 5. 命運祭壇 (Altar of Fate) - 核心升級
  private renderAltarOfFate(): void {
    this.container.appendChild(this.createTopBar());

    const run = store.run;
    if (!run) return;

    const screen = document.createElement('div');
    screen.className = 'screen-container';
    screen.style.alignItems = 'center';
    screen.style.justifyContent = 'center';

    screen.innerHTML = `
      <div style="text-align: center; margin-bottom: 20px;">
        <div style="font-size: 50px; margin-bottom: 8px; filter: drop-shadow(0 0 16px rgba(255, 209, 102, 0.6));">🔮✨</div>
        <h2 style="color: #ffd166; font-size: 24px; margin-bottom: 6px;">命運祭壇 (Altar of Fate)</h2>
        <p style="font-size: 13px; color: var(--text-dim); max-width: 360px; line-height: 1.5;">
          地下城戰意平息，古老祭壇自地磚升起。請獻祭命運點陣，選擇一種永久骰子祭煉賜福：
        </p>
      </div>

      <div style="display: flex; flex-direction: column; gap: 14px; width: 100%; max-width: 380px;">
        <!-- 選擇 1: 命運重洗 -->
        <div class="fate-option-card" id="fate-opt-reroll">
          <div style="font-size: 28px;">🎲</div>
          <div style="flex: 1;">
            <div style="font-weight: bold; color: #ffd166; font-size: 15px;">命運重洗 (Fate Reroll)</div>
            <div style="font-size: 12px; color: var(--text-dim); margin-top: 2px;">
              每場戰鬥額外獲得 <b style="color: #ffd166;">+1 次</b> 免費戰術重擲次數 (當前重擲加成: +${run.bonusRerollsPerCombat})
            </div>
          </div>
        </div>

        <!-- 選擇 2: 雙子分裂 -->
        <div class="fate-option-card ${run.baseDiceCount >= 6 ? 'disabled' : ''}" id="fate-opt-split">
          <div style="font-size: 28px;">♊</div>
          <div style="flex: 1;">
            <div style="font-weight: bold; color: #4ea8de; font-size: 15px;">雙子分裂 (Soul Split)</div>
            <div style="font-size: 12px; color: var(--text-dim); margin-top: 2px;">
              將 1 顆 6 點骰分裂為兩顆 3 點骰，<b style="color: #4ea8de;">基礎骰池永久 +1 顆</b> (當前: ${run.baseDiceCount}/6 顆)
            </div>
          </div>
        </div>

        <!-- 選擇 3: 永恆淬煉 -->
        <div class="fate-option-card" id="fate-opt-bless">
          <div style="font-size: 28px;">✨</div>
          <div style="flex: 1;">
            <div style="font-weight: bold; color: #a3e635; font-size: 15px;">永恆淬煉 (Eternal Blessing)</div>
            <div style="font-size: 12px; color: var(--text-dim); margin-top: 2px;">
              古代金光淬煉，所有投擲的骰子點數 <b style="color: #a3e635;">永久 +1</b> (當前祝福: +${run.permanentDieBonus})
            </div>
          </div>
        </div>

        <button id="btn-skip-fate" class="btn btn-secondary btn-block" style="margin-top: 8px;">
          不進行祭煉，前往下一區域
        </button>
      </div>
    `;

    this.container.appendChild(screen);

    screen.querySelector('#fate-opt-reroll')?.addEventListener('click', () => {
      sound.playAltarBlessing();
      store.applyFateReroll();
    });

    if (run.baseDiceCount < 6) {
      screen.querySelector('#fate-opt-split')?.addEventListener('click', () => {
        sound.playAltarBlessing();
        store.applyFateSplit();
      });
    }

    screen.querySelector('#fate-opt-bless')?.addEventListener('click', () => {
      sound.playAltarBlessing();
      store.applyFateBlessing();
    });

    screen.querySelector('#btn-skip-fate')?.addEventListener('click', () => {
      store.proceedAfterFate();
    });
  }

  // 6. 契約祭壇
  private renderAltar(): void {
    this.container.appendChild(this.createTopBar());

    const screen = document.createElement('div');
    screen.className = 'screen-container';
    screen.innerHTML = `
      <div style="text-align: center; margin-bottom: 16px;">
        <h2 style="color: #ff7b72;">📜 鮮血與命運祭壇</h2>
        <p style="font-size: 13px; color: var(--text-dim);">簽訂強效契約，獲得超凡力量，但必須承擔對等的反噬代價。</p>
      </div>
      <div class="altar-pacts-list" id="pacts-container"></div>
      <div style="text-align: center; margin-top: 16px;">
        <button id="btn-skip-altar" class="btn btn-secondary">無視誘惑，離開祭壇</button>
      </div>
    `;

    const container = screen.querySelector('#pacts-container')!;
    const availablePacts = Object.values(ALL_PACTS).filter(
      (p) => !store.run?.activePacts.includes(p.id)
    );

    availablePacts.slice(0, 3).forEach((pact) => {
      const card = document.createElement('div');
      card.className = 'pact-card';
      card.innerHTML = `
        <div style="font-size: 16px; font-weight: bold; color: var(--border-gold);">${pact.name}</div>
        <div style="font-size: 12px; color: var(--text-dim);">${pact.title}</div>
        <div class="pact-benefit">${pact.benefitText}</div>
        <div class="pact-cost">${pact.costText}</div>
        <button class="btn btn-danger btn-block" style="margin-top: 6px;">簽署契約</button>
      `;

      card.querySelector('button')?.addEventListener('click', () => {
        sound.playPactSigned();
        store.signPact(pact.id);
      });

      container.appendChild(card);
    });

    this.container.appendChild(screen);

    screen.querySelector('#btn-skip-altar')?.addEventListener('click', () => {
      store.completeCurrentRoom();
    });
  }

  // 7. 營火休整
  private renderCampfire(): void {
    this.container.appendChild(this.createTopBar());

    const screen = document.createElement('div');
    screen.className = 'screen-container';
    screen.style.alignItems = 'center';
    screen.style.justifyContent = 'center';
    screen.innerHTML = `
      <div style="font-size: 60px; margin-bottom: 12px; filter: drop-shadow(0 0 16px rgba(255, 140, 0, 0.6));">🔥</div>
      <h2 style="color: var(--border-gold); margin-bottom: 8px;">避難所營火</h2>
      <p style="font-size: 14px; color: var(--text-dim); margin-bottom: 24px; text-align: center; max-width: 320px;">
        微弱的溫暖火光驅散了地牢深處的刺骨寒意。請選擇休整方式：
      </p>
      <div style="display: flex; flex-direction: column; gap: 12px; width: 100%; max-width: 300px;">
        <button id="btn-camp-heal" class="btn btn-block">休養生息 (回復 40% 生命值)</button>
        <button id="btn-camp-train" class="btn btn-secondary btn-block">體能鍛鍊 (最大生命上限 +5)</button>
      </div>
    `;

    this.container.appendChild(screen);

    screen.querySelector('#btn-camp-heal')?.addEventListener('click', () => {
      sound.playHeal();
      store.restAtCampfire('HEAL');
    });

    screen.querySelector('#btn-camp-train')?.addEventListener('click', () => {
      sound.playShieldBlock();
      store.restAtCampfire('TRAIN');
    });
  }

  // 8. 勝利通關
  private renderVictory(): void {
    const screen = document.createElement('div');
    screen.className = 'screen-container';
    screen.style.alignItems = 'center';
    screen.style.justifyContent = 'center';
    screen.style.textAlign = 'center';

    screen.innerHTML = `
      <div style="font-size: 64px; margin-bottom: 16px; filter: drop-shadow(0 0 20px rgba(255, 215, 0, 0.8));">🏆👑</div>
      <h1 style="color: #ffd166; font-size: 28px; margin-bottom: 8px;">契約履行！地下城征服！</h1>
      <p style="font-size: 15px; color: var(--text-dim); max-width: 380px; margin-bottom: 20px;">
        你擊潰了深淵巫妖與終末之主墨菲斯，斬斷了命運枷鎖，帶著無盡的古老靈魂凱旋而歸！
      </p>
      <div style="background: var(--bg-card); border: 2px solid var(--border-gold); border-radius: 8px; padding: 16px; margin-bottom: 24px; width: 100%; max-width: 320px; font-size: 14px;">
        <div style="margin-bottom: 6px;">收集靈魂碎片: <b style="color: #4ea8de;">+${store.run?.soulsEarned || 0}</b></div>
        <div style="margin-bottom: 6px;">金幣儲備: <b style="color: #ffd166;">${store.run?.gold || 0}</b></div>
        <div style="margin-top: 10px; padding-top: 8px; border-top: 1px dashed #794336; font-size: 15px;">
          最終結算得分: <b style="color: #a3e635; font-size: 18px;">${store.lastScore || 0} 分</b>
        </div>
      </div>
      <button id="btn-victory-back" class="btn btn-block" style="max-width: 280px;">領取靈魂並返回標題</button>
    `;

    this.container.appendChild(screen);

    screen.querySelector('#btn-victory-back')?.addEventListener('click', () => {
      store.setState('TITLE');
    });
  }

  // 9. 戰敗結算 (修復同歸於盡邊界)
  private renderGameOver(): void {
    const screen = document.createElement('div');
    screen.className = 'screen-container';
    screen.style.alignItems = 'center';
    screen.style.justifyContent = 'center';
    screen.style.textAlign = 'center';

    screen.innerHTML = `
      <div style="font-size: 64px; margin-bottom: 16px; filter: drop-shadow(0 0 16px rgba(255, 107, 107, 0.6));">💀🪦</div>
      <h1 style="color: #ff6b6b; font-size: 26px; margin-bottom: 8px;">魂歸深淵</h1>
      <p style="font-size: 14px; color: var(--text-dim); max-width: 340px; margin-bottom: 20px;">
        你的肉身在險惡的地牢中倒下，殘留的靈魂碎片已被收納回靈魂殿堂。
      </p>
      <div style="background: var(--bg-card); border: 1px solid #794336; border-radius: 8px; padding: 14px; margin-bottom: 24px; width: 100%; max-width: 300px; font-size: 14px;">
        <div style="margin-bottom: 6px;">獲得靈魂碎片: <b style="color: #4ea8de;">+${store.run?.soulsEarned || 0}</b></div>
        <div style="margin-top: 10px; padding-top: 8px; border-top: 1px dashed #794336; font-size: 15px;">
          最終結算得分: <b style="color: #ffd166; font-size: 18px;">${store.lastScore || 0} 分</b>
        </div>
      </div>
      <button id="btn-defeat-back" class="btn btn-block" style="max-width: 280px;">重返生者世界</button>
    `;

    this.container.appendChild(screen);

    screen.querySelector('#btn-defeat-back')?.addEventListener('click', () => {
      store.setState('TITLE');
    });
  }

  // 10. 靈魂殿堂
  private renderHallOfSouls(): void {
    this.container.appendChild(this.createTopBar());

    const screen = document.createElement('div');
    screen.className = 'screen-container';
    const shards = store.save.meta.soulShards;
    const talents = store.save.meta.talents;

    screen.innerHTML = `
      <div style="text-align: center; margin-bottom: 16px;">
        <h2 style="color: #4ea8de;">✨ 靈魂殿堂 (Hall of Souls)</h2>
        <div style="font-size: 14px; color: var(--text-dim);">可用靈魂碎片儲備: <b style="color: #4ea8de; font-size: 18px;">${shards}</b></div>
      </div>

      <div style="display: flex; flex-direction: column; gap: 12px; max-width: 500px; margin: 0 auto; width: 100%;">
        <!-- 生命加成 -->
        <div class="map-node" style="cursor: default;">
          <div>
            <div style="font-weight: bold;">❤️ 體魄鍛造 (等級 ${talents.vitality}/3)</div>
            <div style="font-size: 12px; color: var(--text-dim);">冒險開局生命上限 +${talents.vitality * 4}</div>
          </div>
          <div>
            ${talents.vitality < 3 ? `<button id="btn-up-vit" class="btn" style="min-height: 38px; padding: 4px 12px; font-size: 12px;">升級 (${[20,40,70][talents.vitality]} 碎片)</button>` : '<span style="color: #4ea8de;">已滿級</span>'}
          </div>
        </div>

        <!-- 幸運重骰 -->
        <div class="map-node" style="cursor: default;">
          <div>
            <div style="font-weight: bold;">🎲 命運眷顧 (等級 ${talents.destiny}/1)</div>
            <div style="font-size: 12px; color: var(--text-dim);">每場戰鬥額外獲得 1 次免費重擲</div>
          </div>
          <div>
            ${talents.destiny < 1 ? `<button id="btn-up-des" class="btn" style="min-height: 38px; padding: 4px 12px; font-size: 12px;">升級 (50 碎片)</button>` : '<span style="color: #4ea8de;">已滿級</span>'}
          </div>
        </div>

        <!-- 初始金幣 -->
        <div class="map-node" style="cursor: default;">
          <div>
            <div style="font-weight: bold;">💰 財富積蓄 (等級 ${talents.fortune}/2)</div>
            <div style="font-size: 12px; color: var(--text-dim);">開局額外攜帶 +${talents.fortune * 25} 金幣</div>
          </div>
          <div>
            ${talents.fortune < 2 ? `<button id="btn-up-for" class="btn" style="min-height: 38px; padding: 4px 12px; font-size: 12px;">升級 (${[25,50][talents.fortune]} 碎片)</button>` : '<span style="color: #4ea8de;">已滿級</span>'}
          </div>
        </div>
      </div>

      <div style="text-align: center; margin-top: 24px;">
        <button id="btn-hall-back" class="btn btn-secondary">返回標題</button>
      </div>
    `;

    this.container.appendChild(screen);

    screen.querySelector('#btn-up-vit')?.addEventListener('click', () => {
      if (store.upgradeTalent('vitality')) {
        sound.playHeal();
        this.render();
      } else {
        alert('靈魂碎片不足！');
      }
    });

    screen.querySelector('#btn-up-des')?.addEventListener('click', () => {
      if (store.upgradeTalent('destiny')) {
        sound.playDiceSocket();
        this.render();
      } else {
        alert('靈魂碎片不足！');
      }
    });

    screen.querySelector('#btn-up-for')?.addEventListener('click', () => {
      if (store.upgradeTalent('fortune')) {
        sound.playShieldBlock();
        this.render();
      } else {
        alert('靈魂碎片不足！');
      }
    });

    screen.querySelector('#btn-hall-back')?.addEventListener('click', () => {
      store.setState('TITLE');
    });
  }
}
