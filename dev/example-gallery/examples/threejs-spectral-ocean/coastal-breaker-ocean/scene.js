import * as THREE from "three/webgpu";
import {
  Fn,
  exp,
  float,
  normalize,
  positionWorld,
  pow,
  vec3,
  vec4,
} from "three/tsl";
import {
  CoastalBreakerOcean,
  coastalSkyRadiance,
  loadCoastalBreakerSandTextures,
} from "/skills/threejs-spectral-ocean/examples/coastal-breaker-ocean/coastal-breaker-ocean.js";

const COASTAL_TERRAIN_MAX_Y = 3;
const CAMERA_GROUND_MARGIN = 0.05;
const AUTHORED_MIN_DISTANCE = 1;
const AUTHORED_MAX_POLAR_ANGLE = Math.PI / 2 - 0.05;

function constrainCameraAboveTerrain(camera, controls) {
  controls.target.y = 0;

  const minCameraY =
    COASTAL_TERRAIN_MAX_Y + camera.near + CAMERA_GROUND_MARGIN;
  const requiredRise = Math.max(minCameraY - controls.target.y, 0);

  // Let OrbitControls own the collision boundary. Clamping only camera.y after
  // controls.update() makes its spherical state fight the correction and shake.
  controls.minDistance = Math.max(AUTHORED_MIN_DISTANCE, requiredRise + 1e-4);
  const radius = Math.max(
    camera.position.distanceTo(controls.target),
    controls.minDistance,
  );
  const groundLimitedPolarAngle = Math.acos(
    THREE.MathUtils.clamp(requiredRise / radius, -1, 1),
  );
  controls.maxPolarAngle = Math.min(
    AUTHORED_MAX_POLAR_ANGLE,
    groundLimitedPolarAngle,
  );
  controls.update();
}

function createSkyMaterial(uniforms) {
  const material = new THREE.MeshBasicNodeMaterial();
  material.side = THREE.BackSide;
  material.depthWrite = false;
  material.depthTest = false;
  material.fragmentNode = Fn(() => {
    const direction = normalize(positionWorld.sub(uniforms.cameraPos));
    let color = float(1).sub(
      exp(coastalSkyRadiance(direction, uniforms.sunDir).mul(-1.8)),
    );
    color = pow(color, vec3(1 / 2.2));
    return vec4(color, 1);
  })();
  return material;
}

export default {
  backend: "webgpu",
  renderer: {
    options: { antialias: true, samples: 4, alpha: false },
    outputColorSpace: THREE.LinearSRGBColorSpace,
    toneMapping: THREE.NoToneMapping,
    exposure: 1,
    clearColor: 0xd6dee6,
  },
  camera: {
    fov: 60,
    near: 0.5,
    far: 300000,
    position: [14.5, 4.5,  32],
  },
  controls: {
    target: [-7.5, 0, 0],
    enableDamping: false,
    enablePan: true,
    screenSpacePanning: false,
    minDistance: 1,
    maxDistance: 1000,
    minPolarAngle: Math.PI / 2 - 1.5,
    maxPolarAngle: Math.PI / 2 - 0.05,
  },
  async setup({ renderer, scene, camera, controls }) {
    const sand = await loadCoastalBreakerSandTextures(renderer, {
      baseUrl: "/skills/threejs-spectral-ocean/assets/coastal-breaker-ocean/sand-base.jpg",
      normalUrl: "/skills/threejs-spectral-ocean/assets/coastal-breaker-ocean/sand-normal.jpg",
    });
    const coast = new CoastalBreakerOcean(renderer, {
      sandBase: sand.base,
      sandNormal: sand.normal,
    });

    const skyMaterial = createSkyMaterial(coast.uniforms);
    const skyGeometry = new THREE.SphereGeometry(200000, 96, 48);
    const sky = new THREE.Mesh(skyGeometry, skyMaterial);
    sky.frustumCulled = false;
    sky.renderOrder = -100;
    scene.add(sky, coast.group);

    return {
      setDebugMode(mode) {
        coast.setDebugMode(mode);
      },
      update({ delta }) {
        constrainCameraAboveTerrain(camera, controls);
        coast.update(delta, camera.position, controls.target);
        sky.position.copy(camera.position);
      },
      render() {
        renderer.setRenderTarget(null);
        renderer.setClearColor(0xd6dee6, 1);
        renderer.render(scene, camera);
      },
      metrics() {
        return coast.metrics();
      },
      dispose() {
        scene.remove(sky, coast.group);
        skyGeometry.dispose();
        skyMaterial.dispose();
        coast.dispose();
      },
    };
  },
};
