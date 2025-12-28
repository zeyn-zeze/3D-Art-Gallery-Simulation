// src/scene/galleryScene.js
import * as THREE from "three";
import { createLights } from "./lights.js";
import { createRoom } from "../world/room.js";
import { createArtwork } from "../world/artwork.js";
import { createChandelier } from "../world/chandelier.js";
import { createPalaceDoor } from "../world/door.js";
import { createInfoStand } from "../world/stand.js";

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

  // ---- Lights ----
  scene.add(createLights());

  // ---- Chandelier ----
  const chandelier = createChandelier({
    y: ROOM_H - 1.2,
    x: 0,
    z: -ROOM_D * 0.05,
    scale: 1.2,
  });
  scene.add(chandelier);

  // ---- Door ----
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
  collidables.push(door.object);

  // ---- Carpet ----
  const carpetMat = new THREE.MeshStandardMaterial({
    color: 0x7a0e12,
    roughness: 0.95,
    metalness: 0.0,
  });

    // ---- Invisible floor for click-to-move (Exhibit mode) ----
  const floorRay = new THREE.Mesh(
    new THREE.PlaneGeometry(ROOM_W, ROOM_D),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  floorRay.rotation.x = -Math.PI / 2;
  floorRay.position.y = 0.001;
  scene.add(floorRay);


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

  // ---- Helper: add artwork ----
  function addArt(art, x, y, z, rotY = 0) {
    art.position.set(x, y, z);
    art.rotation.y = rotY;
    scene.add(art);
    collidables.push(art);
    return art;
  }

  // ✅ Stand: artık info objesi alıyor
  function addStandForArt(artObj, info, opts = {}) {
    const { distFromWall = 1.2, standY = 0 } = opts;

    const normal = new THREE.Vector3(0, 0, 1).applyEuler(artObj.rotation);
    const pos = artObj.position.clone().add(normal.clone().multiplyScalar(distFromWall));
    pos.y = standY;

    const stand = createInfoStand({
      position: [pos.x, pos.y, pos.z],
      ...info,
    });

    scene.add(stand);

    // ✅ clickables: stand içindeki meshler
    stand.traverse((o) => {
      if (o.isMesh) clickables.push(o);
    });

    stands.push(stand);
    return stand;
  }

  // ---- Helper: soft spot ----
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
      art.position.clone().add(normal.clone().multiplyScalar(forwardOffset)).add(new THREE.Vector3(0, heightOffset, 0))
    );

    spot.target.position.copy(art.position.clone().add(new THREE.Vector3(0, targetYOffset, 0)));

    scene.add(spot);
    scene.add(spot.target);
    return spot;
  }

  // Walls
  const backWallZ = -ROOM_D / 2 + 0.14;
  const leftWallX = -ROOM_W / 2 + 0.14;
  const rightWallX = ROOM_W / 2 - 0.14;

  // ---- Divider ----
  const dividerMat = new THREE.MeshStandardMaterial({ color: 0x3e1616, roughness: 0.85, metalness: 0.05 });
  const dividerT = 0.22;
  const dividerZ = -ROOM_D * 0.10;
  const GAP_W = 5.2;
  const SIDE_W = (ROOM_W - GAP_W) / 2;

  const leftDivider = new THREE.Mesh(new THREE.BoxGeometry(SIDE_W, ROOM_H, dividerT), dividerMat);
  leftDivider.position.set(-(GAP_W / 2 + SIDE_W / 2), ROOM_H / 2, dividerZ);
  leftDivider.castShadow = true;
  leftDivider.receiveShadow = true;
  scene.add(leftDivider);
  collidables.push(leftDivider);

  const rightDivider = new THREE.Mesh(new THREE.BoxGeometry(SIDE_W, ROOM_H, dividerT), dividerMat);
  rightDivider.position.set((GAP_W / 2 + SIDE_W / 2), ROOM_H / 2, dividerZ);
  rightDivider.castShadow = true;
  rightDivider.receiveShadow = true;
  scene.add(rightDivider);
  collidables.push(rightDivider);

  // =========================================================
  // ARTWORKS + STANDS (dosya isimlerine göre)
  // =========================================================

  // 1) Mona Lisa
  const mona = createArtwork({
    imageUrl: "/artworks/mona_lisa.jpg",
    title: "Mona Lisa — Leonardo da Vinci",
    w: 1.05,
    h: 1.55,
    frameWidth: 0.12,
    frameColor: 0x2a1a12,
    frameShape: "rect",
  });

  const monaObj = addArt(mona, leftDivider.position.x, 2.85, dividerZ + dividerT / 2 + 0.08, 0);

  addStandForArt(
    monaObj,
    {
      title: "Mona Lisa",
      artist: "Leonardo da Vinci",
      year: "c. 1503–1519",
      technique: "Ahşap panel üzerine yağlı boya",
      imageUrl: "/artworks/mona_lisa.jpg",
      text:
        "Mona Lisa, Batı sanat tarihinin en çok tartışılan ve en çok bilinen portrelerinden biridir. Eserin gücü, yüz ifadesindeki belirsizlik (özellikle “gülümseme” etkisi), yumuşak geçişlerle modellenmiş cilt tonları ve arka plandaki atmosferik perspektiften gelir.\n\nLeonardo’nun sfumato tekniği, keskin konturlar yerine sisli geçişler yaratarak figürü canlı ve derinlikli gösterir. Figürün üç çeyrek duruşu ve izleyiciyle kurduğu doğrudan göz teması, portre geleneğinde yeni bir etki yaratmıştır.\n\nEser bugün Louvre Müzesi’nde sergilenir ve Rönesans’ın insan merkezli bakışını simgeleyen bir ikon haline gelmiştir.",
    },
    { distFromWall: 1.1 }
  );

  addSoftSpotForArt(monaObj, { intensity: 3.2, angle: Math.PI / 12, penumbra: 0.72, forwardOffset: 1.5, heightOffset: 2.5 });

  // 2) Back wall left: a1.jpg (Landscape)
  const back1 = addArt(
    createArtwork({ imageUrl: "/artworks/a1.jpg", title: "Landscape Study — (Koleksiyon)", w: 3.6, h: 1.8, frameWidth: 0.14, frameColor: 0x1f140c, frameShape: "rect" }),
    -5.6,
    3.0,
    backWallZ,
    0
  );

  addStandForArt(
    back1,
    {
      title: "Landscape Study",
      artist: "Koleksiyon / Atölye çalışması",
      year: "19.–20. yy (tahmini)",
      technique: "Tuval üzerine yağlı boya (tahmini)",
      imageUrl: "/artworks/a1.jpg",
      text:
        "Bu manzara çalışması, izleyiciyi kompozisyonun derinliğine taşıyan geniş bir ufuk kurgusu üzerine kuruludur. Açık-koyu dengesi, gökyüzü ve arazi katmanlarını birbirinden ayırarak mekânsal hissi güçlendirir.\n\nManzara resminde amaç çoğu zaman “yer”den çok “atmosfer”dir: ışığın kırılması, hava perspektifi ve uzak planların soluklaşması gibi unsurlar, sahneyi daha gerçekçi kılar.\n\nKoleksiyon içinde sergi akışını destekleyen bu tür çalışmalar, ana başyapıtların etrafında ritim ve nefes alanı oluşturur.",
    },
    { distFromWall: 1.3 }
  );

  addSoftSpotForArt(back1, { intensity: 2.6, angle: Math.PI / 10, penumbra: 0.7 });

  // 3) Girl with a Pearl Earring
  const back2 = addArt(
    createArtwork({ imageUrl: "/artworks/Girl_with_a_Pearl_Earring.jpg", title: "Girl with a Pearl Earring — Vermeer", w: 1.5, h: 2.8, frameWidth: 0.16, frameColor: 0x2a1a12, frameShape: "rect" }),
    0.8,
    3.3,
    backWallZ,
    0
  );

  addStandForArt(
    back2,
    {
      title: "Girl with a Pearl Earring",
      artist: "Johannes Vermeer",
      year: "c. 1665",
      technique: "Tuval üzerine yağlı boya",
      imageUrl: "/artworks/Girl_with_a_Pearl_Earring.jpg",
      text:
        "Vermeer’in en tanınan eserlerinden biri olan “Girl with a Pearl Earring”, klasik bir portreden çok bir “tronie” (ifade/karakter çalışması) olarak değerlendirilir. Koyu arka plan, figürü adeta sahne ışığı altındaymış gibi öne çıkarır.\n\nEserin etkisi, minimal kompozisyon içinde ışığın inanılmaz kontrollü kullanımından doğar: yüz ve dudak çevresindeki yumuşak geçişler, gözlerdeki parlak nokta ve inci küpenin küçük ama güçlü yansıması izleyiciyi hemen yakalar.\n\nBaşın hafifçe geriye dönmesi ve yarım açık ağız ifadesi, ‘bir an yakalanmış’ hissi verir; bu da tabloyu sessiz ama unutulmaz kılar.",
    },
    { distFromWall: 1.3 }
  );

  addSoftSpotForArt(back2, { intensity: 2.8, angle: Math.PI / 12, penumbra: 0.75, heightOffset: 2.8 });

  // 4) The Last Supper
  const back3 = addArt(
    createArtwork({ imageUrl: "/artworks/lastsupper.jpg", title: "The Last Supper — Leonardo da Vinci", w: 4.5, h: 3.5, frameWidth: 0.12, frameColor: 0x2b2116, frameShape: "rect" }),
    6.2,
    2.7,
    backWallZ,
    0
  );

  addStandForArt(
    back3,
    {
      title: "The Last Supper",
      artist: "Leonardo da Vinci",
      year: "1495–1498",
      technique: "Duvar resmi (deneysel tempera/yağ karışımı teknik)",
      imageUrl: "/artworks/lastsupper.jpg",
      text:
        "“The Last Supper”, İsa’nın havarilerine ‘içinizden biri bana ihanet edecek’ dediği dramatik anı resmeder. Leonardo burada tek bir sahneyle, on iki farklı psikolojik tepkiyi kompozisyon içinde düzenler.\n\nMerkezi perspektif, tüm kaçış çizgilerini İsa’nın başında toplar. Böylece figürler ve mimikler ne kadar hareketli olursa olsun, izleyicinin gözü sürekli merkeze geri döner. Havarilerin üçlü gruplar halinde düzenlenmesi, sahneye ritim kazandırır.\n\nEserin sanatsal önemi, anlatıyı ‘donmuş bir an’ üzerinden sinematografik bir etkiye dönüştürmesidir.",
    },
    { distFromWall: 1.3 }
  );

  addSoftSpotForArt(back3, { intensity: 2.1, angle: Math.PI / 13, penumbra: 0.8 });

  // Left wall
  const left1 = addArt(
    createArtwork({ imageUrl: "/artworks/vangohcigara.jpg", title: "Van Gogh (Çalışma) — (Koleksiyon)", w: 1.5, h: 2.1, frameWidth: 0.18, frameColor: 0x3a2a12, frameShape: "oval" }),
    leftWallX,
    3.1,
    -10.0,
    Math.PI / 2
  );

  addStandForArt(
    left1,
    {
      title: "Van Gogh Study (Portre)",
      artist: "Vincent van Gogh (atfedilen / çalışma)",
      year: "1880’ler–1890’lar (tahmini)",
      technique: "Tuval üzerine yağlı boya",
      imageUrl: "/artworks/vangohcigara.jpg",
      text:
        "Van Gogh’un portrelerinde yüzey, fırça darbelerinin enerjisiyle ‘canlı’ bir dokuya dönüşür. Bu yaklaşım, klasik portrelerdeki pürüzsüz ideali kırarak daha doğrudan bir duygu aktarımı sağlar.\n\nRenk kontrastları ve hızlı vuruşlar, figürün psikolojisini güçlendirir; izleyici, yalnızca bir yüz değil aynı zamanda bir ruh hâli görür.\n\nBu eser, Van Gogh’un ifade gücünü ve kısa zamanda yoğun etki yaratma becerisini temsil eden bir çalışma olarak sergi rotasına dinamizm katar.",
    },
    { distFromWall: 1.2 }
  );

  addSoftSpotForArt(left1, { intensity: 2.6, forwardOffset: 1.5, heightOffset: 2.6 });

  // Medusa (Caravaggio) — ✅ Stand EKSİKTİ, EKLENDİ
  const left2 = addArt(
    createArtwork({ imageUrl: "/artworks/medusacaravegio.jpg", title: "Medusa — Caravaggio", w: 1.6, h: 1.6, frameWidth: 0.18, frameColor: 0x2d1f10, frameShape: "round" }),
    leftWallX,
    2.8,
    -1.0,
    Math.PI / 2
  );

  addStandForArt(
    left2,
    {
      title: "Medusa",
      artist: "Michelangelo Merisi da Caravaggio",
      year: "c. 1597",
      technique: "Kalkan üzerine yağlı boya",
      imageUrl: "/artworks/medusacaravegio.jpg",
      text:
        "Caravaggio’nun “Medusa”sı, mitolojik bir figürü tek bir çarpıcı an üzerinden sunar: başın kesildiği ve yüz ifadesinin donduğu an. Dramatik ışık-gölge (chiaroscuro) kullanımı, şok ve dehşet duygusunu güçlendirir.\n\nEserin ilginç yönlerinden biri, klasik bir tuval yerine kalkan formuna uygulanmış olmasıdır. Bu, hem işlevsel bir nesneyi sanata dönüştürür hem de Medusa’nın ‘bakışıyla taş kesme’ efsanesini görsel olarak daha etkili kılar.\n\nCaravaggio’nun gerçekçilik yaklaşımı ve teatral ışığı, Barok dönemin duygusal yoğunluğunu burada açık biçimde hissettirir.",
    },
    { distFromWall: 1.2 }
  );

  addSoftSpotForArt(left2, { intensity: 2.4, forwardOffset: 1.5, heightOffset: 2.2 });

  // Osman Hamdi Bey
  const left3 = addArt(
    createArtwork({ imageUrl: "/artworks/osmanhamdikaplumbaga.jpg", title: "Kaplumbağa Terbiyecisi — Osman Hamdi Bey", w: 3.0, h: 4.45, frameWidth: 0.13, frameColor: 0x24170e, frameShape: "rect" }),
    leftWallX,
    3.35,
    7.7,
    Math.PI / 2
  );

  addStandForArt(
    left3,
    {
      title: "Kaplumbağa Terbiyecisi",
      artist: "Osman Hamdi Bey",
      year: "1906 (1. versiyon) / 1907 (2. versiyon)",
      technique: "Tuval üzerine yağlı boya",
      imageUrl: "/artworks/osmanhamdikaplumbaga.jpg",
      text:
        "Osman Hamdi Bey’in en bilinen eserlerinden biri olan “Kaplumbağa Terbiyecisi”, yüzeyde sakin bir sahne gibi görünse de güçlü bir sembolik anlatı taşır. Yaşlı derviş figürünün kaplumbağaları ‘eğitmeye’ çalışması, toplumun dönüşümüne ve değişimin yavaşlığına dair bir metafor olarak yorumlanır.\n\nMekânın mimari detayları, kıyafet dokuları ve objelerin işlenişi, sanatçının arkeolog ve müzeci kimliğiyle de uyumlu bir titizlik taşır. Figürün duruşu ve yüz ifadesi, sabır ile çaresizlik arasında bir gerilim kurar.\n\nEser, Osmanlı modernleşme tartışmalarının kültürel bir yansıması olarak Türk resim tarihinde özel bir yere sahiptir.",
    },
    { distFromWall: 1.2 }
  );

  addSoftSpotForArt(left3, { intensity: 2.4, forwardOffset: 1.7, heightOffset: 2.4, angle: Math.PI / 10 });

  // Right wall
  const right1 = addArt(
    createArtwork({ imageUrl: "/artworks/savasinyuzusalvador.jpg", title: "The Face of War — Salvador Dalí", w: 1.15, h: 2.35, frameWidth: 0.14, frameColor: 0x2a1a12, frameShape: "rect" }),
    rightWallX,
    3.15,
    -10.5,
    -Math.PI / 2
  );

  addStandForArt(
    right1,
    {
      title: "The Face of War",
      artist: "Salvador Dalí",
      year: "1940–1941",
      technique: "Tuval üzerine yağlı boya",
      imageUrl: "/artworks/savasinyuzusalvador.jpg",
      text:
        "Dalí’nin “The Face of War” adlı eseri, savaşın yarattığı travmayı tek bir yüz formu üzerinden tekrar eden bir kabusa dönüştürür. Yüzün içindeki göz ve ağız boşluklarında tekrar eden kafatasları, şiddetin ‘sonsuz döngü’ hissini güçlendirir.\n\nArka plandaki kurak çöl atmosferi, yaşamın çekildiği bir dünyayı çağrıştırır. Dalí’nin sürreal dili burada dekoratif bir hayalden çok psikolojik bir ağırlığa dönüşür.\n\nEser, II. Dünya Savaşı döneminin dehşetiyle ilişkilendirilir ve sanatçının savaş karşısındaki karanlık anlatılarından biri olarak öne çıkar.",
    },
    { distFromWall: 1.2 }
  );

  addSoftSpotForArt(right1, { intensity: 2.7, forwardOffset: 1.5, heightOffset: 2.7 });

  // Right wall middle: a1.jpg (ikinci landscape)
  const right2 = addArt(
    createArtwork({ imageUrl: "/artworks/a1.jpg", title: "Landscape Study — (Koleksiyon)", w: 5.6, h: 4.5, frameWidth: 0.12, frameColor: 0x1f140c, frameShape: "rect" }),
    rightWallX,
    2.7,
    3.4,
    -Math.PI / 2
  );

  addStandForArt(
    right2,
    {
      title: "Landscape Study (II)",
      artist: "Koleksiyon",
      year: "19.–20. yy (tahmini)",
      technique: "Tuval üzerine yağlı boya (tahmini)",
      imageUrl: "/artworks/a1.jpg",
      text:
        "Bu ikinci manzara çalışması, sergi rotasında görsel denge kurmak için kullanılır. Geniş biçim, duvarda yatay bir ‘nefes’ alanı oluşturur.\n\nManzara resimleri çoğu zaman bir ‘ruh hâli’ taşır: ışığın tonu, gökyüzünün açıklığı ve zeminin dokusu, izleyicinin duygusunu yönlendirir.\n\nKoleksiyon eserleri, başyapıtların yanında sergiye süreklilik ve ritim kazandırır.",
    },
    { distFromWall: 1.2 }
  );

  addSoftSpotForArt(right2, { intensity: 2.4, forwardOffset: 1.6, heightOffset: 2.3, angle: Math.PI / 10 });

  // Starry Night
  const right3 = addArt(
    createArtwork({ imageUrl: "/artworks/yıldızlıgeceler.jpg", title: "The Starry Night — Vincent van Gogh", w: 1.25, h: 1.5, frameWidth: 0.16, frameColor: 0x3b2a14, frameShape: "oval" }),
    rightWallX,
    2.75,
    8.5,
    -Math.PI / 2
  );

  addStandForArt(
    right3,
    {
      title: "The Starry Night",
      artist: "Vincent van Gogh",
      year: "1889",
      technique: "Tuval üzerine yağlı boya",
      imageUrl: "/artworks/yıldızlıgeceler.jpg",
      text:
        "“The Starry Night”, Van Gogh’un en ikonik eserlerinden biridir ve gökyüzünü neredeyse fiziksel bir akışkanlıkla betimler. Dönen fırça darbeleri, yıldızların ve bulutların hareket ettiğini hissettirir; gökyüzü durağan bir arka plan değil, eserin ana karakteri gibidir.\n\nAşağıdaki köy ve serviler, yukarıdaki kozmik hareketle tezat kurar. Bu karşıtlık, hem huzur hem de içsel gerilimi aynı anda taşır.\n\nVan Gogh’un resminde renk yalnızca ‘görünüş’ değil ‘duygu’ taşır; bu yüzden eser, post-empresyonizmin ifade gücünü en net gösteren örneklerden sayılır.",
    },
    { distFromWall: 1.2 }
  );

  addSoftSpotForArt(right3, { intensity: 2.3, forwardOffset: 1.5, heightOffset: 2.4 });

  // ---- Portal ----
  const portalIn = new THREE.Vector3(0, 1.6, ROOM_D / 2 - 1.2);
  const portalOut = new THREE.Vector3(0, 1.6, ROOM_D / 2 + 6.0);

  function update(dt) {
    door.update(dt);
  }

  const spawn = {
    outside: new THREE.Vector3(0, 1.6, ROOM_D / 2 + 7),
    inside: new THREE.Vector3(0, 1.6, ROOM_D / 2 - 5),
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
    spawn,
    floorRay,
  };
}
