import * as THREE from "three/webgpu";
import {
  DIFFRACTION_GRATING_DEFAULTS,
  createPhysicalDiffractionGrating,
} from "/skills/threejs-procedural-materials/examples/physical-diffraction-grating/physical-diffraction-grating.js";

export default {
  backend: "webgpu",
  renderer: {
    options: { antialias: true },
    exposure: 1.05,
  },
  camera: {
    fov: 34,
    near: 0.05,
    far: 100,
    position: [0, 0, 10],
  },
  controls: {
    target: [0, 0, 0],
    enableDamping: true,
    dampingFactor: 0.07,
    minDistance: 7.5,
    maxDistance: 22,
    minPolarAngle: 0.2,
    maxPolarAngle: 2.9,
    enablePan: true,
  },
  async setup({ scene, resolveAsset }) {
    scene.background = new THREE.Color(0x050507);
    const artTexture = await new THREE.TextureLoader().loadAsync(resolveAsset("./assets/card-art.png"));
    const grating = createPhysicalDiffractionGrating({ artTexture });
    scene.add(grating.group);

    const hemisphere = new THREE.HemisphereLight(0xc8c9d8, 0x19131a, 0.86);
    const rim = new THREE.DirectionalLight(0xcbd6ff, 1.6);
    rim.position.set(-3, 5, 6);
    scene.add(hemisphere, rim);

    const lampGeometry = new THREE.PlaneGeometry(grating.uniforms.lightHalfLength.value * 2, 0.11);
    const lampMaterial = new THREE.MeshBasicMaterial({ color: 0xf8f3e8, side: THREE.DoubleSide });
    const lamp = new THREE.Mesh(lampGeometry, lampMaterial);
    lamp.position.copy(grating.uniforms.lightCenter.value);
    const xAxis = grating.uniforms.lightAxis.value.clone().normalize();
    const zAxis = grating.uniforms.lightNormal.value.clone().normalize();
    const yAxis = new THREE.Vector3().crossVectors(zAxis, xAxis).normalize();
    lamp.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(xAxis, yAxis, zAxis));
    lamp.visible = false;
    scene.add(lamp);

    return {
      setDebugMode(mode) {
        const uniforms = grating.uniforms;
        uniforms.pitchNm.value = DIFFRACTION_GRATING_DEFAULTS.pitchNm;
        uniforms.reliefNm.value = mode === "shallow-relief" ? 24 : DIFFRACTION_GRATING_DEFAULTS.reliefNm;
        uniforms.coherenceUm.value = DIFFRACTION_GRATING_DEFAULTS.coherenceUm;
        uniforms.azimuthSigma.value = mode === "broad-azimuth" ? 0.08 : DIFFRACTION_GRATING_DEFAULTS.azimuthSigma;
        uniforms.grooveAngle.value = DIFFRACTION_GRATING_DEFAULTS.grooveAngleRadians;
        uniforms.gain.value = DIFFRACTION_GRATING_DEFAULTS.gain;
        uniforms.starsEnabled.value = mode === "no-stars" ? 0 : 1;
      },
      update() {
        grating.updateObjectFrame();
      },
      metrics() {
        return {
          pitchNm: String(grating.uniforms.pitchNm.value),
          reliefNm: String(grating.uniforms.reliefNm.value),
          stripSamples: "21",
          orders: "1-3",
        };
      },
      dispose() {
        scene.remove(grating.group, hemisphere, rim, lamp);
        grating.dispose();
        artTexture.dispose();
        lampGeometry.dispose();
        lampMaterial.dispose();
      },
    };
  },
};
