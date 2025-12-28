// src/app/init.js
import * as THREE from 'three';
import { createGalleryScene } from '../scene/galleryScene.js';
import { createFPSControls } from '../controls/fpsControls.js';
import { createCameraControls } from '../controls/cameraControls.js';
import { mountHint, setHint, clearHint } from '../ui/hint.js';
import { setupResize } from './resize.js';
import { showInfoPanel } from '../ui/infoPanel.js';
import { setHint, clearHint } from '../ui/hint.js';



const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

export function initApp() {
  const container = document.querySelector('#app') ?? document.body;
  container.querySelector('canvas')?.remove();

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.shadowMap.enabled = true;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;
  container.appendChild(renderer.domElement);

  const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 200);
  const START_POS = new THREE.Vector3(0, 2.2, 14);
  const START_LOOK = new THREE.Vector3(0, 2.2, 0);
  const EXHIBIT_TARGET = new THREE.Vector3(0, 2.2, 0);

  camera.position.copy(START_POS);
  camera.lookAt(START_LOOK);
 

  // ✅ Müzik sistemi hazırla (burada play etme!)
  initBgMusic(camera); // /public/audio/museum.mp3

  let musicStartedOnce = false;

  function ensureMusicStart() {
    if (musicStartedOnce) return;
    musicStartedOnce = true;
  
    if (isBgReady()) {
      startBgMusic();
    } else {
      const t = setInterval(() => {
        if (isBgReady()) {
          clearInterval(t);
          startBgMusic();
        }
      }, 150);
    }
  }
  


  // ---- Music UI State ----
let musicEnabled = false;
let musicVol = 0.35;

function safeStartMusic() {
  // buffer hazır değilse biraz beklet
  if (isBgReady()) {
    startBgMusic();
    return;
  }
  const t = setInterval(() => {
    if (isBgReady()) {
      clearInterval(t);
      startBgMusic();
    }
  }, 150);
}

function applyMusic() {
  setBgVolume(musicEnabled ? musicVol : 0.0);
}

mountMusicToggle({
  onToggle: () => {
    const nextEnabled = !musicEnabled;

    // ON’a geçerken user gesture ile başlat
    if (nextEnabled) ensureMusicStart();

    musicEnabled = nextEnabled;
    applyMusic();
  },
  onVolume: (v) => {
    musicVol = v;
    if (musicEnabled) setBgVolume(musicVol);
  },
  getState: () => ({ enabled: musicEnabled, volume: musicVol }),
});


  const world = createGalleryScene();
  const { scene, update, collidables, roomInfo,clickables,stands } = world;

  setupResize({ container, renderer, camera });

  

  // --- Mode system ---
  let mode = 'exhibit';
  let active = null;

  let hovered = null; // Mesh
  let hoveredStandGroup = null;  
  const _origEmissive = new Map(); // mesh.uuid -> emissiveIntensity
  const _tmp = new THREE.Vector3();

  function setHover(mesh) {
    if (mesh === hovered) return;
  
    // eski hover'ı geri al
    if (hovered?.material?.emissive) {
      const prev = _origEmissive.get(hovered.uuid);
      if (prev) {
        hovered.material.emissive.copy(prev.emissive);
        hovered.material.emissiveIntensity = prev.intensity;
      }
    }
  
    hovered = mesh;
  
    // yeni hover'u uygula
    if (hovered?.material?.emissive) {
      if (!_origEmissive.has(hovered.uuid)) {
        _origEmissive.set(hovered.uuid, {
          emissive: hovered.material.emissive.clone(),
          intensity: hovered.material.emissiveIntensity ?? 0,
        });
      }
      hovered.material.emissive.set(0xffffff);
      hovered.material.emissiveIntensity = 0.65;
    }
  
    document.body.style.cursor = hovered ? 'pointer' : '';
  }

  function onCanvasClick(e) {
    if (mode === 'fps') return;
  
    const rect = renderer.domElement.getBoundingClientRect();
  
    mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  
    raycaster.setFromCamera(mouse, camera);
    const hits = raycaster.intersectObjects(clickables, true);
  
    console.log('hits:', hits.length, hits[0]?.object?.userData); // debug
  
    if (!hits.length) return;
  
    const data = hits[0].object.userData;
    if (data?.type === 'stand') {
      showInfoPanel(data);
    }
  }
  

  renderer.domElement.addEventListener('click', onCanvasClick);

    console.log('clickables:', clickables?.length, 'stands:', stands?.length);


    function onMouseMove(e) {
      if (mode !== 'exhibit') {
        setHover(null);
        hoveredStandGroup = null;
        return;
      }
    
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    
      raycaster.setFromCamera(mouse, camera);
      const hits = raycaster.intersectObjects(clickables, true);
      const hitMesh = hits[0]?.object ?? null;
    
      if (hitMesh?.userData?.type === 'stand') {
        setHover(hitMesh);
    
        // stand group'u bul (parent chain)
        let g = hitMesh;
        while (g && !g.userData?.type) g = g.parent;
        hoveredStandGroup = g;
      } else {
        setHover(null);
        hoveredStandGroup = null;
      }
    }
    
    renderer.domElement.addEventListener('mousemove', onMouseMove);
  
  function updateProximityHint() {
    if (mode !== 'exhibit') {
      clearHint();
      return;
    }

  // Hover edilen stand varsa: sadece onu kontrol et (daha performanslı)
  if (hoveredStandGroup) {
    hoveredStandGroup.getWorldPosition(_tmp);
    const near = camera.position.distanceTo(_tmp) < 2.0;
    if (near) setHint('Tıkla: Bilgi');
    else clearHint();
    return;
  }

  // Hover yoksa: tüm stand'lere bak (opsiyonel)
  let nearAny = false;
  for (const s of (stands || [])) {
    s.getWorldPosition(_tmp);
    if (camera.position.distanceTo(_tmp) < 2.0) { nearAny = true; break; }
  }

  if (nearAny) setHint('Tıkla: Bilgi');
  else clearHint();
}

    
  function getMode() {
    return mode;
    
  }

  function resetCameraExhibit() {
    camera.position.set(0, 1.6, 6);
    camera.lookAt(0, 1.6, -6);
  }

  function resetCameraFPS() {
    camera.position.set(0, 1.6, 6);
    camera.lookAt(0, 1.6, -6);
  }

  function enableExhibit() {
    resetCamera();
    const api = createCameraControls(camera, renderer.domElement, {
      target: EXHIBIT_TARGET,
      room: roomInfo ?? { width: 18, depth: 30, height: 10.5, margin: 0.8 },
      collidables, // collision yapıyorsa kullanır
      minDistance: 2.0,
      maxDistance: 18.0,
      enablePan: false,
      enableZoom: true,
    });
    const controls = api.controls ?? api.orbit ?? api;
    return {
      controls,
      update: api.update ?? ((dt) => controls?.update?.(dt)),
      dispose: api.dispose ?? (() => controls?.dispose?.()),
    };
  }

  function enableFPS() {
    resetCamera();
    const api = createFPSControls(camera, renderer.domElement, {
      collidables,
      minDistance: 0.9,
      room: { width: roomInfo?.width ?? 18, depth: roomInfo?.depth ?? 30, margin: 0.6 },
    });
    const controls = api.controls ?? api;
    return { controls, update: api.update ?? (() => {}), dispose: api.dispose ?? (() => {}) };
  }

  function setMode(newMode) {
    if (newMode === mode) return;

    // eski modu kapat
    if (active?.controls?.unlock) {
      try { active.controls.unlock(); } catch {}
    }
    if (active?.dispose) active.dispose();
    active = null;

    mode = newMode;
    
    setHover(null);
    hoveredStandGroup = null;
    clearHint();

    active = (mode === 'fps') ? enableFPS() : enableExhibit();
  }

  active = enableExhibit();

  // FPS modunda tıkla → lock
  renderer.domElement.addEventListener('click', () => {
    if (mode === 'fps' && active?.controls?.lock) {
      active.controls.lock();
    }
  });

  // ✅ UI: sadece hint.js (çünkü hint.js zaten butonlu UI kuruyor)
  mountHint({
    onExhibit: () => setMode('exhibit'),
    onFPS: () => setMode('fps'),
    getMode,
  });

  const clock = new THREE.Clock();

  function render() {
    requestAnimationFrame(render);

    const dt = clock.getDelta();
    update?.(dt);
    active?.update?.(dt);

    // Rehber event’leri 
    if (guideApi?.popEvents) {
      const events = guideApi.popEvents();
      for (const ev of events) {
        if (ev.type === 'open_panel') showInfoPanel(ev.data);
        if (ev.type === 'guide_hint') setHint(ev.text);
      }
    }

    updateProximityHint();
    renderer.render(scene, camera);
  }

  render();

  return { renderer, scene, camera, clock, update, getMode, setMode };
}
