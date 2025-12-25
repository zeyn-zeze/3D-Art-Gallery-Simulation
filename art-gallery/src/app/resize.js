export function setupResize({ container, renderer, camera }) {
  function resize() {
    const w = container.clientWidth || window.innerWidth;
    const h = container.clientHeight || window.innerHeight;

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(w, h);

    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  window.addEventListener('resize', resize);
  resize();
}
