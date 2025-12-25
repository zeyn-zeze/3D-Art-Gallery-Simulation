// src/world/door.js
import * as THREE from 'three';

export function createPalaceDoor({
  doorW = 6.0,
  doorH = 7.5,
  thickness = 0.22,
  x = 0,
  y = 0,
  z = 0,
  faceIn = true, // true: içeri baksın
} = {}) {
  const g = new THREE.Group();
  g.name = 'palaceDoor';

  const creamMat = new THREE.MeshStandardMaterial({
    color: 0xf3efe4,
    metalness: 0.08,
    roughness: 0.45,
  });

  const goldMat = new THREE.MeshPhysicalMaterial({
    color: 0xd8b24c,
    metalness: 1.0,
    roughness: 0.20,
    clearcoat: 1.0,
    clearcoatRoughness: 0.12,
  });

  // -----------------------
  // FRAME + ARCH
  // -----------------------
  const frame = 0.28;

  const frameTop = new THREE.Mesh(
    new THREE.BoxGeometry(doorW + frame * 2, frame, thickness * 0.8),
    goldMat
  );
  frameTop.position.set(0, doorH + frame / 2, 0);

  const frameBottom = new THREE.Mesh(
    new THREE.BoxGeometry(doorW + frame * 2, frame, thickness * 0.8),
    goldMat
  );
  frameBottom.position.set(0, frame / 2, 0);

  const frameL = new THREE.Mesh(
    new THREE.BoxGeometry(frame, doorH, thickness * 0.8),
    goldMat
  );
  frameL.position.set(-(doorW / 2 + frame / 2), doorH / 2, 0);

  const frameR = frameL.clone();
  frameR.position.x = (doorW / 2 + frame / 2);

  const arch = new THREE.Mesh(
    new THREE.TorusGeometry(doorW / 2 + frame * 0.35, frame * 0.33, 16, 96, Math.PI),
    goldMat
  );
  arch.rotation.x = Math.PI / 2;
  arch.rotation.z = Math.PI;
  arch.position.set(0, doorH + frame * 0.12, 0);

  g.add(frameTop, frameBottom, frameL, frameR, arch);

  // -----------------------
  // DOOR LEAVES (PIVOTS)
  // -----------------------
  const gap = 0.08;
  const leafW = (doorW - gap) / 2;
  const leafT = thickness * 0.55;

  const leafGeo = new THREE.BoxGeometry(leafW, doorH, leafT);

  // left pivot at its hinge (near center gap)
  const pivotL = new THREE.Group();
  pivotL.name = 'pivotL';
  pivotL.position.set(-gap / 2, 0, 0);

  const leftLeaf = new THREE.Mesh(leafGeo, creamMat);
  leftLeaf.name = 'leftLeaf';
  leftLeaf.position.set(-leafW / 2, doorH / 2, 0);
  leftLeaf.castShadow = true;
  leftLeaf.receiveShadow = true;

  // ✅ paneller artık leaf üstünde (pivot ile döner)
  addGoldPanelsToLeaf(leftLeaf, goldMat, leafW, doorH, leafT);

  pivotL.add(leftLeaf);

  // right pivot at its hinge (near center gap)
  const pivotR = new THREE.Group();
  pivotR.name = 'pivotR';
  pivotR.position.set(gap / 2, 0, 0);

  const rightLeaf = new THREE.Mesh(leafGeo, creamMat);
  rightLeaf.name = 'rightLeaf';
  rightLeaf.position.set(leafW / 2, doorH / 2, 0);
  rightLeaf.castShadow = true;
  rightLeaf.receiveShadow = true;

  addGoldPanelsToLeaf(rightLeaf, goldMat, leafW, doorH, leafT);

  pivotR.add(rightLeaf);

  // knobs (kanatların üstünde dursun diye leaf'e ekleyelim)
  const knobGeo = new THREE.SphereGeometry(0.11, 24, 18);

  const knobL = new THREE.Mesh(knobGeo, goldMat);
  knobL.position.set(leafW * 0.28, doorH * 0.55, leafT / 2 + 0.06);
  leftLeaf.add(knobL);

  const knobR = new THREE.Mesh(knobGeo, goldMat);
  knobR.position.set(-leafW * 0.28, doorH * 0.55, leafT / 2 + 0.06);
  rightLeaf.add(knobR);

  g.add(pivotL, pivotR);

  // -----------------------
  // ✅ INVISIBLE BLOCKER (collision)
  // Kapı kapalıyken geçişi ENGELLER, açılınca devre dışı kalır
  // -----------------------
  const blocker = new THREE.Mesh(
    new THREE.BoxGeometry(doorW * 0.92, doorH * 0.94, 0.35),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  blocker.name = 'doorBlocker';
  blocker.position.set(0, doorH / 2, 0); // kapı düzleminde
  g.add(blocker);

  // -----------------------
  // Place + face
  // -----------------------
  g.position.set(x, y, z);
  g.rotation.y = faceIn ? Math.PI : 0;

  // -----------------------
  // Animation state
  // -----------------------
  let isOpen = false;
  let targetAngle = 0;
  let currentL = 0;
  let currentR = 0;

  function setBlockerEnabled(enabled) {
    blocker.visible = false;         // collider görünmesin
    blocker.userData.enabled = enabled; // bizim kontrol için flag
  }

  // başlangıç: kapalı → blocker aktif
  setBlockerEnabled(true);

  function open() {
    isOpen = true;
    targetAngle = Math.PI / 2.4;
    setBlockerEnabled(false);
  }

  function close() {
    isOpen = false;
    targetAngle = 0;
    setBlockerEnabled(true);
  }

  function toggle() {
    isOpen ? close() : open();
  }

  function update(dt) {
    const speed = 6.0;
    const lerp = 1 - Math.exp(-speed * dt);

    currentL = THREE.MathUtils.lerp(currentL, -targetAngle, lerp);
    currentR = THREE.MathUtils.lerp(currentR, targetAngle, lerp);

    pivotL.rotation.y = currentL;
    pivotR.rotation.y = currentR;
  }

  function getIsOpen() {
    return isOpen;
  }

  function getBlocker() {
    return blocker;
  }

  return { object: g, update, open, close, toggle, getIsOpen, getBlocker };
}

function addGoldPanelsToLeaf(leafMesh, goldMat, leafW, doorH, leafT) {
  // panel derinliği (çok az kabartma)
  const panelZ = leafT / 2 + 0.02;

  const panelW = Math.min(1.2, leafW * 0.72);

  const p1 = new THREE.Mesh(new THREE.BoxGeometry(panelW, doorH * 0.20, 0.03), goldMat);
  p1.position.set(0, doorH * 0.25 - doorH / 2, panelZ);

  const p2 = new THREE.Mesh(new THREE.BoxGeometry(panelW, doorH * 0.22, 0.03), goldMat);
  p2.position.set(0, doorH * 0.55 - doorH / 2, panelZ);

  const p3 = new THREE.Mesh(new THREE.BoxGeometry(panelW, doorH * 0.12, 0.03), goldMat);
  p3.position.set(0, doorH * 0.83 - doorH / 2, panelZ);

  leafMesh.add(p1, p2, p3);
}
