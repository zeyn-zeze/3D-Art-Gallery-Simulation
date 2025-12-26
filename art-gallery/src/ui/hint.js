export function mountHint({ onExhibit, onFPS, getMode }) {
  // Eski UI varsa temizle
  document.querySelector('.ui-bar')?.remove();
  document.querySelector('.ui-hint')?.remove();

  const bar = document.createElement('div');
  bar.className = 'ui-bar';

  const btnEx = document.createElement('button');
  btnEx.className = 'ui-btn';
  btnEx.textContent = 'Sergi Modu';

  const btnFps = document.createElement('button');
  btnFps.className = 'ui-btn';
  btnFps.textContent = 'FPS Modu';

  bar.appendChild(btnEx);
  bar.appendChild(btnFps);
  document.body.appendChild(bar);

  const hint = document.createElement('div');
  hint.className = 'ui-hint';
  hint.innerHTML =
    'Sergi modu: Mouse ile dön, scroll ile zoom.<br>' +
    'FPS modu: Canvas’a tıkla → mouse kilitlenir, WASD ile yürü, ESC ile çık.';
  document.body.appendChild(hint);

  function refresh() {
    const m = getMode?.() ?? 'exhibit';
    btnEx.classList.toggle('active', m === 'exhibit');
    btnFps.classList.toggle('active', m === 'fps');
  }

  btnEx.addEventListener('click', () => {
    onExhibit?.();
    refresh();
  });

  btnFps.addEventListener('click', () => {
    onFPS?.();
    refresh();
  });

  refresh();
}

// ================================
// DYNAMIC HINT API (Hover / Proximity)
// ================================

let hintEl = null;

function getHintEl() {
  if (!hintEl) {
    hintEl = document.querySelector('.ui-hint');
  }
  return hintEl;
}

export function setHint(text) {
  const el = getHintEl();
  if (!el) return;

  el.innerHTML = text || '';
  el.style.display = text ? 'block' : 'none';
}

export function clearHint() {
  setHint('');
}
