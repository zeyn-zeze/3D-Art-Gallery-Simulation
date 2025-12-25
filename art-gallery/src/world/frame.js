import * as THREE from 'three';

export function createFrame({
  w = 1.2,
  h = 1.8,
  frameWidth = 0.12,
  depth = 0.06,
  color = 0x2a1a12,
  metalness = 0.2,
  roughness = 0.75,
  shape = 'rect', // 'rect' | 'oval' | 'round'
} = {}) {
  const mat = new THREE.MeshStandardMaterial({
    color,
    metalness,
    roughness,
  });

  if (shape === 'oval') {
    return createOvalFrame({ w, h, frameWidth, depth, mat });
  }
  if (shape === 'round') {
    const d = Math.min(w, h);
    return createOvalFrame({ w: d, h: d, frameWidth, depth, mat, forceCircle: true });
  }
  return createRectFrame({ w, h, frameWidth, depth, mat });
}

function createRectFrame({ w, h, frameWidth, depth, mat }) {
  // Outer box frame with a hole (using 4 bars)
  const g = new THREE.Group();

  const outerW = w + frameWidth * 2;
  const outerH = h + frameWidth * 2;

  const top = new THREE.Mesh(new THREE.BoxGeometry(outerW, frameWidth, depth), mat);
  top.position.set(0, h / 2 + frameWidth / 2, 0);

  const bottom = top.clone();
  bottom.position.set(0, -h / 2 - frameWidth / 2, 0);

  const left = new THREE.Mesh(new THREE.BoxGeometry(frameWidth, h, depth), mat);
  left.position.set(-w / 2 - frameWidth / 2, 0, 0);

  const right = left.clone();
  right.position.set(w / 2 + frameWidth / 2, 0, 0);

  g.add(top, bottom, left, right);
  return g;
}

function createOvalFrame({ w, h, frameWidth, depth, mat, forceCircle = false }) {
  const g = new THREE.Group();

  // Outer ellipse and inner ellipse (hole) using Shape + hole
  const outer = new THREE.Shape();
  const rx = (w / 2) + frameWidth;
  const ry = (h / 2) + frameWidth;

  const inner = new THREE.Path();
  const irx = (w / 2);
  const iry = (h / 2);

  // Ellipse points
  outer.absellipse(0, 0, rx, ry, 0, Math.PI * 2, false, 0);
  inner.absellipse(0, 0, irx, iry, 0, Math.PI * 2, true, 0);

  outer.holes.push(inner);

  const geo = new THREE.ExtrudeGeometry(outer, {
    depth,
    bevelEnabled: false,
    curveSegments: 64,
  });

  const mesh = new THREE.Mesh(geo, mat);
  // ExtrudeGeometry +Z’ye doğru çıkar, frame’i duvara paralel tutmak için merkeze al:
  mesh.position.z = -depth / 2;

  g.add(mesh);
  return g;
}
