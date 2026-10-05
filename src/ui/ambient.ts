// Dark Fantasy Dungeon Ambient Canvas Renderer
// Torchlight, dynamic wall shadows, flickering flames, and drifting stone dust/embers

interface DustParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  fadeSpeed: number;
  isEmber: boolean;
}

interface FlameParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
}

export class DungeonAmbient {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private animId: number = 0;
  private dusts: DustParticle[] = [];
  private leftFlames: FlameParticle[] = [];
  private rightFlames: FlameParticle[] = [];
  private width: number = 0;
  private height: number = 0;
  private flickerIntensity: number = 1.0;
  private flickerTarget: number = 1.0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.resize();
    this.initDusts(45);
    window.addEventListener('resize', () => this.resize());
    this.start();
  }

  private resize(): void {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = Math.floor(this.width * dpr);
    this.canvas.height = Math.floor(this.height * dpr);
    this.ctx.scale(dpr, dpr);
  }

  private initDusts(count: number): void {
    this.dusts = [];
    for (let i = 0; i < count; i++) {
      this.dusts.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: -0.2 - Math.random() * 0.5,
        size: Math.random() * 2 + 1,
        alpha: Math.random() * 0.6 + 0.2,
        fadeSpeed: (Math.random() * 0.008 + 0.004) * (Math.random() > 0.5 ? 1 : -1),
        isEmber: Math.random() < 0.25
      });
    }
  }

  private emitFlames(x: number, y: number, pool: FlameParticle[]): void {
    if (pool.length < 35) {
      const colors = ['#ffe066', '#ff922b', '#fa5252', '#f03e3e'];
      pool.push({
        x: x + (Math.random() - 0.5) * 8,
        y: y + (Math.random() - 0.5) * 4,
        vx: (Math.random() - 0.5) * 1.2,
        vy: -1.5 - Math.random() * 2.2,
        life: 0,
        maxLife: 20 + Math.random() * 25,
        size: 5 + Math.random() * 6,
        color: colors[Math.floor(Math.random() * colors.length)]
      });
    }
  }

  public start(): void {
    const render = () => {
      this.updateAndDraw();
      this.animId = requestAnimationFrame(render);
    };
    render();
  }

  public stop(): void {
    if (this.animId) cancelAnimationFrame(this.animId);
  }

  private updateAndDraw(): void {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    ctx.clearRect(0, 0, w, h);

    // 1. 火把搖曳計算 (Flicker)
    if (Math.random() < 0.12) {
      this.flickerTarget = 0.85 + Math.random() * 0.35;
    }
    this.flickerIntensity += (this.flickerTarget - this.flickerIntensity) * 0.15;

    // 2. 左右火把光源動態照射
    const leftTorchX = Math.max(24, Math.floor(w * 0.08));
    const rightTorchX = Math.min(w - 24, Math.floor(w * 0.92));
    const torchY = Math.max(90, Math.floor(h * 0.22));

    // 左光源光暈
    const leftGrad = ctx.createRadialGradient(
      leftTorchX,
      torchY,
      8,
      leftTorchX,
      torchY,
      180 * this.flickerIntensity
    );
    leftGrad.addColorStop(0, 'rgba(255, 160, 50, 0.25)');
    leftGrad.addColorStop(0.4, 'rgba(200, 80, 20, 0.10)');
    leftGrad.addColorStop(1, 'rgba(18, 15, 14, 0)');
    ctx.fillStyle = leftGrad;
    ctx.beginPath();
    ctx.arc(leftTorchX, torchY, 200, 0, Math.PI * 2);
    ctx.fill();

    // 右光源光暈
    const rightGrad = ctx.createRadialGradient(
      rightTorchX,
      torchY,
      8,
      rightTorchX,
      torchY,
      180 * this.flickerIntensity
    );
    rightGrad.addColorStop(0, 'rgba(255, 160, 50, 0.25)');
    rightGrad.addColorStop(0.4, 'rgba(200, 80, 20, 0.10)');
    rightGrad.addColorStop(1, 'rgba(18, 15, 14, 0)');
    ctx.fillStyle = rightGrad;
    ctx.beginPath();
    ctx.arc(rightTorchX, torchY, 200, 0, Math.PI * 2);
    ctx.fill();

    // 3. 火焰粒子生成與繪製
    this.emitFlames(leftTorchX, torchY, this.leftFlames);
    this.emitFlames(rightTorchX, torchY, this.rightFlames);

    [this.leftFlames, this.rightFlames].forEach((flames) => {
      for (let i = flames.length - 1; i >= 0; i--) {
        const p = flames[i];
        p.life++;
        p.x += p.vx;
        p.y += p.vy;
        p.size *= 0.94;

        const progress = p.life / p.maxLife;
        const alpha = Math.max(0, 1 - progress);

        ctx.fillStyle = p.color;
        ctx.globalAlpha = alpha * 0.7;
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(0.5, p.size), 0, Math.PI * 2);
        ctx.fill();

        if (p.life >= p.maxLife || p.size <= 0.5) {
          flames.splice(i, 1);
        }
      }
    });

    // 4. 地牢石壁漂浮微塵 (Stone Dust & Floating Ash Embers)
    ctx.globalAlpha = 1.0;
    this.dusts.forEach((d) => {
      d.x += d.vx;
      d.y += d.vy;
      d.alpha += d.fadeSpeed;
      if (d.alpha <= 0.1 || d.alpha >= 0.75) {
        d.fadeSpeed = -d.fadeSpeed;
      }

      if (d.y < -10) {
        d.y = h + 10;
        d.x = Math.random() * w;
      }
      if (d.x < -10) d.x = w + 10;
      if (d.x > w + 10) d.x = -10;

      ctx.fillStyle = d.isEmber ? '#ffa94d' : '#e9ecef';
      ctx.globalAlpha = Math.max(0, Math.min(0.7, d.alpha));
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.size, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.globalAlpha = 1.0;
  }
}
