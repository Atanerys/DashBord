import { UIComponent, fetchJson } from './UIComponent.js';

const API = 'https://www.themealdb.com/api/json/v1/1/';

export class RecipeWidget extends UIComponent {
  constructor(id) {
    super(id, 'Рецепт');
    this.ctrl = null;
    this.lastUrl = null;
  }

  mount(body) {
    body.innerHTML = `<div class="row"><input type="text" placeholder="Например: pasta" aria-label="Название блюда (на английском)">
      <button type="button" class="btn" data-a="find">Найти</button>
      <button type="button" class="btn green" data-a="rand">Случайный</button></div>
      <div class="meal" aria-live="polite"><p class="muted">Введите название блюда (на английском) или нажмите «Случайный».</p></div>`;
    this.input = body.querySelector('input');
    this.out = body.querySelector('.meal');
    const find = () => {
      const q = this.input.value.trim();
      if (q) this.load(API + 'search.php?s=' + encodeURIComponent(q));
    };
    this.listen(body.querySelector('[data-a=find]'), 'click', find);
    this.listen(body.querySelector('[data-a=rand]'), 'click', () => this.load(API + 'random.php'));
    this.listen(this.input, 'keydown', (e) => { if (e.key === 'Enter') find(); });
  }

  async load(url) {
    if (this.ctrl) this.ctrl.abort();
    this.ctrl = new AbortController();
    const { signal } = this.ctrl;
    this.lastUrl = url;
    this.out.replaceChildren(this.p('Загрузка…', 'muted'));
    try {
      const data = await fetchJson(url, signal);
      const meal = data && data.meals && data.meals[0];
      if (!meal) { this.out.replaceChildren(this.p('Ничего не найдено.', 'muted')); return; }
      this.show(meal);
    } catch (e) {
      if (e.name === 'AbortError' || !this.el) return;
      this.error('Не удалось загрузить рецепт.');
    }
  }

  p(text, cls) {
    const p = document.createElement('p');
    p.className = cls;
    p.textContent = text;
    return p;
  }

  error(msg) {
    const box = this.p(msg, 'err');
    const b = this.makeBtn('Повторить');
    b.addEventListener('click', () => this.load(this.lastUrl)); // кнопка живёт вместе с узлом
    box.append(b);
    this.out.replaceChildren(box);
  }

  show(m) {
    const frag = document.createDocumentFragment();
    if (m.strMealThumb) {
      const img = document.createElement('img');
      img.src = m.strMealThumb;
      img.alt = m.strMeal || '';
      frag.append(img);
    }
    const h = document.createElement('h3');
    h.textContent = m.strMeal;
    const ul = document.createElement('ul');
    for (let i = 1; i <= 20; i++) {
      const ing = (m['strIngredient' + i] || '').trim();
      if (!ing) continue;
      const li = document.createElement('li');
      li.textContent = ((m['strMeasure' + i] || '').trim() + ' ' + ing).trim();
      ul.append(li);
    }
    const det = document.createElement('details');
    const sum = document.createElement('summary');
    sum.textContent = 'Инструкция';
    const pre = document.createElement('pre');
    pre.textContent = m.strInstructions || 'Инструкции нет.';
    det.append(sum, pre);
    frag.append(h, ul, det);
    this.out.replaceChildren(frag);
  }

  destroy() {
    if (this.ctrl) this.ctrl.abort();
    super.destroy();
  }
}