// src/app/init.js
import * as THREE from 'three';
import { createGalleryScene } from '../scene/galleryScene.js';
import { createFPSControls } from '../controls/fpsControls.js';
import { createCameraControls } from '../controls/cameraControls.js';
import { mountHint } from '../ui/hint.js';
import { setupResize } from './resize.js';
import { showInfoPanel } from '../ui/infoPanel.js';
import { setHint, clearHint } from '../ui/hint.js';
import { mountMusicToggle } from '../ui/musicToggle.js';

// ✅ DOĞRU import
import { initBgMusic, startBgMusic, setBgVolume, isBgReady } from '../audio/bgMusic.js';


const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

export function initApp() {
  const container = document.querySelector('#app') ?? document.body;

  // Eski canvas varsa kaldır
  container.querySelector('canvas')?.remove();

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.shadowMap.enabled = true;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;
  container.appendChild(renderer.domElement);

  const camera = new THREE.PerspectiveCamera(85, 1, 0.1, 200);
  camera.position.set(0, 1.6, 6);
  camera.lookAt(0, 1.6, -6);

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



  let musicStarted = false;
  function ensureMusicStart() {
    if (musicStarted) return;
    musicStarted = true;

    // buffer hazır değilse, ilk etkileşimden sonra kısa süre içinde hazır olunca çal
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

  const world = createGalleryScene();
  const { scene, update, collidables, roomInfo, clickables, stands } = world;

  setupResize({ container, renderer, camera });

  // --- Mode system ---
  let mode = 'exhibit';
  let active = null; // { controls, update, dispose }

  let hovered = null; // Mesh
  let hoveredStandGroup = null;
  const _origEmissive = new Map(); // mesh.uuid -> emissiveIntensity
  const _tmp = new THREE.Vector3();

  function setHover(mesh) {
    if (mesh === hovered) return;

    if (hovered?.material?.emissive) {
      const prev = _origEmissive.get(hovered.uuid);
      if (prev) {
        hovered.material.emissive.copy(prev.emissive);
        hovered.material.emissiveIntensity = prev.intensity;
      }
    }

    hovered = mesh;

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
    ensureMusicStart();
    if (mode === 'fps') return;

    const rect = renderer.domElement.getBoundingClientRect();

    mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const hits = raycaster.intersectObjects(clickables, true);

    if (!hits.length) return;

    const data = hits[0].object.userData;
    if (data?.type === 'stand') showInfoPanel(data);
  }

  renderer.domElement.addEventListener('click', onCanvasClick);

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

    if (hoveredStandGroup) {
      hoveredStandGroup.getWorldPosition(_tmp);
      const near = camera.position.distanceTo(_tmp) < 2.0;
      if (near) setHint('Tıkla: Bilgi');
      else clearHint();
      return;
    }

    let nearAny = false;
    for (const s of (stands || [])) {
      s.getWorldPosition(_tmp);
      if (camera.position.distanceTo(_tmp) < 2.0) {
        nearAny = true;
        break;
      }
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
    resetCameraExhibit();

    const api = createCameraControls(camera, renderer.domElement, {
      target: { x: 0, y: 2.8, z: -3 },
      room: roomInfo ?? { width: 18, depth: 30, height: 10.5, margin: 0.8 },
      collidables,
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
    resetCameraFPS();

    const api = createFPSControls(camera, renderer.domElement, {
      collidables,
      minDistance: 0.9,
      room: { width: roomInfo?.width ?? 18, depth: roomInfo?.depth ?? 30, margin: 0.6 },
    });

    const controls = api.controls ?? api;

    return {
      controls,
      update: api.update ?? (() => {}),
      dispose: api.dispose ?? (() => {}),
    };
  }

  function setMode(newMode) {
    if (newMode === mode) return;

    if (active?.controls?.unlock) {
      try { active.controls.unlock(); } catch {}
    }
    if (active?.dispose) active.dispose();
    active = null;

    mode = newMode;

    // ✅ FPS modunda kıs
    mode = newMode;
    if (musicEnabled) setBgVolume(mode === 'fps' ? Math.min(musicVol, 0.15) : musicVol);


    setHover(null);
    hoveredStandGroup = null;
    clearHint();

    active = (mode === 'fps') ? enableFPS() : enableExhibit();
  }

  active = enableExhibit();



  mountHint({
    onExhibit: () => setMode('exhibit'),
    onFPS: () => setMode('fps'),
    getMode,
  });

  const clock = new THREE.Clock();

  function updateControls(dt) {
    active?.update?.(dt);
  }

  function render() {
    requestAnimationFrame(render);

    const dt = clock.getDelta();
    update?.(dt);
    updateControls(dt);

    updateProximityHint();
    renderer.render(scene, camera);
  }

  render();

  return { renderer, scene, camera, clock, update, updateControls, getMode, setMode };
}
