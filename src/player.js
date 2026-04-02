import * as THREE from 'https://unpkg.com/three@0.161.0/build/three.module.js';

export class PlayerController {
  constructor(camera, domElement) {
    this.camera = camera;
    this.domElement = domElement;
    this.velocity = new THREE.Vector3();
    this.direction = new THREE.Vector3();
    this.keys = {};
    this.pitch = 0;
    this.yaw = 0;
    this.height = 1.72;
    this.speed = 4.8;
    this.sprintMultiplier = 1.55;
    this.jumpVelocity = 6.5;
    this.gravity = 18;
    this.grounded = false;

    this.position = new THREE.Vector3(0, 24, 0);
    this.camera.position.copy(this.position);

    this.bindEvents();
  }

  bindEvents() {
    window.addEventListener('keydown', (e) => (this.keys[e.code] = true));
    window.addEventListener('keyup', (e) => (this.keys[e.code] = false));

    window.addEventListener('mousemove', (e) => {
      if (document.pointerLockElement !== this.domElement) return;
      const s = 0.002;
      this.yaw -= e.movementX * s;
      this.pitch -= e.movementY * s;
      this.pitch = Math.max(-Math.PI / 2 + 0.01, Math.min(Math.PI / 2 - 0.01, this.pitch));
      this.camera.rotation.set(this.pitch, this.yaw, 0, 'YXZ');
    });
  }

  update(dt, world) {
    this.direction.set(0, 0, 0);
    if (this.keys.KeyW) this.direction.z -= 1;
    if (this.keys.KeyS) this.direction.z += 1;
    if (this.keys.KeyA) this.direction.x -= 1;
    if (this.keys.KeyD) this.direction.x += 1;
    this.direction.normalize();

    const forward = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);
    const right = new THREE.Vector3(1, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);
    const move = new THREE.Vector3();
    move.addScaledVector(forward, this.direction.z);
    move.addScaledVector(right, this.direction.x);
    move.normalize();

    const targetSpeed = this.speed * (this.keys.ShiftLeft ? this.sprintMultiplier : 1);
    this.velocity.x = move.x * targetSpeed;
    this.velocity.z = move.z * targetSpeed;

    if (this.keys.Space && this.grounded) {
      this.velocity.y = this.jumpVelocity;
      this.grounded = false;
    }

    this.velocity.y -= this.gravity * dt;

    const next = this.position.clone().addScaledVector(this.velocity, dt);
    const footY = Math.floor(next.y - this.height);
    const belowSolid = world.isSolid(Math.floor(next.x), footY, Math.floor(next.z));
    if (belowSolid && this.velocity.y <= 0) {
      next.y = Math.ceil(next.y - this.height) + this.height;
      this.velocity.y = 0;
      this.grounded = true;
    } else {
      this.grounded = false;
    }

    this.position.copy(next);
    this.camera.position.copy(this.position);
  }
}
