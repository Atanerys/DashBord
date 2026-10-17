import { load } from './storage.js';
import { Dashboard } from './Dashboard.js';
import { RecipeWidget } from './RecipeWidget.js';
import { VideoWidget } from './VideoWidget.js';
import { TimerWidget } from './TimerWidget.js';
import { ShoppingWidget } from './ShoppingWidget.js';
import { MusicWidget } from './MusicWidget.js';

const registry = {
  recipe: { title: 'Рецепт', Widget: RecipeWidget },
  video: { title: 'Видеорецепт', Widget: VideoWidget },
  timer: { title: 'Таймер', Widget: TimerWidget },
  shopping: { title: 'Продукты', Widget: ShoppingWidget },
  music: { title: 'Музыка', Widget: MusicWidget },
};

const dash = new Dashboard(document.getElementById('grid'), registry, document.getElementById('hint'));
document.querySelectorAll('[data-add]').forEach((b) =>
  b.addEventListener('click', () => dash.addWidget(b.dataset.add))
);
dash.restore();

// Тема (тот же ключ и значения, что в портфолио)
const root = document.documentElement;
const themeBtn = document.getElementById('theme-toggle');
let stored = null;
try { stored = localStorage.getItem('theme'); } catch {}
function applyTheme(t) {
  root.dataset.theme = t;
  themeBtn.setAttribute('aria-pressed', String(t === 'dark'));
  themeBtn.textContent = t === 'dark' ? 'Светлая тема' : 'Тёмная тема';
}
applyTheme(stored === 'dark' || stored === 'light' ? stored
  : matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
themeBtn.addEventListener('click', () => {
  const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  try { localStorage.setItem('theme', next); } catch {}
});

// Живая статистика
const grid = document.getElementById('grid');
const stat = (k, v) => { const el = document.querySelector(`[data-stat=${k}]`); if (el) el.textContent = v; };
function updateStats() {
  stat('widgets', grid.children.length);
  const items = load('kitchen.shopping', []);
  stat('items', Array.isArray(items) ? items.length : 0);
  const t = load('kitchen.timer', null);
  stat('minutes', t && Number.isInteger(t.minutes) ? t.minutes : 10);
}
new MutationObserver(updateStats).observe(grid, { childList: true, subtree: true });
updateStats();