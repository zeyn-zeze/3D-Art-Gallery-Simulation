let panelEl;

export function mountInfoPanel() {
  if (panelEl) return;

  panelEl = document.createElement('div');
  panelEl.className = 'info-panel hidden';
  panelEl.innerHTML = `
  <div class="info-panel__header">
    <h3 class="info-panel__title"></h3>
    <button class="info-panel__close">✕</button>
  </div>

  <div class="info-panel__meta"></div>

  <img class="info-panel__image" />

  <div class="info-panel__body"></div>
`;

  document.body.appendChild(panelEl);

  panelEl.querySelector('.info-panel__close').addEventListener('click', hideInfoPanel);
}

export function showInfoPanel(data) {
    mountInfoPanel();
  
    panelEl.querySelector('.info-panel__title').textContent =
      data.title ?? 'Bilgi';
  
    panelEl.querySelector('.info-panel__meta').innerHTML = `
      <div><b>Sanatçı:</b> ${data.artist ?? '-'}</div>
      <div><b>Yıl:</b> ${data.year ?? '-'}</div>
      <div><b>Teknik:</b> ${data.technique ?? '-'}</div>
    `;
  
    const img = panelEl.querySelector('.info-panel__image');
    if (data.imageUrl) {
      img.src = data.imageUrl;
      img.style.display = 'block';
    } else {
      img.style.display = 'none';
    }
  
    panelEl.querySelector('.info-panel__body').textContent =
      data.description ?? '';
  
    panelEl.classList.remove('hidden');
  }
  

export function hideInfoPanel() {
  if (!panelEl) return;
  panelEl.classList.add('hidden');
}
