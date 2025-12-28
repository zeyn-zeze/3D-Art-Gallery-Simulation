// src/ui/infoPanel.js
let panelEl = null;

export function showInfoPanel(data = {}) {
  if (!panelEl) createPanel();

  const title = data.title ?? "Eser";
  const artist = data.artist ?? "-";
  const year = data.year ?? "-";
  const technique = data.technique ?? "-";

  const bodyText = data.text || data.description || "";
  console.log("[INFO PANEL] title:", title);
  console.log("[INFO PANEL] text length:", bodyText?.length ?? 0);

  panelEl.querySelector(".info-panel__title").textContent = title;
  panelEl.querySelector(".meta-artist").innerHTML = `<b>Sanatçı:</b> ${escapeHtml(artist)}`;
  panelEl.querySelector(".meta-year").innerHTML = `<b>Yıl:</b> ${escapeHtml(year)}`;
  panelEl.querySelector(".meta-tech").innerHTML = `<b>Teknik:</b> ${escapeHtml(technique)}`;

  const img = panelEl.querySelector(".info-panel__image");
  if (data.imageUrl) {
    img.src = data.imageUrl;
    img.style.display = "block";
  } else {
    img.style.display = "none";
    img.removeAttribute("src");
  }

  const body = panelEl.querySelector(".info-panel__body");
  body.innerText = bodyText;

  body.style.display = bodyText.length > 0 ? "block" : "none";
  panelEl.classList.remove("hidden");
}

export function hideInfoPanel() {
  panelEl?.classList?.add("hidden");
}

function createPanel() {
  panelEl = document.createElement("div");
  panelEl.className = "info-panel hidden";

  panelEl.innerHTML = `
    <div class="info-panel__header">
      <h3 class="info-panel__title">Eser</h3>
      <button class="info-panel__close" type="button">×</button>
    </div>

    <div class="info-panel__meta">
      <div class="meta-artist"><b>Sanatçı:</b> -</div>
      <div class="meta-year"><b>Yıl:</b> -</div>
      <div class="meta-tech"><b>Teknik:</b> -</div>
    </div>

    <div class="info-panel__content">
      <img class="info-panel__image" alt="" style="display:none" />
      <div class="info-panel__body"></div>
    </div>
  `;

  document.body.appendChild(panelEl);

  panelEl.querySelector(".info-panel__close").addEventListener("click", hideInfoPanel);
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
