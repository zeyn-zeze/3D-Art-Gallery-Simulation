import * as THREE from 'three';

const raycaster = new THREE.Raycaster();
const forward = new THREE.Vector3();
const right = new THREE.Vector3();

function forwardFlat(camera) {
  camera.getWorldDirection(forward);
  forward.y = 0;
  return forward.normalize();
}

export function isBlockedForward(camera, collidables, minDistance = 0.9) {
  if (!collidables?.length) return false;
  forwardFlat(camera);
  raycaster.set(camera.position, forward);
  raycaster.near = 0;
  raycaster.far = minDistance;
  return raycaster.intersectObjects(collidables, true).length > 0;
}

export function isBlockedBackward(camera, collidables, minDistance = 0.9) {
  if (!collidables?.length) return false;
  forwardFlat(camera).multiplyScalar(-1);
  raycaster.set(camera.position, forward);
  raycaster.near = 0;
  raycaster.far = minDistance;
  return raycaster.intersectObjects(collidables, true).length > 0;
}

export function isBlockedSide(camera, collidables, goRight = true, minDistance = 0.9) {
  if (!collidables?.length) return false;
  forwardFlat(camera);
  right.crossVectors(forward, camera.up).normalize();
  if (!goRight) right.multiplyScalar(-1);
  raycaster.set(camera.position, right);
  raycaster.near = 0;
  raycaster.far = minDistance;
  return raycaster.intersectObjects(collidables, true).length > 0;
}

