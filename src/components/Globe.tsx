"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { feature } from "topojson-client";
import type { Topology, GeometryCollection } from "topojson-specification";
import type { FeatureCollection, Geometry, Position } from "geojson";

const HIT_LOCATIONS = [
  { lat: 40.7128, lng: -74.006, label: "New York" },
  { lat: 51.5074, lng: -0.1278, label: "London" },
  { lat: 48.8566, lng: 2.3522, label: "Paris" },
  { lat: 35.6762, lng: 139.6503, label: "Tokyo" },
  { lat: 22.3193, lng: 114.1694, label: "Hong Kong" },
  { lat: 1.3521, lng: 103.8198, label: "Singapore" },
  { lat: -33.8688, lng: 151.2093, label: "Sydney" },
  { lat: 25.2048, lng: 55.2708, label: "Dubai" },
  { lat: -23.5505, lng: -46.6333, label: "São Paulo" },
  { lat: 19.076, lng: 72.8777, label: "Mumbai" },
  { lat: 55.7558, lng: 37.6173, label: "Moscow" },
  { lat: -1.2921, lng: 36.8219, label: "Nairobi" },
  { lat: -33.9249, lng: 18.4241, label: "Cape Town" },
  { lat: 41.8781, lng: -87.6298, label: "Chicago" },
  { lat: 29.7604, lng: -95.3698, label: "Houston" },
  { lat: 34.0522, lng: -118.2437, label: "Los Angeles" },
  { lat: 52.52, lng: 13.405, label: "Berlin" },
  { lat: 39.9042, lng: 116.4074, label: "Beijing" },
  { lat: 37.5665, lng: 126.978, label: "Seoul" },
  { lat: -34.6037, lng: -58.3816, label: "Buenos Aires" },
  { lat: 18.1096, lng: -77.2975, label: "Kingston" },
  { lat: 45.4642, lng: 9.19, label: "Milan" },
  { lat: 47.3769, lng: 8.5417, label: "Zurich" },
];

// Connection arcs between key financial/recruitment corridors
const ARCS: [number, number][] = [
  [0, 1],   // New York — London
  [1, 2],   // London — Paris
  [0, 13],  // New York — Chicago
  [1, 7],   // London — Dubai
  [3, 4],   // Tokyo — Hong Kong
  [4, 5],   // Hong Kong — Singapore
  [7, 9],   // Dubai — Mumbai
  [1, 16],  // London — Berlin
  [8, 20],  // São Paulo — Kingston
  [11, 12], // Nairobi — Cape Town
  [0, 15],  // New York — Los Angeles
  [17, 18], // Beijing — Seoul
];

function latLngToVector3(lat: number, lng: number, radius: number) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -(radius * Math.sin(phi) * Math.cos(theta)),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}

function createArcPoints(
  start: THREE.Vector3,
  end: THREE.Vector3,
  segments: number,
  altitude: number
): THREE.Vector3[] {
  const points: THREE.Vector3[] = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const point = new THREE.Vector3().lerpVectors(start, end, t);
    // Lift the midpoint — parabolic arc
    const lift = Math.sin(t * Math.PI) * altitude;
    point.normalize().multiplyScalar(point.length() + lift);
    points.push(point);
  }
  return points;
}

export default function Globe() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Scene
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 1000);
    camera.position.z = 3.4;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const globeGroup = new THREE.Group();
    scene.add(globeGroup);

    // ── Atmospheric glow halo ──
    const glowGeo = new THREE.SphereGeometry(1.15, 64, 64);
    const glowMat = new THREE.ShaderMaterial({
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vPosition;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        varying vec3 vPosition;
        void main() {
          float intensity = pow(0.62 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 3.0);
          gl_FragColor = vec4(0.788, 0.659, 0.298, 1.0) * intensity * 0.4;
        }
      `,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      transparent: true,
      depthWrite: false,
    });
    const glowMesh = new THREE.Mesh(glowGeo, glowMat);
    globeGroup.add(glowMesh);

    // ── Globe sphere with rim lighting ──
    const sphereGeo = new THREE.SphereGeometry(1, 64, 64);
    const sphereMat = new THREE.ShaderMaterial({
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vPosition;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        varying vec3 vPosition;
        void main() {
          float rim = 1.0 - max(0.0, dot(vNormal, vec3(0.0, 0.0, 1.0)));
          float rimPow = pow(rim, 3.0);
          // Dark sphere with subtle gold rim
          vec3 baseColor = vec3(0.04, 0.04, 0.04);
          vec3 rimColor = vec3(0.788, 0.659, 0.298);
          vec3 color = baseColor + rimColor * rimPow * 0.15;
          float alpha = 0.85 + rimPow * 0.15;
          gl_FragColor = vec4(color, alpha);
        }
      `,
      transparent: true,
    });
    const sphere = new THREE.Mesh(sphereGeo, sphereMat);
    globeGroup.add(sphere);

    // ── Grid lines — latitude ──
    for (let i = -80; i <= 80; i += 20) {
      const points: THREE.Vector3[] = [];
      for (let lng = 0; lng <= 360; lng += 3) {
        points.push(latLngToVector3(i, lng, 1.003));
      }
      const geo = new THREE.BufferGeometry().setFromPoints(points);
      const mat = new THREE.LineBasicMaterial({
        color: 0xc9a84c,
        transparent: true,
        opacity: 0.06,
      });
      globeGroup.add(new THREE.Line(geo, mat));
    }

    // ── Grid lines — longitude ──
    for (let i = 0; i < 360; i += 20) {
      const points: THREE.Vector3[] = [];
      for (let lat = -90; lat <= 90; lat += 3) {
        points.push(latLngToVector3(lat, i, 1.003));
      }
      const geo = new THREE.BufferGeometry().setFromPoints(points);
      const mat = new THREE.LineBasicMaterial({
        color: 0xc9a84c,
        transparent: true,
        opacity: 0.05,
      });
      globeGroup.add(new THREE.Line(geo, mat));
    }

    // ── Continent outlines from TopoJSON (real world data) ──
    const continentGroup = new THREE.Group();
    globeGroup.add(continentGroup);

    function addGeoJsonLines(geojson: FeatureCollection<Geometry>) {
      const lineMat = new THREE.LineBasicMaterial({
        color: 0xc9a84c,
        transparent: true,
        opacity: 0.45,
      });

      function processRing(coords: Position[]) {
        const points = coords.map(([lng, lat]) =>
          latLngToVector3(lat, lng, 1.006)
        );
        if (points.length < 2) return;
        const geo = new THREE.BufferGeometry().setFromPoints(points);
        continentGroup.add(new THREE.Line(geo, lineMat.clone()));
      }

      geojson.features.forEach((feat) => {
        const geom = feat.geometry;
        if (geom.type === "Polygon") {
          geom.coordinates.forEach(processRing);
        } else if (geom.type === "MultiPolygon") {
          geom.coordinates.forEach((polygon) => {
            polygon.forEach(processRing);
          });
        }
      });
    }

    // Load world-110m TopoJSON
    fetch("https://cdn.jsdelivr.net/npm/world-atlas@2/land-110m.json")
      .then((res) => res.json())
      .then((topology: Topology) => {
        const land = feature(
          topology,
          topology.objects.land as GeometryCollection
        ) as FeatureCollection<Geometry>;
        addGeoJsonLines(land);
      })
      .catch(() => {
        // Fallback: if fetch fails, show nothing for continents
        console.warn("Failed to load world outline data");
      });

    // ── Connection arcs ──
    const arcGroup = new THREE.Group();
    globeGroup.add(arcGroup);

    ARCS.forEach(([fromIdx, toIdx]) => {
      const from = HIT_LOCATIONS[fromIdx];
      const to = HIT_LOCATIONS[toIdx];
      const startPos = latLngToVector3(from.lat, from.lng, 1.006);
      const endPos = latLngToVector3(to.lat, to.lng, 1.006);
      const dist = startPos.distanceTo(endPos);
      const arcPts = createArcPoints(startPos, endPos, 48, dist * 0.15);
      const geo = new THREE.BufferGeometry().setFromPoints(arcPts);
      const mat = new THREE.LineBasicMaterial({
        color: 0x8b2020,
        transparent: true,
        opacity: 0.12,
      });
      arcGroup.add(new THREE.Line(geo, mat));
    });

    // ── Hit dots — custom shader for glow ──
    const dotPositions: THREE.Vector3[] = [];
    HIT_LOCATIONS.forEach((loc) => {
      dotPositions.push(latLngToVector3(loc.lat, loc.lng, 1.012));
    });

    // Dot sprites with glow
    const dotTexture = new THREE.CanvasTexture(createDotTexture());
    const dotGlowTexture = new THREE.CanvasTexture(createDotGlowTexture());

    dotPositions.forEach((pos) => {
      // Glow layer
      const glowSpriteMat = new THREE.SpriteMaterial({
        map: dotGlowTexture,
        transparent: true,
        opacity: 0.5,
        depthTest: false,
        blending: THREE.AdditiveBlending,
      });
      const glowSprite = new THREE.Sprite(glowSpriteMat);
      glowSprite.position.copy(pos);
      glowSprite.scale.set(0.08, 0.08, 1);
      globeGroup.add(glowSprite);

      // Core dot
      const spriteMat = new THREE.SpriteMaterial({
        map: dotTexture,
        transparent: true,
        opacity: 0.85,
        depthTest: false,
      });
      const sprite = new THREE.Sprite(spriteMat);
      sprite.position.copy(pos);
      sprite.scale.set(0.03, 0.03, 1);
      globeGroup.add(sprite);
    });

    // ── Pulse system ──
    const pulseRings: {
      mesh: THREE.Mesh;
      startTime: number;
    }[] = [];

    function createPulse(pos: THREE.Vector3) {
      const geo = new THREE.RingGeometry(0.005, 0.012, 32);
      const mat = new THREE.MeshBasicMaterial({
        color: 0x9b2525,
        transparent: true,
        opacity: 0.5,
        side: THREE.DoubleSide,
        depthTest: false,
        blending: THREE.AdditiveBlending,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(pos);
      mesh.lookAt(new THREE.Vector3(0, 0, 0));
      globeGroup.add(mesh);
      pulseRings.push({ mesh, startTime: Date.now() });
    }

    // Stagger pulses at different intervals for organic feel
    let pulseCounter = 0;
    const pulseInterval = setInterval(() => {
      // Pulse 1-3 random dots at varying intervals
      const count = Math.random() > 0.6 ? 2 : 1;
      for (let n = 0; n < count; n++) {
        const idx = Math.floor(Math.random() * HIT_LOCATIONS.length);
        const loc = HIT_LOCATIONS[idx];
        createPulse(latLngToVector3(loc.lat, loc.lng, 1.013));
      }
      pulseCounter++;
    }, 1800 + Math.random() * 1200);

    // Subtle tilt
    globeGroup.rotation.x = 0.2;
    globeGroup.rotation.z = 0.05;

    // ── Animate ──
    let animId: number;
    const clock = new THREE.Clock();

    function animate() {
      animId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      // Slow, steady rotation
      globeGroup.rotation.y += 0.0015;

      // Very subtle oscillation on tilt for life
      globeGroup.rotation.x = 0.2 + Math.sin(elapsed * 0.15) * 0.02;

      // Update pulse rings
      const now = Date.now();
      for (let i = pulseRings.length - 1; i >= 0; i--) {
        const ring = pulseRings[i];
        const age = (now - ring.startTime) / 1000;
        if (age > 3.5) {
          globeGroup.remove(ring.mesh);
          ring.mesh.geometry.dispose();
          (ring.mesh.material as THREE.MeshBasicMaterial).dispose();
          pulseRings.splice(i, 1);
        } else {
          const scale = 1 + age * 3;
          ring.mesh.scale.set(scale, scale, scale);
          const fadeOut = Math.pow(1 - age / 3.5, 1.5);
          (ring.mesh.material as THREE.MeshBasicMaterial).opacity =
            0.5 * fadeOut;
        }
      }

      // Subtle arc opacity pulsing
      arcGroup.children.forEach((child, idx) => {
        const mat = (child as THREE.Line).material as THREE.LineBasicMaterial;
        mat.opacity = 0.08 + Math.sin(elapsed * 0.5 + idx * 0.7) * 0.05;
      });

      renderer.render(scene, camera);
    }
    animate();

    // Resize
    function handleResize() {
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    }
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animId);
      clearInterval(pulseInterval);
      window.removeEventListener("resize", handleResize);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="w-full h-full"
      aria-label="Rotating globe showing global recruitment presence"
      role="img"
    />
  );
}

function createDotTexture(): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext("2d")!;
  const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 20);
  gradient.addColorStop(0, "rgba(200, 55, 55, 1)");
  gradient.addColorStop(0.5, "rgba(160, 35, 35, 0.9)");
  gradient.addColorStop(0.8, "rgba(120, 25, 25, 0.3)");
  gradient.addColorStop(1, "rgba(100, 20, 20, 0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 64, 64);
  return canvas;
}

function createDotGlowTexture(): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext("2d")!;
  const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  gradient.addColorStop(0, "rgba(180, 50, 50, 0.6)");
  gradient.addColorStop(0.3, "rgba(140, 30, 30, 0.2)");
  gradient.addColorStop(0.6, "rgba(100, 20, 20, 0.05)");
  gradient.addColorStop(1, "rgba(80, 15, 15, 0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 128, 128);
  return canvas;
}
