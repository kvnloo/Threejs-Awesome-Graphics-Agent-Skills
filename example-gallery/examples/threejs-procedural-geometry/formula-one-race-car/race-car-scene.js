import * as THREE from "three/webgpu";
import { createStudioStage } from "/example-gallery/support/studio-stage.js";
import { createFormulaOneRaceCar } from
  "/skills/threejs-procedural-geometry/examples/formula-one-race-car/race-car-model.js";

const GROUND_Y = 0;

export function createFormulaOneRaceCarScene({ renderer, scene, camera, controls }) {
  const stage = createStudioStage({
    renderer,
    scene,
    groundY: GROUND_Y,
    // The car spans 5.4 m of wheelbase-plus-overhang against the submarine's 2.6 m, so
    // the shadow frustum is widened to its own footprint; the rig itself is unchanged.
    shadowExtent: 4.2,
    shadowNear: 1,
    shadowFar: 24,
    blushSize: [3.2, 7.2],
    blushCenter: [0, 0.3],
  });

  const car = createFormulaOneRaceCar();
  scene.add(car.object);

  return {
    setDebugMode(mode) {
      car.setWireframe(mode === "topology");
      car.setLivery(mode !== "no-livery");
      car.setProjectorDebug(mode === "projector");
      car.setRolling(mode === "rolling");
      stage.ground.visible = mode !== "topology";
      stage.blush.visible = mode !== "topology";
    },
    update({ delta, elapsed }) {
      car.update({ delta, elapsed });
      if (controls) {
        camera.position.y = Math.max(GROUND_Y + 0.12, camera.position.y);
        controls.target.y = THREE.MathUtils.clamp(controls.target.y, GROUND_Y + 0.1, 2.4);
      }
    },
    metrics() {
      return {
        emittedParts: car.stats.length,
        uniqueTriangles: car.totalTriangles,
        hullRings: 168,
        hullSegments: 96,
      };
    },
    dispose() {
      scene.remove(car.object);
      car.dispose();
      stage.dispose();
    },
  };
}
