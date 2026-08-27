import { createStudioStage } from "/example-gallery/support/studio-stage.js";
import { createPorcelainBrassSubmarine } from
  "/skills/threejs-procedural-geometry/examples/porcelain-brass-submarine/submarine-model.js";

const GROUND_Y = -1.34;

export function createPorcelainBrassSubmarineScene({
  renderer,
  scene,
  camera,
  controls,
}) {
  const stage = createStudioStage({
    renderer,
    scene,
    groundY: GROUND_Y,
    shadowExtent: 3.2,
    shadowFar: 16,
    blushSize: [6.4, 3.4],
    blushCenter: [0, -0.1],
  });

  const submarine = createPorcelainBrassSubmarine();
  scene.add(submarine.object);

  const meshVisibility = new Map();
  submarine.object.traverse((object) => {
    if (object.isMesh) meshVisibility.set(object, object.visible);
  });

  return {
    setDebugMode(mode) {
      const hullOnly = mode === "hull-loft";
      const withoutGlass = mode === "no-glass";
      for (const [mesh, visible] of meshVisibility) {
        mesh.visible = hullOnly
          ? mesh.name === "hull"
          : visible && !(
            withoutGlass &&
            (mesh.material === submarine.materials.glass ||
              mesh.material === submarine.materials.lampGlass)
          );
      }
      for (const material of Object.values(submarine.materials)) {
        material.wireframe = mode === "topology" || hullOnly;
        material.needsUpdate = true;
      }
    },
    update({ delta, elapsed }) {
      submarine.update({ delta, elapsed });
      if (controls) {
        controls.target.y = Math.max(GROUND_Y + 0.25, controls.target.y);
        camera.position.y = Math.max(GROUND_Y + 0.12, camera.position.y);
      }
    },
    metrics() {
      return {
        sculptedParts: submarine.stats.length,
        referenceTriangles: submarine.totalTriangles,
        hullRings: 56,
        hullSegments: 128,
      };
    },
    dispose() {
      submarine.dispose();
      stage.dispose();
    },
  };
}
