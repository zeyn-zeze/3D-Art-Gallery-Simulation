// src/audio/bgMusic.js
import * as THREE from 'three';

let listener = null;
let sound = null;
let ready = false;
let started = false;

export function initBgMusic(camera, url = '/src/audio/museum.mp3') {
  listener = new THREE.AudioListener();
  camera.add(listener);

  sound = new THREE.Audio(listener);

  const loader = new THREE.AudioLoader();
  loader.load(
    url,
    (buffer) => {
      sound.setBuffer(buffer);
      sound.setLoop(true);
      sound.setVolume(0.0); // sessiz başlat (UI açınca yükseltirsin)
      ready = true;
    },
    undefined,
    (err) => {
      console.error('BG music load error:', err);
    }
  );
}

export function isBgReady() {
  return !!sound && ready;
}

export async function startBgMusic() {
  if (!sound || !ready) return;
  if (started) return;

  // Autoplay kilidi için: AudioContext'i user gesture anında resume et
  const ctx = listener?.context;
  if (ctx && ctx.state !== 'running') {
    try { await ctx.resume(); } catch {}
  }

  try {
    sound.play();
    started = true;
  } catch (e) {
    console.warn('BG music play blocked:', e);
  }
}

export function setBgVolume(v) {
  if (sound) sound.setVolume(v);
}

export function stopBgMusic() {
  if (sound && sound.isPlaying) sound.stop();
  started = false;
}
