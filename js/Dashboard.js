import { load, save } from './storage.js';

const KEY = 'kitchen.dashboard';

export class Dashboard {
  constructor(container, registry, hintEl) {
    this.container = container;
    this.registry = registry; // { type: { title, Widget } }
    this.hintEl = hintEl;
    this.widgets = new Map();
    this.hintTimer = null;
    this.enableDrag();
  }

  restore() {
    const data = load(KEY, null);
    const types = data && Array.isArray(data.widgets) ? data.widgets : Object.keys(this.registry);
    types.forEach((t) => this.addWidget(t, true));
  }

  addWidget(type, silent = false) {
    const info = this.registry[type];
    if (!info) return false;
    if (this.widgets.has(type)) {
      if (!silent) this.hint(`Виджет «${info.title}» уже на панели. Можно добавить только один.`);
      return false;
    }
    try {
      const w = new info.Widget(type);
      w.onRemove = (id) => this.removeWidget(id);
      const el = w.render();
      el.querySelector('.card-head').title = 'Потяните за заголовок, чтобы переместить';
      this.container.append(el);
      this.widgets.set(type, w);
    } catch (e) {
      console.error(e);
      this.hint(`Не удалось создать виджет «${info.title}».`);
      return false;
    }
    this.persist();
    return true;
  }

  removeWidget(id) {
    const w = this.widgets.get(id);
    if (!w) return;
    try { w.destroy(); } catch (e) { console.error(e); }
    this.widgets.delete(id);
    this.persist();
  }


  persist() {
    const order = [...this.container.children].map((c) => c.dataset.id).filter((id) => this.widgets.has(id));
    save(KEY, { widgets: order });
  }


  enableDrag() {
    const c = this.container;
    let drag = null;
    c.addEventListener('pointerdown', (e) => {
      const head = e.target.closest('.card-head');
      if (!head || e.target.closest('button') || (e.pointerType === 'mouse' && e.button !== 0)) return;
      drag = { card: head.parentElement, x: e.clientX, y: e.clientY, on: false };
      try { head.setPointerCapture(e.pointerId); } catch {}
    });
    c.addEventListener('pointermove', (e) => {
      if (!drag) return;
      if (!drag.on) {
        if (Math.hypot(e.clientX - drag.x, e.clientY - drag.y) < 6) return;
        drag.on = true;
        drag.card.classList.add('dragging');
      }
      const target = document.elementsFromPoint(e.clientX, e.clientY)
        .map((el) => el.closest('.card'))
        .find((card) => card && card !== drag.card && card.parentElement === c);
      if (!target) return;
      const r = target.getBoundingClientRect();
      
      const after = (e.clientX - r.left) / r.width + (e.clientY - r.top) / r.height > 1;
      if (after) target.after(drag.card); else target.before(drag.card);
    });
    const end = () => {
      if (!drag) return;
      const moved = drag.on;
      drag.card.classList.remove('dragging');
      drag = null;
      if (moved) this.persist();
    };
    c.addEventListener('pointerup', end);
    c.addEventListener('pointercancel', end);
  }

  hint(msg) {
    this.hintEl.textContent = msg;
    clearTimeout(this.hintTimer);
    this.hintTimer = setTimeout(() => (this.hintEl.textContent = ''), 4000);
  }
}
