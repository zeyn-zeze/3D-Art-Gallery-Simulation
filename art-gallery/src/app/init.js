import * as THREE from 'three';
import { createGalleryScene } from '../scene/galleryScene.js';
import { createFPSControls } from '../controls/fpsControls.js';
import { createCameraControls } from '../controls/cameraControls.js';
import { mountHint } from '../ui/hint.js';
import { setupResize } from './resize.js';
import { showInfoPanel } from '../ui/infoPanel.js';
import { setHint, clearHint } from '../ui/hint.js';



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

  const world = createGalleryScene();
  const { scene, update, collidables, roomInfo,clickables,stands } = world;

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
    
    setHover(null);
    hoveredStandGroup = null;
    clearHint();


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

    updateProximityHint();
    renderer.render(scene, camera);
    
  }

  render();

  return { renderer, scene, camera, clock, update, updateControls, getMode, setMode };
}
