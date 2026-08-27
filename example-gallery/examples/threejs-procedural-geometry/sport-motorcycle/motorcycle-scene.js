import * as THREE from "three/webgpu";
import { createStudioStage } from "/example-gallery/support/studio-stage.js";
import { createSportMotorcycle } from
  "/skills/threejs-procedural-geometry/examples/sport-motorcycle/motorcycle-model.js";

const GROUND_Y = 0;

export function createSportMotorcycleScene({ renderer, scene, camera, controls }) {
  const stage = createStudioStage({
    renderer,
    scene,
    groundY: GROUND_Y,
    // 2.0 m long and 0.71 m wide: a tighter frustum than the car, so the same
    // 2048 shadow map lands far more texels on the machine.
    shadowExtent: 1.9,
    shadowNear: 0.6,
    shadowFar: 12,
    blushSize: [1.5, 2.9],
    blushCenter: [0, -0.05],
  });

  const motorcycle = createSportMotorcycle();
  scene.add(motorcycle.object);

  return {
    setDebugMode(mode) {
      motorcycle.setDebugMode(mode);
      const showFloor = mode === "final" || mode === "nobody" || mode === "noglass";
      stage.ground.visible = showFloor;
      stage.blush.visible = showFloor;
    },
    update() {
      if (controls) {
        camera.position.y = Math.max(GROUND_Y + 0.06, camera.position.y);
        controls.target.y = THREE.MathUtils.clamp(controls.target.y, GROUND_Y + 0.05, 1.4);
      }
    },
    metrics() {
      const envelope = motorcycle.measure();
      return {
        emittedParts: motorcycle.stats.length,
        uniqueTriangles: motorcycle.totalTriangles,
        invertedFixups: motorcycle.invertedFixups,
        envelope: `${envelope.length} x ${envelope.width} x ${envelope.height} m`,
      };
    },
    dispose() {
      scene.remove(motorcycle.object);
      motorcycle.dispose();
      stage.dispose();
    },
  };
}
