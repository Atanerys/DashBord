import { RecipeWidget } from './RecipeWidget.js';

// Тот же поиск и запросы, что у RecipeWidget, но показываем только видео.
export class VideoWidget extends RecipeWidget {
  constructor(id) {
    super(id);
    this.title = 'Видеорецепт';
  }

  show(m) {
    const h = document.createElement('h3');
    h.textContent = m.strMeal;
    this.out.replaceChildren(h, this.video(m.strYoutube));
  }

  video(link) {
    let id = null;
    if (link) {
      try { id = new URL(link).searchParams.get('v'); } catch {}
      if (!id) { const mt = String(link).match(/v=([\w-]{11})/); id = mt && mt[1]; }
    }
    if (!id || !/^[\w-]{11}$/.test(id)) return this.p('Видео для этого рецепта нет', 'muted');
    const f = document.createElement('iframe');
    f.src = 'https://www.youtube.com/embed/' + id;
    f.width = '100%';
    f.height = '360';
    f.title = 'Видео рецепта';
    f.allowFullscreen = true;
    return f;
  }
}
