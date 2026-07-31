import * as THREE from "three";

export const POLAR_NIGHT_SETTINGS = Object.freeze({
  dithering: 0.0228,
  filmGrain: 0,
  exposure: 1.08,
  skyDark: "#14213d",
  skyDeep: "#161b35",
  starDensity: 0.085,
  starSize: 0.9193,
  starBlinkRate: 6.26,
  starIntensity: 0.58,
  starColor: "#61fcff",
  starHorizonFade: 0.035,
});

export const QUAD_VERTEX_SHADER = /* glsl */ `
  void main() {
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

export const GRADE_GLSL = /* glsl */ `
  uniform float uDithering;
  uniform float uFilmGrain;
  uniform float uExposure;

  float hashNoise(vec2 seedVal) {
    vec3 p3 = fract(vec3(seedVal.xyx) * 0.1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
  }

  vec3 applyToneMapping(vec3 colorValue) {
    return clamp(
      (colorValue * (2.51 * colorValue + 0.03))
        / (colorValue * (2.43 * colorValue + 0.59) + 0.14),
      0.0,
      1.0
    );
  }

  vec3 grade(vec3 linearColor, vec2 fragmentCoordinate, float timeValue) {
    vec3 colorValue = applyToneMapping(linearColor * uExposure);
    colorValue = pow(colorValue, vec3(0.4545));
    colorValue += (hashNoise(fragmentCoordinate) - 0.5) * uDithering;
    if (uFilmGrain > 0.0) {
      colorValue += (
        hashNoise(fragmentCoordinate + vec2(timeValue * 17.0, -timeValue * 11.0)) - 0.5
      ) * uFilmGrain;
    }
    return colorValue;
  }
`;

const POLAR_NIGHT_GLSL = /* glsl */ `
  uniform vec3  uSkyDark;
  uniform vec3  uSkyDeep;
  uniform float uStarDensity;
  uniform float uStarSize;
  uniform float uStarBlinkRate;
  uniform float uStarIntensity;
  uniform vec3  uStarColor;
  uniform float uStarHorizonFade;

  vec3 renderStarfield(vec3 viewDirection, float timeFlow) {
    float gridScale = 400.0;
    vec3 spaceGrid = floor(viewDirection * gridScale);
    vec3 spaceLocal = fract(viewDirection * gridScale) - 0.5;

    float cellHash = computeHash3(spaceGrid);
    float threshold = 1.0 - (uStarDensity * 0.15);
    float starExistence = step(threshold, cellHash);

    float pixelSize = (gridScale * 1.5) / iResolution.y;
    float radius = min(max(0.08, pixelSize) * uStarSize, 0.5);
    float starGlow = smoothstep(radius, 0.0, length(spaceLocal));
    starGlow *= 0.08 / radius;

    float blinkChance = fract(cellHash * 31.415);
    float isTwinkling = step(0.85, blinkChance);
    float blinkAnimation = 0.3 + 0.7 * sin(
      timeFlow * uStarBlinkRate * (1.5 + blinkChance * 2.0) + cellHash * 100.0
    );
    float twinkleFlow = mix(1.0, blinkAnimation, isTwinkling);

    vec3 starTint = mix(vec3(0.7, 0.85, 1.0), uStarColor, fract(cellHash * 13.0));
    return starTint * starExistence * starGlow * twinkleFlow;
  }

  vec3 paintBackdrop(vec3 viewDirection) {
    return mix(uSkyDark, uSkyDeep, clamp(viewDirection.y * 1.5, 0.0, 1.0));
  }
`;

const COMPOSITE_FRAGMENT_SHADER = /* glsl */ `
  uniform sampler2D uSkyTex;
  uniform vec2 iResolution;
  uniform float iTime;
  ${GRADE_GLSL}

  void main() {
    vec3 sky = texture2D(uSkyTex, gl_FragCoord.xy / iResolution).rgb;
    gl_FragColor = vec4(grade(sky, gl_FragCoord.xy, iTime), 1.0);
  }
`;

const PROBE_DEBUG_FRAGMENT_SHADER = /* glsl */ `
  uniform sampler2D uProbeTex;
  uniform vec2 iResolution;
  uniform float iTime;
  ${GRADE_GLSL}

  void main() {
    vec3 radiance = texture2D(
      uProbeTex,
      gl_FragCoord.xy / iResolution
    ).rgb;
    gl_FragColor = vec4(grade(radiance, gl_FragCoord.xy, iTime), 1.0);
  }
`;

export function createPolarNightSky({
  auroraUniforms,
  auroraGlsl,
  raySteps,
  probeRaySteps,
  skyTexture,
  probeTexture,
  options = {},
}) {
  const settings = { ...POLAR_NIGHT_SETTINGS, ...options };
  const uniforms = {
    ...auroraUniforms,
    uSkyDark: { value: new THREE.Color(settings.skyDark) },
    uSkyDeep: { value: new THREE.Color(settings.skyDeep) },
    uStarDensity: { value: settings.starDensity },
    uStarSize: { value: settings.starSize },
    uStarBlinkRate: { value: settings.starBlinkRate },
    uStarIntensity: { value: settings.starIntensity },
    uStarColor: { value: new THREE.Color(settings.starColor) },
    uStarHorizonFade: { value: settings.starHorizonFade },
    uSkyTex: { value: skyTexture },
    uProbeTex: { value: probeTexture },
    uDithering: { value: settings.dithering },
    uFilmGrain: { value: settings.filmGrain },
    uExposure: { value: settings.exposure },
  };

  const backdropMaterial = new THREE.ShaderMaterial({
    vertexShader: QUAD_VERTEX_SHADER,
    fragmentShader: auroraGlsl + POLAR_NIGHT_GLSL + /* glsl */ `
      void main() {
        vec2 fragmentCoordinate = gl_FragCoord.xy;
        vec2 screenPosition = fragmentCoordinate - iResolution.xy * 0.5;
        float focalLength = (0.5 * iResolution.y) / tan(radians(uFov) * 0.5);
        vec3 sightVector = normalize(
          uCamBasis * vec3(screenPosition, -focalLength)
        );
        float ditherShift = generateRandomFloat(
          fragmentCoordinate + vec2(iTime * 13.0, iTime * 27.0)
        );
        float starFade = smoothstep(-0.02, uStarHorizonFade, sightVector.y);
        vec3 colorValue = paintBackdrop(sightVector);
        colorValue += renderStarfield(sightVector, iTime)
          * uStarIntensity * starFade;
        colorValue += auroraEmission(sightVector, ditherShift);
        gl_FragColor = vec4(colorValue, 1.0);
      }
    `,
    defines: { AURORA_STEPS: Math.round(raySteps) },
    uniforms,
    depthTest: false,
    depthWrite: false,
  });
  const probeBackdropMaterial = new THREE.ShaderMaterial({
    vertexShader: QUAD_VERTEX_SHADER,
    fragmentShader: auroraGlsl + POLAR_NIGHT_GLSL + /* glsl */ `
      void main() {
        vec3 accumulation = vec3(0.0);
        for (int sampleIndex = 0; sampleIndex < 4; sampleIndex++) {
          vec2 offset = vec2(
            sampleIndex == 1 || sampleIndex == 3 ? 0.5 : 0.0,
            sampleIndex >= 2 ? 0.5 : 0.0
          ) - 0.25;
          vec2 probeUv = (gl_FragCoord.xy + offset) / vec2(32.0, 16.0);
          float azimuth = probeUv.x * 6.2831853;
          float elevation = max(probeUv.y, 0.0) * 1.5407;
          vec3 direction = vec3(
            cos(elevation) * cos(azimuth),
            sin(elevation),
            cos(elevation) * sin(azimuth)
          );
          accumulation += paintBackdrop(direction);
          accumulation += auroraEmission(
            direction,
            generateRandomFloat(
              gl_FragCoord.xy + float(sampleIndex) * 3.7
            )
          );
        }
        gl_FragColor = vec4(accumulation * 0.25, 1.0);
      }
    `,
    defines: { AURORA_STEPS: Math.round(probeRaySteps) },
    uniforms,
    depthTest: false,
    depthWrite: false,
  });
  const compositeMaterial = new THREE.ShaderMaterial({
    vertexShader: QUAD_VERTEX_SHADER,
    fragmentShader: COMPOSITE_FRAGMENT_SHADER,
    uniforms,
    depthTest: false,
    depthWrite: false,
  });
  const probeDebugMaterial = new THREE.ShaderMaterial({
    vertexShader: QUAD_VERTEX_SHADER,
    fragmentShader: PROBE_DEBUG_FRAGMENT_SHADER,
    uniforms,
    depthTest: false,
    depthWrite: false,
  });

  return {
    settings,
    uniforms,
    backdropMaterial,
    probeBackdropMaterial,
    compositeMaterial,
    probeDebugMaterial,
    dispose() {
      backdropMaterial.dispose();
      probeBackdropMaterial.dispose();
      compositeMaterial.dispose();
      probeDebugMaterial.dispose();
    },
  };
}
