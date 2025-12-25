import * as THREE from 'three';

export function createChandelier({ y = 6.8, z = 0, x = 0, scale = 1.25 } = {}) {
  const g = new THREE.Group();
  g.position.set(x, y, z);
  g.scale.setScalar(scale);

  // Metal gövde (altın/bronze)
  const metalMat = new THREE.MeshStandardMaterial({
    color: 0xd4af37,
    metalness: 0.95,
    roughness: 0.22,
  });

  // Kristal (cam) - görünür olsun diye opacity biraz daha yüksek
  const crystalMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.55,        // ↑ daha görünür
    transmission: 1.0,
    roughness: 0.03,
    thickness: 0.35,      // ↑ ışık kırılımı daha iyi
    ior: 1.45,
    specularIntensity: 1.0,
  });

  // Kristallerin “ışıltısı” için çok hafif emissive (abartma)
  crystalMat.emissive = new THREE.Color(0x111111);

  // --- Zincir (tavandan asılı kısım) ---
  const chain = new THREE.Mesh(
    new THREE.CylinderGeometry(0.035, 0.035, 1.25, 18),
    metalMat
  );
  chain.position.y = 0.65;
  g.add(chain);

  // Üst kapak
  const cap = new THREE.Mesh(new THREE.ConeGeometry(0.42, 0.42, 28), metalMat);
  cap.position.y = 0.12;
  g.add(cap);

  // Ana halka
  const ringOuter = new THREE.Mesh(
    new THREE.TorusGeometry(1.05, 0.07, 18, 72),
    metalMat
  );
  ringOuter.rotation.x = Math.PI / 2;
  ringOuter.position.y = -0.35;
  g.add(ringOuter);

  // İç halka
  const ringInner = new THREE.Mesh(
    new THREE.TorusGeometry(0.68, 0.055, 18, 72),
    metalMat
  );
  ringInner.rotation.x = Math.PI / 2;
  ringInner.position.y = -0.30;
  g.add(ringInner);

  // --- Kristal sarkıt geometrileri ---
  // Damla kristal
  const dropGeo = new THREE.ConeGeometry(0.10, 0.40, 14);
  // Boncuk kristal (zincir gibi)
  const beadGeo = new THREE.SphereGeometry(0.06, 14, 14);

  // Dış halka sarkıtlar (daha uzun)
  addDropsAround({
    parent: g,
    radius: 1.05,
    yTop: -0.45,
    count: 22,
    dropGeo,
    crystalMat,
    length: 0.95, // sarkıt uzunluğu
    beads: 4,      // araya boncuk sayısı
    beadGeo,
  });

  // İç halka sarkıtlar (biraz kısa)
  addDropsAround({
    parent: g,
    radius: 0.68,
    yTop: -0.42,
    count: 14,
    dropGeo,
    crystalMat,
    length: 0.75,
    beads: 3,
    beadGeo,
  });

  // Ortada küçük kristal küme
  const cluster = new THREE.Group();
  cluster.position.set(0, -0.58, 0);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const bead = new THREE.Mesh(beadGeo, crystalMat);
    bead.position.set(Math.cos(a) * 0.22, -0.05 * (i % 2), Math.sin(a) * 0.22);
    cluster.add(bead);
  }
  g.add(cluster);

  // --- Avizenin ışığı ---
  const light = new THREE.PointLight(0xfff2d5, 1.35, 40, 2.0);
  light.position.set(0, -0.25, 0);
  light.castShadow = true;
  light.shadow.mapSize.set(1024, 1024);
  g.add(light);

  // “Ampul” görseli (glow hissi)
  const bulb = new THREE.Mesh(
    new THREE.SphereGeometry(0.14, 18, 18),
    new THREE.MeshStandardMaterial({
      color: 0xfff2d5,
      emissive: 0xffe6b8,
      emissiveIntensity: 1.8,
      roughness: 1.0,
      metalness: 0.0,
    })
  );
  bulb.position.copy(light.position);
  g.add(bulb);

  // dışarıdan intensity kontrolü için
  g.userData.light = light;

  return g;
}

/**
 * Çevreye kristal sarkıtlar + boncuk zincir ekler
 */
function addDropsAround({
  parent,
  radius,
  yTop,
  count,
  dropGeo,
  crystalMat,
  length = 0.9,
  beads = 4,
  beadGeo,
}) {
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2;

    const x = Math.cos(a) * radius;
    const z = Math.sin(a) * radius;

    // Sarkıt grubu
    const chain = new THREE.Group();
    chain.position.set(x, yTop, z);

    // Boncuklar (üstten aşağı)
    for (let b = 0; b < beads; b++) {
      const bead = new THREE.Mesh(beadGeo, crystalMat);
      bead.position.set(0, -0.12 * (b + 1), 0);
      chain.add(bead);
    }

    // Damla (en altta)
    const drop = new THREE.Mesh(dropGeo, crystalMat);
    drop.rotation.x = Math.PI; // sivri uç aşağı
    drop.position.set(0, -length, 0);
    chain.add(drop);

    parent.add(chain);
  }
}
