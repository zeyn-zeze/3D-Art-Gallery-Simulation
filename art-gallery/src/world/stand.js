import * as THREE from 'three';


export function createInfoStand({
  position,
  artId,
  title,
  artist,
  year,
  technique,
  description,
  imageUrl
}) {
  const group = new THREE.Group();

  // Antik bronz/gold
  const bronzeGold = new THREE.MeshPhysicalMaterial({
    color: 0xb88a2a,          // altın/bronz tonu
    metalness: 1.0,
    roughness: 0.28,
    clearcoat: 1.0,
    clearcoatRoughness: 0.18,
  });

  // Mermer gibi taban (açık taş)
  const marble = new THREE.MeshStandardMaterial({
    color: 0xe7ddcf,
    roughness: 0.85,
    metalness: 0.05,
  });

  // Tabanı biraz daha “kaideli” yapalım
  const base = new THREE.Mesh(
    new THREE.BoxGeometry(0.50, 0.95, 0.40),
    marble
  );
  base.position.y = 0.475;

  // Üst plakayı bronz yap
  const top = new THREE.Mesh(
    new THREE.BoxGeometry(0.60, 0.07, 0.44),
    bronzeGold
  );
  top.position.y = 1.02;

  // İnce “çerçeve” gibi bronz şerit (opsiyonel ama çok iyi durur)
  const trim = new THREE.Mesh(
    new THREE.BoxGeometry(0.62, 0.02, 0.46),
    bronzeGold
  );
  trim.position.y = 0.985;

  group.add(base, trim, top);
  group.position.set(position[0], position[1], position[2]);

  group.userData = {
    type: 'stand',
    artId,
    title,
    artist,
    year,
    technique,
    description,
    imageUrl
  };

  base.userData = group.userData;
  top.userData  = group.userData;
  trim.userData = group.userData;

  return group;
}
