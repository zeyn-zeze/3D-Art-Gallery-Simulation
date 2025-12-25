import * as THREE from 'three';
import { createGalleryScene } from '../scene/galleryScene.js';
import { createFPSControls } from '../controls/fpsControls.js';
import { createCameraControls } from '../controls/cameraControls.js';
import { mountHint } from '../ui/hint.js';
import { setupResize } from './resize.js';

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

  const world = createGalleryScene();
  const { scene, update, collidables, roomInfo } = world;

  setupResize({ container, renderer, camera });

  // --- Mode system ---
  let mode = 'exhibit';
  let active = null; // { controls, update, dispose }

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

    // eski modu kapat
    if (active?.controls?.unlock) {
      try { active.controls.unlock(); } catch {}
    }
    if (active?.dispose) active.dispose();
    active = null;

    mode = newMode;

    // yeni modu aç
    active = (mode === 'fps') ? enableFPS() : enableExhibit();
  }

  // İlk açılış
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

  function updateControls(dt) {
    active?.update?.(dt);
  }

  function render() {
    requestAnimationFrame(render);

    const dt = clock.getDelta();
    update?.(dt);
    updateControls(dt);

    renderer.render(scene, camera);
  }

  render();

  return { renderer, scene, camera, clock, update, updateControls, getMode, setMode };
}
