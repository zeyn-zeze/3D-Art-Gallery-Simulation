// src/world/sculpture.js
import * as THREE from 'three';

export function createSculpture(opts = {}) {
  const {
    scale = 1,
    color = 0xddd6c8,
    metal = 0.05,
    rough = 0.35,
  } = opts;

  const g = new THREE.Group();

  const mat = new THREE.MeshStandardMaterial({
    color,
    metalness: metal,
    roughness: rough,
  });

  // Basit modern heykel: taban + gövde + üst form
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.32, 0.08, 24), mat);
  base.castShadow = true; base.receiveShadow = true;
  g.add(base);

  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.16, 0.55, 8, 16), mat);
  body.position.y = 0.36;
  body.rotation.y = 0.45;
  body.castShadow = true; body.receiveShadow = true;
  g.add(body);

  const head = new THREE.Mesh(new THREE.IcosahedronGeometry(0.14, 1), mat);
  head.position.set(0.02, 0.75, 0.04);
  head.castShadow = true; head.receiveShadow = true;
  g.add(head);

  // hafif “sanatsal” twist
  g.rotation.y = 0.6;

  g.scale.setScalar(scale);
  return g;
}
