// src/controls/cameraControls.js
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

export function createCameraControls(camera, domElement, options = {}) {
  const {
    collidables = [],
    target = new THREE.Vector3(0, 2.2, 0),
    minDistance = 2.5,
    maxDistance = 18,
    collisionOffset = 0.3,
  } = options;

  const orbit = new OrbitControls(camera, domElement);
  orbit.enableDamping = true;
  orbit.dampingFactor = 0.08;
  orbit.enablePan = false;

  orbit.minDistance = minDistance;
  orbit.maxDistance = maxDistance;

  orbit.minPolarAngle = 0.75;
  orbit.maxPolarAngle = Math.PI - 0.85;

  orbit.target.copy(target);

  const raycaster = new THREE.Raycaster();
  const dir = new THREE.Vector3();

  function solveCollision() {
    if (!collidables.length) return;

    dir.copy(camera.position).sub(orbit.target);
    const dist = dir.length();
    dir.normalize();

    raycaster.set(orbit.target, dir);
    raycaster.far = dist;

    const hits = raycaster.intersectObjects(collidables, true);
    if (!hits.length) return;

    const hit = hits[0];
    const safeDist = Math.max(minDistance, hit.distance - collisionOffset);

    camera.position
      .copy(orbit.target)
      .addScaledVector(dir, safeDist);
  }

  function update() {
    orbit.update();
    solveCollision();
  }

  return { orbit, update };
}
