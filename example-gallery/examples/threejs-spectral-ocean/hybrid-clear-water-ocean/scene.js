import * as THREE from "three";
import { SpectralOceanSystem } from
  "/skills/threejs-spectral-ocean/examples/spectral-cascade-ocean/ocean-system.js";
import { validateFragmentIFFT } from
  "/skills/threejs-spectral-ocean/examples/spectral-cascade-ocean/fft-pipeline.js";
import {
  buildHybridSwell,
  createClearWaterSandMaterial,
  createHybridOceanMaterial,
  createHybridOceanSkyMaterial,
  hybridOceanDebugModes,
  updateClearWaterSandMaterial,
  updateHybridOceanMaterial,
} from "/skills/threejs-spectral-ocean/examples/hybrid-clear-water-ocean/hybrid-ocean-material.js";

async function loadTexture(url, colorSpace = THREE.SRGBColorSpace) {
  const texture = await new THREE.TextureLoader().loadAsync(url);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = colorSpace;
  texture.anisotropy = 8;
  return texture;
}

export default {
  initialTime: 14,
  renderer: {
    options: { antialias: true },
    outputColorSpace: THREE.LinearSRGBColorSpace,
    toneMapping: THREE.NoToneMapping,
    exposure: 1,
    clearColor: 0x9fc6dc,
  },
  camera: {
    fov: 50,
    near: 0.2,
    far: 20000,
    position: [45, 22, 75],
  },
  controls: {
    target: [0, 2, 0],
    minDistance: 5,
    maxDistance: 1200,
    maxPolarAngle: Math.PI * 0.495,
    enablePan: true,
  },
  async setup({ renderer, scene, camera, controls, resolveAsset }) {
    const fftValidation = validateFragmentIFFT(renderer);
    if (!fftValidation.pass) {
      throw new Error(
        `IFFT validation failed: impulse=${fftValidation.impulseError}, ` +
        `frequency=${fftValidation.frequencyError}`,
      );
    }

    const sunDirection = new THREE.Vector3(0.506, 0.616, 0.604).normalize();
    const skyMaterial = createHybridOceanSkyMaterial({ sunDirection });
    const sky = new THREE.Mesh(new THREE.SphereGeometry(9000, 48, 24), skyMaterial);
    scene.add(sky);

    const [sandColor, sandNormal, sandRoughness, sandAo] = await Promise.all([
      loadTexture(resolveAsset("assets/sand/Ground098_1K-JPG_Color.jpg")),
      loadTexture(
        resolveAsset("assets/sand/Ground098_1K-JPG_NormalDX.jpg"),
        THREE.NoColorSpace,
      ),
      loadTexture(
        resolveAsset("assets/sand/Ground098_1K-JPG_Roughness.jpg"),
        THREE.NoColorSpace,
      ),
      loadTexture(
        resolveAsset("assets/sand/Ground098_1K-JPG_AmbientOcclusion.jpg"),
        THREE.NoColorSpace,
      ),
    ]);
    const sandMaterial = createClearWaterSandMaterial({
      colorMap: sandColor,
      normalMap: sandNormal,
      roughnessMap: sandRoughness,
      aoMap: sandAo,
      sunDirection,
      causticIntensity: 0.7,
    });
    const oceanSize = 1200;
    const sand = new THREE.Mesh(
      new THREE.PlaneGeometry(oceanSize * 0.98, oceanSize * 0.98, 1, 1),
      sandMaterial,
    );
    sand.rotation.x = -Math.PI / 2;
    sand.position.y = -7.0;
    scene.add(sand);

    const options = {
      resolution: 256,
      patchLengths: [220, 59.4, 15.84],
      boundaryFactor: 6,
      gravity: 9.81,
      depth: 120,
      choppiness: 1.05,
      foamRecovery: 0.55,
      amplitude: 0.34,
      seed: 490173,
      sunDirection,
      local: {
        scale: 0.30,
        windSpeed: 14,
        directionDegrees: 43,
        fetchMeters: 80000,
        directionality: 1,
        swell: 0.18,
        peakEnhancement: 3.3,
        shortWaveFade: 0.018,
      },
      swell: {
        scale: 0.18,
        windSpeed: 3,
        directionDegrees: 20,
        fetchMeters: 280000,
        directionality: 1,
        swell: 1,
        peakEnhancement: 3.3,
        shortWaveFade: 0.012,
      },
    };
    const ocean = new SpectralOceanSystem(renderer, options);
    const sceneTarget = new THREE.WebGLRenderTarget(1, 1, {
      type: THREE.HalfFloatType,
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      depthBuffer: true,
      stencilBuffer: false,
    });
    const oceanMaterial = createHybridOceanMaterial(ocean.cascades, {
      patchLengths: options.patchLengths,
      sceneColor: sceneTarget.texture,
      sunDirection,
      swell: buildHybridSwell(),
    });
    oceanMaterial.uniforms.uSandLevel.value = sand.position.y;
    oceanMaterial.uniforms.uOceanExtent.value = oceanSize;

    const geometry = new THREE.PlaneGeometry(oceanSize, oceanSize, 512, 512);
    geometry.rotateX(-Math.PI / 2);
    const water = new THREE.Mesh(geometry, oceanMaterial);
    water.frustumCulled = false;
    scene.add(water);

    let debugMode = "final";
    return {
      resize({ bufferWidth, bufferHeight }) {
        sceneTarget.setSize(bufferWidth, bufferHeight);
        oceanMaterial.uniforms.uResolution.value.set(bufferWidth, bufferHeight);
      },
      setDebugMode(mode) {
        debugMode = mode;
        oceanMaterial.uniforms.uDebugMode.value =
          hybridOceanDebugModes.get(mode) ?? 0;
      },
      update({ elapsed, delta }) {
        const cell = oceanSize / 512;
        const snappedX = Math.round(camera.position.x / cell) * cell;
        const snappedZ = Math.round(camera.position.z / cell) * cell;
        water.position.x = snappedX;
        water.position.z = snappedZ;
        sand.position.x = snappedX;
        sand.position.z = snappedZ;
        oceanMaterial.uniforms.uModelOffset.value.set(snappedX, snappedZ);
        sky.position.x = camera.position.x;
        sky.position.z = camera.position.z;
        if (camera.position.y < 0.8) camera.position.y = 0.8;
        if (controls?.target && controls.target.y < 0.2) controls.target.y = 0.2;
        ocean.update(elapsed, Math.max(delta, 1 / 120));
        updateHybridOceanMaterial(oceanMaterial, ocean.cascades);
        oceanMaterial.uniforms.uTime.value = elapsed;
        oceanMaterial.uniforms.uDebugMode.value =
          hybridOceanDebugModes.get(debugMode) ?? 0;
        skyMaterial.uniforms.uTime.value = elapsed;
        updateClearWaterSandMaterial(sandMaterial, { elapsed, sunDirection });
      },
      render() {
        water.visible = false;
        renderer.setRenderTarget(sceneTarget);
        renderer.render(scene, camera);
        renderer.setRenderTarget(null);
        water.visible = true;
        renderer.render(scene, camera);
      },
      metrics() {
        return {
          resolution: `${options.resolution}² x ${ocean.cascades.length}`,
          fftTest: `pass ${Math.max(
            fftValidation.impulseError,
            fftValidation.frequencyError,
          ).toExponential(1)}`,
        };
      },
      dispose() {
        sceneTarget.dispose();
        geometry.dispose();
        oceanMaterial.dispose();
        sky.geometry.dispose();
        skyMaterial.dispose();
        sand.geometry.dispose();
        sandMaterial.dispose();
        sandColor.dispose();
        sandNormal.dispose();
        sandRoughness.dispose();
        sandAo.dispose();
      },
    };
  },
};
