import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import type { City } from "../types";
import { CITIES } from "../data/cities";
import {
  createOceanTexture,
  latLngToVec3,
  upgradeWithTopoJSON,
} from "../lib/three-globe";

export interface GlobeHoverState {
  city: City | null;
  x: number;
  y: number;
}

interface GlobeProps {
  onCitySelect: (city: City) => void;
  onHoverChange?: (state: GlobeHoverState) => void;
  onZoomingChange?: (zooming: boolean) => void;
  /** Camera Z distance to start at on mount. If less than the rest position
   *  (8), the camera animates outward over 600ms — used for a "zoom out"
   *  transition when arriving back from a city dashboard. */
  initialCameraZ?: number;
  /** When true, the auto-spin in the animation loop is suppressed (the
   *  user can still drag to rotate manually). Read live via a ref so
   *  toggling does not require restarting the Three.js setup. */
  rotationPaused?: boolean;
}

/**
 * Three.js holographic earth with city markers, drag/scroll/click controls,
 * and a 600ms zoom-in transition before notifying the parent of selection.
 */
export default function Globe({
  onCitySelect,
  onHoverChange,
  onZoomingChange,
  initialCameraZ,
  rotationPaused = false,
}: GlobeProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [zoomingIn, setZoomingIn] = useState(false);
  // Tracks whether `upgradeWithTopoJSON` has finished. Until then, the
  // globe is just a smooth blue sphere with no continents. We surface a
  // small "Loading coastlines…" chip while we wait so the screen doesn't
  // look broken on slow networks or first paint.
  const [upgraded, setUpgraded] = useState(false);

  // Live mirror of `rotationPaused` for the animation-loop closure. Updated
  // every render so the loop sees the latest value without us re-running
  // the whole Three.js setup effect.
  const rotationPausedRef = useRef(rotationPaused);
  useEffect(() => {
    rotationPausedRef.current = rotationPaused;
  }, [rotationPaused]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const width = mount.clientWidth;
    const height = mount.clientHeight;
    const aspect = width / height;
    const globeRadius = 2.5;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 1000);
    // Frame the globe so it doesn't dominate narrow/portrait screens. On wide
    // screens the vertical FOV sets the size (BASE_Z); on tall phones the
    // horizontal FOV shrinks, so we pull the camera back to keep the globe's
    // width inside the viewport instead of overflowing the sides.
    const BASE_Z = 7;
    const V_HALF_TAN = Math.tan((45 / 2) * (Math.PI / 180));
    // Keep the globe's diameter within ~90% of the narrower viewport dimension.
    const fitZ = globeRadius / (0.9 * V_HALF_TAN * Math.min(aspect, 1));
    const REST_CAMERA_Z = Math.max(BASE_Z, fitZ);
    // Zoom bounds. Give portrait phones headroom above the (larger) rest
    // distance so pinch-out still has room.
    const MIN_Z = 4;
    const MAX_Z = Math.max(15, REST_CAMERA_Z + 3);
    camera.position.z = initialCameraZ ?? REST_CAMERA_Z;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    mount.appendChild(renderer.domElement);

    const globeGeometry = new THREE.SphereGeometry(globeRadius, 64, 64);
    const globeMaterial = new THREE.MeshBasicMaterial({
      map: createOceanTexture(),
      transparent: true,
      opacity: 0.65,
    });
    const globe = new THREE.Mesh(globeGeometry, globeMaterial);
    scene.add(globe);

    // Async upgrade to higher-fidelity coastlines; failures keep procedural
    // fallback. We flip `upgraded` either way so the loading chip clears —
    // a stuck-open chip would be more confusing than a blue-only globe.
    let cancelled = false;
    upgradeWithTopoJSON(globeMaterial).finally(() => {
      if (!cancelled) setUpgraded(true);
    });

    // Lat/lng grid
    const gridGroup = new THREE.Group();
    const gridMat = new THREE.LineBasicMaterial({
      color: 0x60a5fa,
      transparent: true,
      opacity: 0.28,
    });
    const equatorMat = new THREE.LineBasicMaterial({
      color: 0x93c5fd,
      transparent: true,
      opacity: 0.5,
    });
    for (let latDeg = -75; latDeg <= 75; latDeg += 15) {
      const pts = [];
      for (let i = 0; i <= 96; i++) {
        const lng = -180 + (i / 96) * 360;
        pts.push(latLngToVec3(latDeg, lng, globeRadius * 1.003));
      }
      const geo = new THREE.BufferGeometry().setFromPoints(pts);
      gridGroup.add(new THREE.Line(geo, latDeg === 0 ? equatorMat : gridMat));
    }
    for (let lngDeg = -180; lngDeg < 180; lngDeg += 15) {
      const pts = [];
      for (let i = 0; i <= 96; i++) {
        const lat = -90 + (i / 96) * 180;
        pts.push(latLngToVec3(lat, lngDeg, globeRadius * 1.003));
      }
      const geo = new THREE.BufferGeometry().setFromPoints(pts);
      gridGroup.add(new THREE.Line(geo, lngDeg === 0 ? equatorMat : gridMat));
    }
    scene.add(gridGroup);

    // Atmosphere glow — fresnel-falloff shader so it fades smoothly into the
    // background instead of having a hard outer silhouette.
    const glowGeometry = new THREE.SphereGeometry(globeRadius * 1.22, 64, 64);
    const glowMaterial = new THREE.ShaderMaterial({
      uniforms: {
        glowColor: { value: new THREE.Color(0x38bdf8) },
        intensityScale: { value: 1.6 },
        power: { value: 2.4 },
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vViewDir;
        void main() {
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          vNormal = normalize(normalMatrix * normal);
          vViewDir = normalize(-mvPosition.xyz);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform vec3 glowColor;
        uniform float intensityScale;
        uniform float power;
        varying vec3 vNormal;
        varying vec3 vViewDir;
        void main() {
          // Fresnel: |dot| is high near the globe rim and ~0 at the outer
          // silhouette of the glow sphere, so the ring fades to background.
          float fresnel = pow(abs(dot(vNormal, vViewDir)), power);
          float alpha = clamp(fresnel * intensityScale, 0.0, 1.0);
          gl_FragColor = vec4(glowColor, alpha);
        }
      `,
      side: THREE.BackSide,
      transparent: true,
      depthWrite: false,
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    scene.add(glow);

    scene.add(new THREE.AmbientLight(0xffffff, 0.9));
    const directional = new THREE.DirectionalLight(0xffffff, 0.5);
    directional.position.set(5, 3, 5);
    scene.add(directional);

    // City markers
    const cityGroup = new THREE.Group();
    const cityMeshes: THREE.Mesh[] = [];
    CITIES.forEach((city) => {
      const pos = latLngToVec3(city.lat, city.lng, globeRadius * 1.01);

      const dotGeo = new THREE.SphereGeometry(0.022, 16, 16);
      const dotMat = new THREE.MeshBasicMaterial({ color: 0xfbbf24 });
      const dot = new THREE.Mesh(dotGeo, dotMat);
      dot.position.copy(pos);
      dot.userData = { city };

      const ringGeo = new THREE.RingGeometry(0.035, 0.05, 32);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0xfbbf24,
        transparent: true,
        opacity: 0.5,
        side: THREE.DoubleSide,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.copy(pos);
      ring.lookAt(0, 0, 0);
      ring.userData = {
        city,
        isPulse: true,
        phase: Math.random() * Math.PI * 2,
      };

      cityGroup.add(dot);
      cityGroup.add(ring);
      cityMeshes.push(dot);
    });
    scene.add(cityGroup);

    // Drag rotation
    let isDragging = false;
    let prevX = 0;
    let prevY = 0;
    let rotVelX = 0;
    let rotVelY = 0;
    const targetRotation = { x: 0, y: 0 };
    let currentHoveredCity: City | null = null;
    let zoomAnimating = false;

    // Zoom-out on mount when returning from a city dashboard
    if (initialCameraZ !== undefined && initialCameraZ < REST_CAMERA_Z) {
      zoomAnimating = true;
      const startZ = initialCameraZ;
      const startTime = performance.now();
      const animateZoomOut = () => {
        const elapsed = performance.now() - startTime;
        const t = Math.min(1, elapsed / 600);
        const ease = 1 - Math.pow(1 - t, 3); // easeOutCubic
        camera.position.z = startZ + (REST_CAMERA_Z - startZ) * ease;
        if (t < 1) {
          requestAnimationFrame(animateZoomOut);
        } else {
          zoomAnimating = false;
        }
      };
      animateZoomOut();
    }

    // --- Pointer controls (mouse + touch + pen via Pointer Events) -------
    // Active pointers keyed by pointerId — drives single-finger drag and
    // two-finger pinch-zoom. Touch input is implicitly captured to the
    // canvas on pointerdown, so window-level move/up still fire while a
    // finger or the cursor strays outside the canvas.
    const activePointers = new Map<number, { x: number; y: number }>();
    let pinchPrevDist = 0;
    let wasPinching = false;
    // Tap detection: a pointer that goes down and up near the same spot
    // (no significant drag) is a tap/select rather than a rotate gesture.
    let downX = 0;
    let downY = 0;
    let movedFar = false;
    const TAP_MOVE_THRESHOLD = 6; // CSS px
    // Screen-space pick radii (CSS px). Touch is more forgiving for fingers;
    // mouse/pen is tighter since the cursor is precise. Tune to taste.
    const TOUCH_PICK_RADIUS = 32;
    const MOUSE_PICK_RADIUS = 22;
    // Touch has no hover, so selection is two-step: the first tap on a
    // marker previews it (shows the card); a second tap on the SAME marker
    // confirms and zooms in. Mouse/pen keep the hover + single-click model.
    let touchPreviewCity: City | null = null;

    const ptrDist = (a: { x: number; y: number }, b: { x: number; y: number }) =>
      Math.hypot(a.x - b.x, a.y - b.y);

    /** Raycast at a client position; return the front-facing city mesh or
     *  null (markers on the far side of the globe are rejected). */
    const pickCity = (
      clientX: number,
      clientY: number,
    ): THREE.Object3D | null => {
      const rect = renderer.domElement.getBoundingClientRect();
      const ndc = new THREE.Vector2(
        ((clientX - rect.left) / rect.width) * 2 - 1,
        -((clientY - rect.top) / rect.height) * 2 + 1,
      );
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(ndc, camera);
      const hits = raycaster.intersectObjects(cityMeshes);
      if (hits.length === 0) return null;
      const target = hits[0].object;
      const cityPos = target.getWorldPosition(new THREE.Vector3());
      const camDir = new THREE.Vector3()
        .subVectors(camera.position, new THREE.Vector3(0, 0, 0))
        .normalize();
      if (cityPos.clone().normalize().dot(camDir) <= 0) return null;
      return target;
    };

    /** Nearest front-facing marker within `radiusPx` (screen space) of a
     *  point. Used for touch taps so a fat finger — and clusters of cities
     *  that sit close together — still resolve to the closest marker rather
     *  than needing a pixel-perfect hit on the tiny dot. */
    const pickCityNear = (
      clientX: number,
      clientY: number,
      radiusPx: number,
    ): THREE.Object3D | null => {
      const rect = renderer.domElement.getBoundingClientRect();
      const camDir = new THREE.Vector3()
        .subVectors(camera.position, new THREE.Vector3(0, 0, 0))
        .normalize();
      const v = new THREE.Vector3();
      let best: THREE.Object3D | null = null;
      let bestDist = radiusPx;
      for (const dot of cityMeshes) {
        dot.getWorldPosition(v);
        if (v.clone().normalize().dot(camDir) <= 0) continue; // far side
        v.project(camera); // → NDC (mutates v)
        const sx = rect.left + (v.x * 0.5 + 0.5) * rect.width;
        const sy = rect.top + (-v.y * 0.5 + 0.5) * rect.height;
        const d = Math.hypot(sx - clientX, sy - clientY);
        if (d < bestDist) {
          bestDist = d;
          best = dot;
        }
      }
      return best;
    };

    /** 600ms easeOutCubic zoom-in, then notify the parent of the selection. */
    const zoomToCity = (target: THREE.Object3D, x: number, y: number) => {
      if (zoomAnimating) return;
      zoomAnimating = true;
      setZoomingIn(true);
      onZoomingChange?.(true);
      currentHoveredCity = null;
      touchPreviewCity = null;
      onHoverChange?.({ city: null, x, y });

      const startZ = camera.position.z;
      const targetZ = 3.5;
      const startTime = performance.now();
      const animateZoom = () => {
        const elapsed = performance.now() - startTime;
        const t = Math.min(1, elapsed / 600);
        const ease = 1 - Math.pow(1 - t, 3);
        camera.position.z = startZ + (targetZ - startZ) * ease;
        if (t < 1) {
          requestAnimationFrame(animateZoom);
        } else {
          onCitySelect(target.userData.city as City);
        }
      };
      animateZoom();
    };

    const onPointerDown = (e: PointerEvent) => {
      activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (activePointers.size === 1) {
        isDragging = true;
        wasPinching = false;
        movedFar = false;
        prevX = e.clientX;
        prevY = e.clientY;
        downX = e.clientX;
        downY = e.clientY;
      } else if (activePointers.size === 2) {
        // Second finger down → switch from drag to pinch.
        isDragging = false;
        wasPinching = true;
        const pts = [...activePointers.values()];
        pinchPrevDist = ptrDist(pts[0], pts[1]);
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      if (activePointers.has(e.pointerId)) {
        activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      }

      // Pinch-zoom takes over whenever two pointers are down.
      if (activePointers.size >= 2) {
        const pts = [...activePointers.values()];
        const d = ptrDist(pts[0], pts[1]);
        if (pinchPrevDist > 0) {
          // Pinch out (distance grows) → camera moves closer (smaller z).
          camera.position.z -= (d - pinchPrevDist) * 0.01;
          camera.position.z = Math.max(MIN_Z, Math.min(MAX_Z, camera.position.z));
        }
        pinchPrevDist = d;
        return;
      }

      if (isDragging) {
        const dx = e.clientX - prevX;
        const dy = e.clientY - prevY;
        rotVelY = dx * 0.005;
        rotVelX = dy * 0.005;
        targetRotation.y += rotVelY;
        targetRotation.x += rotVelX;
        targetRotation.x = Math.max(
          -Math.PI / 2.2,
          Math.min(Math.PI / 2.2, targetRotation.x),
        );
        prevX = e.clientX;
        prevY = e.clientY;
        if (
          Math.hypot(e.clientX - downX, e.clientY - downY) > TAP_MOVE_THRESHOLD
        ) {
          movedFar = true;
        }
      }

      // Hover preview is a mouse/pen affordance only — touch uses tap.
      if (e.pointerType !== "touch") {
        const target = pickCityNear(e.clientX, e.clientY, MOUSE_PICK_RADIUS);
        if (target) {
          currentHoveredCity = target.userData.city as City;
          onHoverChange?.({
            city: currentHoveredCity,
            x: e.clientX,
            y: e.clientY,
          });
          renderer.domElement.style.cursor = "pointer";
        } else {
          currentHoveredCity = null;
          onHoverChange?.({ city: null, x: e.clientX, y: e.clientY });
          renderer.domElement.style.cursor = isDragging ? "grabbing" : "grab";
        }
      }
    };

    const onPointerUp = (e: PointerEvent) => {
      const wasTap =
        activePointers.size === 1 &&
        !movedFar &&
        !wasPinching &&
        !zoomAnimating;
      activePointers.delete(e.pointerId);

      // One finger lifted from a pinch → resume single-finger drag cleanly
      // from the remaining pointer so the globe doesn't jump.
      if (activePointers.size === 1) {
        const [p] = [...activePointers.values()];
        prevX = p.x;
        prevY = p.y;
        isDragging = true;
        return;
      }
      if (activePointers.size === 0) {
        isDragging = false;
        wasPinching = false;
      }

      if (!wasTap) return;

      if (e.pointerType === "touch") {
        // Fat-finger friendly: nearest marker within the touch radius wins.
        const target = pickCityNear(e.clientX, e.clientY, TOUCH_PICK_RADIUS);
        if (target) {
          const city = target.userData.city as City;
          if (touchPreviewCity && touchPreviewCity.id === city.id) {
            zoomToCity(target, e.clientX, e.clientY); // second tap → confirm
          } else {
            touchPreviewCity = city; // first tap → preview the card
            // Mark as hovered so the animation loop halts the auto-spin and
            // highlights the marker while the card is showing.
            currentHoveredCity = city;
            onHoverChange?.({ city, x: e.clientX, y: e.clientY });
          }
        } else {
          touchPreviewCity = null; // tap empty space → dismiss preview
          currentHoveredCity = null; // …and let the globe resume spinning
          onHoverChange?.({ city: null, x: e.clientX, y: e.clientY });
        }
      } else {
        const target = pickCityNear(e.clientX, e.clientY, MOUSE_PICK_RADIUS);
        if (target) zoomToCity(target, e.clientX, e.clientY); // mouse/pen click
      }
    };

    const onPointerCancel = (e: PointerEvent) => {
      activePointers.delete(e.pointerId);
      if (activePointers.size === 0) {
        isDragging = false;
        wasPinching = false;
      }
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      camera.position.z += e.deltaY * 0.005;
      // Lower bound is a tiny positive number — just enough to keep the
      // camera from crossing the origin (which would flip the view); the
      // user can otherwise zoom in past the globe surface freely.
      camera.position.z = Math.max(MIN_Z, Math.min(MAX_Z, camera.position.z));
    };

    // touch-action:none stops the browser from scrolling/zooming the page
    // while the user is dragging or pinching the globe.
    renderer.domElement.style.touchAction = "none";
    renderer.domElement.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerCancel);
    renderer.domElement.addEventListener("wheel", onWheel, { passive: false });

    // Animation loop
    let frameId = 0;
    const clock = new THREE.Clock();
    const animate = () => {
      const t = clock.getElapsedTime();
      if (!isDragging) {
        rotVelY *= 0.95;
        rotVelX *= 0.95;
        if (
          !currentHoveredCity &&
          !zoomAnimating &&
          !rotationPausedRef.current
        ) {
          targetRotation.y += 0.0008;
        }
      }
      globe.rotation.y = targetRotation.y;
      globe.rotation.x = targetRotation.x;
      gridGroup.rotation.y = targetRotation.y;
      gridGroup.rotation.x = targetRotation.x;
      cityGroup.rotation.y = targetRotation.y;
      cityGroup.rotation.x = targetRotation.x;

      cityGroup.children.forEach((child) => {
        if (child.userData.isPulse) {
          const phase = (t * 1.0 + child.userData.phase) % (Math.PI * 2);
          const scale = 1 + Math.sin(phase) * 0.4;
          child.scale.set(scale, scale, scale);
          const mat = (child as THREE.Mesh).material as THREE.MeshBasicMaterial;
          mat.opacity = 0.5 - Math.sin(phase) * 0.3;
        }
      });

      cityMeshes.forEach((dot) => {
        const isHov =
          currentHoveredCity && dot.userData.city.id === currentHoveredCity.id;
        const targetScale = isHov ? 1.6 : 1;
        dot.scale.x += (targetScale - dot.scale.x) * 0.2;
        dot.scale.y = dot.scale.x;
        dot.scale.z = dot.scale.x;
        (dot.material as THREE.MeshBasicMaterial).color.setHex(
          isHov ? 0xef4444 : 0xfbbf24, // red-500 when selected, amber otherwise
        );
      });

      renderer.render(scene, camera);
      frameId = requestAnimationFrame(animate);
    };
    animate();

    const onResize = () => {
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelled = true;
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", onResize);
      renderer.domElement.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerCancel);
      renderer.domElement.removeEventListener("wheel", onWheel);
      mount.removeChild(renderer.domElement);
      renderer.dispose();
      globeGeometry.dispose();
      globeMaterial.dispose();
      glowGeometry.dispose();
      glowMaterial.dispose();
      gridMat.dispose();
      equatorMat.dispose();
      gridGroup.children.forEach((line) =>
        (line as THREE.Line).geometry.dispose(),
      );
    };
    // initialCameraZ is intentionally excluded — we capture it once on mount
    // so route state changes don't re-run the whole Three.js setup.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onCitySelect, onHoverChange, onZoomingChange]);

  return (
    <div className="relative w-full h-full">
      <div
        ref={mountRef}
        className="w-full h-full transition-all duration-700 ease-out"
        style={{
          cursor: "grab",
          filter: zoomingIn ? "blur(20px) brightness(0.4)" : "none",
        }}
      />

      {/* "Loading coastlines…" chip — shown while `upgradeWithTopoJSON`
          is in flight (typically ~200–600 ms). Fades out smoothly when
          the texture swap completes (or fails — failure leaves the blue
          sphere, but we still clear the chip so the UI doesn't hang).
          Positioned high enough to clear the bottom "DRAG TO ROTATE" hint
          but low enough not to fight the page header. */}
      <div
        className={`absolute left-1/2 -translate-x-1/2 bottom-20 sm:bottom-24 pointer-events-none transition-opacity duration-500 ${
          upgraded || zoomingIn ? "opacity-0" : "opacity-100"
        }`}
        aria-live="polite"
      >
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/70 backdrop-blur-md border border-white/50 text-blue-700/85 text-xs shadow-[0_4px_14px_-4px_rgba(30,58,138,0.25)]">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-70 animate-ping" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500" />
          </span>
          <span>Loading coastlines…</span>
        </div>
      </div>
    </div>
  );
}
