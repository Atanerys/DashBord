
export function initGradient() {
  const el = document.querySelector('.interactive');
  if (!el) return;

  let curX = 0, curY = 0, tgX = 0, tgY = 0;

  window.addEventListener('mousemove', (e) => {
    tgX = e.clientX;
    tgY = e.clientY;
  });

  function move() {
    curX += (tgX - curX) / 20;
    curY += (tgY - curY) / 20;
    el.style.transform = `translate(calc(-50% + ${curX}px), calc(-50% + ${curY}px))`;
    requestAnimationFrame(move);
  }
  move();
}

initGradient();
