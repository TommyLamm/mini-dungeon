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

  constructor(container: HTMLElement) {
    this.container = container;
  }

  public render(): void {
    const state = store.state;
    this.container.innerHTML = '';

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
        <div class="stat-badge">❤️ ${run.hp}/${run.maxHp}</div>
        <div class="stat-badge">🛡️ ${run.block}</div>
        <div class="stat-badge">💰 ${run.gold}</div>
        <div class="stat-badge">✨ ${run.soulsEarned}</div>
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
      <div style="font-size: 54px; margin-bottom: 8px;">🎲⚔️</div>
      <h1 class="game-title">微型地下城：骰子契約</h1>
      <p class="game-subtitle">投擲命運點數，嵌合戰技，與深淵簽訂終末盟約</p>
      
      <div class="title-actions">
        <button id="btn-start-run" class="btn btn-block">開始冒險</button>
        <button id="btn-hall-souls" class="btn btn-secondary btn-block">靈魂殿堂 (${store.save.meta.soulShards} 碎片)</button>
        <button id="btn-rules" class="btn btn-secondary btn-block">冒險者指南</button>
      </div>

      <div style="margin-top: 24px; font-size: 12px; color: var(--text-dim);">
        v1.0.0 · 純純前端靜態運作 · 支援直向觸控
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
        '【微型地下城：骰子契約 玩法說明】\n\n' +
        '1. 戰鬥中每回合擲出骰子，將骰子拖曳或點選放入技能槽。\n' +
        '2. 卡槽限制：Any（任意）、偶數、奇數、5+（下限）、對子、合計等。\n' +
        '3. 怪物擁有預告意圖（攻擊、護甲、中毒），請善用盾牌抵擋！\n' +
        '4. 祭壇中可簽訂強大的「血契」，提供超強被動但伴隨代價。\n' +
        '5. 戰利品靈魂可在靈魂殿堂永久升級生命與幸運！'
      );
    });
  }

  // 2. 英雄選擇
  private renderHeroSelect(): void {
    this.container.appendChild(this.createTopBar());

    const screen = document.createElement('div');
    screen.className = 'screen-container';
    screen.innerHTML = `
      <h2 style="text-align: center; color: var(--border-gold); margin-bottom: 16px;">選擇啟程英雄</h2>
      <div class="hero-select-grid" id="hero-grid"></div>
      <div style="display: flex; gap: 12px; max-width: 400px; margin: 20px auto 0; width: 100%;">
        <button id="btn-hero-back" class="btn btn-secondary" style="flex: 1;">返回</button>
        <button id="btn-hero-confirm" class="btn" style="flex: 2;">以該英雄啟程</button>
      </div>
    `;

    const grid = screen.querySelector('#hero-grid')!;
    Object.values(HEROES).forEach((hero) => {
      const isUnlocked = store.save.meta.unlockedHeroes.includes(hero.id);
      const card = document.createElement('div');
      card.className = `hero-card ${this.selectedHero === hero.id ? 'selected' : ''}`;
      if (!isUnlocked) card.style.opacity = '0.5';

      card.innerHTML = `
        <div class="hero-header">
          <div class="hero-avatar">${hero.avatar}</div>
          <div>
            <div style="font-size: 16px; font-weight: bold; color: var(--text-main);">${hero.name} ${!isUnlocked ? '(未解鎖)' : ''}</div>
            <div style="font-size: 12px; color: var(--text-dim);">${hero.title}</div>
          </div>
        </div>
        <div style="font-size: 13px; color: var(--text-dim);">
          生命值: <b style="color: #ff7b72;">${hero.baseHp}</b> | 基礎骰池: <b style="color: #ffd166;">${hero.baseDiceCount} 顆</b>
        </div>
        <div style="background: #181310; padding: 8px; border-radius: 6px; border: 1px solid var(--border-gold-dim); font-size: 12px;">
          <div style="font-weight: bold; color: var(--border-gold); margin-bottom: 2px;">⚡ 特長：${hero.perkName}</div>
          <div style="color: var(--text-dim);">${hero.perkDesc}</div>
        </div>
      `;

      if (isUnlocked) {
        card.onclick = () => {
          this.selectedHero = hero.id;
          sound.playDiceSocket();
          this.render();
        };
      } else {
        card.onclick = () => {
          alert(`此英雄尚未解鎖！擊敗地下城首領即可解鎖，或在靈魂殿堂兌換。`);
        };
      }

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

    const actNames = ['', '第一幕：古代墓穴', '第二幕：熔岩裂隙', '第三幕：虛空聖所'];
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

  // 4. 核心戰鬥畫面
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

    const monsterSection = document.createElement('div');
    monsterSection.className = 'monster-section';
    monsterSection.innerHTML = `
      <div class="monster-header">
        <div class="monster-avatar">${monster.avatar}</div>
        <div class="monster-info">
          <div class="monster-name">${monster.name} ${monster.isBoss ? '【首領】' : monster.isElite ? '【精英】' : ''}</div>
          <div class="hp-bar-container">
            <div class="hp-bar-fill" style="width: ${hpPercent}%;"></div>
            <div class="hp-bar-text">${monster.currentHp} / ${monster.maxHp} ${monster.block > 0 ? `(+🛡️${monster.block})` : ''}</div>
          </div>
          ${monster.poison > 0 ? `<div style="font-size: 11px; color: #8ce09e; margin-top: 2px;">☠️ 中毒層數: ${monster.poison}</div>` : ''}
        </div>
      </div>
      <div class="monster-intent-badge">
        <span>預告意圖:</span>
        <b>${intentIcon} ${intent.name} (${intent.description})</b>
      </div>
    `;
    screen.appendChild(monsterSection);

    // 技能卡牌網格
    const cardsGrid = document.createElement('div');
    cardsGrid.className = 'cards-grid';

    const selectedDie = cState.dice.find((d) => d.id === cState.selectedDieId);

    cState.cards.forEach((card) => {
      const cardEl = document.createElement('div');
      cardEl.className = 'skill-card';

      // Compatibility highlight
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

      cardEl.innerHTML = `
        <div>
          <div class="skill-card-name">${card.name}</div>
          <div class="skill-card-desc">${card.description}</div>
        </div>
        <div class="card-socket ${card.slottedDice.length > 0 ? 'ready' : ''}" id="socket-${card.id}">
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

      // Socket Click Handler
      socketEl.addEventListener('click', () => {
        if (cState.selectedDieId) {
          combat.socketDieToCard(card.id, cState.selectedDieId);
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
      const maxR = 2 + store.save.meta.talents.destiny;
      perkText = `靈巧重擲 (剩餘 ${Math.max(0, maxR - cState.freeRerollsUsed)} 次)`;
      perkBtnText = '重擲小骰 (≤3)';
      canUsePerk = cState.freeRerollsUsed < maxR && selectedDie !== undefined && selectedDie.value <= 3;
    } else if (run.heroClass === 'MAGE') {
      perkText = `符文鏡面 (剩餘 ${1 - cState.freeFlipsUsed} 次)`;
      perkBtnText = '骰子翻面 (7-x)';
      canUsePerk = cState.freeFlipsUsed < 1 && selectedDie !== undefined && !selectedDie.isUsed;
    } else {
      const maxR = 1 + store.save.meta.talents.destiny;
      perkText = `重鎧防線 (剩餘重擲 ${Math.max(0, maxR - cState.freeRerollsUsed)} 次)`;
      perkBtnText = '戰術重擲';
      canUsePerk = cState.freeRerollsUsed < maxR && selectedDie !== undefined && !selectedDie.isUsed;
    }

    perksBar.innerHTML = `<span style="font-size: 12px; color: var(--text-dim);">${perkText}</span>`;

    if (canUsePerk) {
      const pBtn = document.createElement('button');
      pBtn.className = 'btn btn-secondary';
      pBtn.style.minHeight = '36px';
      pBtn.style.padding = '4px 12px';
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
      perksBar.appendChild(pBtn);
    }
    bottomBar.appendChild(perksBar);

    // 骰池
    const poolContainer = document.createElement('div');
    poolContainer.className = 'dice-pool-container';

    cState.dice.forEach((die) => {
      const dEl = this.renderDieElement(die, die.id === cState.selectedDieId);
      dEl.addEventListener('click', () => {
        if (!die.isUsed) {
          combat.selectDie(die.id);
        }
      });
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

  // 骰子渲染器 (純 CSS 3x3 點陣)
  private renderDieElement(die: Die, isSelected: boolean): HTMLElement {
    const el = document.createElement('div');
    el.className = `die-element ${isSelected ? 'selected' : ''} ${die.isUsed ? 'used' : ''}`;

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
        dot.className = 'die-dot';
        el.appendChild(dot);
      } else {
        const empty = document.createElement('div');
        el.appendChild(empty);
      }
    }

    return el;
  }

  // 5. 契約祭壇
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

  // 6. 營火休整
  private renderCampfire(): void {
    this.container.appendChild(this.createTopBar());

    const screen = document.createElement('div');
    screen.className = 'screen-container';
    screen.style.alignItems = 'center';
    screen.style.justifyContent = 'center';
    screen.innerHTML = `
      <div style="font-size: 60px; margin-bottom: 12px;">🔥</div>
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

  // 7. 勝利通關
  private renderVictory(): void {
    const screen = document.createElement('div');
    screen.className = 'screen-container';
    screen.style.alignItems = 'center';
    screen.style.justifyContent = 'center';
    screen.style.textAlign = 'center';

    screen.innerHTML = `
      <div style="font-size: 64px; margin-bottom: 16px;">🏆👑</div>
      <h1 style="color: #ffd166; font-size: 28px; margin-bottom: 8px;">契約履行！地下城征服！</h1>
      <p style="font-size: 15px; color: var(--text-dim); max-width: 380px; margin-bottom: 20px;">
        你擊敗了終末之主墨菲斯，斬斷了詛咒的枷鎖，帶著無盡的古老靈魂凱旋而歸！
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

  // 8. 戰敗結算
  private renderGameOver(): void {
    const screen = document.createElement('div');
    screen.className = 'screen-container';
    screen.style.alignItems = 'center';
    screen.style.justifyContent = 'center';
    screen.style.textAlign = 'center';

    screen.innerHTML = `
      <div style="font-size: 64px; margin-bottom: 16px;">💀🪦</div>
      <h1 style="color: #ff6b6b; font-size: 26px; margin-bottom: 8px;">魂歸深淵</h1>
      <p style="font-size: 14px; color: var(--text-dim); max-width: 340px; margin-bottom: 20px;">
        你的肉身在地牢中倒下，但殘留的靈魂碎片已被收納回靈魂殿堂。
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

  // 9. 靈魂殿堂
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
