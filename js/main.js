// Titik masuk: menyatukan Game, Scene, UI, penyimpanan, dan service worker.
import { Game } from './game.js';
import { Scene } from './scene.js';
import { UI } from './ui.js';
import { saveNow, loadSave } from './store.js';

const game = new Game();
const scene = new Scene(document.getElementById('scene'), game);
let dirty = false, lastSave = 0;

const hooks = {
  save() { if (game.s) { saveNow(game.serialize()); dirty = false; lastSave = performance.now(); } },
  exportSave() {
    const blob = new Blob([game.serialize()], { type: 'application/json' }), a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = `neko-bank-it-hari${game.s.day}.json`; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  },
  async importSave(text) {
    const o = JSON.parse(text); if (!o || !o.employees || !o.v) throw new Error('invalid');
    saveNow(JSON.stringify(o)); location.reload();
  }
};
const ui = new UI(game, scene, hooks);
window.__game = game; window.__scene = scene; // untuk debugging

game.on('save', json => { saveNow(json); dirty = false; lastSave = performance.now(); });
game.on('change', () => { dirty = true; });

function begin(opts) {
  if (opts.mode === 'continue') { const s = loadSave(); if (s) game.load(s); else game.newGame({ name: 'Direktur', dirLook: undefined }); }
  else game.newGame({ name: opts.name, bank: opts.bank, dirLook: opts.dirLook });
  ui.startSession();
  game.s.speed = 1;
  if (opts.mode === 'new') { game.s.speed = 0; ui.showStarterWizard(() => { hooks.save(); ui.showWelcome(); }); }
  else if (!game.s.starterDone) { game.s.speed = 0; ui.showStarterWizard(() => { game.s.speed = 1; hooks.save(); }); }
  requestAnimationFrame(loop);
}

// Performa: resolusi kanvas menyesuaikan otomatis bila perangkat lambat; saat jeda/dialog digambar setengah frame
let last = performance.now(), ema = 16, nFrames = 0, skip = false;
function loop(now) {
  const idle = game.blocking || (game.s && game.s.speed === 0);
  if (idle) { skip = !skip; if (skip) { requestAnimationFrame(loop); return; } }
  const raw = now - last;
  if (!idle && raw < 200) {
    ema = ema * 0.94 + raw * 0.06;
    if (++nFrames % 90 === 0) {
      const q = scene.quality || 1;
      if (ema > 27 && q > 0.55) scene.setQuality(Math.max(0.55, q - 0.2));
      else if (ema < 18.5 && q < 1 && nFrames % 540 === 0) scene.setQuality(Math.min(1, q + 0.15));
    }
  }
  const dt = Math.min(0.1, raw / 1000); last = now;
  game.update(dt); scene.frame(dt); scene.draw(); ui.tick(dt);
  if (dirty && now - lastSave > 6000) hooks.save();
  requestAnimationFrame(loop);
}

window.addEventListener('resize', () => { if (game.s) ui.layout(); });
window.addEventListener('orientationchange', () => setTimeout(() => game.s && ui.layout(), 250));
document.addEventListener('visibilitychange', () => { if (document.hidden && game.s) hooks.save(); });
window.addEventListener('pagehide', () => { if (game.s) hooks.save(); });

ui.showTitle(begin);

// PWA
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); window.__installPrompt = e; });
if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}
