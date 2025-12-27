// src/ui/musicToggle.js
let el = null;
let btn = null;
let range = null;

export function mountMusicToggle({
  onToggle,
  onVolume,
  getState,
}) {
  if (el) return;

  el = document.createElement('div');
  el.className = 'music-ui';

  el.innerHTML = `
    <button class="music-ui__btn" type="button">🔊 Müzik: Kapalı</button>
    <input class="music-ui__range" type="range" min="0" max="1" step="0.01" value="0.35" />
  `;

  document.body.appendChild(el);

  btn = el.querySelector('.music-ui__btn');
  range = el.querySelector('.music-ui__range');

  btn.addEventListener('click', () => {
    onToggle?.();
    refresh(getState?.());
  });

  range.addEventListener('input', () => {
    const v = parseFloat(range.value);
    onVolume?.(v);
    refresh(getState?.());
  });

  injectStylesOnce();
  refresh(getState?.());
}

export function refreshMusicUI(getState) {
  refresh(getState?.());
}

function refresh(state) {
  if (!btn || !range) return;
  const s = state || { enabled: false, volume: 0.35 };

  btn.textContent = s.enabled ? '🔊 Müzik: Açık' : '🔇 Müzik: Kapalı';
  range.value = String(s.volume ?? 0.35);
  range.style.opacity = s.enabled ? '1' : '0.55';
}

let stylesInjected = false;
function injectStylesOnce() {
  if (stylesInjected) return;
  stylesInjected = true;

  const style = document.createElement('style');
  style.textContent = `
    .music-ui{
      position: fixed;
      top: 12px;
      right: 12px;
      z-index: 9999;
      display: flex;
      gap: 10px;
      align-items: center;
      padding: 10px 12px;
      border-radius: 14px;
      border: 1px solid rgba(255,255,255,0.14);
      background: rgba(12, 10, 8, 0.72);
      backdrop-filter: blur(10px);
      box-shadow: 0 8px 24px rgba(0,0,0,0.35);
      pointer-events: auto;
      user-select: none;
    }

    .music-ui__btn{
      font: 13px/1.2 system-ui, -apple-system, Segoe UI, Roboto, Arial;
      padding: 8px 10px;
      border-radius: 12px;
      border: 1px solid rgba(255,255,255,0.14);
      background: rgba(40, 28, 12, 0.55);
      color: rgba(255, 232, 196, 0.95);
      cursor: pointer;
    }
    .music-ui__btn:hover{
      border-color: rgba(255,255,255,0.28);
      background: rgba(64, 44, 16, 0.62);
    }

    .music-ui__range{
      width: 140px;
      accent-color: #d8b24c; /* gold */
    }
  `;
  document.head.appendChild(style);
}
