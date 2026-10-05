// Web Audio API Procedural Retro Synthesizer
export class SoundManager {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  constructor() {
    this.isMuted = localStorage.getItem('mini-dungeon:muted') === 'true';
    this.initUnlockListener();
  }

  private initUnlockListener(): void {
    const unlock = () => {
      this.ensureContext();
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
      window.removeEventListener('touchstart', unlock);
    };
    window.addEventListener('pointerdown', unlock, { once: true });
    window.addEventListener('keydown', unlock, { once: true });
    window.addEventListener('touchstart', unlock, { once: true });
  }

  public ensureContext(): AudioContext | null {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    localStorage.setItem('mini-dungeon:muted', String(this.isMuted));
    return this.isMuted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  // 1. 擬真清脆木質/象牙骰子碰撞音效 (立體滾動與連環木質敲擊)
  public playDiceRoll(): void {
    if (this.isMuted) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    try {
      // 3-4 次微小且隨機的象牙/木塊碰撞 tap
      const tapTimes = [0, 0.05, 0.11, 0.18];
      tapTimes.forEach((delay, idx) => {
        const t = ctx.currentTime + delay;
        // 短促高頻木質碰撞
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = idx % 2 === 0 ? 'triangle' : 'sine';
        const baseFreq = 850 + Math.random() * 400;
        osc.frequency.setValueAtTime(baseFreq, t);
        osc.frequency.exponentialRampToValueAtTime(160, t + 0.035);

        const vol = 0.22 - idx * 0.04;
        gain.gain.setValueAtTime(vol, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.035);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.035);

        // 柔和白噪音混響
        const bufferSize = Math.floor(ctx.sampleRate * 0.03);
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
        }
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1400, t);
        const nGain = ctx.createGain();
        nGain.gain.setValueAtTime(0.12, t);
        nGain.gain.exponentialRampToValueAtTime(0.001, t + 0.03);
        noise.connect(filter);
        filter.connect(nGain);
        nGain.connect(ctx.destination);
        noise.start(t);
      });
    } catch {}
  }

  // 2. 骰子卡入槽位音效：清脆卡扣聲
  public playDiceSocket(): void {
    if (this.isMuted) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(540, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1080, ctx.currentTime + 0.06);

      gain.gain.setValueAtTime(0.24, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.06);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.06);
    } catch {}
  }

  // 3. 劍氣破屏斬擊音效 (金屬劃痕與破空呼嘯)
  public playSlash(): void {
    if (this.isMuted) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    try {
      // 呼嘯風聲
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(900, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + 0.16);

      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.16);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.16);

      // 金屬刃口鏗鏘高頻
      const metalOsc = ctx.createOscillator();
      const metalGain = ctx.createGain();
      metalOsc.type = 'square';
      metalOsc.frequency.setValueAtTime(1600, ctx.currentTime + 0.03);
      metalOsc.frequency.exponentialRampToValueAtTime(450, ctx.currentTime + 0.15);
      metalGain.gain.setValueAtTime(0.22, ctx.currentTime + 0.03);
      metalGain.gain.exponentialRampToValueAtTime(0.005, ctx.currentTime + 0.15);
      metalOsc.connect(metalGain);
      metalGain.connect(ctx.destination);
      metalOsc.start(ctx.currentTime + 0.03);
      metalOsc.stop(ctx.currentTime + 0.15);
    } catch {}
  }

  // 4. 攻擊命中音效
  public playAttackHit(): void {
    this.playSlash();
  }

  // 5. 鋼鐵神盾格擋與金屬火花音效
  public playShieldBlock(): void {
    if (this.isMuted) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    try {
      // 重型鋼鐵低頻沉悶震動
      const bass = ctx.createOscillator();
      const bassGain = ctx.createGain();
      bass.type = 'triangle';
      bass.frequency.setValueAtTime(180, ctx.currentTime);
      bass.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.22);
      bassGain.gain.setValueAtTime(0.35, ctx.currentTime);
      bassGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.22);
      bass.connect(bassGain);
      bassGain.connect(ctx.destination);
      bass.start();
      bass.stop(ctx.currentTime + 0.22);

      // 金屬撞擊火花高頻回音
      [1120, 1540].forEach((freq) => {
        const ring = ctx.createOscillator();
        const ringGain = ctx.createGain();
        ring.type = 'sine';
        ring.frequency.setValueAtTime(freq, ctx.currentTime);
        ringGain.gain.setValueAtTime(0.18, ctx.currentTime);
        ringGain.gain.exponentialRampToValueAtTime(0.005, ctx.currentTime + 0.28);
        ring.connect(ringGain);
        ringGain.connect(ctx.destination);
        ring.start();
        ring.stop(ctx.currentTime + 0.28);
      });
    } catch {}
  }

  // 6. 元素冰封晶體凝結音效
  public playFreeze(): void {
    if (this.isMuted) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    try {
      [980, 1318, 1760, 2093].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        const start = ctx.currentTime + idx * 0.04;
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.18, start);
        gain.gain.exponentialRampToValueAtTime(0.005, start + 0.18);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + 0.18);
      });
    } catch {}
  }

  // 7. 命運祭壇神聖賜福鐘鳴
  public playAltarBlessing(): void {
    if (this.isMuted) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    try {
      [329.63, 440, 554.37, 659.25, 880].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        const start = ctx.currentTime + idx * 0.08;
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.2, start);
        gain.gain.exponentialRampToValueAtTime(0.005, start + 0.6);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + 0.6);
      });
    } catch {}
  }

  // 8. 亡靈巫妖靈魂護命匣碎裂與重生震波
  public playLichResurrect(): void {
    if (this.isMuted) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    try {
      // 碎裂玻璃高頻
      const crash = ctx.createOscillator();
      const crashGain = ctx.createGain();
      crash.type = 'sawtooth';
      crash.frequency.setValueAtTime(1400, ctx.currentTime);
      crash.frequency.exponentialRampToValueAtTime(220, ctx.currentTime + 0.3);
      crashGain.gain.setValueAtTime(0.3, ctx.currentTime);
      crashGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      crash.connect(crashGain);
      crashGain.connect(ctx.destination);
      crash.start();
      crash.stop(ctx.currentTime + 0.3);

      // 冥界低吼長震波
      const roar = ctx.createOscillator();
      const roarGain = ctx.createGain();
      roar.type = 'sawtooth';
      roar.frequency.setValueAtTime(65, ctx.currentTime + 0.1);
      roar.frequency.linearRampToValueAtTime(130, ctx.currentTime + 0.5);
      roar.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 1.0);
      roarGain.gain.setValueAtTime(0.35, ctx.currentTime + 0.1);
      roarGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.0);
      roar.connect(roarGain);
      roarGain.connect(ctx.destination);
      roar.start(ctx.currentTime + 0.1);
      roar.stop(ctx.currentTime + 1.0);
    } catch {}
  }

  // 9. 契約簽署
  public playPactSigned(): void {
    if (this.isMuted) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    try {
      [110, 116.54, 164.81].forEach((freq) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        gain.gain.setValueAtTime(0.18, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.005, ctx.currentTime + 0.55);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.55);
      });
    } catch {}
  }

  // 10. 治療回復音效
  public playHeal(): void {
    if (this.isMuted) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    try {
      [523.25, 659.25, 783.99].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        const start = ctx.currentTime + idx * 0.08;
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.2, start);
        gain.gain.exponentialRampToValueAtTime(0.01, start + 0.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + 0.2);
      });
    } catch {}
  }

  // 11. 勝利音效
  public playVictory(): void {
    if (this.isMuted) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    try {
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        const start = ctx.currentTime + idx * 0.1;
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.25, start);
        gain.gain.exponentialRampToValueAtTime(0.01, start + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + 0.35);
      });
    } catch {}
  }

  // 12. 戰敗音效
  public playDefeat(): void {
    if (this.isMuted) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    try {
      [392.0, 369.99, 329.63, 261.63].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        const start = ctx.currentTime + idx * 0.18;
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.2, start);
        gain.gain.exponentialRampToValueAtTime(0.01, start + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + 0.3);
      });
    } catch {}
  }
}

export const sound = new SoundManager();
