import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';

export function createExhibitControls(camera, domElement) {
  const controls = new PointerLockControls(camera, domElement);

  function update() {
    // Sergi modunda hareket yok, sadece bakış var
  }

  function dispose() {
    controls.unlock();
  }

  return { controls, update, dispose };
}
