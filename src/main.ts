import './ui/styles.css';
import { store } from './core/state';
import { UIRenderer } from './ui/renderer';
import { sound } from './audio/sound-manager';
import { DungeonAmbient } from './ui/ambient';
import { Playroom } from './playroom-sdk';

window.addEventListener('DOMContentLoaded', () => {
  const appContainer = document.getElementById('app');
  if (!appContainer) return;

  // Initialize Dungeon Atmosphere Ambient Canvas
  const ambientCanvas = document.getElementById('ambient-canvas') as HTMLCanvasElement;
  if (ambientCanvas) {
    new DungeonAmbient(ambientCanvas);
  }

  // Ready Playroom SDK
  Playroom.ready().catch((err) => {
    console.warn('Playroom ready check (non-fatal):', err);
  });

  const renderer = new UIRenderer(appContainer);
  store.subscribe(() => {
    renderer.render();
  });

  // 初次渲染
  renderer.render();

  // 監聽使用者首次點擊解鎖 Web Audio API
  const unlockAudio = () => {
    sound.ensureContext();
    window.removeEventListener('pointerdown', unlockAudio);
    window.removeEventListener('keydown', unlockAudio);
    window.removeEventListener('touchstart', unlockAudio);
  };
  window.addEventListener('pointerdown', unlockAudio, { once: true });
  window.addEventListener('keydown', unlockAudio, { once: true });
  window.addEventListener('touchstart', unlockAudio, { once: true });
});
