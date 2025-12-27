// src/scene/galleryScene.js
import * as THREE from 'three';
import { createLights } from './lights.js';
import { createRoom } from '../world/room.js';
import { createArtwork } from '../world/artwork.js';
import { createChandelier } from '../world/chandelier.js';
import { createPalaceDoor } from '../world/door.js';
import { createInfoStand } from '../world/stand.js';





export function createGalleryScene() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x111111);
  scene.fog = new THREE.Fog(0x111111, 12, 90);

  const collidables = [];
  const clickables = [];
  const stands = [];

  // ---- Room ----
  const ROOM_W = 18;
  const ROOM_D = 30;
  const ROOM_H = 10.5;
  const DOOR_W = 6.0;
  const DOOR_H = 7.5;

  const room = createRoom({ width: ROOM_W, depth: ROOM_D, height: ROOM_H, doorW: DOOR_W, doorH: DOOR_H });
  scene.add(room);
  collidables.push(...(room.userData.collidables || []));

  // ---- Lights (global) ----
  scene.add(createLights());

  // ---- Chandelier ----
  const chandelier = createChandelier({
    y: ROOM_H - 1.2,
    x: 0,
    z: -ROOM_D * 0.05,
    scale: 1.2,
  });
  scene.add(chandelier);



  // ---- Palace Door at front wall opening ----
  // front wall plane is at z = +ROOM_D/2. Door sits slightly INSIDE opening.
  const doorZ = ROOM_D / 2 - 0.18;
  const door = createPalaceDoor({
    doorW: DOOR_W,
    doorH: DOOR_H,
    x: 0,
    y: 0,
    z: doorZ,
    faceIn: true,
  });
  scene.add(door.object);
  collidables.push(door.object); // kapının kendisine çarpma (istersen çıkarırız)

  // ---- Red carpet outside + inside (1) ----
  const carpetMat = new THREE.MeshStandardMaterial({
    color: 0x7a0e12,
    roughness: 0.95,
    metalness: 0.0,
  });

  const carpetIn = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 7.0), carpetMat);
  carpetIn.rotation.x = -Math.PI / 2;
  carpetIn.position.set(0, 0.01, ROOM_D / 2 - 3.8);
  carpetIn.receiveShadow = true;
  scene.add(carpetIn);

  const carpetOut = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 9.0), carpetMat);
  carpetOut.rotation.x = -Math.PI / 2;
  carpetOut.position.set(0, 0.01, ROOM_D / 2 + 4.5);
  carpetOut.receiveShadow = true;
  scene.add(carpetOut);

  // ---- Gold sconces (aplik) near the door (1) ----
  const gold = new THREE.MeshPhysicalMaterial({
    color: 0xd8b24c,
    metalness: 1.0,
    roughness: 0.22,
    clearcoat: 1.0,
    clearcoatRoughness: 0.15,
  });

  function addSconce(x) {
    const g = new THREE.Group();
    g.position.set(x, 4.6, ROOM_D / 2 - 0.35);

    const plate = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.05, 24), gold);
    plate.rotation.x = Math.PI / 2;
    g.add(plate);

    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.55, 18), gold);
    arm.rotation.z = Math.PI / 2;
    arm.position.set(0.28, 0, 0);
    g.add(arm);

    const bulb = new THREE.Mesh(
      new THREE.SphereGeometry(0.16, 24, 18),
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2, metalness: 0.0, emissive: 0xffe9c9, emissiveIntensity: 0.7 })
    );
    bulb.position.set(0.58, 0, 0);
    g.add(bulb);

    const light = new THREE.PointLight(0xffe6c2, 1.25, 10, 1.4);
    light.position.set(0.58, 0, 0);
    g.add(light);

    scene.add(g);
  }

  addSconce(-4.2);
  addSconce(4.2);

  // ---- Helper: add artwork ----
  function addArt(art, x, y, z, rotY = 0) {
    art.position.set(x, y, z);
    art.rotation.y = rotY;
    scene.add(art);
    collidables.push(art);
    return art;
  }

  function addStandForArt(artObj, { title, text }, opts = {}) {
    const {
      distFromWall = 1.2,   // tablonun önüne ne kadar gelsin
      standY = 0,           // stand zeminden başlar
      standHeightFix = 0,   // küçük ayar
    } = opts;

    // tablonun baktığı yönü bul (art.rotation’a göre)
    const normal = new THREE.Vector3(0, 0, 1).applyEuler(artObj.rotation);

    // stand pozisyonu: tablonun önüne doğru dist kadar
    const pos = artObj.position.clone().add(normal.clone().multiplyScalar(distFromWall));
    pos.y = standY;

    const stand = createInfoStand({
      position: [pos.x, pos.y, pos.z],
      title,
      text,
    });

    scene.add(stand);
    stand.traverse(o => {
      if (o.isMesh) clickables.push(o);
    });
    
    stands.push(stand);

    // raycast için: stand içindeki meshleri tıklanabilir listeye ekle
    stand.traverse(o => {
      if (o.isMesh) clickables.push(o);
    });

    return stand;
  }


  // ---- Helper: soft spot on art (loş leke) ----
  function addSoftSpotForArt(art, opts = {}) {
    const {
      intensity = 2.4,
      distance = 22,
      angle = Math.PI / 11,
      penumbra = 0.65,
      decay = 1.15,
      color = 0xfff0d8,
      heightOffset = 2.3,
      forwardOffset = 1.8,
      targetYOffset = 0.0,
    } = opts;

    const spot = new THREE.SpotLight(color, intensity, distance, angle, penumbra, decay);
    spot.castShadow = false;

    const normal = new THREE.Vector3(0, 0, 1).applyEuler(art.rotation);
    spot.position.copy(
      art.position.clone()
        .add(normal.clone().multiplyScalar(forwardOffset))
        .add(new THREE.Vector3(0, heightOffset, 0))
    );

    spot.target.position.copy(art.position.clone().add(new THREE.Vector3(0, targetYOffset, 0)));

    scene.add(spot);
    scene.add(spot.target);
    return spot;
  }

  // Wall planes
  const backWallZ  = -ROOM_D / 2 + 0.14;
  const leftWallX  = -ROOM_W / 2 + 0.14;
  const rightWallX =  ROOM_W / 2 - 0.14;

  // ---- Center divider corridor (2 pieces with gap) ----
  const dividerMat = new THREE.MeshStandardMaterial({ color: 0x3e1616, roughness: 0.85, metalness: 0.05 });
  const dividerT = 0.22;
  const dividerZ = -ROOM_D * 0.10;
  const GAP_W = 5.2;
  const SIDE_W = (ROOM_W - GAP_W) / 2;

  const leftDivider = new THREE.Mesh(new THREE.BoxGeometry(SIDE_W, ROOM_H, dividerT), dividerMat);
  leftDivider.position.set(-(GAP_W / 2 + SIDE_W / 2), ROOM_H / 2, dividerZ);
  leftDivider.castShadow = true; leftDivider.receiveShadow = true;
  scene.add(leftDivider); collidables.push(leftDivider);

  const rightDivider = new THREE.Mesh(new THREE.BoxGeometry(SIDE_W, ROOM_H, dividerT), dividerMat);
  rightDivider.position.set((GAP_W / 2 + SIDE_W / 2), ROOM_H / 2, dividerZ);
  rightDivider.castShadow = true; rightDivider.receiveShadow = true;
  scene.add(rightDivider); collidables.push(rightDivider);

  // ---- Art placements (no front wall art, because door is there) ----
  const monaLisa = createArtwork({
    imageUrl: '/artworks/mona_lisa.jpg',
    title: 'Mona Lisa — Leonardo da Vinci',
    w: 1.05, h: 1.55,
    frameWidth: 0.12,
    frameColor: 0x2a1a12,
    frameShape: 'rect',
  });

  const monaX = leftDivider.position.x;
  const monaY = 2.85;
  const monaZ = dividerZ + dividerT / 2 + 0.08;
  const monaObj = addArt(monaLisa, monaX, monaY, monaZ, 0);
  addStandForArt(monaObj,
    { title: 'Mona Lisa — Leonardo da Vinci', text: 'Rönesans dönemi. Yağlı boya...' },
    { distFromWall: 1.1 }
  );

  addSoftSpotForArt(monaObj, { intensity: 3.2, angle: Math.PI / 12, penumbra: 0.72, forwardOffset: 1.5, heightOffset: 2.5 });

  // Back wall
  const back1 = addArt(createArtwork({ imageUrl: '/artworks/a1.jpg', title:'Large Landscape', w:3.6,h:1.8, frameWidth:0.14, frameColor:0x1f140c, frameShape:'rect' }),
    -5.6, 3.0, backWallZ, 0
  );
  addStandForArt(back1,
    { title: 'Large Landscape', text: 'Bu eser geniş kompozisyon...' },
    { distFromWall: 1.3 }
  );

  addSoftSpotForArt(back1, { intensity: 2.6, angle: Math.PI / 10, penumbra: 0.7 });

  const back2 = addArt(createArtwork({ imageUrl: '/artworks/a3.jpg', title:'Tall Portrait', w:1.5,h:2.8, frameWidth:0.16, frameColor:0x2a1a12, frameShape:'rect' }),
    0.8, 3.3, backWallZ, 0
  );
  addSoftSpotForArt(back2, { intensity: 2.8, angle: Math.PI / 12, penumbra: 0.75, heightOffset: 2.8 });

  const back3 = addArt(createArtwork({ imageUrl: '/artworks/a2.jpg', title:'Small Square', w:1.1,h:1.1, frameWidth:0.12, frameColor:0x2b2116, frameShape:'rect' }),
    6.2, 2.7, backWallZ, 0
  );
  addSoftSpotForArt(back3, { intensity: 2.1, angle: Math.PI / 13, penumbra: 0.8 });

  // Left wall (rot +PI/2)
  const left1 = addArt(createArtwork({ imageUrl:'/artworks/a1.jpg', title:'Oval Classic', w:1.5,h:2.1, frameWidth:0.18, frameColor:0x3a2a12, frameShape:'oval' }),
    leftWallX, 3.1, -10.0, Math.PI/2
  );
  addSoftSpotForArt(left1, { intensity: 2.6, forwardOffset: 1.5, heightOffset: 2.6 });

  const left2 = addArt(createArtwork({ imageUrl:'/artworks/a2.jpg', title:'Round Frame', w:1.6,h:1.6, frameWidth:0.18, frameColor:0x2d1f10, frameShape:'round' }),
    leftWallX, 2.8, -1.0, Math.PI/2
  );
  addSoftSpotForArt(left2, { intensity: 2.4, forwardOffset: 1.5, heightOffset: 2.2 });

  const left3 = addArt(createArtwork({ imageUrl:'/artworks/a3.jpg', title:'Wide Piece', w:3.0,h:1.25, frameWidth:0.13, frameColor:0x24170e, frameShape:'rect' }),
    leftWallX, 3.2, 9.0, Math.PI/2
  );
  addSoftSpotForArt(left3, { intensity: 2.4, forwardOffset: 1.7, heightOffset: 2.4, angle: Math.PI/10 });

  // Right wall (rot -PI/2)
  const right1 = addArt(createArtwork({ imageUrl:'/artworks/a3.jpg', title:'Tall Small', w:1.15,h:2.35, frameWidth:0.14, frameColor:0x2a1a12, frameShape:'rect' }),
    rightWallX, 3.15, -10.5, -Math.PI/2
  );
  addSoftSpotForArt(right1, { intensity: 2.7, forwardOffset: 1.5, heightOffset: 2.7 });

  const right2 = addArt(createArtwork({ imageUrl:'/artworks/a1.jpg', title:'Medium Landscape', w:2.6,h:1.5, frameWidth:0.12, frameColor:0x1f140c, frameShape:'rect' }),
    rightWallX, 2.95, -2.0, -Math.PI/2
  );
  addSoftSpotForArt(right2, { intensity: 2.4, forwardOffset: 1.6, heightOffset: 2.3, angle: Math.PI/10 });

  const right3 = addArt(createArtwork({ imageUrl:'/artworks/a2.jpg', title:'Oval Small', w:1.25,h:1.7, frameWidth:0.16, frameColor:0x3b2a14, frameShape:'oval' }),
    rightWallX, 2.75, 8.5, -Math.PI/2
  );
  addSoftSpotForArt(right3, { intensity: 2.3, forwardOffset: 1.5, heightOffset: 2.4 });


  // ---- Door trigger zone (3) ----
  // Kapının iç tarafında ve dış tarafında küçük “portal”
  const portalIn = new THREE.Vector3(0, 1.6, ROOM_D / 2 - 1.2);
  const portalOut = new THREE.Vector3(0, 1.6, ROOM_D / 2 + 6.0);

  function update(dt) {
    door.update(dt);
  }

  const spawn = {
  outside: new THREE.Vector3(0, 1.6, ROOM_D / 2 + 7), // avlu tarafı
  inside:  new THREE.Vector3(0, 1.6, ROOM_D / 2 - 5), // içeri adım
};




  return {
    scene,
    update,
    collidables,
    roomInfo: { width: ROOM_W, depth: ROOM_D, height: ROOM_H },
    doorApi: door,
    portal: { inPos: portalIn, outPos: portalOut, doorZ },
    clickables,
    stands,
    roomInfo: { width: ROOM_W, depth: ROOM_D, height: ROOM_H },
    doorApi: door,
    portal: { inPos: portalIn, outPos: portalOut, doorZ },
    spawn
  };
}
