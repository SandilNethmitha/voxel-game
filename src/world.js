import * as THREE from 'https://unpkg.com/three@0.161.0/build/three.module.js';

const CHUNK_SIZE = 12;
const WORLD_HEIGHT = 40;
const BASE_LEVEL = 12;

function hash(x, y, z) {
  const n = Math.sin(x * 12.9898 + y * 78.233 + z * 37.719) * 43758.5453123;
  return n - Math.floor(n);
}

function terrainHeight(x, z) {
  return (
    BASE_LEVEL +
    Math.floor(Math.sin(x * 0.11) * 2.5 + Math.cos(z * 0.1) * 2 + Math.sin((x + z) * 0.05) * 3 + hash(x, 0, z) * 2)
  );
}

export class VoxelWorld {
  constructor(scene, materials, overrides = {}) {
    this.scene = scene;
    this.materials = materials;
    this.blockData = new Map();
    this.meshes = new Map();
    this.loadedChunks = new Set();
    this.overrides = new Map(Object.entries(overrides));
    this.blockGeo = new THREE.BoxGeometry(1, 1, 1);
  }

  key(x, y, z) {
    return `${x},${y},${z}`;
  }

  chunkKey(cx, cz) {
    return `${cx},${cz}`;
  }

  isSolid(x, y, z) {
    return this.getBlock(x, y, z) !== 'air';
  }

  getBlock(x, y, z) {
    if (y < 0 || y >= WORLD_HEIGHT) return 'air';
    const k = this.key(x, y, z);
    if (this.blockData.has(k)) return this.blockData.get(k);
    if (this.overrides.has(k)) return this.overrides.get(k);

    const h = terrainHeight(x, z);
    if (y > h) return 'air';

    const caveNoise = hash(x * 0.75, y * 0.68, z * 0.77);
    if (y < h - 2 && y > 4 && caveNoise > 0.8) return 'air';

    if (y === h) return 'turf';
    if (y > h - 3) return 'loam';

    const oreNoise = hash(x * 1.3, y * 1.8, z * 1.2);
    if (y < h - 4 && oreNoise > 0.93) return 'glowshard';

    return 'basalt';
  }

  setBlock(x, y, z, type, recordOverride = true) {
    const k = this.key(x, y, z);
    this.blockData.set(k, type);
    if (recordOverride) this.overrides.set(k, type);

    const mesh = this.meshes.get(k);
    if (mesh) {
      this.scene.remove(mesh);
      this.meshes.delete(k);
    }

    if (type !== 'air') {
      const m = new THREE.Mesh(this.blockGeo, this.materials[type]);
      m.position.set(x + 0.5, y + 0.5, z + 0.5);
      m.userData = { x, y, z, type };
      this.scene.add(m);
      this.meshes.set(k, m);
    }
  }

  ensureChunksAround(px, pz, radius = 1) {
    const cx = Math.floor(px / CHUNK_SIZE);
    const cz = Math.floor(pz / CHUNK_SIZE);
    for (let dz = -radius; dz <= radius; dz++) {
      for (let dx = -radius; dx <= radius; dx++) {
        this.generateChunk(cx + dx, cz + dz);
      }
    }
  }

  generateChunk(cx, cz) {
    const ck = this.chunkKey(cx, cz);
    if (this.loadedChunks.has(ck)) return;

    const startX = cx * CHUNK_SIZE;
    const startZ = cz * CHUNK_SIZE;

    for (let x = startX; x < startX + CHUNK_SIZE; x++) {
      for (let z = startZ; z < startZ + CHUNK_SIZE; z++) {
        const h = terrainHeight(x, z);
        for (let y = 0; y <= h; y++) {
          const type = this.getBlock(x, y, z);
          if (type !== 'air') this.setBlock(x, y, z, type, false);
        }

        if (h > 10 && hash(x, 99, z) > 0.973) this.spawnTree(x, h + 1, z);
      }
    }

    this.loadedChunks.add(ck);
  }

  spawnTree(x, y, z) {
    const height = 3 + Math.floor(hash(x, y, z) * 2);
    for (let i = 0; i < height; i++) this.setBlock(x, y + i, z, 'trunk', false);

    for (let lx = -2; lx <= 2; lx++) {
      for (let lz = -2; lz <= 2; lz++) {
        for (let ly = height - 2; ly <= height; ly++) {
          if (Math.abs(lx) + Math.abs(lz) < 4) this.setBlock(x + lx, y + ly, z + lz, 'leaves', false);
        }
      }
    }
  }

  breakBlock(mesh) {
    const { x, y, z, type } = mesh.userData;
    this.setBlock(x, y, z, 'air');
    return type;
  }

  placeBlock(pos, normal, type) {
    const x = Math.floor(pos.x + normal.x * 0.5);
    const y = Math.floor(pos.y + normal.y * 0.5);
    const z = Math.floor(pos.z + normal.z * 0.5);
    if (!this.isSolid(x, y, z) && y >= 0 && y < WORLD_HEIGHT) {
      this.setBlock(x, y, z, type);
      return true;
    }
    return false;
  }

  serializeOverrides() {
    const out = {};
    this.overrides.forEach((value, key) => {
      out[key] = value;
    });
    return out;
  }
}
