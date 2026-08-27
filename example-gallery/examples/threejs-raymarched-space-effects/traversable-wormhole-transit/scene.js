import { createTraversableWormholeTransitEffect } from
  "/skills/threejs-raymarched-space-effects/examples/traversable-wormhole-transit/wormhole-effect.js";

// The effect carries its own observer through the throat, so this adapter binds
// raw input rather than an orbit rig: drag to look, W/A/S/D to fly, shift to
// sprint, wheel to zoom. Nothing in the scene moves on its own; hold still and
// the frame converges.
const MOVEMENT_KEYS = {
  w: ["forward", 1],
  s: ["forward", -1],
  d: ["right", 1],
  a: ["right", -1],
};

export default {
  renderer: {
    options: {
      antialias: false,
      alpha: false,
      powerPreference: "high-performance",
    },
    toneMapping: 0,
    exposure: 1,
    clearColor: 0x000000,
  },
  camera: {
    fov: 50,
    near: 0.01,
    far: 100,
    position: [0, 0, 0],
  },
  controls: { enabled: false },

  setup({ canvas }) {
    const effect = createTraversableWormholeTransitEffect();
    const pressed = Object.create(null);
    let dragging = false;
    let lastX = 0;
    let lastY = 0;

    canvas.style.cursor = "grab";
    canvas.style.touchAction = "none";

    const onPointerDown = (event) => {
      dragging = true;
      lastX = event.clientX;
      lastY = event.clientY;
      canvas.style.cursor = "grabbing";
      canvas.setPointerCapture(event.pointerId);
    };
    const onPointerUp = (event) => {
      dragging = false;
      canvas.style.cursor = "grab";
      try {
        canvas.releasePointerCapture(event.pointerId);
      } catch {
        // the pointer was already released
      }
    };
    const onPointerMove = (event) => {
      if (!dragging) return;
      effect.look(event.clientX - lastX, event.clientY - lastY);
      lastX = event.clientX;
      lastY = event.clientY;
    };
    const onWheel = (event) => {
      event.preventDefault();
      effect.zoom(event.deltaY);
    };
    const onKeyDown = (event) => {
      pressed[event.key.toLowerCase()] = true;
    };
    const onKeyUp = (event) => {
      pressed[event.key.toLowerCase()] = false;
    };
    const onBlur = () => {
      for (const key of Object.keys(pressed)) pressed[key] = false;
      dragging = false;
      canvas.style.cursor = "grab";
    };

    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointercancel", onPointerUp);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);

    return {
      resize({ bufferWidth, bufferHeight }) {
        effect.setSize(bufferWidth, bufferHeight);
      },
      setDebugMode(mode) {
        effect.setDebugMode(mode);
      },
      update({ delta }) {
        let forward = 0;
        let right = 0;
        for (const [key, [axis, direction]] of Object.entries(MOVEMENT_KEYS)) {
          if (!pressed[key]) continue;
          if (axis === "forward") forward += direction;
          else right += direction;
        }
        effect.update(delta, {
          forward: Math.sign(forward),
          right: Math.sign(right),
          boost: Boolean(pressed.shift),
        });
      },
      render({ renderer }) {
        effect.render(renderer);
      },
      metrics() {
        return {
          tier: "1024-step adaptive RK4 at 0.65x",
          samples: `${effect.accumulatedSamples}/512`,
          observer: `${effect.universe} l=${effect.radialCoordinate.toFixed(2)}`,
        };
      },
      dispose() {
        canvas.removeEventListener("pointerdown", onPointerDown);
        canvas.removeEventListener("pointerup", onPointerUp);
        canvas.removeEventListener("pointercancel", onPointerUp);
        canvas.removeEventListener("pointermove", onPointerMove);
        canvas.removeEventListener("wheel", onWheel);
        window.removeEventListener("keydown", onKeyDown);
        window.removeEventListener("keyup", onKeyUp);
        window.removeEventListener("blur", onBlur);
        canvas.style.cursor = "";
        effect.dispose();
      },
    };
  },
};
