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

  // Resim yüzeyi
  const imageMat = new THREE.MeshStandardMaterial({
    map: texture,
    roughness: 0.9,
    metalness: 0.0,
  });

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
