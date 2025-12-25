export function startLoop(app) {
  function tick() {
    const dt = app.clock.getDelta();

    app.update?.(dt);
    app.updateControls?.(dt);

    app.renderer.render(app.scene, app.camera);
    requestAnimationFrame(tick);
  }

  tick();
}
