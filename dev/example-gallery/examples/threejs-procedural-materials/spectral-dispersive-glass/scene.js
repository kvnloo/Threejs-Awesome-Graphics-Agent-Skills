import { EXRLoader } from "three/addons/loaders/EXRLoader.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { AgXToneMapping } from "three/webgpu";
import { SpectralDispersiveGlass } from "/skills/threejs-procedural-materials/examples/spectral-dispersive-glass/spectral-glass-material.js";

// Normalised subject height in world units. The glass example derives its
// fallback thickness and maximum interior segment from the subject's bounding
// diagonal, so the inspection stage fixes a known scale.
const SUBJECT_HEIGHT = 1.6;

const DEBUG_VIEWS = {
  final: "final",
  thickness: "thickness",
  "exit-normal": "exitNormal",
  "entry-fresnel": "entryFresnel",
};

export default {
  backend: "webgpu",
  renderer: {
    options: { antialias: true },
    toneMapping: AgXToneMapping,
    exposure: 1.3,
    clearColor: 0x000000,
    clearAlpha: 0,
  },
  camera: {
    fov: 32,
    near: 0.05,
    far: 100,
    position: [1.9, 0.52, 2.1],
  },
  controls: {
    target: [0, 0.15, 0],
    enableDamping: true,
    dampingFactor: 0.06,
    minDistance: 0.9,
    maxDistance: 12,
    enablePan: true,
  },

  async setup({ THREE, scene, resolveAsset }) {
    const [gltf, environment] = await Promise.all([
      new GLTFLoader().loadAsync(resolveAsset("./assets/sculpture.glb")),
      new EXRLoader().loadAsync(resolveAsset("./assets/bar.exr")),
    ]);

    // The material reads this map with an explicit mip level, so the mip chain
    // has to exist. S repeats to close the horizontal seam; T clamps so the
    // poles do not wrap into each other.
    environment.mapping = THREE.EquirectangularReflectionMapping;
    environment.wrapS = THREE.RepeatWrapping;
    environment.wrapT = THREE.ClampToEdgeWrapping;
    environment.generateMipmaps = true;
    environment.minFilter = THREE.LinearMipmapLinearFilter;
    environment.magFilter = THREE.LinearFilter;
    environment.needsUpdate = true;

    // Centre the subject on the origin and normalise its height.
    const model = gltf.scene;
    const preBox = new THREE.Box3().setFromObject(model);
    const preSize = preBox.getSize(new THREE.Vector3());
    const preCenter = preBox.getCenter(new THREE.Vector3());

    const group = new THREE.Group();
    model.position.set(-preCenter.x, -preCenter.y, -preCenter.z);
    group.add(model);
    group.scale.setScalar(SUBJECT_HEIGHT / preSize.y);
    group.updateMatrixWorld(true);

    const glass = new SpectralDispersiveGlass(group, { environment });
    scene.add(group);

    // The visible surround must be the radiance field the body transmits.
    scene.backgroundNode = glass.backgroundNode;

    return {
      setDebugMode(mode) {
        glass.setDebugView(DEBUG_VIEWS[mode] ?? "final");
      },
      resize({ bufferWidth, bufferHeight }) {
        glass.setSize(bufferWidth, bufferHeight);
      },
      render({ renderer, camera }) {
        // Pass 1 writes the back-face normals and distances the interior ray
        // searches; pass 2 draws the glass and the environment behind it.
        glass.renderBackFaces(renderer, camera);
        renderer.render(scene, camera);
      },
      metrics() {
        return {
          spectralSamples: String(glass.spectralSamples),
          pathSegments: String(glass.pathSegments),
          iorAtD: glass.ior.toFixed(2),
          abbe: String(glass.abbe),
          dataBuffer: `${glass.renderTarget.width}×${glass.renderTarget.height}`,
        };
      },
      dispose() {
        glass.dispose();
        environment.dispose();
        model.traverse((object) => {
          if (object.isMesh) object.geometry.dispose();
        });
      },
    };
  },
};
