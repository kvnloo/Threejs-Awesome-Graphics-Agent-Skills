import * as THREE from "three/webgpu";

const SKY_WIDTH = 1024;
const SKY_HEIGHT = 512;

export const daylightSunDirection = new THREE.Vector3(
  0.45,
  0.78,
  0.55,
).normalize();

export const unrealDaylightReference = {
  sunLux: 120_000,
  sunAngularDiameterDegrees: 0.545,
};

export const daylightLighting = {
  sunColor: 0xfff7e8,
  sunIntensity: unrealDaylightReference.sunLux / 30_000,
  hemisphereSkyColor: 0xd7e4ee,
  hemisphereGroundColor: 0x8a806f,
  hemisphereIntensity: 0.28,
  fillColor: 0xffffff,
  fillIntensity: 0.06,
  rimColor: 0xffffff,
  rimIntensity: 0.04,
};

const defaultRealDaylightSkySettings = {
  zenith: [0.2, 0.46, 0.82],
  upperSky: [0.42, 0.64, 0.9],
  horizon: [0.78, 0.86, 0.92],
  ground: [0.6, 0.55, 0.48],
  horizonMixPower: 0.62,
  groundMixPower: 0.42,
  horizonGlowStrength: 0.05,
  broadHaloPower: 12,
  broadHaloStrength: 0.18,
  innerHaloPower: 90,
  innerHaloStrength: 0.55,
  sunCoreStrength: 1.4,
  sunAngularDiameterDegrees: unrealDaylightReference.sunAngularDiameterDegrees,
};

function clamp01(value) {
  return Math.min(1, Math.max(0, value));
}

function mixNumber(a, b, amount) {
  return a + (b - a) * amount;
}

function mixColor(a, b, amount) {
  return [
    mixNumber(a[0], b[0], amount),
    mixNumber(a[1], b[1], amount),
    mixNumber(a[2], b[2], amount),
  ];
}

function addColor(a, b, amount) {
  return [
    a[0] + b[0] * amount,
    a[1] + b[1] * amount,
    a[2] + b[2] * amount,
  ];
}

function directionFromEquirect(u, v) {
  const longitude = u * Math.PI * 2 - Math.PI;
  const latitude = (0.5 - v) * Math.PI;
  const cosLatitude = Math.cos(latitude);
  return new THREE.Vector3(
    Math.sin(longitude) * cosLatitude,
    Math.sin(latitude),
    Math.cos(longitude) * cosLatitude,
  );
}

function skyColorForDirection(direction, settings) {
  const sunDot = clamp01(direction.dot(daylightSunDirection));
  const skyAmount = clamp01(direction.y);
  const groundAmount = clamp01(-direction.y);

  let color = direction.y >= 0
    ? mixColor(
        settings.horizon,
        mixColor(settings.upperSky, settings.zenith, skyAmount),
        Math.pow(skyAmount, settings.horizonMixPower),
      )
    : mixColor(
        settings.horizon,
        settings.ground,
        Math.pow(groundAmount, settings.groundMixPower),
      );

  const horizonGlow =
    Math.pow(1 - Math.abs(direction.y), 5) * settings.horizonGlowStrength;
  color = addColor(color, [1, 0.78, 0.48], horizonGlow);

  const sunRadiusRadians =
    THREE.MathUtils.degToRad(settings.sunAngularDiameterDegrees) * 0.5;
  const broadHalo =
    Math.pow(sunDot, settings.broadHaloPower) * settings.broadHaloStrength;
  const innerHalo =
    Math.pow(sunDot, settings.innerHaloPower) * settings.innerHaloStrength;
  const sunCore =
    sunDot > Math.cos(sunRadiusRadians) ? settings.sunCoreStrength : 0;

  color = addColor(color, [1, 0.88, 0.68], broadHalo);
  color = addColor(color, [1, 0.95, 0.82], innerHalo);
  color = addColor(color, [1, 0.98, 0.92], sunCore);

  return [clamp01(color[0]), clamp01(color[1]), clamp01(color[2])];
}

function createRealDaylightSkyTexture(settings = defaultRealDaylightSkySettings) {
  const canvas = document.createElement("canvas");
  canvas.width = SKY_WIDTH;
  canvas.height = SKY_HEIGHT;

  const context = canvas.getContext("2d");
  const image = context.createImageData(SKY_WIDTH, SKY_HEIGHT);
  const direction = new THREE.Vector3();
  let offset = 0;

  for (let y = 0; y < SKY_HEIGHT; y += 1) {
    const v = (y + 0.5) / SKY_HEIGHT;
    for (let x = 0; x < SKY_WIDTH; x += 1) {
      const u = (x + 0.5) / SKY_WIDTH;
      direction.copy(directionFromEquirect(u, v));
      const color = skyColorForDirection(direction, settings);
      image.data[offset] = Math.round(color[0] * 255);
      image.data[offset + 1] = Math.round(color[1] * 255);
      image.data[offset + 2] = Math.round(color[2] * 255);
      image.data[offset + 3] = 255;
      offset += 4;
    }
  }

  context.putImageData(image, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.name = "Real Daylight Sky";
  texture.mapping = THREE.EquirectangularReflectionMapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.generateMipmaps = true;
  return texture;
}

export function createDaylightEnvironment(scene) {
  const texture = createRealDaylightSkyTexture();
  scene.environmentIntensity = 0.32;
  scene.backgroundIntensity = 0.45;
  scene.backgroundBlurriness = 0;
  scene.environment = texture;
  scene.background = texture;
  return {
    texture,
    dispose() {
      texture.dispose();
    },
  };
}
