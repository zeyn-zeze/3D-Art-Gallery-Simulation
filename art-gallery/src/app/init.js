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
import { playIntroSequence } from '../ui/introSequence.js';


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
  const { scene, update, collidables, roomInfo, clickables, stands,floorRay } = world;


  
  setupResize({ container, renderer, camera });
  
  // Start butonu intro
  playIntroSequence({
    onStart: () => {
      introPlayed = true;
      ensureMusicStart();
    }
  });
  
  renderer.domElement.addEventListener('click', onCanvasClick);



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

  let introPlayed = false;
  let exhibitMoveTarget = null;

function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
function clampCameraInsideRoom(cam, room, margin = 0.8) {
  const halfW = room.width / 2 - margin;
  const halfD = room.depth / 2 - margin;

  cam.position.x = clamp(cam.position.x, -halfW, halfW);
  cam.position.z = clamp(cam.position.z, -halfD, halfD);

  // Y sınırı (zeminin altına inme / tavana çıkma)
  cam.position.y = clamp(cam.position.y, 1.2, room.height - 0.9);
}



// src/app/init.js içindeki onCanvasClick fonksiyonu
function onCanvasClick(e) {
  if (!introPlayed) return;

  // FPS: click => lock
  if (mode === 'fps' && active?.controls?.lock) {
    active.controls.lock();
    return;
  }

  const rect = renderer.domElement.getBoundingClientRect();
  mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);

  // 1) Önce stand tıklaması var mı?
  const hits = raycaster.intersectObjects(clickables, true);
  if (hits.length > 0) {
    let target = hits[0].object;
    while (target && target.userData?.type !== 'stand') target = target.parent;

    if (target?.userData) {
      showInfoPanel(target.userData);
      return;
    }
  }

  // 2) Sergi modunda stand yoksa: zemine tıkla -> yürü
  if (mode !== 'exhibit' || !floorRay) return;

  const floorHit = raycaster.intersectObject(floorRay, true)[0];
  if (!floorHit) return;

  const p = floorHit.point;

  // ✅ oda dışına çıkma (margin ile)
  const margin = 1.0;
  const x = clamp(p.x, -roomInfo.width / 2 + margin, roomInfo.width / 2 - margin);
  const z = clamp(p.z, -roomInfo.depth / 2 + margin, roomInfo.depth / 2 - margin);

  // ✅ hedef: orbit target taşınacak
  exhibitMoveTarget = new THREE.Vector3(x, EXHIBIT_TARGET.y, z);
}




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
  camera.position.copy(START_POS);
  camera.lookAt(START_LOOK);
}

function resetCameraFPS() {
  camera.position.copy(START_POS);
  camera.lookAt(START_LOOK);
}


  function enableExhibit() {
    resetCameraExhibit();

    const api = createCameraControls(camera, renderer.domElement, {
      target: EXHIBIT_TARGET,
      room: roomInfo ?? { width: 18, depth: 30, height: 10.5, margin: 0.8 },
      collidables,
      minDistance: 4.0,
      maxDistance: 26.0,
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

  // ✅ 1) Exhibit click-to-move (ÖNCE uygula)
  if (mode === 'exhibit' && exhibitMoveTarget && active?.controls) {
    const controls = active.controls; // OrbitControls
    const speed = 4.5;
    const t = 1 - Math.exp(-speed * dt);

    const offset = camera.position.clone().sub(controls.target);

    controls.target.lerp(exhibitMoveTarget, t);
    camera.position.copy(controls.target).add(offset);

    if (controls.target.distanceTo(exhibitMoveTarget) < 0.05) {
      exhibitMoveTarget = null;
    }
  }

  // ✅ 2) Orbit damping + collision
  updateControls(dt);

  // ✅ 3) Exhibit modunda oda dışına çıkmayı engelle (SONRA)
  if (mode === 'exhibit' && roomInfo) {
    clampCameraInsideRoom(camera, roomInfo, 0.9);

    if (active?.controls?.target) {
      const tgt = active.controls.target;
      const halfW = roomInfo.width / 2 - 1.0;
      const halfD = roomInfo.depth / 2 - 1.0;
      tgt.x = clamp(tgt.x, -halfW, halfW);
      tgt.z = clamp(tgt.z, -halfD, halfD);
    }
  }

  updateProximityHint();
  renderer.render(scene, camera);
}


  render();

  return { renderer, scene, camera, clock, update, updateControls, getMode, setMode };
}
