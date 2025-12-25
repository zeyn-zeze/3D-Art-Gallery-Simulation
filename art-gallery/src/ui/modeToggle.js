import { setHint } from './hint.js';

let barEl = null;
let btnExhibit = null;
let btnFPS = null;

export function mountModeToggle({ getMode, setMode }) {
  if (barEl) return;

  barEl = document.createElement('div');
  barEl.className = 'ui-bar';

  btnExhibit = document.createElement('button');
  btnExhibit.className = 'ui-btn';
  btnExhibit.textContent = 'Sergi Modu';

  btnFPS = document.createElement('button');
  btnFPS.className = 'ui-btn';
  btnFPS.textContent = 'FPS Modu';

  barEl.appendChild(btnExhibit);
  barEl.appendChild(btnFPS);
  document.body.appendChild(barEl);

  function refresh() {
    const mode = getMode();
    btnExhibit.classList.toggle('active', mode === 'exhibit');
    btnFPS.classList.toggle('active', mode === 'fps');

    if (mode === 'exhibit') {
      setHint('Sergi Modu: Mouse ile bak/zoom. FPS için “FPS Modu”na bas.');
    } else {
      setHint('FPS Modu: WASD hareket, Shift koşu. Canvas’a tıkla → mouse kilitlenir. Esc çıkış.');
    }
  }

  btnExhibit.addEventListener('click', () => { setMode('exhibit'); refresh(); });
  btnFPS.addEventListener('click', () => { setMode('fps'); refresh(); });

  refresh();
}
