import { UIComponent } from './UIComponent.js';
import { load, save } from './storage.js';

const KEY = 'kitchen.timer';

export class TimerWidget extends UIComponent {
  constructor(id) {
    super(id, 'Таймер');
    const m = Number((load(KEY, null) || {}).minutes);
    this.minutes = Number.isInteger(m) && m >= 1 && m <= 999 ? m : 10;
    this.remaining = this.minutes * 60;
    this.timer = null;
    this.endAt = 0;
    this.ctx = null;
  }

  mount(body) {
    body.innerHTML = `<div class="row"><input type="number" min="1" max="999" step="1" aria-label="Минуты">
      <button type="button" class="btn" data-a="start">Старт</button>
      <button type="button" class="btn green" data-a="pause">Пауза</button>
      <button type="button" class="btn ghost" data-a="reset">Сброс</button></div>
      <div class="digits" aria-label="Осталось времени">00:00</div><p class="muted" aria-live="assertive"></p>`;
    this.input = body.querySelector('input');
    this.input.value = this.minutes;
    this.digits = body.querySelector('.digits');
    this.msg = body.querySelector('.muted');
    const on = (a, fn) => this.listen(body.querySelector(`[data-a=${a}]`), 'click', fn);
    on('start', () => this.start());
    on('pause', () => this.pause());
    on('reset', () => this.reset());
    this.listen(this.input, 'change', () => {
      const v = Number(this.input.value);
      this.minutes = Number.isInteger(v) && v >= 1 && v <= 999 ? v : this.minutes;
      this.input.value = this.minutes;
      save(KEY, { minutes: this.minutes });
      if (!this.timer) this.reset();
    });
    this.draw();
  }

  draw() {
    const s = this.remaining;
    this.digits.textContent = String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
  }

  start() {
    if (this.timer) return;
    if (this.remaining <= 0) this.remaining = this.minutes * 60;
    try {
      this.ctx = this.ctx || new AudioContext(); // создаём по клику — так разрешает браузер
      this.ctx.resume();
    } catch {}
    this.msg.textContent = '';
    this.digits.classList.remove('end');
    this.endAt = Date.now() + this.remaining * 1000;
    this.timer = setInterval(() => this.tick(), 250);
  }

  tick() {
    this.remaining = Math.max(0, Math.ceil((this.endAt - Date.now()) / 1000));
    this.draw();
    if (this.remaining === 0) {
      this.stop();
      this.digits.classList.add('end');
      this.msg.textContent = '⏰ Время вышло!';
      this.beep();
    }
  }

  stop() {
    clearInterval(this.timer);
    this.timer = null;
  }

  pause() {
    if (!this.timer) return;
    this.tick();
    this.stop();
  }

  reset() {
    this.stop();
    this.remaining = this.minutes * 60;
    this.msg.textContent = '';
    this.digits.classList.remove('end');
    this.draw();
  }

  beep() {
    if (!this.ctx) return;
    for (let i = 0; i < 3; i++) {
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.connect(g);
      g.connect(this.ctx.destination);
      o.frequency.value = 880;
      g.gain.value = 0.2;
      const t = this.ctx.currentTime + i * 0.35;
      o.start(t);
      o.stop(t + 0.2);
    }
  }

  destroy() {
    this.stop();
    if (this.ctx) { this.ctx.close().catch(() => {}); this.ctx = null; }
    super.destroy();
  }
}
