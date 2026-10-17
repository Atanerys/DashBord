import { UIComponent } from './UIComponent.js';
import { load, save } from './storage.js';

const KEY = 'kitchen.shopping';

export class ShoppingWidget extends UIComponent {
  constructor(id) {
    super(id, 'Продукты');
    const d = load(KEY, []);
    this.items = Array.isArray(d)
      ? d.filter((i) => i && typeof i.text === 'string').map((i) => ({ id: String(i.id), text: i.text, done: !!i.done }))
      : [];
  }

  mount(body) {
    body.innerHTML = `<form class="row"><input type="text" maxlength="80" placeholder="Что купить?" aria-label="Продукт">
      <button class="btn">Добавить</button></form><ul class="list"></ul>`;
    const form = body.querySelector('form');
    const input = body.querySelector('input');
    this.ul = body.querySelector('ul');
    this.listen(form, 'submit', (e) => {
      e.preventDefault();
      const text = input.value.trim();
      if (!text) return;
      this.items.push({ id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), text, done: false });
      input.value = '';
      this.update();
    });
    // один обработчик на весь список — без дублей при пересборке
    this.listen(this.ul, 'click', (e) => {
      const li = e.target.closest('li');
      if (li && e.target.closest('button')) {
        this.items = this.items.filter((i) => i.id !== li.dataset.id);
        this.update();
      }
    });
    this.listen(this.ul, 'change', (e) => {
      const li = e.target.closest('li');
      const it = li && this.items.find((i) => i.id === li.dataset.id);
      if (it) { it.done = e.target.checked; this.update(); }
    });
    this.draw();
  }

  update() {
    save(KEY, this.items);
    this.draw();
  }

  draw() {
    if (!this.items.length) {
      const li = document.createElement('li');
      li.textContent = 'Список пуст';
      this.ul.replaceChildren(li);
      return;
    }
    this.ul.replaceChildren(...this.items.map((i) => {
      const li = document.createElement('li');
      li.dataset.id = i.id;
      li.className = i.done ? 'done' : '';
      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.checked = i.done;
      cb.setAttribute('aria-label', 'Куплено');
      const sp = document.createElement('span');
      sp.textContent = i.text;
      const del = this.makeBtn('✕');
      del.classList.add('ghost');
      del.setAttribute('aria-label', 'Удалить ' + i.text);
      li.append(cb, sp, del);
      return li;
    }));
  }
}
