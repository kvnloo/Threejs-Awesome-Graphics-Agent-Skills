import {
  AerialPerspectiveEffect,
  CLOUD_SHAPE_DETAIL_TEXTURE_SIZE,
  CLOUD_SHAPE_TEXTURE_SIZE,
  CloudsEffect,
  DitheringEffect,
  EffectComposer,
  EffectPass,
  Ellipsoid,
  Geodetic,
  LensFlareEffect,
  NormalPass,
  PrecomputedTexturesLoader,
  RenderPass,
  STBNLoader,
  ToneMappingEffect,
  ToneMappingMode,
  createData3DTextureLoaderClass,
  getSunDirectionECEF,
  parseUint8Array,
  radians,
} from "/skills/threejs-volumetric-clouds/examples/weather-volume-clouds/cloud-effect.js";

const date = new Date("2000-06-01T10:00:00Z");
const geodetic = new Geodetic(0, radians(67), 500);
const position = geodetic.toECEF();
const up = Ellipsoid.WGS84.getSurfaceNormal(position);

export default {
  renderer: {
    options: {
      antialias: false,
      depth: false,
      logarithmicDepthBuffer: false,
    },
    toneMapping: 0,
    exposure: 10,
    clearColor: 0x000000,
  },
  camera: {
    fov: 75,
    near: 10,
    far: 1e6,
  },
  controls: {
    minDistance: 1e3,
    maxDistance: 2.5e5,
    enablePan: true,
  },

  async setup({ THREE, renderer, scene, camera, controls }) {
    const ellipsoid = Ellipsoid.WGS84;
    const minDistance = 1e3;
    const maxDistance = 2.5e5;
    const targetHeight = 380;
    const minCameraClearance = 25;
    const minElevation = THREE.MathUtils.degToRad(2.5);
    const maxElevation = THREE.MathUtils.degToRad(88);
    const rotateSpeed = 0.005;
    const panSpeed = 1.0;
    const zoomSpeed = 0.0015;

    const target = position.clone();
    const surface = new THREE.Vector3();
    const east = new THREE.Vector3();
    const north = new THREE.Vector3();
    const localUp = up.clone();
    const cameraRight = new THREE.Vector3();
    const cameraGroundUp = new THREE.Vector3();
    const panDelta = new THREE.Vector3();
    const panCandidate = new THREE.Vector3();
    const surfaceScratch = new THREE.Vector3();
    const normalScratch = new THREE.Vector3();
    const offsetScratch = new THREE.Vector3();
    const pointerScratchA = new THREE.Vector2();
    const pointerScratchB = new THREE.Vector2();

    let disposed = false;
    let distance = 7000;
    let azimuth = Math.atan2(2500, -7500);
    let elevation = THREE.MathUtils.degToRad(10);
    let originalControlsUpdate = null;
    let originalControlsEnabled = null;
    let previousTouchCenter = null;
    let previousTouchDistance = 0;

    const activePointers = new Map();
    const dragState = {
      pointerId: null,
      mode: null,
      x: 0,
      y: 0,
    };

    function clamp(value, min, max) {
      return Math.min(Math.max(value, min), max);
    }

    function projectToSurface(worldPosition, result = surfaceScratch) {
      return ellipsoid.projectOnSurface(worldPosition, result);
    }

    function updateLocalFrame() {
      const projected = projectToSurface(target, surface);
      if (!projected) return;
      ellipsoid.getEastNorthUpVectors(projected, east, north, localUp);
    }

    function setTargetFromSurfacePoint(surfacePoint) {
      ellipsoid.getSurfaceNormal(surfacePoint, normalScratch);
      target.copy(surfacePoint).addScaledVector(normalScratch, targetHeight);
      updateLocalFrame();
    }

    function setTargetFromWorldPoint(worldPoint) {
      const projected = projectToSurface(worldPoint, surfaceScratch);
      if (!projected) return;
      setTargetFromSurfacePoint(projected);
    }

    function keepCameraAboveSurface() {
      const projected = projectToSurface(camera.position, surfaceScratch);
      if (!projected) return;

      ellipsoid.getSurfaceNormal(projected, normalScratch);
      const clearance = offsetScratch.copy(camera.position).sub(projected).dot(normalScratch);
      if (clearance >= minCameraClearance) return;

      camera.position.addScaledVector(normalScratch, minCameraClearance - clearance);
    }

    function applyCamera() {
      if (disposed) return;

      updateLocalFrame();
      elevation = clamp(elevation, minElevation, maxElevation);
      distance = clamp(distance, minDistance, maxDistance);

      const horizontalDistance = Math.cos(elevation) * distance;
      camera.position
        .copy(target)
        .addScaledVector(north, Math.cos(azimuth) * horizontalDistance)
        .addScaledVector(east, Math.sin(azimuth) * horizontalDistance)
        .addScaledVector(localUp, Math.sin(elevation) * distance);

      keepCameraAboveSurface();
      camera.up.copy(localUp);
      camera.lookAt(target);
      camera.updateProjectionMatrix();
      camera.updateMatrixWorld();
    }

    function getWorldUnitsPerPixel() {
      const fallbackSize = renderer.getSize(new THREE.Vector2());
      const height = renderer.domElement?.clientHeight || fallbackSize.height || 1;
      return (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov) * 0.5) * distance) / height;
    }

    function updateGroundPanAxes() {
      cameraRight.setFromMatrixColumn(camera.matrixWorld, 0);
      cameraRight.addScaledVector(localUp, -cameraRight.dot(localUp));
      if (cameraRight.lengthSq() < 1e-8) {
        cameraRight.copy(east);
      } else {
        cameraRight.normalize();
      }

      cameraGroundUp.setFromMatrixColumn(camera.matrixWorld, 1);
      cameraGroundUp.addScaledVector(localUp, -cameraGroundUp.dot(localUp));
      if (cameraGroundUp.lengthSq() < 1e-8) {
        cameraGroundUp.copy(north);
      } else {
        cameraGroundUp.normalize();
      }
    }

    function panByScreenDelta(deltaX, deltaY) {
      updateGroundPanAxes();
      const scale = getWorldUnitsPerPixel() * panSpeed;
      panDelta
        .set(0, 0, 0)
        .addScaledVector(cameraRight, -deltaX * scale)
        .addScaledVector(cameraGroundUp, deltaY * scale);

      panCandidate.copy(target).add(panDelta);
      setTargetFromWorldPoint(panCandidate);
      applyCamera();
    }

    function orbitByScreenDelta(deltaX, deltaY) {
      azimuth += deltaX * rotateSpeed;
      elevation = clamp(elevation + deltaY * rotateSpeed, minElevation, maxElevation);
      applyCamera();
    }

    function zoomByScale(scale) {
      distance = clamp(distance * scale, minDistance, maxDistance);
      applyCamera();
    }

    function getPointerMode(event) {
      if (event.pointerType === "touch") return "touch";
      if (event.button === 1 || event.button === 2) return "pan";
      if (event.button === 0 && (event.shiftKey || event.ctrlKey || event.metaKey)) return "pan";
      return "orbit";
    }

    function setPointerFromEvent(event) {
      activePointers.set(event.pointerId, {
        x: event.clientX,
        y: event.clientY,
        pointerType: event.pointerType,
      });
    }

    function getTwoTouchInfo() {
      const touches = [...activePointers.values()].filter((pointer) => pointer.pointerType === "touch");
      if (touches.length < 2) return null;

      pointerScratchA.set(touches[0].x, touches[0].y);
      pointerScratchB.set(touches[1].x, touches[1].y);
      const center = pointerScratchA.clone().add(pointerScratchB).multiplyScalar(0.5);
      const distancePixels = pointerScratchA.distanceTo(pointerScratchB);
      return { center, distancePixels };
    }

    function resetTouchGesture() {
      const info = getTwoTouchInfo();
      previousTouchCenter = info ? info.center : null;
      previousTouchDistance = info ? info.distancePixels : 0;
    }

    function onPointerDown(event) {
      if (disposed) return;

      setPointerFromEvent(event);

      if (event.pointerType === "touch" && activePointers.size >= 2) {
        resetTouchGesture();
      } else if (event.pointerType !== "touch") {
        dragState.pointerId = event.pointerId;
        dragState.mode = getPointerMode(event);
        dragState.x = event.clientX;
        dragState.y = event.clientY;
      } else {
        dragState.pointerId = event.pointerId;
        dragState.mode = "orbit";
        dragState.x = event.clientX;
        dragState.y = event.clientY;
      }

      renderer.domElement.setPointerCapture?.(event.pointerId);
      event.preventDefault();
    }

    function onPointerMove(event) {
      if (disposed || !activePointers.has(event.pointerId)) return;

      const previous = activePointers.get(event.pointerId);
      setPointerFromEvent(event);

      if (event.pointerType === "touch" && activePointers.size >= 2) {
        const info = getTwoTouchInfo();
        if (!info) return;

        if (previousTouchCenter) {
          panByScreenDelta(
            info.center.x - previousTouchCenter.x,
            info.center.y - previousTouchCenter.y,
          );
        }
        if (previousTouchDistance > 0 && info.distancePixels > 0) {
          zoomByScale(previousTouchDistance / info.distancePixels);
        }

        previousTouchCenter = info.center;
        previousTouchDistance = info.distancePixels;
        event.preventDefault();
        return;
      }

      if (dragState.pointerId !== event.pointerId) return;

      const deltaX = event.clientX - dragState.x;
      const deltaY = event.clientY - dragState.y;
      dragState.x = event.clientX;
      dragState.y = event.clientY;

      if (dragState.mode === "pan") {
        panByScreenDelta(deltaX, deltaY);
      } else {
        orbitByScreenDelta(deltaX, deltaY);
      }

      if (!previous || previous.x !== event.clientX || previous.y !== event.clientY) {
        event.preventDefault();
      }
    }

    function onPointerUp(event) {
      activePointers.delete(event.pointerId);
      renderer.domElement.releasePointerCapture?.(event.pointerId);

      if (dragState.pointerId === event.pointerId) {
        dragState.pointerId = null;
        dragState.mode = null;
      }

      resetTouchGesture();
      event.preventDefault();
    }

    function onWheel(event) {
      if (disposed) return;
      zoomByScale(Math.exp(event.deltaY * zoomSpeed));
      event.preventDefault();
    }

    function onContextMenu(event) {
      event.preventDefault();
    }

    function installSurfaceControls() {
      const element = renderer.domElement;

      if (controls) {
        originalControlsEnabled = controls.enabled;
        originalControlsUpdate = controls.update?.bind(controls) ?? null;
        controls.enabled = false;
        controls.enablePan = false;
        controls.enableRotate = false;
        controls.enableZoom = false;
        controls.update = () => false;
      }

      element.style.touchAction = "none";
      element.addEventListener("pointerdown", onPointerDown, { passive: false });
      element.addEventListener("pointermove", onPointerMove, { passive: false });
      element.addEventListener("pointerup", onPointerUp, { passive: false });
      element.addEventListener("pointercancel", onPointerUp, { passive: false });
      element.addEventListener("lostpointercapture", onPointerUp, { passive: false });
      element.addEventListener("wheel", onWheel, { passive: false });
      element.addEventListener("contextmenu", onContextMenu, { passive: false });
    }

    function uninstallSurfaceControls() {
      const element = renderer.domElement;
      element.removeEventListener("pointerdown", onPointerDown);
      element.removeEventListener("pointermove", onPointerMove);
      element.removeEventListener("pointerup", onPointerUp);
      element.removeEventListener("pointercancel", onPointerUp);
      element.removeEventListener("lostpointercapture", onPointerUp);
      element.removeEventListener("wheel", onWheel);
      element.removeEventListener("contextmenu", onContextMenu);

      if (controls) {
        controls.enabled = originalControlsEnabled ?? true;
        controls.update = originalControlsUpdate ?? controls.update;
      }
    }

    setTargetFromWorldPoint(position);
    applyCamera();
    installSurfaceControls();

    renderer.toneMapping = THREE.NoToneMapping;
    renderer.toneMappingExposure = 10;

    const aerialPerspective = new AerialPerspectiveEffect(camera);
    aerialPerspective.sky = true;
    aerialPerspective.sunIrradiance = true;
    aerialPerspective.skyIrradiance = true;

    const normalPass = new NormalPass(scene, camera);
    aerialPerspective.normalBuffer = normalPass.texture;

    const clouds = new CloudsEffect(camera);
    clouds.coverage = 0.4;
    clouds.localWeatherVelocity.set(0.001, 0);

    clouds.events.addEventListener("change", (event) => {
      if (event.property === "atmosphereOverlay") {
        aerialPerspective.overlay = clouds.atmosphereOverlay;
      } else if (event.property === "atmosphereShadow") {
        aerialPerspective.shadow = clouds.atmosphereShadow;
      } else if (event.property === "atmosphereShadowLength") {
        aerialPerspective.shadowLength = clouds.atmosphereShadowLength;
      }
    });

    const sunDirection = new THREE.Vector3();
    getSunDirectionECEF(date, sunDirection);
    aerialPerspective.sunDirection.copy(sunDirection);
    clouds.sunDirection.copy(sunDirection);

    const composer = new EffectComposer(renderer, {
      frameBufferType: THREE.HalfFloatType,
      multisampling: 0,
    });
    composer.addPass(new RenderPass(scene, camera));
    composer.addPass(normalPass);
    composer.addPass(new EffectPass(camera, clouds, aerialPerspective));
    composer.addPass(
      new EffectPass(
        camera,
        new LensFlareEffect(),
        new ToneMappingEffect({ mode: ToneMappingMode.AGX }),
        new DitheringEffect(),
      ),
    );

    const [
      precomputedTextures,
      localWeatherTexture,
      shapeTexture,
      shapeDetailTexture,
      turbulenceTexture,
      stbnTexture,
    ] = await Promise.all([
      loadPrecomputedAtmosphere(renderer),
      loadLocalWeather(THREE),
      loadShapeTexture(THREE),
      loadShapeDetailTexture(THREE),
      loadTurbulence(THREE),
      loadSTBNTexture(),
    ]);

    Object.assign(aerialPerspective, precomputedTextures);
    Object.assign(clouds, precomputedTextures);
    clouds.localWeatherTexture = localWeatherTexture;
    clouds.shapeTexture = shapeTexture;
    clouds.shapeDetailTexture = shapeDetailTexture;
    clouds.turbulenceTexture = turbulenceTexture;
    aerialPerspective.stbnTexture = stbnTexture;
    clouds.stbnTexture = stbnTexture;

    function applyDebugMode(modeName) {
      clouds.coverage = modeName === "atmosphere-only" ? 0 : 0.4;
      clouds.temporalUpscale = modeName !== "native-resolution";
      clouds.shapeDetail = modeName !== "no-detail";
      clouds.turbulence = modeName !== "no-turbulence";
      aerialPerspective.sky = modeName !== "clouds-only";
      aerialPerspective.sunIrradiance = modeName !== "clouds-only";
      aerialPerspective.skyIrradiance = modeName !== "clouds-only";
      aerialPerspective.transmittance = modeName !== "clouds-only";
      aerialPerspective.inscatter = modeName !== "clouds-only";
    }

    applyDebugMode("final");

    return {
      setDebugMode(modeName) {
        applyDebugMode(modeName);
      },
      resize({ width, height }) {
        composer.setSize(width, height);
      },
      update() {
        applyCamera();
      },
      render() {
        composer.render();
      },
      metrics() {
        const scale = clouds.temporalUpscale ? "temporal upscale" : "native";
        return {
          tier:
            `${CLOUD_SHAPE_TEXTURE_SIZE}^3 shape / ` +
            `${CLOUD_SHAPE_DETAIL_TEXTURE_SIZE}^3 detail / ${scale}`,
          controls: "terrain-safe surface orbit controls",
        };
      },
      dispose() {
        disposed = true;
        uninstallSurfaceControls();
        composer.dispose();
        localWeatherTexture.dispose();
        shapeTexture.dispose();
        shapeDetailTexture.dispose();
        turbulenceTexture.dispose();
        stbnTexture.dispose();
        for (const texture of Object.values(precomputedTextures)) {
          texture.dispose();
        }
      },
    };
  },
};

function loadPrecomputedAtmosphere(renderer) {
  return new Promise((resolve, reject) => {
    new PrecomputedTexturesLoader().load(
      "/skills/threejs-volumetric-clouds/assets/weather-volume-clouds/atmosphere",
      resolve,
      undefined,
      reject,
    );
  });
}

function loadLocalWeather(THREE) {
  return new Promise((resolve, reject) => {
    new THREE.TextureLoader().load(
      "/skills/threejs-volumetric-clouds/assets/weather-volume-clouds/local_weather.png",
      (texture) => {
        texture.minFilter = THREE.LinearMipMapLinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.colorSpace = THREE.NoColorSpace;
        texture.needsUpdate = true;
        resolve(texture);
      },
      undefined,
      reject,
    );
  });
}

function loadShapeTexture(THREE) {
  return new Promise((resolve, reject) => {
    const Loader = createData3DTextureLoaderClass(parseUint8Array, {
      width: CLOUD_SHAPE_TEXTURE_SIZE,
      height: CLOUD_SHAPE_TEXTURE_SIZE,
      depth: CLOUD_SHAPE_TEXTURE_SIZE,
    });
    new Loader().load(
      "/skills/threejs-volumetric-clouds/assets/weather-volume-clouds/shape.bin",
      (texture) => {
        texture.format = THREE.RedFormat;
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.wrapR = THREE.RepeatWrapping;
        texture.colorSpace = THREE.NoColorSpace;
        texture.needsUpdate = true;
        resolve(texture);
      },
      undefined,
      reject,
    );
  });
}

function loadShapeDetailTexture(THREE) {
  return new Promise((resolve, reject) => {
    const Loader = createData3DTextureLoaderClass(parseUint8Array, {
      width: CLOUD_SHAPE_DETAIL_TEXTURE_SIZE,
      height: CLOUD_SHAPE_DETAIL_TEXTURE_SIZE,
      depth: CLOUD_SHAPE_DETAIL_TEXTURE_SIZE,
    });
    new Loader().load(
      "/skills/threejs-volumetric-clouds/assets/weather-volume-clouds/shape_detail.bin",
      (texture) => {
        texture.format = THREE.RedFormat;
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.wrapR = THREE.RepeatWrapping;
        texture.colorSpace = THREE.NoColorSpace;
        texture.needsUpdate = true;
        resolve(texture);
      },
      undefined,
      reject,
    );
  });
}

function loadTurbulence(THREE) {
  return new Promise((resolve, reject) => {
    new THREE.TextureLoader().load(
      "/skills/threejs-volumetric-clouds/assets/weather-volume-clouds/turbulence.png",
      (texture) => {
        texture.minFilter = THREE.LinearMipMapLinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.colorSpace = THREE.NoColorSpace;
        texture.needsUpdate = true;
        resolve(texture);
      },
      undefined,
      reject,
    );
  });
}

function loadSTBNTexture() {
  return new Promise((resolve, reject) => {
    new STBNLoader().load(
      "/skills/threejs-volumetric-clouds/assets/weather-volume-clouds/stbn.bin",
      resolve,
      undefined,
      reject,
    );
  });
}
