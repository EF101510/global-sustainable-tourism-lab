import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import type { City } from '../types';
import { CITIES } from '../data/cities';
import {
  createOceanTexture,
  latLngToVec3,
  upgradeWithTopoJSON,
} from '../lib/three-globe';

export interface GlobeHoverState {
  city: City | null;
  x: number;
  y: number;
}

interface GlobeProps {
  onCitySelect: (city: City) => void;
  onHoverChange?: (state: GlobeHoverState) => void;
  onZoomingChange?: (zooming: boolean) => void;
}

/**
 * Three.js holographic earth with city markers, drag/scroll/click controls,
 * and a 600ms zoom-in transition before notifying the parent of selection.
 */
export default function Globe({
  onCitySelect,
  onHoverChange,
  onZoomingChange,
}: GlobeProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [zoomingIn, setZoomingIn] = useState(false);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const width = mount.clientWidth;
    const height = mount.clientHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.z = 8;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    mount.appendChild(renderer.domElement);

    const globeRadius = 2.5;
    const globeGeometry = new THREE.SphereGeometry(globeRadius, 64, 64);
    const globeMaterial = new THREE.MeshBasicMaterial({
      map: createOceanTexture(),
      transparent: true,
      opacity: 0.65,
    });
    const globe = new THREE.Mesh(globeGeometry, globeMaterial);
    scene.add(globe);

    // Async upgrade to higher-fidelity coastlines; failures keep procedural fallback.
    void upgradeWithTopoJSON(globeMaterial);

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
      ring.userData = { city, isPulse: true, phase: Math.random() * Math.PI * 2 };

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

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      prevX = e.clientX;
      prevY = e.clientY;
    };
    const onMouseUp = () => {
      isDragging = false;
    };

    const onMouseMove = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      if (isDragging) {
        const dx = e.clientX - prevX;
        const dy = e.clientY - prevY;
        rotVelY = dx * 0.005;
        rotVelX = dy * 0.005;
        targetRotation.y += rotVelY;
        targetRotation.x += rotVelX;
        targetRotation.x = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, targetRotation.x));
        prevX = e.clientX;
        prevY = e.clientY;
      }

      const mouseNDC = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1
      );
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouseNDC, camera);
      const intersects = raycaster.intersectObjects(cityMeshes);
      if (intersects.length > 0) {
        const target = intersects[0].object;
        const cityPos = target.getWorldPosition(new THREE.Vector3());
        const camDir = new THREE.Vector3()
          .subVectors(camera.position, new THREE.Vector3(0, 0, 0))
          .normalize();
        const cityDir = cityPos.clone().normalize();
        if (cityDir.dot(camDir) > 0) {
          currentHoveredCity = target.userData.city as City;
          onHoverChange?.({ city: currentHoveredCity, x: e.clientX, y: e.clientY });
          renderer.domElement.style.cursor = 'pointer';
          return;
        }
      }
      currentHoveredCity = null;
      onHoverChange?.({ city: null, x: e.clientX, y: e.clientY });
      renderer.domElement.style.cursor = isDragging ? 'grabbing' : 'grab';
    };

    const onClick = (e: MouseEvent) => {
      if (zoomAnimating) return;
      const rect = renderer.domElement.getBoundingClientRect();
      const mouseNDC = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1
      );
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouseNDC, camera);
      const intersects = raycaster.intersectObjects(cityMeshes);
      if (intersects.length === 0) return;
      const target = intersects[0].object;
      const cityPos = target.getWorldPosition(new THREE.Vector3());
      const camDir = new THREE.Vector3()
        .subVectors(camera.position, new THREE.Vector3(0, 0, 0))
        .normalize();
      const cityDir = cityPos.clone().normalize();
      if (cityDir.dot(camDir) <= 0) return;

      zoomAnimating = true;
      setZoomingIn(true);
      onZoomingChange?.(true);
      currentHoveredCity = null;
      onHoverChange?.({ city: null, x: e.clientX, y: e.clientY });

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

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      camera.position.z += e.deltaY * 0.005;
      camera.position.z = Math.max(5, Math.min(15, camera.position.z));
    };

    renderer.domElement.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('mousemove', onMouseMove);
    renderer.domElement.addEventListener('click', onClick);
    renderer.domElement.addEventListener('wheel', onWheel, { passive: false });

    // Animation loop
    let frameId = 0;
    const clock = new THREE.Clock();
    const animate = () => {
      const t = clock.getElapsedTime();
      if (!isDragging) {
        rotVelY *= 0.95;
        rotVelX *= 0.95;
        if (!currentHoveredCity && !zoomAnimating && camera.position.z > 5.05) {
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
        const isHov = currentHoveredCity && dot.userData.city.id === currentHoveredCity.id;
        const targetScale = isHov ? 1.6 : 1;
        dot.scale.x += (targetScale - dot.scale.x) * 0.2;
        dot.scale.y = dot.scale.x;
        dot.scale.z = dot.scale.x;
        (dot.material as THREE.MeshBasicMaterial).color.setHex(
          isHov ? 0xffffff : 0xfbbf24
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
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('mousemove', onMouseMove);
      renderer.domElement.removeEventListener('mousedown', onMouseDown);
      renderer.domElement.removeEventListener('click', onClick);
      renderer.domElement.removeEventListener('wheel', onWheel);
      mount.removeChild(renderer.domElement);
      renderer.dispose();
      globeGeometry.dispose();
      globeMaterial.dispose();
      glowGeometry.dispose();
      glowMaterial.dispose();
      gridMat.dispose();
      equatorMat.dispose();
      gridGroup.children.forEach((line) => (line as THREE.Line).geometry.dispose());
    };
  }, [onCitySelect, onHoverChange, onZoomingChange]);

  return (
    <div
      ref={mountRef}
      className="w-full h-full transition-all duration-700 ease-out"
      style={{
        cursor: 'grab',
        filter: zoomingIn ? 'blur(20px) brightness(0.4)' : 'none',
      }}
    />
  );
}
