import { UIComponent, fetchJson } from './UIComponent.js';

const API = 'https://de1.api.radio-browser.info/json/stations/search?limit=5&name=jazz';

export class MusicWidget extends UIComponent {
  constructor(id) {
    super(id, 'Музыка');
    this.ctrl = null;
    this.current = null;
  }

  mount(body) {
    body.innerHTML = `<div class="status" aria-live="polite"></div><ul class="list"></ul>
      <p class="muted now"></p><audio controls preload="none"></audio>`;
    this.status = body.querySelector('.status');
    this.ul = body.querySelector('ul');
    this.now = body.querySelector('.now');
    this.audio = body.querySelector('audio');
    this.listen(this.ul, 'click', (e) => {
      const b = e.target.closest('button');
      if (b) this.play(this.stations[Number(b.dataset.i)]);
    });
    this.listen(this.audio, 'error', () => {
      if (this.current) this.fail('Не удалось воспроизвести станцию (она недоступна или заблокирована браузером).', () => this.play(this.current));
    });
    this.load();
  }

  fail(msg, retry) {
    const box = document.createElement('p');
    box.className = 'err';
    box.textContent = msg;
    const b = this.makeBtn('Повторить');
    b.addEventListener('click', retry);
    box.append(b);
    this.status.replaceChildren(box);
  }

  async load() {
    if (this.ctrl) this.ctrl.abort();
    this.ctrl = new AbortController();
    this.status.textContent = 'Загрузка станций…';
    this.ul.replaceChildren();
    try {
      const data = await fetchJson(API, this.ctrl.signal);
      this.stations = (Array.isArray(data) ? data : []).filter((s) => s && s.url_resolved);
      if (!this.stations.length) { this.status.textContent = 'Станции не найдены.'; return; }
      this.status.textContent = '';
      this.ul.replaceChildren(...this.stations.map((s, i) => {
        const li = document.createElement('li');
        const sp = document.createElement('span');
        sp.textContent = (s.name || 'Без названия').trim() + (s.country ? ' — ' + s.country : '');
        const b = this.makeBtn('▶');
        b.dataset.i = i;
        b.setAttribute('aria-label', 'Слушать ' + sp.textContent);
        li.append(sp, b);
        return li;
      }));
    } catch (e) {
      if (e.name === 'AbortError' || !this.el) return;
      this.fail('Не удалось загрузить список станций.', () => this.load());
    }
  }

  play(st) {
    if (!st) return;
    this.current = st;
    this.status.textContent = '';
    this.now.textContent = 'Играет: ' + (st.name || '').trim();
    this.audio.src = st.url_resolved;
    this.audio.play().catch(() => {}); // ошибки покажет обработчик 'error'
  }

  destroy() {
    if (this.ctrl) this.ctrl.abort();
    this.current = null;
    if (this.audio) { this.audio.pause(); this.audio.removeAttribute('src'); this.audio.load(); }
    super.destroy();
  }
}
