import * as THREE from "three";
import { GRADE_GLSL } from "./polar-night-sky.js";

export const SNOW_DESERT_SETTINGS = Object.freeze({
  detail: "High",
  seedX: 0,
  seedZ: 0,
  windAngle: 0.62,
  reliefFreq: 0.00085,
  reliefHeight: 210,
  reliefSharp: 1.7,
  swellFreq: 0.0016,
  swellHeight: 6,
  duneFreq: 0.0105,
  duneHeight: 5.5,
  duneAniso: 0.28,
  driftFreq: 0.045,
  driftHeight: 1.25,
  driftAniso: 0.2,
  moundFreq: 0.34,
  moundHeight: 0.55,
  sastrugiFreq: 0.42,
  sastrugiHeight: 0.1,
  rippleFreq: 3.2,
  rippleHeight: 0.008,
  detailStrength: 1.5,
  grain: 0.5,
  snowColor: "#edf2fb",
  roughCrust: 0.52,
  roughSoft: 0.85,
  sheen: 0.22,
  sparkle: 1,
  sparkleDensity: 220,
  ao: 0.5,
  moonAzimuth: 214,
  moonElevation: 14,
  moonColor: "#d8e2f5",
  moonIntensity: 0.18,
  skyBounce: 1.15,
  skySoft: 0.55,
  fogDensity: 0.0005,
  snowfall: 0.35,
  flakeSize: 4.5,
  fallSpeed: 0.55,
  windSpeed: 3.4,
  flakeColor: "#cfe6ff",
});

const DETAIL_LEVELS = { Low: 64, Medium: 96, High: 128, Ultra: 176 };
const LEVEL_SPACINGS = [0.75, 1.5, 3, 6, 12, 24, 48, 96];
const FLAKE_COUNT = 9000;

const NOISE_GLSL = /* glsl */ `
  #define PI 3.14159265359
  const mat2 ROT = mat2(0.80, 0.60, -0.60, 0.80);

  float hash21(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * 0.1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
  }

  vec2 gh2(vec2 p) {
    vec3 p3 = fract(vec3(p.x, p.y, p.x) * vec3(0.1031, 0.1030, 0.0973));
    p3 += dot(p3, p3.yzx + 33.33);
    vec2 o = fract((p3.xx + p3.yz) * p3.zy) * 2.0 - 1.0;
    return o * inversesqrt(max(dot(o, o), 1e-4));
  }

  float gnoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = p - i;
    vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
    float a = dot(gh2(i + vec2(0.0, 0.0)), f - vec2(0.0, 0.0));
    float b = dot(gh2(i + vec2(1.0, 0.0)), f - vec2(1.0, 0.0));
    float c = dot(gh2(i + vec2(0.0, 1.0)), f - vec2(0.0, 1.0));
    float d = dot(gh2(i + vec2(1.0, 1.0)), f - vec2(1.0, 1.0));
    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y) * 1.4;
  }

  float fbm4(vec2 p, float foot) {
    float sum = 0.0;
    float amplitude = 0.5;
    float frequency = 1.0;
    float normalization = 0.0;
    for (int octave = 0; octave < 4; octave++) {
      float fade = 1.0 - smoothstep(0.20, 0.60, foot * frequency);
      sum += amplitude * gnoise(p) * fade;
      normalization += amplitude;
      p = ROT * p * 2.02;
      amplitude *= 0.5;
      frequency *= 2.02;
    }
    return sum / normalization;
  }

  float ridged3(vec2 p, float foot) {
    float sum = 0.0;
    float amplitude = 0.5;
    float frequency = 1.0;
    float normalization = 0.0;
    for (int octave = 0; octave < 3; octave++) {
      float fade = 1.0 - smoothstep(0.20, 0.60, foot * frequency);
      float noiseValue = 1.0 - abs(gnoise(p));
      noiseValue *= noiseValue;
      sum += amplitude * mix(0.42, noiseValue, fade);
      normalization += amplitude;
      p = ROT * p * 2.03;
      amplitude *= 0.5;
      frequency *= 2.03;
    }
    return sum / normalization;
  }

  float reliefFbm(vec2 p, float foot) {
    float sum = 0.0;
    float amplitude = 1.0;
    float frequency = 1.0;
    float normalization = 0.0;
    float carry = 1.0;
    for (int octave = 0; octave < 5; octave++) {
      float fade = 1.0 - smoothstep(0.20, 0.60, foot * frequency);
      float noiseValue = 1.0 - abs(gnoise(p));
      noiseValue *= noiseValue;
      sum += amplitude * noiseValue * carry * fade;
      normalization += amplitude;
      carry = clamp(mix(1.0, noiseValue * 1.6, 0.65), 0.0, 1.4);
      p = ROT * p * 2.07;
      amplitude *= 0.48;
      frequency *= 2.07;
    }
    return sum / normalization;
  }
`;

const FIELD_GLSL = /* glsl */ `
  uniform vec2  uSeedXZ;
  uniform vec2  uWind;
  uniform float uReliefFreq, uReliefHeight, uReliefSharp;
  uniform float uSwellFreq, uSwellHeight;
  uniform float uDuneFreq, uDuneHeight, uDuneAniso;
  uniform float uDriftFreq, uDriftHeight, uDriftAniso;
  uniform float uMoundFreq, uMoundHeight;
  uniform float uSastrugiFreq, uSastrugiHeight;
  uniform float uRippleFreq, uRippleHeight;

  vec2 windSpace(vec2 p) {
    return vec2(uWind.x * p.x + uWind.y * p.y, -uWind.y * p.x + uWind.x * p.y);
  }

  float macroHeight(vec2 worldPosition, out float ridgeProminence) {
    worldPosition += uSeedXZ;
    vec2 windPosition = windSpace(worldPosition);

    vec2 reliefPosition = worldPosition * uReliefFreq;
    reliefPosition += vec2(
      gnoise(reliefPosition * 0.5),
      gnoise(reliefPosition * 0.5 + 41.7)
    ) * 0.45;
    float peaks = (
      pow(reliefFbm(reliefPosition, 0.0), uReliefSharp) - 0.22
    ) * uReliefHeight;

    float swell = gnoise(worldPosition * uSwellFreq) * uSwellHeight;
    vec2 dunePosition = vec2(windPosition.x * uDuneAniso, windPosition.y) * uDuneFreq;
    float dunes = fbm4(dunePosition, 0.0) * uDuneHeight;

    ridgeProminence = clamp(
      ridged3(
        vec2(windPosition.x * uDriftAniso, windPosition.y) * uDriftFreq,
        0.0
      ) * 1.6,
      0.0,
      1.0
    );
    return peaks + swell + dunes;
  }

  float detailHeight(vec2 worldPosition, float foot, out float crest) {
    worldPosition += uSeedXZ;
    vec2 windPosition = windSpace(worldPosition);

    float heightValue = (
      ridged3(
        vec2(windPosition.x * uDriftAniso, windPosition.y) * uDriftFreq,
        foot * uDriftFreq
      ) - 0.34
    ) * uDriftHeight;

    vec2 moundPosition = vec2(windPosition.x * 0.75, windPosition.y) * uMoundFreq;
    float mound = fbm4(moundPosition, foot * uMoundFreq) * 0.5 + 0.5;
    crest = mound;
    heightValue += (mound * mound - 0.28) * uMoundHeight;

    float lumpFade = 1.0 - smoothstep(0.20, 0.60, foot * uMoundFreq * 3.7);
    heightValue += gnoise(moundPosition * 3.7) * uMoundHeight * 0.12 * lumpFade;

    vec2 sastrugiPosition = vec2(windPosition.x * 0.33, windPosition.y) * uSastrugiFreq;
    float streak = ridged3(sastrugiPosition, foot * uSastrugiFreq);
    float carved = smoothstep(-0.1, 0.55, gnoise(sastrugiPosition * 0.055));
    heightValue += streak * streak * uSastrugiHeight * carved;

    float rippleWeight = 1.0 - smoothstep(0.006, 0.03, foot);
    if (rippleWeight > 0.002) {
      vec2 ripplePosition = vec2(windPosition.x, windPosition.y * 0.22) * uRippleFreq;
      float drifted = smoothstep(-0.15, 0.45, gnoise(ripplePosition * 0.09));
      heightValue += sin(
        ripplePosition.x * 6.28318 + gnoise(ripplePosition * 0.30) * 2.6
      ) * 0.5 * uRippleHeight * rippleWeight * drifted;
    }
    return heightValue;
  }
`;

const TERRAIN_VERTEX_SHADER = /* glsl */ `
  uniform vec3 uCamPos;
  uniform float uSpacing;
  uniform vec2 uMorphRange;

  varying vec3 vWorldPos;
  varying vec2 vGrad;
  varying float vDist;
  varying float vRidge;

  ${NOISE_GLSL}
  ${FIELD_GLSL}

  void main() {
    vec3 worldPosition = (modelMatrix * vec4(position, 1.0)).xyz;

    float ridge;
    float ridgeX;
    float ridgeZ;
    float ridgeDiscard;
    float heightValue = macroHeight(worldPosition.xz, ridge);
    float unmorphedHeight = heightValue;

    float morphWeight = smoothstep(
      uMorphRange.x,
      uMorphRange.y,
      max(abs(position.x), abs(position.z))
    );
    if (morphWeight > 0.0) {
      float spacing = uSpacing;
      float evenX = mod(floor(position.x / spacing + 0.5), 2.0);
      float evenZ = mod(floor(position.z / spacing + 0.5), 2.0);
      if (evenX + evenZ > 0.5) {
        vec2 offset = evenX > 0.5 && evenZ > 0.5
          ? vec2(spacing, -spacing)
          : evenX > 0.5
            ? vec2(spacing, 0.0)
            : vec2(0.0, spacing);
        float targetHeight = 0.5 * (
          macroHeight(worldPosition.xz + offset, ridgeDiscard)
          + macroHeight(worldPosition.xz - offset, ridgeDiscard)
        );
        heightValue = mix(heightValue, targetHeight, morphWeight);
      }
    }

    const float epsilon = 0.75;
    float heightX = macroHeight(worldPosition.xz + vec2(epsilon, 0.0), ridgeX);
    float heightZ = macroHeight(worldPosition.xz + vec2(0.0, epsilon), ridgeZ);

    worldPosition.y = heightValue;
    vWorldPos = worldPosition;
    vGrad = vec2(heightX - unmorphedHeight, heightZ - unmorphedHeight) / epsilon;
    vDist = length(uCamPos - worldPosition);
    vRidge = ridge;
    gl_Position = projectionMatrix * viewMatrix * vec4(worldPosition, 1.0);
  }
`;

const TERRAIN_FRAGMENT_SHADER = /* glsl */ `
  precision highp float;

  uniform vec3 uCamPos;
  uniform float iTime;
  uniform sampler2D uProbeTex;
  uniform float uDetailStrength, uGrain, uDetailRange;
  uniform vec3 uSnowColor;
  uniform float uRoughCrust, uRoughSoft, uSheen, uSparkle, uSparkleDensity, uAO;
  uniform vec3 uMoonDir, uMoonColor;
  uniform float uMoonIntensity, uSkyBounce, uSkySoft;
  uniform float uFogDensity;

  varying vec3 vWorldPos;
  varying vec2 vGrad;
  varying float vDist;
  varying float vRidge;

  ${NOISE_GLSL}
  ${FIELD_GLSL}
  ${GRADE_GLSL}

  vec3 probeLight(vec3 direction) {
    float elevation = asin(clamp(direction.y, 0.0, 1.0));
    float azimuth = atan(direction.z, direction.x);
    return texture2D(
      uProbeTex,
      vec2(azimuth * 0.15915494 + 0.5, elevation * 0.6491)
    ).rgb;
  }

  void gatherSky(vec3 normalValue, out vec3 directional, out vec3 averageValue) {
    vec3 sum = vec3(0.0);
    vec3 averageSum = vec3(0.0);
    vec3 lightValue;
    lightValue = probeLight(vec3(0.0, 1.0, 0.0));
    averageSum += lightValue;
    sum += lightValue * clamp(normalValue.y, 0.0, 1.0);
    lightValue = probeLight(vec3(0.707, 0.707, 0.0));
    averageSum += lightValue;
    sum += lightValue * clamp(dot(normalValue, vec3(0.707, 0.707, 0.0)), 0.0, 1.0);
    lightValue = probeLight(vec3(-0.707, 0.707, 0.0));
    averageSum += lightValue;
    sum += lightValue * clamp(dot(normalValue, vec3(-0.707, 0.707, 0.0)), 0.0, 1.0);
    lightValue = probeLight(vec3(0.0, 0.707, 0.707));
    averageSum += lightValue;
    sum += lightValue * clamp(dot(normalValue, vec3(0.0, 0.707, 0.707)), 0.0, 1.0);
    lightValue = probeLight(vec3(0.0, 0.707, -0.707));
    averageSum += lightValue;
    sum += lightValue * clamp(dot(normalValue, vec3(0.0, 0.707, -0.707)), 0.0, 1.0);
    lightValue = probeLight(vec3(0.966, 0.259, 0.0));
    averageSum += lightValue;
    sum += lightValue * clamp(dot(normalValue, vec3(0.966, 0.259, 0.0)), 0.0, 1.0);
    lightValue = probeLight(vec3(-0.966, 0.259, 0.0));
    averageSum += lightValue;
    sum += lightValue * clamp(dot(normalValue, vec3(-0.966, 0.259, 0.0)), 0.0, 1.0);
    lightValue = probeLight(vec3(0.0, 0.259, 0.966));
    averageSum += lightValue;
    sum += lightValue * clamp(dot(normalValue, vec3(0.0, 0.259, 0.966)), 0.0, 1.0);
    lightValue = probeLight(vec3(0.0, 0.259, -0.966));
    averageSum += lightValue;
    sum += lightValue * clamp(dot(normalValue, vec3(0.0, 0.259, -0.966)), 0.0, 1.0);
    directional = sum * 0.2222;
    averageValue = averageSum * (1.08 / 9.0);
  }

  vec3 airlight() {
    return 0.25 * (
      probeLight(vec3(1.0, 0.06, 0.0))
      + probeLight(vec3(-1.0, 0.06, 0.0))
      + probeLight(vec3(0.0, 0.06, 1.0))
      + probeLight(vec3(0.0, 0.06, -1.0))
    );
  }

  void main() {
    float foot = max(fwidth(vWorldPos.x), fwidth(vWorldPos.z)) + 0.004;
    const float epsilon = 0.025;
    float detailRange = uDetailRange;

    float crest;
    float crestX;
    float crestZ;
    float detail = detailHeight(vWorldPos.xz, foot, crest);
    float detailX = detailHeight(vWorldPos.xz + vec2(epsilon, 0.0), foot, crestX);
    float detailZ = detailHeight(vWorldPos.xz + vec2(0.0, epsilon), foot, crestZ);

    float macroNormalY = inversesqrt(1.0 + dot(vGrad, vGrad));
    float flatness = smoothstep(0.30, 0.95, macroNormalY);
    vec2 detailGradient = vec2(detailX - detail, detailZ - detail)
      / epsilon * uDetailStrength * flatness;

    float grainFade = 1.0 - smoothstep(0.05 * detailRange, 0.90 * detailRange, vDist);
    if (grainFade > 0.001) {
      vec2 grainPosition = floor(vWorldPos.xz * 640.0);
      detailGradient += (
        vec2(hash21(grainPosition), hash21(grainPosition + 17.3)) - 0.5
      ) * uGrain * grainFade * flatness;
    }

    vec2 gradientValue = vGrad + detailGradient;
    vec3 normalValue = normalize(vec3(-gradientValue.x, 1.0, -gradientValue.y));
    vec3 viewDirection = normalize(uCamPos - vWorldPos);
    vec3 moonDirection = normalize(uMoonDir);

    float steep = smoothstep(0.30, 0.86, 1.0 - normalValue.y);
    float crustMask = smoothstep(0.55, 0.85, crest) * 0.6
      + smoothstep(0.30, 0.85, vRidge) * 0.35
      + steep * 0.8;
    crustMask = clamp(crustMask, 0.0, 1.0);
    float roughness = mix(uRoughSoft, uRoughCrust, crustMask);

    vec3 albedo = uSnowColor * mix(0.94, 1.0, crustMask);
    if (grainFade > 0.001) {
      albedo *= 1.0 + (hash21(floor(vWorldPos.xz * 90.0)) - 0.5) * 0.06 * grainFade;
    }
    float occlusion = mix(1.0 - uAO, 1.0, max(vRidge, crest));

    vec3 directionalSky;
    vec3 averageSky;
    gatherSky(normalValue, directionalSky, averageSky);
    vec3 skyIrradiance = mix(directionalSky, averageSky, uSkySoft) * uSkyBounce;
    skyIrradiance = mix(
      skyIrradiance,
      vec3(dot(skyIrradiance, vec3(0.299, 0.587, 0.114))),
      0.40
    );

    float wrapDiffuse = 0.32;
    float moonDiffuse = pow(
      max(0.0, (dot(normalValue, moonDirection) + wrapDiffuse) / (1.0 + wrapDiffuse)),
      1.6
    );
    vec3 colorValue = albedo * (
      skyIrradiance + uMoonColor * uMoonIntensity * moonDiffuse
    ) * occlusion;
    colorValue += albedo * uMoonColor * uMoonIntensity
      * pow(max(0.0, dot(viewDirection, -moonDirection)), 3.0)
      * 0.13 * occlusion;

    vec3 halfVector = normalize(moonDirection + viewDirection);
    float roughnessSquared = roughness * roughness;
    float alphaSquared = roughnessSquared * roughnessSquared;
    float normalHalf = max(dot(normalValue, halfVector), 0.0);
    float normalView = max(dot(normalValue, viewDirection), 1e-3);
    float normalLight = max(dot(normalValue, moonDirection), 0.0);
    float denominator = normalHalf * normalHalf * (alphaSquared - 1.0) + 1.0;
    float distribution = alphaSquared / (PI * denominator * denominator);
    float fresnel = 0.02 + 0.98
      * pow(1.0 - max(dot(viewDirection, halfVector), 0.0), 5.0);
    float geometryK = roughnessSquared * 0.5;
    float geometry = (
      normalView / (normalView * (1.0 - geometryK) + geometryK)
    ) * (
      normalLight / (normalLight * (1.0 - geometryK) + geometryK)
    );
    colorValue += uMoonColor * uMoonIntensity
      * (distribution * fresnel * geometry * 0.25 / normalView);

    vec3 air = airlight();
    vec3 zenithLight = probeLight(vec3(0.0, 1.0, 0.0));
    float reflectedY = clamp(reflect(-viewDirection, normalValue).y, 0.0, 1.0);
    vec3 sheenLight = mix(air, zenithLight, reflectedY);
    colorValue += sheenLight
      * (0.02 + 0.98 * pow(1.0 - normalView, 5.0))
      * uSheen;

    float sparkleFade = 1.0 - smoothstep(0.40 * detailRange, 3.00 * detailRange, vDist);
    if (sparkleFade > 0.001) {
      vec2 sparkleCell = floor(vWorldPos.xz * uSparkleDensity);
      float randomOne = hash21(sparkleCell);
      float randomTwo = hash21(sparkleCell + 37.7);
      float randomThree = hash21(sparkleCell + 91.3);
      vec3 facet = normalize(
        normalValue + vec3(randomOne - 0.5, 0.0, randomTwo - 0.5) * 1.8
      );
      float gate = step(0.86, randomThree) * sparkleFade * uSparkle
        * mix(0.35, 1.0, crustMask);
      colorValue += vec3(1.0, 1.0, 1.06) * uMoonColor * uMoonIntensity
        * pow(max(0.0, dot(facet, halfVector)), 900.0) * gate * 2.0;
      colorValue += zenithLight
        * pow(
          max(
            0.0,
            dot(facet, normalize(vec3(0.0, 1.0, 0.0) + viewDirection))
          ),
          500.0
        ) * gate * 1.6;
    }

    float fog = 1.0 - exp(-pow(max(vDist, 0.0) * uFogDensity, 1.35));
    colorValue = mix(colorValue, air, fog);
    gl_FragColor = vec4(grade(colorValue, gl_FragCoord.xy, iTime), 1.0);
  }
`;

function directionFromAngles(azimuthDegrees, elevationDegrees) {
  const azimuth = THREE.MathUtils.degToRad(azimuthDegrees);
  const elevation = THREE.MathUtils.degToRad(elevationDegrees);
  return new THREE.Vector3(
    Math.sin(azimuth) * Math.cos(elevation),
    Math.sin(elevation),
    -Math.cos(azimuth) * Math.cos(elevation),
  );
}

function buildGridGeometry(cells, spacing, holeHalfCells) {
  const rowSize = cells + 1;
  const positions = new Float32Array(rowSize * rowSize * 3);
  let positionIndex = 0;
  for (let zIndex = 0; zIndex < rowSize; zIndex += 1) {
    for (let xIndex = 0; xIndex < rowSize; xIndex += 1) {
      positions[positionIndex++] = (xIndex - cells / 2) * spacing;
      positions[positionIndex++] = 0;
      positions[positionIndex++] = (zIndex - cells / 2) * spacing;
    }
  }

  const indices = [];
  for (let zIndex = 0; zIndex < cells; zIndex += 1) {
    for (let xIndex = 0; xIndex < cells; xIndex += 1) {
      const centerX = xIndex - cells / 2 + 0.5;
      const centerZ = zIndex - cells / 2 + 0.5;
      if (Math.max(Math.abs(centerX), Math.abs(centerZ)) < holeHalfCells) continue;
      const a = zIndex * rowSize + xIndex;
      const b = a + 1;
      const c = a + rowSize;
      const d = c + 1;
      indices.push(a, c, b, b, c, d);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(), cells * spacing);
  return geometry;
}

export function createSnowDesert({
  scene,
  auroraUniforms,
  skyUniforms,
  probeTexture,
  options = {},
}) {
  const settings = { ...SNOW_DESERT_SETTINGS, ...options };
  const windX = Math.cos(settings.windAngle);
  const windZ = Math.sin(settings.windAngle);
  const uniforms = {
    iTime: auroraUniforms.iTime,
    uCamPos: { value: new THREE.Vector3() },
    uProbeTex: { value: probeTexture },
    uDithering: skyUniforms.uDithering,
    uFilmGrain: skyUniforms.uFilmGrain,
    uExposure: skyUniforms.uExposure,
    uSeedXZ: { value: new THREE.Vector2(settings.seedX, settings.seedZ) },
    uWind: { value: new THREE.Vector2(windX, windZ) },
    uWindVec: { value: new THREE.Vector2(windX, windZ) },
    uReliefFreq: { value: settings.reliefFreq },
    uReliefHeight: { value: settings.reliefHeight },
    uReliefSharp: { value: settings.reliefSharp },
    uSwellFreq: { value: settings.swellFreq },
    uSwellHeight: { value: settings.swellHeight },
    uDuneFreq: { value: settings.duneFreq },
    uDuneHeight: { value: settings.duneHeight },
    uDuneAniso: { value: settings.duneAniso },
    uDriftFreq: { value: settings.driftFreq },
    uDriftHeight: { value: settings.driftHeight },
    uDriftAniso: { value: settings.driftAniso },
    uMoundFreq: { value: settings.moundFreq },
    uMoundHeight: { value: settings.moundHeight },
    uSastrugiFreq: { value: settings.sastrugiFreq },
    uSastrugiHeight: { value: settings.sastrugiHeight },
    uRippleFreq: { value: settings.rippleFreq },
    uRippleHeight: { value: settings.rippleHeight },
    uDetailStrength: { value: settings.detailStrength },
    uGrain: { value: settings.grain },
    uDetailRange: { value: 60 },
    uSnowColor: { value: new THREE.Color(settings.snowColor) },
    uRoughCrust: { value: settings.roughCrust },
    uRoughSoft: { value: settings.roughSoft },
    uSheen: { value: settings.sheen },
    uSparkle: { value: settings.sparkle },
    uSparkleDensity: { value: settings.sparkleDensity },
    uAO: { value: settings.ao },
    uMoonDir: {
      value: directionFromAngles(settings.moonAzimuth, settings.moonElevation),
    },
    uMoonColor: { value: new THREE.Color(settings.moonColor) },
    uMoonIntensity: { value: settings.moonIntensity },
    uSkyBounce: { value: settings.skyBounce },
    uSkySoft: { value: settings.skySoft },
    uFogDensity: { value: settings.fogDensity },
    uFlakeColor: { value: new THREE.Color(settings.flakeColor) },
    uFlakeSize: { value: settings.flakeSize },
    uFallSpeed: { value: settings.fallSpeed },
    uWindSpeed: { value: settings.windSpeed },
    uSnowfall: { value: settings.snowfall },
    uViewportH: { value: 2 },
  };

  const pick = (...names) => Object.fromEntries(names.map((name) => [name, uniforms[name]]));
  const terrainUniforms = pick(
    "uCamPos", "iTime", "uProbeTex", "uDithering", "uFilmGrain", "uExposure",
    "uSeedXZ", "uWind", "uReliefFreq", "uReliefHeight", "uReliefSharp",
    "uSwellFreq", "uSwellHeight", "uDuneFreq", "uDuneHeight", "uDuneAniso",
    "uDriftFreq", "uDriftHeight", "uDriftAniso", "uMoundFreq", "uMoundHeight",
    "uSastrugiFreq", "uSastrugiHeight", "uRippleFreq", "uRippleHeight",
    "uDetailStrength", "uGrain", "uDetailRange", "uSnowColor", "uRoughCrust",
    "uRoughSoft", "uSheen", "uSparkle", "uSparkleDensity", "uAO", "uMoonDir",
    "uMoonColor", "uMoonIntensity", "uSkyBounce", "uSkySoft", "uFogDensity",
  );

  const terrainLevels = [];
  const cells = DETAIL_LEVELS[settings.detail];
  LEVEL_SPACINGS.forEach((spacing, levelIndex) => {
    const hole = levelIndex === 0 ? 0 : cells / 4 - 2;
    const isLast = levelIndex === LEVEL_SPACINGS.length - 1;
    const material = new THREE.ShaderMaterial({
      vertexShader: TERRAIN_VERTEX_SHADER,
      fragmentShader: TERRAIN_FRAGMENT_SHADER,
      uniforms: {
        ...terrainUniforms,
        uSpacing: { value: spacing },
        uMorphRange: {
          value: isLast
            ? new THREE.Vector2(1e9, 2e9)
            : new THREE.Vector2(
                0.70 * cells * spacing / 2,
                0.95 * cells * spacing / 2,
              ),
        },
      },
      side: THREE.FrontSide,
      polygonOffset: levelIndex > 0,
      polygonOffsetFactor: levelIndex,
      polygonOffsetUnits: levelIndex * 2,
    });
    const mesh = new THREE.Mesh(buildGridGeometry(cells, spacing, hole), material);
    mesh.frustumCulled = false;
    mesh.userData.spacing = spacing;
    scene.add(mesh);
    terrainLevels.push(mesh);
  });

  const flakeBox = new THREE.Vector3(150, 46, 150);
  const flakePositions = new Float32Array(FLAKE_COUNT * 3);
  const flakeSeeds = new Float32Array(FLAKE_COUNT * 3);
  for (let index = 0; index < FLAKE_COUNT; index += 1) {
    const heightBias = Math.pow(Math.random(), 1.8);
    flakePositions[index * 3] = (Math.random() - 0.5) * flakeBox.x;
    flakePositions[index * 3 + 1] = heightBias * flakeBox.y - flakeBox.y * 0.5;
    flakePositions[index * 3 + 2] = (Math.random() - 0.5) * flakeBox.z;
    flakeSeeds[index * 3] = Math.random();
    flakeSeeds[index * 3 + 1] = Math.random();
    flakeSeeds[index * 3 + 2] = Math.random();
  }
  const flakeGeometry = new THREE.BufferGeometry();
  flakeGeometry.setAttribute(
    "position",
    new THREE.BufferAttribute(flakePositions, 3),
  );
  flakeGeometry.setAttribute("aSeed", new THREE.BufferAttribute(flakeSeeds, 3));
  flakeGeometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e6);

  const flakeMaterial = new THREE.ShaderMaterial({
    uniforms: {
      ...pick(
        "iTime", "uCamPos", "uWindVec", "uFlakeColor", "uFlakeSize",
        "uFallSpeed", "uWindSpeed", "uSnowfall", "uViewportH", "uExposure",
      ),
      uBox: { value: flakeBox },
    },
    vertexShader: /* glsl */ `
      attribute vec3 aSeed;
      uniform float iTime, uFlakeSize, uFallSpeed, uWindSpeed, uViewportH, uSnowfall;
      uniform vec3 uCamPos, uBox;
      uniform vec2 uWindVec;
      varying float vA;

      void main() {
        vec3 point = position;
        float speed = 0.45 + aSeed.x;
        point.y -= iTime * uFallSpeed * speed;
        point.xz += uWindVec * (iTime * uWindSpeed * (0.7 + aSeed.y * 0.7));
        point.x += sin(iTime * 0.9 + aSeed.z * 31.0) * 0.85;
        point.z += cos(iTime * 0.7 + aSeed.z * 17.0) * 0.85;

        vec3 relative = point - uCamPos;
        relative = mod(relative + uBox * 0.5, uBox) - uBox * 0.5;
        vec3 worldPosition = uCamPos + relative;
        vec4 viewPosition = viewMatrix * vec4(worldPosition, 1.0);
        gl_Position = projectionMatrix * viewPosition;

        float distanceValue = max(-viewPosition.z, 0.05);
        gl_PointSize = clamp(
          uFlakeSize * (projectionMatrix[1][1] * 0.5 * uViewportH)
            / distanceValue * 0.02,
          1.0,
          26.0
        );
        float keep = step(aSeed.y, uSnowfall);
        vA = keep * smoothstep(70.0, 14.0, distanceValue)
          * smoothstep(0.5, 2.5, distanceValue)
          * (0.35 + aSeed.x * 0.65);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uFlakeColor;
      varying float vA;
      void main() {
        vec2 centered = gl_PointCoord * 2.0 - 1.0;
        float radiusSquared = dot(centered, centered);
        if (radiusSquared > 1.0 || vA <= 0.001) discard;
        float alpha = 1.0 - radiusSquared;
        alpha *= alpha;
        gl_FragColor = vec4(uFlakeColor * alpha * vA * 0.55, 1.0);
      }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    depthTest: true,
  });
  const spindrift = new THREE.Points(flakeGeometry, flakeMaterial);
  spindrift.frustumCulled = false;
  spindrift.renderOrder = 1;
  scene.add(spindrift);

  const float32 = Math.fround;
  const fract32 = (value) => float32(value - Math.floor(value));

  function gradientHash32(xPosition, yPosition) {
    let x = fract32(float32(xPosition * 0.1031));
    let y = fract32(float32(yPosition * 0.1030));
    let z = fract32(float32(xPosition * 0.0973));
    const dotValue = float32(
      float32(float32(x * float32(y + 33.33)) + float32(y * float32(z + 33.33)))
      + float32(z * float32(x + 33.33)),
    );
    x = float32(x + dotValue);
    y = float32(y + dotValue);
    z = float32(z + dotValue);
    const outputX = float32(float32(fract32(float32(float32(x + y) * z)) * 2) - 1);
    const outputY = float32(float32(fract32(float32(float32(x + z) * y)) * 2) - 1);
    const inverseLength = float32(
      1 / Math.sqrt(Math.max(float32(float32(outputX * outputX) + float32(outputY * outputY)), 1e-4)),
    );
    return [float32(outputX * inverseLength), float32(outputY * inverseLength)];
  }

  function gradientNoise32(xPosition, yPosition) {
    const integerX = Math.floor(xPosition);
    const integerY = Math.floor(yPosition);
    const fractionX = float32(xPosition - integerX);
    const fractionY = float32(yPosition - integerY);
    const smoothX = float32(
      fractionX * fractionX * fractionX
        * (fractionX * (fractionX * 6 - 15) + 10),
    );
    const smoothY = float32(
      fractionY * fractionY * fractionY
        * (fractionY * (fractionY * 6 - 15) + 10),
    );

    const gradient00 = gradientHash32(integerX, integerY);
    const gradient10 = gradientHash32(float32(integerX + 1), integerY);
    const gradient01 = gradientHash32(integerX, float32(integerY + 1));
    const gradient11 = gradientHash32(float32(integerX + 1), float32(integerY + 1));
    const a = float32(float32(gradient00[0] * fractionX) + float32(gradient00[1] * fractionY));
    const b = float32(float32(gradient10[0] * float32(fractionX - 1)) + float32(gradient10[1] * fractionY));
    const c = float32(float32(gradient01[0] * fractionX) + float32(gradient01[1] * float32(fractionY - 1)));
    const d = float32(float32(gradient11[0] * float32(fractionX - 1)) + float32(gradient11[1] * float32(fractionY - 1)));
    const ab = float32(a + float32(smoothX * float32(b - a)));
    const cd = float32(c + float32(smoothX * float32(d - c)));
    return float32(float32(ab + float32(smoothY * float32(cd - ab))) * 1.4);
  }

  function fbm32(xPosition, yPosition) {
    let sum = 0;
    let amplitude = 0.5;
    let normalization = 0;
    let x = xPosition;
    let y = yPosition;
    for (let octave = 0; octave < 4; octave += 1) {
      sum = float32(sum + float32(amplitude * gradientNoise32(x, y)));
      normalization = float32(normalization + amplitude);
      const nextX = float32(float32(float32(0.8 * x) - float32(0.6 * y)) * 2.02);
      const nextY = float32(float32(float32(0.6 * x) + float32(0.8 * y)) * 2.02);
      x = nextX;
      y = nextY;
      amplitude = float32(amplitude * 0.5);
    }
    return float32(sum / normalization);
  }

  function reliefFbm32(xPosition, yPosition) {
    let sum = 0;
    let amplitude = 1;
    let normalization = 0;
    let carry = 1;
    let x = xPosition;
    let y = yPosition;
    for (let octave = 0; octave < 5; octave += 1) {
      let noiseValue = float32(1 - Math.abs(gradientNoise32(x, y)));
      noiseValue = float32(noiseValue * noiseValue);
      sum = float32(sum + float32(float32(amplitude * noiseValue) * carry));
      normalization = float32(normalization + amplitude);
      carry = Math.max(
        0,
        Math.min(1.4, float32(1 + float32(0.65 * float32(float32(noiseValue * 1.6) - 1)))),
      );
      const nextX = float32(float32(float32(0.8 * x) - float32(0.6 * y)) * 2.07);
      const nextY = float32(float32(float32(0.6 * x) + float32(0.8 * y)) * 2.07);
      x = nextX;
      y = nextY;
      amplitude = float32(amplitude * 0.48);
    }
    return float32(sum / normalization);
  }

  function groundHeight(worldX, worldZ) {
    const positionX = float32(worldX + settings.seedX);
    const positionZ = float32(worldZ + settings.seedZ);
    const cosine = Math.cos(settings.windAngle);
    const sine = Math.sin(settings.windAngle);
    const windXPosition = float32(float32(cosine * positionX) + float32(sine * positionZ));
    const windZPosition = float32(float32(-sine * positionX) + float32(cosine * positionZ));

    let reliefX = float32(positionX * settings.reliefFreq);
    let reliefZ = float32(positionZ * settings.reliefFreq);
    const warpX = gradientNoise32(float32(reliefX * 0.5), float32(reliefZ * 0.5));
    const warpZ = gradientNoise32(
      float32(float32(reliefX * 0.5) + 41.7),
      float32(float32(reliefZ * 0.5) + 41.7),
    );
    reliefX = float32(reliefX + float32(warpX * 0.45));
    reliefZ = float32(reliefZ + float32(warpZ * 0.45));
    const peaks = (
      Math.pow(Math.max(reliefFbm32(reliefX, reliefZ), 0), settings.reliefSharp) - 0.22
    ) * settings.reliefHeight;
    const swell = gradientNoise32(
      float32(positionX * settings.swellFreq),
      float32(positionZ * settings.swellFreq),
    ) * settings.swellHeight;
    const dunes = fbm32(
      float32(float32(windXPosition * settings.duneAniso) * settings.duneFreq),
      float32(windZPosition * settings.duneFreq),
    ) * settings.duneHeight;
    return peaks + swell + dunes;
  }

  return {
    settings,
    uniforms,
    terrainLevels,
    spindrift,
    groundHeight,
    setViewportHeight(height) {
      uniforms.uViewportH.value = height;
    },
    update(camera, eyeHeight = 45) {
      uniforms.uCamPos.value.copy(camera.position);
      uniforms.uDetailRange.value = THREE.MathUtils.clamp(eyeHeight * 3, 20, 500);
      for (const mesh of terrainLevels) {
        const doubleSpacing = mesh.userData.spacing * 2;
        mesh.position.set(
          Math.round(camera.position.x / doubleSpacing) * doubleSpacing,
          0,
          Math.round(camera.position.z / doubleSpacing) * doubleSpacing,
        );
        mesh.updateMatrixWorld(true);
      }
    },
    dispose() {
      scene.remove(spindrift);
      flakeGeometry.dispose();
      flakeMaterial.dispose();
      for (const mesh of terrainLevels) {
        scene.remove(mesh);
        mesh.geometry.dispose();
        mesh.material.dispose();
      }
    },
  };
}
