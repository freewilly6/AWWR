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

    // ── Earth texture canvas ──
    const earthCanvas = document.createElement("canvas");
    earthCanvas.width = 2048;
    earthCanvas.height = 1024;
    const earthCtx = earthCanvas.getContext("2d")!;

    // Ocean blue background
    earthCtx.fillStyle = "#1a4a7a";
    earthCtx.fillRect(0, 0, 2048, 1024);

    const earthTexture = new THREE.CanvasTexture(earthCanvas);

    // ── Globe sphere with Earth texture ──
    const sphereGeo = new THREE.SphereGeometry(1, 64, 64);
    const sphereMat = new THREE.ShaderMaterial({
      uniforms: {
        earthMap: { value: earthTexture },
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec2 vUv;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D earthMap;
        varying vec3 vNormal;
        varying vec2 vUv;
        void main() {
          vec3 texColor = texture2D(earthMap, vUv).rgb;
          float rim = 1.0 - max(0.0, dot(vNormal, vec3(0.0, 0.0, 1.0)));
          float rimPow = pow(rim, 3.0);
          vec3 rimColor = vec3(0.79, 0.66, 0.30);
          float rimGlow = pow(rim, 2.0);
          vec3 color = texColor + rimColor * rimGlow * 0.7;
          float alpha = 0.9 + rimPow * 0.1;
          gl_FragColor = vec4(color, alpha);
        }
      `,
      transparent: true,
      depthWrite: true,
    });
    const sphere = new THREE.Mesh(sphereGeo, sphereMat);
    globeGroup.add(sphere);

    // ── Paint land masses onto Earth texture ──
    function paintLandOnTexture(geojson: FeatureCollection<Geometry>) {
      function lngLatToCanvas(lng: number, lat: number): [number, number] {
        const x = ((lng + 180) / 360) * 2048;
        const y = ((90 - lat) / 180) * 1024;
        return [x, y];
      }

      function fillRing(coords: Position[]) {
        if (coords.length < 3) return;

        // Split ring into segments that don't cross the antimeridian
        const segments: Position[][] = [];
        let current: Position[] = [coords[0]];

        for (let i = 1; i < coords.length; i++) {
          const prevLng = coords[i - 1][0];
          const curLng = coords[i][0];
          if (Math.abs(curLng - prevLng) > 180) {
            // Antimeridian crossing — end current segment, start new one
            if (current.length >= 3) segments.push(current);
            current = [coords[i]];
          } else {
            current.push(coords[i]);
          }
        }
        if (current.length >= 3) segments.push(current);

        // Draw each segment separately
        segments.forEach((seg) => {
          earthCtx.beginPath();
          const [sx, sy] = lngLatToCanvas(seg[0][0], seg[0][1]);
          earthCtx.moveTo(sx, sy);
          for (let i = 1; i < seg.length; i++) {
            const [x, y] = lngLatToCanvas(seg[i][0], seg[i][1]);
            earthCtx.lineTo(x, y);
          }
          earthCtx.closePath();
          earthCtx.fill();
        });
      }

      // Fill land with green/brown earth tones
      const landGradient = earthCtx.createLinearGradient(0, 0, 0, 1024);
      landGradient.addColorStop(0, "#6b8a5e");    // northern tundra green
      landGradient.addColorStop(0.15, "#5a7a4a"); // taiga
      landGradient.addColorStop(0.3, "#4a7a3a");  // temperate green
      landGradient.addColorStop(0.45, "#8a7a3a"); // arid/desert tan
      landGradient.addColorStop(0.55, "#3a7a2a"); // tropical green
      landGradient.addColorStop(0.7, "#4a7a3a");  // southern temperate
      landGradient.addColorStop(0.85, "#5a7a4a"); // southern lands
      landGradient.addColorStop(1, "#dde8dd");    // Antarctica white
      earthCtx.fillStyle = landGradient;

      geojson.features.forEach((feat) => {
        const geom = feat.geometry;
        if (geom.type === "Polygon") {
          geom.coordinates.forEach(fillRing);
        } else if (geom.type === "MultiPolygon") {
          geom.coordinates.forEach((polygon) => {
            polygon.forEach(fillRing);
          });
        }
      });

      // Stroke continent outlines for crisp definition
      earthCtx.strokeStyle = "rgba(201, 168, 76, 0.18)";
      earthCtx.lineWidth = 1.5;
      earthCtx.lineJoin = "round";

      function strokeRing(coords: Position[]) {
        if (coords.length < 3) return;
        const segments: Position[][] = [];
        let current: Position[] = [coords[0]];
        for (let i = 1; i < coords.length; i++) {
          const prevLng = coords[i - 1][0];
          const curLng = coords[i][0];
          if (Math.abs(curLng - prevLng) > 180) {
            if (current.length >= 3) segments.push(current);
            current = [coords[i]];
          } else {
            current.push(coords[i]);
          }
        }
        if (current.length >= 3) segments.push(current);

        segments.forEach((seg) => {
          earthCtx.beginPath();
          const [sx, sy] = lngLatToCanvas(seg[0][0], seg[0][1]);
          earthCtx.moveTo(sx, sy);
          for (let i = 1; i < seg.length; i++) {
            const [x, y] = lngLatToCanvas(seg[i][0], seg[i][1]);
            earthCtx.lineTo(x, y);
          }
          earthCtx.closePath();
          earthCtx.stroke();
        });
      }

      geojson.features.forEach((feat) => {
        const geom = feat.geometry;
        if (geom.type === "Polygon") {
          geom.coordinates.forEach(strokeRing);
        } else if (geom.type === "MultiPolygon") {
          geom.coordinates.forEach((polygon) => {
            polygon.forEach(strokeRing);
          });
        }
      });

      earthTexture.needsUpdate = true;
    }

    // Load world-110m TopoJSON
    fetch("https://cdn.jsdelivr.net/npm/world-atlas@2/land-110m.json")
      .then((res) => res.json())
      .then((topology: Topology) => {
        const land = feature(
          topology,
          topology.objects.land as GeometryCollection
        ) as FeatureCollection<Geometry>;
        paintLandOnTexture(land);
      })
      .catch(() => {
        console.warn("Failed to load world outline data");
      });

    // ── Connection arcs ──
    const arcGroup = new THREE.Group();
    globeGroup.add(arcGroup);

    ARCS.forEach(([fromIdx, toIdx]) => {
      const from = HIT_LOCATIONS[fromIdx];
      const to = HIT_LOCATIONS[toIdx];
      const startPos = latLngToVector3(from.lat, from.lng, 1.002);
      const endPos = latLngToVector3(to.lat, to.lng, 1.002);
      const dist = startPos.distanceTo(endPos);
      const arcPts = createArcPoints(startPos, endPos, 48, dist * 0.15);
      const geo = new THREE.BufferGeometry().setFromPoints(arcPts);
      const mat = new THREE.LineBasicMaterial({
        color: 0xc9a84c,
        transparent: true,
        opacity: 0.25,
        depthTest: true,
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
        depthTest: true,
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
        depthTest: true,
      });
      const sprite = new THREE.Sprite(spriteMat);
      sprite.position.copy(pos);
      sprite.scale.set(0.03, 0.03, 1);
      globeGroup.add(sprite);
    });

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
  gradient.addColorStop(0, "rgba(201, 168, 76, 1)");
  gradient.addColorStop(0.5, "rgba(180, 140, 50, 0.9)");
  gradient.addColorStop(0.8, "rgba(160, 120, 40, 0.3)");
  gradient.addColorStop(1, "rgba(140, 100, 30, 0)");
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
  gradient.addColorStop(0, "rgba(201, 168, 76, 0.6)");
  gradient.addColorStop(0.3, "rgba(180, 140, 50, 0.2)");
  gradient.addColorStop(0.6, "rgba(160, 120, 40, 0.05)");
  gradient.addColorStop(1, "rgba(140, 100, 30, 0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 128, 128);
  return canvas;
}
