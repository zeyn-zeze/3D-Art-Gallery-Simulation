import * as THREE from 'three';

export function createLights() {
  const group = new THREE.Group();

  const ambient = new THREE.AmbientLight(0xffffff, 0.75);
  group.add(ambient);


  const dir = new THREE.DirectionalLight(0xffffff, 0.6);
  dir.position.set(6, 10, 6);
  dir.castShadow = true;
  dir.shadow.mapSize.set(1024, 1024);
  dir.shadow.camera.near = 1;
  dir.shadow.camera.far = 40;
  dir.shadow.camera.left = -15;
  dir.shadow.camera.right = 15;
  dir.shadow.camera.top = 15;
  dir.shadow.camera.bottom = -15;
  group.add(dir);


const monaSpot = new THREE.SpotLight(0xffffff, 1.8, 25, Math.PI / 10, 0.25, 1);
monaSpot.position.set(0, 3.8, -6.5);
monaSpot.target.position.set(0, 2.1, -8.9);

monaSpot.castShadow = true;
group.add(monaSpot);
group.add(monaSpot.target);



  // Galeri hissi için iki spot
  const spot1 = new THREE.SpotLight(0xffffff, 1.2, 35, Math.PI / 7, 0.25, 1);
  spot1.position.set(-3, 3.5, 3);
  spot1.target.position.set(-3, 1.5, -4);
  spot1.castShadow = true;
  group.add(spot1);
  group.add(spot1.target);

  const spot2 = new THREE.SpotLight(0xffffff, 1.2, 35, Math.PI / 7, 0.25, 1);
  spot2.position.set(3, 3.5, 3);
  spot2.target.position.set(3, 1.5, -4);
  spot2.castShadow = true;
  group.add(spot2);
  group.add(spot2.target);

  return group;
}
