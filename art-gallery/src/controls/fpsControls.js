// src/controls/fpsControls.js
import * as THREE from 'three';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';
import { isBlockedForward, isBlockedBackward, isBlockedSide } from '../interaction/raycast.js';

export function createFPSControls(camera, domElement, options = {}) {
  const controls = new PointerLockControls(camera, domElement);

  const {
    scene = null,                 // ✅ kapıyı bulmak için
    collidables = [],
    minDistance = 0.9,
    walkSpeed = 3.0,
    sprintSpeed = 6.0,
    room = { width: 18, depth: 30, height: 10.5, margin: 0.9 },
    eyeHeight = 1.6,
    doorName = 'palaceDoor',
    doorMaxDist = 2.2,
  } = options;

  const keys = { w: false, a: false, s: false, d: false, shift: false };

  // -------- Door refs --------
  let doorObj = null;          // THREE.Group
  let doorBlocker = null;      // Mesh collider
  let pivotL = null;           // Group
  let pivotR = null;           // Group
  let doorAPI = null;          // {toggle, update, getIsOpen, getBlocker} optional

  // Door animation fallback (pivot rotation)
  let anim = {
    active: false,
    open: false,
    t: 0,                 // 0..1
    targetOpen: false,
  };

  // Raycast: camera center
  const ray = new THREE.Raycaster();
  const ndcCenter = new THREE.Vector2(0, 0);

  function ensureDoorRefs() {
    if (!scene) return false;
    if (doorObj) return true;

    const found = scene.getObjectByName(doorName);
    if (!found) return false;

    doorObj = found;

    // Eğer galleryScene'de door API'yi userData'ya koyduysan buradan yakalayabiliriz:
    // door.object.userData.doorAPI = door;
    doorAPI = doorObj.userData?.doorAPI ?? null;

    // blocker
    doorBlocker = doorObj.getObjectByName('doorBlocker') ?? null;

    // pivotlar (bizim düzeltilmiş door.js'de var)
    pivotL = doorObj.getObjectByName('pivotL') ?? null;
    pivotR = doorObj.getObjectByName('pivotR') ?? null;

    // blocker'ı başlangıçta collidables'a ekli değilse ekle (kapı kapalı varsayımı)
    if (doorBlocker && !collidables.includes(doorBlocker)) {
      collidables.push(doorBlocker);
    }

    return true;
  }

  function isLookingAtDoor(maxDist = doorMaxDist) {
    if (!scene) return false;
    if (!ensureDoorRefs()) return false;

    ray.setFromCamera(ndcCenter, camera);

    // sadece kapının alt ağacını test etmek daha stabil
    const hits = ray.intersectObject(doorObj, true);
    if (!hits.length) return false;

    return hits[0].distance <= maxDist;
  }

  function setDoorCollision(opened) {
    if (!doorBlocker) return;

    const idx = collidables.indexOf(doorBlocker);

    if (opened) {
      if (idx >= 0) collidables.splice(idx, 1);   // ✅ açıkken engel kaldır
      doorBlocker.userData.enabled = false;
    } else {
      if (idx < 0) collidables.push(doorBlocker); // ✅ kapalıyken engel ekle
      doorBlocker.userData.enabled = true;
    }
  }

  function toggleDoor() {
    if (!ensureDoorRefs()) return;
    if (!isLookingAtDoor()) return;

    // 1) Eğer door.js API’si sahnede mevcutsa, onu kullan (en temiz)
    if (doorAPI?.toggle && doorAPI?.getIsOpen) {
      doorAPI.toggle();
      setDoorCollision(doorAPI.getIsOpen());
      return;
    }

    // 2) Fallback: pivotlara animasyon
    if (!pivotL || !pivotR) return;

    anim.active = true;
    anim.t = 0;
    anim.targetOpen = !anim.open;
  }

  function updateDoorFallback(dt) {
    if (!anim.active) return;

    anim.t = Math.min(1, anim.t + dt * 1.8);
    const t = anim.t;
    const eased = t * t * (3 - 2 * t);

    const maxAngle = Math.PI / 2.4;
    const target = anim.targetOpen ? maxAngle : 0;

    // sol - , sağ + (bizim door.js yönüyle uyumlu)
    pivotL.rotation.y = THREE.MathUtils.lerp(pivotL.rotation.y, -target, eased);
    pivotR.rotation.y = THREE.MathUtils.lerp(pivotR.rotation.y, +target, eased);

    if (t >= 1) {
      anim.active = false;
      anim.open = anim.targetOpen;
      setDoorCollision(anim.open);
    }
  }

  // -------- Keyboard --------
  function down(e) {
    if (e.code === 'KeyW') keys.w = true;
    if (e.code === 'KeyA') keys.a = true;
    if (e.code === 'KeyS') keys.s = true;
    if (e.code === 'KeyD') keys.d = true;
    if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') keys.shift = true;

    if (e.code === 'KeyE') {
      // tek basış
      toggleDoor();
    }
  }

  function up(e) {
    if (e.code === 'KeyW') keys.w = false;
    if (e.code === 'KeyA') keys.a = false;
    if (e.code === 'KeyS') keys.s = false;
    if (e.code === 'KeyD') keys.d = false;
    if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') keys.shift = false;
  }

  window.addEventListener('keydown', down);
  window.addEventListener('keyup', up);

  function update(dt) {
    if (!controls.isLocked) return;

    dt = Math.min(dt, 0.033);

    // Door update: API varsa onun update'i galleryScene update içinde çağrılmalı.
    // Yine de burada fallback çalışsın:
    ensureDoorRefs();
    updateDoorFallback(dt);

    const speed = keys.shift ? sprintSpeed : walkSpeed;

    const moveX = (keys.d ? 1 : 0) - (keys.a ? 1 : 0);
    const moveZ = (keys.w ? 1 : 0) - (keys.s ? 1 : 0);

    const len = Math.hypot(moveX, moveZ);
    const nx = len ? moveX / len : 0;
    const nz = len ? moveZ / len : 0;

    let dx = nx * speed * dt;
    let dz = nz * speed * dt;

    try {
      if (nz > 0 && isBlockedForward(camera, collidables, minDistance)) dz = Math.min(0, dz);
      if (nz < 0 && isBlockedBackward(camera, collidables, minDistance)) dz = Math.max(0, dz);
      if (nx > 0 && isBlockedSide(camera, collidables, true, minDistance)) dx = Math.min(0, dx);
      if (nx < 0 && isBlockedSide(camera, collidables, false, minDistance)) dx = Math.max(0, dx);
    } catch (_) {}

    controls.moveRight(dx);
    controls.moveForward(dz);

    // Y sabit
    camera.position.y = eyeHeight;

    // Oda sınırı (X/Z clamp)
    const halfW = room.width / 2 - room.margin;
    const halfD = room.depth / 2 - room.margin;
    camera.position.x = Math.max(-halfW, Math.min(halfW, camera.position.x));
    camera.position.z = Math.max(-halfD, Math.min(halfD, camera.position.z));
  }

  function dispose() {
    window.removeEventListener('keydown', down);
    window.removeEventListener('keyup', up);
    controls.unlock();
  }

  return { controls, update, dispose };
}
