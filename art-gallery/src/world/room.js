// src/world/room.js
import * as THREE from 'three';

export function createRoom({
  width = 18,
  depth = 30,
  height = 10.5,
  doorW = 6.0,
  doorH = 7.5,
} = {}) {
  const group = new THREE.Group();
  group.name = 'room';

  const wallMat = new THREE.MeshStandardMaterial({
    color: 0x5a1f1f,
    roughness: 0.9,
    metalness: 0.0,
  });

  const floorMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    roughness: 0.9,
    metalness: 0.0,
  });

  // Tavan: mevcut ornate texture fonksiyonun varsa aynen kullanabilirsin.
  // Yoksa düz koyu tavan:
  const ceilMat = new THREE.MeshStandardMaterial({
    color: 0x151515,
    roughness: 1.0,
    metalness: 0.0,
  });

  // Zemin
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(width, depth), floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  group.add(floor);

  // Tavan
  const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(width, depth), ceilMat);
  ceiling.position.y = height;
  ceiling.rotation.x = Math.PI / 2;
  ceiling.receiveShadow = true;
  group.add(ceiling);

  // Duvar kalınlığı
  const t = 0.22;

  // Arka duvar (tam)
  const backWall = new THREE.Mesh(new THREE.BoxGeometry(width, height, t), wallMat);
  backWall.position.set(0, height / 2, -depth / 2);
  backWall.castShadow = true;
  backWall.receiveShadow = true;
  group.add(backWall);

  // Sol/sağ duvar
  const leftWall = new THREE.Mesh(new THREE.BoxGeometry(t, height, depth), wallMat);
  leftWall.position.set(-width / 2, height / 2, 0);
  leftWall.castShadow = true;
  leftWall.receiveShadow = true;
  group.add(leftWall);

  const rightWall = leftWall.clone();
  rightWall.position.x = width / 2;
  group.add(rightWall);

  // ÖN DUVAR: kapı boşluklu (3 parça)
  const frontZ = depth / 2;

  const sideW = (width - doorW) / 2;
  const topH = height - doorH;

  // sol parça
  const fwL = new THREE.Mesh(new THREE.BoxGeometry(sideW, height, t), wallMat);
  fwL.position.set(-(doorW / 2 + sideW / 2), height / 2, frontZ);
  fwL.castShadow = true; fwL.receiveShadow = true;

  // sağ parça
  const fwR = fwL.clone();
  fwR.position.x = (doorW / 2 + sideW / 2);

  // üst parça (lento)
  const fwTop = new THREE.Mesh(new THREE.BoxGeometry(doorW, topH, t), wallMat);
  fwTop.position.set(0, doorH + topH / 2, frontZ);
  fwTop.castShadow = true; fwTop.receiveShadow = true;

  group.add(fwL, fwR, fwTop);

  // Collidable list için bunları group.userData’ya koy:
  group.userData.collidables = [backWall, leftWall, rightWall, fwL, fwR, fwTop, floor];

  return group;
}
