export function playIntroSequence({ onStart } = {}) {
  const overlay = document.getElementById('intro-overlay');
  const btn = document.getElementById('intro-start-btn');

  if (!overlay || !btn) {
    onStart?.();
    return;
  }

  btn.addEventListener('click', () => {
    overlay.classList.add('fade-out');

    setTimeout(() => {
      overlay.remove();
      onStart?.();
    }, 900);
  }, { once: true });
}
