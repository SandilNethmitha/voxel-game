import * as THREE from 'https://unpkg.com/three@0.161.0/build/three.module.js';
import { buildBlockMaterials } from './textures.js';
import { VoxelWorld } from './world.js';
import { PlayerController } from './player.js';
import { Inventory } from './inventory.js';
import { RECIPES, craft } from './crafting.js';
import { renderHUD } from './ui.js';
import { saveGame, loadGame } from './saveLoad.js';

const scene = new THREE.Scene();
scene.background = new THREE.Color('#88b8f7');
scene.fog = new THREE.Fog('#88b8f7', 20, 80);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 150);
const renderer = new THREE.WebGLRenderer({ antialias: false });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
document.body.appendChild(renderer.domElement);

const ambient = new THREE.AmbientLight('#9db5ff', 0.65);
const sun = new THREE.DirectionalLight('#fff3d2', 1.0);
sun.position.set(10, 30, 6);
scene.add(ambient, sun);

const save = loadGame();
const inventory = new Inventory(save?.inventory);
const world = new VoxelWorld(scene, buildBlockMaterials(), save?.overrides ?? {});
const player = new PlayerController(camera, renderer.domElement);
if (save?.playerPos) player.position.fromArray(save.playerPos);

const raycaster = new THREE.Raycaster();
raycaster.far = 6;

const hud = document.querySelector('#hud');
const hotbar = document.querySelector('#hotbar');
const crafting = document.querySelector('#crafting');
const messageEl = document.querySelector('#message');
const playOverlay = document.querySelector('#clickToPlay');
const playBtn = document.querySelector('#playBtn');

playBtn.addEventListener('click', () => renderer.domElement.requestPointerLock());
document.addEventListener('pointerlockchange', () => {
  playOverlay.style.display = document.pointerLockElement === renderer.domElement ? 'none' : 'grid';
});

window.addEventListener('contextmenu', (e) => e.preventDefault());
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

window.addEventListener('keydown', (e) => {
  const idx = Number(e.key) - 1;
  if (idx >= 0 && idx < 5) inventory.selected = idx;
});

let msgTimer = 0;
const message = { value: '', el: messageEl };
const enemies = [];
let timeOfDay = save?.timeOfDay ?? 10;
let spawnTimer = 0;

function setMessage(text, seconds = 1.8) {
  message.value = text;
  msgTimer = seconds;
}

function spawnEnemy() {
  const geom = new THREE.BoxGeometry(0.8, 1.6, 0.8);
  const mat = new THREE.MeshLambertMaterial({ color: '#5f1020' });
  const e = new THREE.Mesh(geom, mat);
  const angle = Math.random() * Math.PI * 2;
  const dist = 10 + Math.random() * 16;
  e.position.set(player.position.x + Math.cos(angle) * dist, player.position.y, player.position.z + Math.sin(angle) * dist);
  scene.add(e);
  enemies.push(e);
}

window.addEventListener('mousedown', (e) => {
  if (document.pointerLockElement !== renderer.domElement) return;

  raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
  const hits = raycaster.intersectObjects([...world.meshes.values()], false);
  if (!hits.length) return;

  if (e.button === 0) {
    const blockType = world.breakBlock(hits[0].object);
    inventory.add(blockType, 1);
  }

  if (e.button === 2) {
    const type = inventory.currentType();
    if (inventory.consume(type, 1)) {
      const ok = world.placeBlock(hits[0].point, hits[0].face.normal, type);
      if (!ok) inventory.add(type, 1);
    }
  }
});

const clock = new THREE.Clock();
let saveAccumulator = 0;

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05);

  world.ensureChunksAround(player.position.x, player.position.z, 1);
  player.update(dt, world);

  timeOfDay = (timeOfDay + dt * 0.4) % 24;
  const night = timeOfDay >= 18 || timeOfDay < 6;
  const t = Math.max(0.08, Math.sin(((timeOfDay - 6) / 12) * Math.PI));
  ambient.intensity = 0.2 + t * 0.6;
  sun.intensity = 0.12 + t * 1.0;

  spawnTimer += dt;
  if (night && spawnTimer > 3 && enemies.length < 8) {
    spawnEnemy();
    spawnTimer = 0;
  }

  enemies.forEach((enemy, i) => {
    const dir = player.position.clone().sub(enemy.position);
    dir.y = 0;
    const d = dir.length();
    if (d > 0.1) enemy.position.addScaledVector(dir.normalize(), dt * 1.7);
    if (d < 1.2) {
      setMessage('A duskling scratched you! (prototype damage feedback)');
      enemy.position.addScaledVector(dir.normalize(), -2);
    }
    if (d > 50) {
      scene.remove(enemy);
      enemies.splice(i, 1);
    }
  });

  if (msgTimer > 0) {
    msgTimer -= dt;
    if (msgTimer <= 0) message.value = '';
  }

  renderHUD({ hud, hotbar, crafting, message }, player, inventory, timeOfDay, enemies.length, (recipeId) => {
    const recipe = RECIPES.find((r) => r.id === recipeId);
    if (recipe && craft(inventory, recipe)) setMessage(`Crafted ${recipe.name}`);
  });

  saveAccumulator += dt;
  if (saveAccumulator > 4) {
    saveAccumulator = 0;
    saveGame({
      inventory: inventory.items,
      overrides: world.serializeOverrides(),
      playerPos: player.position.toArray(),
      timeOfDay,
    });
  }

  renderer.render(scene, camera);
}

animate();
