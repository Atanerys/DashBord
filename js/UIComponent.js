export async function fetchJson(url, signal) {
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error('HTTP ' + res.status);
  return res.json();
}

export class UIComponent {
  constructor(id, title) {
    this.id = id;
    this.title = title;
    this.el = null;
    this.onRemove = null;
    this.cleanups = [];
  }

  render() {
    const el = document.createElement('article');
    el.className = 'card';
    el.dataset.id = this.id;
    const head = document.createElement('header');
    head.className = 'card-head';
    const h = document.createElement('h2');
    h.textContent = this.title;
    const fold = this.makeBtn('Свернуть');
    const del = this.makeBtn('Удалить');
    head.append(h, fold, del);
    const body = document.createElement('div');
    body.className = 'card-body';
    el.append(head, body);
    this.el = el;

    this.listen(fold, 'click', () => {
      const c = el.classList.toggle('collapsed');
      fold.textContent = c ? 'Развернуть' : 'Свернуть';
    });
    this.listen(del, 'click', () => this.onRemove && this.onRemove(this.id));
    this.mount(body);
    return el;
  }

  mount(body) {} 

  makeBtn(text) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'btn';
    b.textContent = text;
    return b;
  }


  listen(target, type, fn) {
    target.addEventListener(type, fn);
    this.cleanups.push(() => target.removeEventListener(type, fn));
  }

  destroy() {
    this.cleanups.forEach((f) => { try { f(); } catch {} });
    this.cleanups = [];
    if (this.el) this.el.remove();
    this.el = null;
  }
}
