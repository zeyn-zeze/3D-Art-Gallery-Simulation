import * as THREE from 'three';
import { createFrame } from './frame.js';

export function createArtwork({
  imageUrl,
  title = '',
  w = 1.2,
  h = 1.8,
  frameWidth = 0.12,
  frameDepth = 0.06,
  frameColor = 0x2a1a12,
  frameShape = 'rect', // 'rect' | 'oval' | 'round'
} = {}) {
  const group = new THREE.Group();
  group.userData.isArtwork = true;
  group.userData.title = title;

  // Texture
  const loader = new THREE.TextureLoader();
  const texture = loader.load(imageUrl);
  texture.colorSpace = THREE.SRGBColorSpace;

  function makeEllipseMaskTexture(size = 512, shape = "oval") {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");

  // black = transparent, white = visible
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, size, size);

  ctx.fillStyle = "white";
  ctx.beginPath();

  if (shape === "round") {
    const r = size * 0.49;
    ctx.arc(size / 2, size / 2, r, 0, Math.PI * 2);
  } else {
    // oval
    ctx.ellipse(size / 2, size / 2, size * 0.49, size * 0.49, 0, 0, Math.PI * 2);
  }

  ctx.closePath();
  ctx.fill();

  const tex = new THREE.CanvasTexture(canvas);
  // alphaMap grayscale ok; colorSpace şart değil ama zarar vermez
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}
  // Resim yüzeyi
  const imageMat = new THREE.MeshStandardMaterial({
    map: texture,
    roughness: 0.9,
    metalness: 0.0,
  });

  // ✅ Oval/Round frame'de resmin köşelerini kırp (kareyi yok eder)
  if (frameShape === "oval" || frameShape === "round") {
    imageMat.alphaMap = makeEllipseMaskTexture(512, frameShape);
    imageMat.transparent = true;
    imageMat.alphaTest = 0.5; // keskin kırpma
    // imageMat.side = THREE.DoubleSide; // gerekirse aç
  }




  const image = new THREE.Mesh(
    new THREE.PlaneGeometry(w, h),
    imageMat
  );

  


  // Frame'in biraz önünde dursun
  image.position.z = 0.01;

  // Çerçeve
  const frame = createFrame({
    w,
    h,
    frameWidth,
    depth: frameDepth,
    color: frameColor,
    shape: frameShape,
  });

  group.add(frame);
  group.add(image);

  return group;
}
