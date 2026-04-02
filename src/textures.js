import * as THREE from 'https://unpkg.com/three@0.161.0/build/three.module.js';

function makePixelTexture(base, accent, detailChance = 0.2) {
  const size = 16;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, size, size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (Math.random() < detailChance) {
        ctx.fillStyle = accent;
        ctx.fillRect(x, y, 1, 1);
      }
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function buildBlockMaterials() {
  return {
    turf: new THREE.MeshLambertMaterial({ map: makePixelTexture('#4d8a39', '#6cac4f', 0.28) }),
    loam: new THREE.MeshLambertMaterial({ map: makePixelTexture('#6b4f34', '#835f43', 0.22) }),
    basalt: new THREE.MeshLambertMaterial({ map: makePixelTexture('#666973', '#8d9098', 0.22) }),
    trunk: new THREE.MeshLambertMaterial({ map: makePixelTexture('#60452f', '#7f5a39', 0.35) }),
    leaves: new THREE.MeshLambertMaterial({ map: makePixelTexture('#2f7b3f', '#4fa75d', 0.45), transparent: true, opacity: 0.97 }),
    glowshard: new THREE.MeshLambertMaterial({ map: makePixelTexture('#6a5aa4', '#a9a0ff', 0.4), emissive: '#5c4bb0', emissiveIntensity: 0.65 }),
  };
}
