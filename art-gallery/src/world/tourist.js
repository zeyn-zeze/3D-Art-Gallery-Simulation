import * as THREE from 'three';


export function createTourist(opts = {}) {
  const {
    position = new THREE.Vector3(0, 0, 0),
    scale = 1.0,
    bodyColor = 0x7aa6ff,
    pantsColor = 0x2b2b2b,
    skinColor = 0xffd7b3,
  } = opts;
  let collidables = [];
    const _ray = new THREE.Raycaster();
    const _dir = new THREE.Vector3();
    const _from = new THREE.Vector3();

  const g = new THREE.Group();

  const matBody  = new THREE.MeshStandardMaterial({ color: bodyColor, roughness: 0.85, metalness: 0.05 });
  const matPants = new THREE.MeshStandardMaterial({ color: pantsColor, roughness: 0.9, metalness: 0.05 });
  const matSkin  = new THREE.MeshStandardMaterial({ color: skinColor, roughness: 0.9, metalness: 0.0 });

  // Torso
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.22, 0.55, 6, 12), matBody);
  torso.position.y = 1.05;

  // Head
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.18, 16, 12), matSkin);
  head.position.y = 1.48;

  // Legs
  const legGeo = new THREE.CapsuleGeometry(0.10, 0.45, 6, 10);
  const legL = new THREE.Mesh(legGeo, matPants);
  const legR = new THREE.Mesh(legGeo, matPants);
  legL.position.set(-0.12, 0.55, 0);
  legR.position.set( 0.12, 0.55, 0);

  // Arms
  const armGeo = new THREE.CapsuleGeometry(0.08, 0.42, 6, 10);
  const armL = new THREE.Mesh(armGeo, matBody);
  const armR = new THREE.Mesh(armGeo, matBody);
  armL.position.set(-0.32, 1.05, 0);
  armR.position.set( 0.32, 1.05, 0);

  // Pivots for swing
  const legLPivot = new THREE.Group(); legLPivot.add(legL); legLPivot.position.set(-0.12, 0, 0);
  const legRPivot = new THREE.Group(); legRPivot.add(legR); legRPivot.position.set( 0.12, 0, 0);
  const armLPivot = new THREE.Group(); armLPivot.add(armL); armLPivot.position.set(-0.32, 0, 0);
  const armRPivot = new THREE.Group(); armRPivot.add(armR); armRPivot.position.set( 0.32, 0, 0);

  g.add(torso, head, legLPivot, legRPivot, armLPivot, armRPivot);

  g.position.copy(position);
  g.scale.setScalar(scale);

  g.traverse(o => { if (o.isMesh) { o.castShadow = true; } });

  // API
  let t = 0;
  let speed = 0.9;
  let target = position.clone();

  function setTarget(v3) { target.copy(v3); }
  function setSpeed(s) { speed = s; }
  function setCollidables(list) {
    collidables = list || [];
  }
// tourist.js içinde (createTourist içinde)

let stuckT = 0;

function update(dt) {
  if (!target) return Infinity;

  const pos = g.position;

  // hedefe yön
  _dir.copy(target).sub(pos);
  _dir.y = 0;

  const dist = _dir.length();
  if (dist < 1e-4) { stuckT = 0; return 0; }

  _dir.normalize();

  const step = speed * dt;
  const moveLen = Math.min(step, dist);

  // --- yardımcı: bu yönde çarpma var mı?
  function isBlocked(dirVec, far) {
    _from.copy(pos);
    _from.y = 1.0;              // rehber gövde yüksekliği
    _ray.set(_from, dirVec);
    _ray.far = far;

    const hits = collidables.length ? _ray.intersectObjects(collidables, true) : [];
    return (hits.length && hits[0].distance < far);
  }

  // 1) düz ileri dene
  const forwardBlocked = isBlocked(_dir, moveLen + 0.40);
  if (!forwardBlocked) {
    pos.add(_dir.clone().multiplyScalar(moveLen));
    g.rotation.y = Math.atan2(_dir.x, _dir.z);
    stuckT = 0;
    return dist - moveLen;
  }

  // 2) bloklandıysa: açı taraması ile kaçış (köşe çözümü)
  const anglesDeg = [25, -25, 50, -50, 75, -75, 110, -110];
  const up = new THREE.Vector3(0, 1, 0);

  let moved = false;

  for (const deg of anglesDeg) {
    const a = deg * Math.PI / 180;
    const cand = _dir.clone().applyAxisAngle(up, a).normalize();

    const sideStep = Math.min(0.25, moveLen);
    const blocked = isBlocked(cand, sideStep + 0.35);

    if (!blocked) {
      pos.add(cand.multiplyScalar(sideStep));
      g.rotation.y = Math.atan2(cand.x, cand.z);
      moved = true;
      break;
    }
  }

  if (moved) {
    stuckT = 0;
    return dist; // hedefe azalmayabilir ama sıkışmayı kırar
  }

  // 3) hâlâ çıkamadıysa: geri çekil
  stuckT += dt;

  const back = _dir.clone().multiplyScalar(-1).normalize();
  const backStep = 0.18;

  if (!isBlocked(back, backStep + 0.25)) {
    pos.add(back.multiplyScalar(backStep));
    g.rotation.y = Math.atan2(back.x, back.z);
  }

  // 4) uzun süre stuck → hedefi hafif kaydır (köşe/kilit kırma)
  if (stuckT > 1.2) {
    stuckT = 0;

    const jitter = new THREE.Vector3(
      (Math.random() - 0.5) * 1.2,
      0,
      (Math.random() - 0.5) * 1.2
    );

    target.add(jitter);
  }

  return dist;
}

  

  return {
    object: g,
    update,
    setTarget,
    setSpeed,
    setCollidables,
  };
}
