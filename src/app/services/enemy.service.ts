import { Injectable } from '@angular/core';
import * as THREE from 'three';
import { Subject } from 'rxjs';

export type EnemyType = 'basic' | 'scout' | 'tank' | 'drone';

export interface EnemyStats {
  health: number;
  speed: number;
  damage: number;
  attackRate: number; // attacks per second
  pointValue: number;
  scale: number;
}

export interface Enemy {
  id: string;
  type: EnemyType;
  physicsBodyId: number;
  mesh: THREE.Group;
  health: number;
  maxHealth: number;
  stats: EnemyStats;
  lastAttackTime: number;
  animationPhase: number;
  healthBar?: THREE.Group;
}

const ENEMY_CONFIGS: Record<EnemyType, EnemyStats> = {
  basic: {
    health: 30,
    speed: 3,
    damage: 10,
    attackRate: 1,
    pointValue: 100,
    scale: 1
  },
  scout: {
    health: 15,
    speed: 7,
    damage: 5,
    attackRate: 2,
    pointValue: 75,
    scale: 0.7
  },
  tank: {
    health: 100,
    speed: 1.5,
    damage: 25,
    attackRate: 0.5,
    pointValue: 250,
    scale: 1.5
  },
  drone: {
    health: 20,
    speed: 4,
    damage: 8,
    attackRate: 1.5,
    pointValue: 150,
    scale: 0.6
  }
};

@Injectable({
  providedIn: 'root'
})
export class EnemyService {
  private scene!: THREE.Scene;
  private camera!: THREE.Camera;
  private enemies: Map<string, Enemy> = new Map();
  private nextEnemyId = 0;
  
  readonly onEnemySpawned = new Subject<Enemy>();
  readonly onEnemyDamaged = new Subject<{ enemy: Enemy; damage: number }>();
  readonly onEnemyKilled = new Subject<Enemy>();
  
  initialize(scene: THREE.Scene, camera?: THREE.Camera): void {
    this.scene = scene;
    if (camera) this.camera = camera;
  }
  
  createEnemy(
    type: EnemyType,
    position: { x: number; y: number; z: number },
    physicsBodyId: number
  ): Enemy {
    const stats = { ...ENEMY_CONFIGS[type] };
    const id = `enemy_${this.nextEnemyId++}`;
    
    const mesh = this.createEnemyMesh(type, stats);
    mesh.position.set(position.x, position.y, position.z);
    this.scene.add(mesh);
    
    // Create health bar
    const healthBar = this.createHealthBar(stats.scale, type);
    mesh.add(healthBar);
    
    const enemy: Enemy = {
      id,
      type,
      physicsBodyId,
      mesh,
      health: stats.health,
      maxHealth: stats.health,
      stats,
      lastAttackTime: 0,
      animationPhase: Math.random() * Math.PI * 2,
      healthBar
    };
    
    this.enemies.set(id, enemy);
    this.onEnemySpawned.next(enemy);
    
    return enemy;
  }
  
  private createHealthBar(scale: number, type: EnemyType): THREE.Group {
    const group = new THREE.Group();
    
    // Health bar height based on enemy type
    const yOffset = type === 'drone' ? 2.5 * scale : 2 * scale;
    group.position.y = yOffset;
    
    // Background bar
    const bgGeom = new THREE.PlaneGeometry(1.2, 0.15);
    const bgMat = new THREE.MeshBasicMaterial({
      color: 0x222222,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide
    });
    const bg = new THREE.Mesh(bgGeom, bgMat);
    bg.name = 'healthBarBg';
    group.add(bg);
    
    // Health fill bar
    const fillGeom = new THREE.PlaneGeometry(1.1, 0.1);
    const fillMat = new THREE.MeshBasicMaterial({
      color: 0x00ff00,
      transparent: true,
      opacity: 0.9,
      side: THREE.DoubleSide
    });
    const fill = new THREE.Mesh(fillGeom, fillMat);
    fill.name = 'healthBarFill';
    fill.position.z = 0.01; // Slightly in front
    group.add(fill);
    
    // Border
    const borderGeom = new THREE.EdgesGeometry(bgGeom);
    const borderMat = new THREE.LineBasicMaterial({ color: 0x444444 });
    const border = new THREE.LineSegments(borderGeom, borderMat);
    group.add(border);
    
    return group;
  }
  
  updateHealthBar(enemy: Enemy): void {
    if (!enemy.healthBar) return;
    
    const fill = enemy.healthBar.getObjectByName('healthBarFill') as THREE.Mesh;
    if (fill) {
      const healthPercent = Math.max(0, enemy.health / enemy.maxHealth);
      fill.scale.x = healthPercent;
      fill.position.x = (1 - healthPercent) * -0.55; // Shift to keep left-aligned
      
      // Color based on health
      const mat = fill.material as THREE.MeshBasicMaterial;
      if (healthPercent > 0.6) {
        mat.color.setHex(0x00ff00); // Green
      } else if (healthPercent > 0.3) {
        mat.color.setHex(0xffff00); // Yellow
      } else {
        mat.color.setHex(0xff0000); // Red
      }
    }
    
    // Billboard effect - rotate to face camera Y axis only
    if (this.camera && enemy.healthBar && enemy.mesh) {
      const cameraPos = this.camera.position;
      const meshPos = enemy.mesh.position;
      const angle = Math.atan2(cameraPos.x - meshPos.x, cameraPos.z - meshPos.z);
      enemy.healthBar.rotation.y = angle;
    }
  }
  
  private createEnemyMesh(type: EnemyType, stats: EnemyStats): THREE.Group {
    const group = new THREE.Group();
    const scale = stats.scale;
    
    switch (type) {
      case 'basic':
        this.createBasicRobot(group, scale);
        break;
      case 'scout':
        this.createScoutRobot(group, scale);
        break;
      case 'tank':
        this.createTankRobot(group, scale);
        break;
      case 'drone':
        this.createDrone(group, scale);
        break;
    }
    
    return group;
  }
  
  private createBasicRobot(group: THREE.Group, scale: number): void {
    // Body
    const bodyGeom = new THREE.BoxGeometry(0.8 * scale, 1.2 * scale, 0.5 * scale);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0xff2222,
      roughness: 0.3,
      metalness: 0.7,
      emissive: 0x330000
    });
    const body = new THREE.Mesh(bodyGeom, bodyMat);
    body.position.y = 0.6 * scale;
    body.castShadow = true;
    group.add(body);
    
    // Head
    const headGeom = new THREE.BoxGeometry(0.5 * scale, 0.5 * scale, 0.5 * scale);
    const headMat = new THREE.MeshStandardMaterial({
      color: 0xcc0000,
      roughness: 0.2,
      metalness: 0.8,
      emissive: 0x220000
    });
    const head = new THREE.Mesh(headGeom, headMat);
    head.position.y = 1.45 * scale;
    head.castShadow = true;
    head.name = 'head';
    group.add(head);
    
    // Eyes
    this.addGlowingEyes(group, scale, 0xffff00, 1.45 * scale);
    
    // Arms
    this.addArms(group, scale, 0x880000);
    
    // Legs
    this.addLegs(group, scale, 0x880000);
  }
  
  private createScoutRobot(group: THREE.Group, scale: number): void {
    // Slim body
    const bodyGeom = new THREE.CylinderGeometry(0.25 * scale, 0.3 * scale, 1 * scale, 8);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x00ccff,
      roughness: 0.2,
      metalness: 0.8,
      emissive: 0x003344
    });
    const body = new THREE.Mesh(bodyGeom, bodyMat);
    body.position.y = 0.5 * scale;
    body.castShadow = true;
    group.add(body);
    
    // Small head
    const headGeom = new THREE.SphereGeometry(0.2 * scale, 16, 16);
    const head = new THREE.Mesh(headGeom, bodyMat);
    head.position.y = 1.15 * scale;
    head.name = 'head';
    group.add(head);
    
    // Single eye visor
    const visorGeom = new THREE.BoxGeometry(0.35 * scale, 0.08 * scale, 0.1 * scale);
    const visorMat = new THREE.MeshStandardMaterial({
      color: 0x00ffff,
      emissive: 0x00ffff,
      emissiveIntensity: 1
    });
    const visor = new THREE.Mesh(visorGeom, visorMat);
    visor.position.set(0, 1.15 * scale, 0.15 * scale);
    group.add(visor);
    
    // Speed lines (antenna)
    const antennaGeom = new THREE.CylinderGeometry(0.01 * scale, 0.01 * scale, 0.3 * scale, 4);
    const antenna = new THREE.Mesh(antennaGeom, bodyMat);
    antenna.position.set(0, 1.4 * scale, 0);
    antenna.rotation.z = 0.3;
    group.add(antenna);
    
    // Thin legs
    this.addLegs(group, scale * 0.8, 0x0088aa);
  }
  
  private createTankRobot(group: THREE.Group, scale: number): void {
    // Massive body
    const bodyGeom = new THREE.BoxGeometry(1.2 * scale, 1.4 * scale, 0.8 * scale);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x444444,
      roughness: 0.5,
      metalness: 0.9,
      emissive: 0x111111
    });
    const body = new THREE.Mesh(bodyGeom, bodyMat);
    body.position.y = 0.7 * scale;
    body.castShadow = true;
    group.add(body);
    
    // Armored head
    const headGeom = new THREE.BoxGeometry(0.6 * scale, 0.4 * scale, 0.5 * scale);
    const headMat = new THREE.MeshStandardMaterial({
      color: 0x333333,
      roughness: 0.3,
      metalness: 0.9
    });
    const head = new THREE.Mesh(headGeom, headMat);
    head.position.y = 1.6 * scale;
    head.name = 'head';
    group.add(head);
    
    // Red visor
    const visorGeom = new THREE.BoxGeometry(0.5 * scale, 0.1 * scale, 0.1 * scale);
    const visorMat = new THREE.MeshStandardMaterial({
      color: 0xff0000,
      emissive: 0xff0000,
      emissiveIntensity: 1
    });
    const visor = new THREE.Mesh(visorGeom, visorMat);
    visor.position.set(0, 1.6 * scale, 0.25 * scale);
    group.add(visor);
    
    // Shoulder armor
    const shoulderGeom = new THREE.BoxGeometry(0.4 * scale, 0.3 * scale, 0.4 * scale);
    const leftShoulder = new THREE.Mesh(shoulderGeom, bodyMat);
    leftShoulder.position.set(-0.8 * scale, 1.2 * scale, 0);
    group.add(leftShoulder);
    
    const rightShoulder = new THREE.Mesh(shoulderGeom, bodyMat);
    rightShoulder.position.set(0.8 * scale, 1.2 * scale, 0);
    group.add(rightShoulder);
    
    // Heavy arms
    const armGeom = new THREE.BoxGeometry(0.3 * scale, 0.8 * scale, 0.3 * scale);
    const leftArm = new THREE.Mesh(armGeom, headMat);
    leftArm.position.set(-0.9 * scale, 0.7 * scale, 0);
    leftArm.name = 'leftArm';
    group.add(leftArm);
    
    const rightArm = new THREE.Mesh(armGeom, headMat);
    rightArm.position.set(0.9 * scale, 0.7 * scale, 0);
    rightArm.name = 'rightArm';
    group.add(rightArm);
    
    // Thick legs
    const legGeom = new THREE.BoxGeometry(0.35 * scale, 0.6 * scale, 0.35 * scale);
    const leftLeg = new THREE.Mesh(legGeom, headMat);
    leftLeg.position.set(-0.35 * scale, 0.3 * scale, 0);
    leftLeg.name = 'leftLeg';
    group.add(leftLeg);
    
    const rightLeg = new THREE.Mesh(legGeom, headMat);
    rightLeg.position.set(0.35 * scale, 0.3 * scale, 0);
    rightLeg.name = 'rightLeg';
    group.add(rightLeg);
  }
  
  private createDrone(group: THREE.Group, scale: number): void {
    // Central sphere
    const coreGeom = new THREE.SphereGeometry(0.25 * scale, 16, 16);
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0x9b59b6,
      roughness: 0.2,
      metalness: 0.9,
      emissive: 0x4a2963
    });
    const core = new THREE.Mesh(coreGeom, coreMat);
    core.position.y = 2 * scale; // Float above ground
    core.castShadow = true;
    core.name = 'head';
    group.add(core);
    
    // Ring around core
    const ringGeom = new THREE.TorusGeometry(0.35 * scale, 0.03 * scale, 8, 24);
    const ringMat = new THREE.MeshStandardMaterial({
      color: 0x8e44ad,
      roughness: 0.3,
      metalness: 0.8
    });
    const ring = new THREE.Mesh(ringGeom, ringMat);
    ring.position.y = 2 * scale;
    ring.rotation.x = Math.PI / 2;
    ring.name = 'ring';
    group.add(ring);
    
    // Propellers (4 arms)
    const propellerMat = new THREE.MeshStandardMaterial({
      color: 0x666666,
      roughness: 0.4,
      metalness: 0.6
    });
    
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2;
      const armGeom = new THREE.BoxGeometry(0.4 * scale, 0.02 * scale, 0.08 * scale);
      const arm = new THREE.Mesh(armGeom, propellerMat);
      arm.position.set(
        Math.cos(angle) * 0.45 * scale,
        2 * scale,
        Math.sin(angle) * 0.45 * scale
      );
      arm.rotation.y = angle;
      group.add(arm);
      
      // Rotor
      const rotorGeom = new THREE.CylinderGeometry(0.12 * scale, 0.12 * scale, 0.02 * scale, 16);
      const rotor = new THREE.Mesh(rotorGeom, propellerMat);
      rotor.position.set(
        Math.cos(angle) * 0.55 * scale,
        2 * scale,
        Math.sin(angle) * 0.55 * scale
      );
      rotor.name = `rotor_${i}`;
      group.add(rotor);
    }
    
    // Eye
    const eyeGeom = new THREE.SphereGeometry(0.1 * scale, 16, 16);
    const eyeMat = new THREE.MeshStandardMaterial({
      color: 0xff00ff,
      emissive: 0xff00ff,
      emissiveIntensity: 1
    });
    const eye = new THREE.Mesh(eyeGeom, eyeMat);
    eye.position.set(0, 2 * scale, 0.2 * scale);
    group.add(eye);
  }
  
  private addGlowingEyes(group: THREE.Group, scale: number, color: number, yPos: number): void {
    const eyeGeom = new THREE.SphereGeometry(0.08 * scale, 16, 16);
    const eyeMat = new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: 2
    });
    
    const leftEye = new THREE.Mesh(eyeGeom, eyeMat);
    leftEye.position.set(-0.12 * scale, yPos, 0.25 * scale);
    group.add(leftEye);
    
    const rightEye = new THREE.Mesh(eyeGeom, eyeMat);
    rightEye.position.set(0.12 * scale, yPos, 0.25 * scale);
    group.add(rightEye);
  }
  
  private addArms(group: THREE.Group, scale: number, color: number): void {
    const armGeom = new THREE.BoxGeometry(0.2 * scale, 0.8 * scale, 0.2 * scale);
    const armMat = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.4,
      metalness: 0.6
    });
    
    const leftArm = new THREE.Mesh(armGeom, armMat);
    leftArm.position.set(-0.6 * scale, 0.6 * scale, 0);
    leftArm.name = 'leftArm';
    leftArm.castShadow = true;
    group.add(leftArm);
    
    const rightArm = new THREE.Mesh(armGeom, armMat);
    rightArm.position.set(0.6 * scale, 0.6 * scale, 0);
    rightArm.name = 'rightArm';
    rightArm.castShadow = true;
    group.add(rightArm);
  }
  
  private addLegs(group: THREE.Group, scale: number, color: number): void {
    const legGeom = new THREE.BoxGeometry(0.18 * scale, 0.5 * scale, 0.18 * scale);
    const legMat = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.5,
      metalness: 0.5
    });
    
    const leftLeg = new THREE.Mesh(legGeom, legMat);
    leftLeg.position.set(-0.2 * scale, 0.25 * scale, 0);
    leftLeg.name = 'leftLeg';
    leftLeg.castShadow = true;
    group.add(leftLeg);
    
    const rightLeg = new THREE.Mesh(legGeom, legMat);
    rightLeg.position.set(0.2 * scale, 0.25 * scale, 0);
    rightLeg.name = 'rightLeg';
    rightLeg.castShadow = true;
    group.add(rightLeg);
  }
  
  updateEnemy(enemy: Enemy, deltaTime: number, playerPos: { x: number; y: number; z: number }): void {
    // Animation phase
    enemy.animationPhase += deltaTime * enemy.stats.speed;
    
    // Animate based on type
    switch (enemy.type) {
      case 'basic':
      case 'scout':
      case 'tank':
        this.animateWalking(enemy, deltaTime);
        break;
      case 'drone':
        this.animateDrone(enemy, deltaTime);
        break;
    }
    
    // Face player
    const dx = playerPos.x - enemy.mesh.position.x;
    const dz = playerPos.z - enemy.mesh.position.z;
    enemy.mesh.rotation.y = Math.atan2(dx, dz);
  }
  
  private animateWalking(enemy: Enemy, deltaTime: number): void {
    const leftArm = enemy.mesh.getObjectByName('leftArm');
    const rightArm = enemy.mesh.getObjectByName('rightArm');
    const leftLeg = enemy.mesh.getObjectByName('leftLeg');
    const rightLeg = enemy.mesh.getObjectByName('rightLeg');
    const head = enemy.mesh.getObjectByName('head');
    
    const swing = Math.sin(enemy.animationPhase * 5) * 0.3;
    
    if (leftArm) leftArm.rotation.x = swing;
    if (rightArm) rightArm.rotation.x = -swing;
    if (leftLeg) leftLeg.rotation.x = -swing * 0.5;
    if (rightLeg) rightLeg.rotation.x = swing * 0.5;
    if (head) head.rotation.y = Math.sin(enemy.animationPhase * 2) * 0.1;
  }
  
  private animateDrone(enemy: Enemy, deltaTime: number): void {
    // Bobbing
    const baseY = 2 * enemy.stats.scale;
    enemy.mesh.position.y = baseY + Math.sin(enemy.animationPhase * 3) * 0.2;
    
    // Spin rotors
    for (let i = 0; i < 4; i++) {
      const rotor = enemy.mesh.getObjectByName(`rotor_${i}`);
      if (rotor) {
        rotor.rotation.y += deltaTime * 30;
      }
    }
    
    // Tilt ring
    const ring = enemy.mesh.getObjectByName('ring');
    if (ring) {
      ring.rotation.z += deltaTime * 2;
    }
  }
  
  damageEnemy(enemy: Enemy, damage: number): boolean {
    enemy.health -= damage;
    this.onEnemyDamaged.next({ enemy, damage });
    
    // Simplified flash effect - optimization
    if (Math.random() > 0.3) { // Only flash 70% of time to reduce thrashing
        enemy.mesh.traverse(child => {
          if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
             if (!child.userData['originalEmissive']) {
               child.userData['originalEmissive'] = child.material.emissive.clone();
             }
             child.material.emissive.setHex(0xffffff);
             // Use a single timeout per hit? No, individual is fine if not creating objects
             setTimeout(() => {
                if (child.userData['originalEmissive']) {
                   (child.material as THREE.MeshStandardMaterial).emissive.copy(child.userData['originalEmissive']);
                }
             }, 50);
          }
        });
    }
    
    if (enemy.health <= 0) {
      this.killEnemy(enemy);
      return true;
    }
    
    return false;
  }
  
  private killEnemy(enemy: Enemy): void {
    // Death explosion effect
    this.createDeathEffect(enemy);
    
    this.scene.remove(enemy.mesh);
    this.enemies.delete(enemy.id);
    this.onEnemyKilled.next(enemy);
  }
  
  private createDeathEffect(enemy: Enemy): void {
    const particleCount = 15;
    const particles: THREE.Mesh[] = [];
    
    const colors = [0xff0000, 0xff4400, 0xffaa00, 0xffff00];
    
    for (let i = 0; i < particleCount; i++) {
      const geom = new THREE.BoxGeometry(0.1, 0.1, 0.1);
      const mat = new THREE.MeshBasicMaterial({
        color: colors[Math.floor(Math.random() * colors.length)],
        transparent: true,
        opacity: 1
      });
      const particle = new THREE.Mesh(geom, mat);
      particle.position.copy(enemy.mesh.position);
      particle.position.y += 0.5;
      
      const vel = new THREE.Vector3(
        (Math.random() - 0.5) * 0.4,
        Math.random() * 0.4,
        (Math.random() - 0.5) * 0.4
      );
      (particle as any).velocity = vel;
      
      this.scene.add(particle);
      particles.push(particle);
    }
    
    let frame = 0;
    const animate = () => {
      frame++;
      particles.forEach(p => {
        const vel = (p as any).velocity as THREE.Vector3;
        p.position.add(vel);
        vel.y -= 0.015;
        p.rotation.x += 0.1;
        p.rotation.y += 0.1;
        (p.material as THREE.MeshBasicMaterial).opacity -= 0.03;
        p.scale.multiplyScalar(0.97);
      });
      
      if (frame < 40) {
        requestAnimationFrame(animate);
      } else {
        particles.forEach(p => this.scene.remove(p));
      }
    };
    animate();
  }
  
  canAttack(enemy: Enemy): boolean {
    const now = performance.now();
    const timeSinceLastAttack = (now - enemy.lastAttackTime) / 1000;
    return timeSinceLastAttack >= 1 / enemy.stats.attackRate;
  }
  
  attack(enemy: Enemy): number {
    enemy.lastAttackTime = performance.now();
    return enemy.stats.damage;
  }
  
  getEnemy(id: string): Enemy | undefined {
    return this.enemies.get(id);
  }
  
  getAllEnemies(): Enemy[] {
    return Array.from(this.enemies.values());
  }
  
  removeEnemy(id: string): void {
    const enemy = this.enemies.get(id);
    if (enemy) {
      this.scene.remove(enemy.mesh);
      this.enemies.delete(id);
    }
  }
  
  getRandomEnemyType(difficulty: number = 1): EnemyType {
    // More difficult enemies spawn at higher difficulties
    const rand = Math.random();
    
    if (difficulty < 3) {
      // Early game: mostly basic, some scouts
      if (rand < 0.7) return 'basic';
      return 'scout';
    } else if (difficulty < 6) {
      // Mid game: mix of all
      if (rand < 0.3) return 'basic';
      if (rand < 0.55) return 'scout';
      if (rand < 0.8) return 'drone';
      return 'tank';
    } else {
      // Late game: harder enemies
      if (rand < 0.2) return 'basic';
      if (rand < 0.4) return 'scout';
      if (rand < 0.7) return 'drone';
      return 'tank';
    }
  }
  
  destroy(): void {
    this.enemies.forEach(enemy => {
      this.scene.remove(enemy.mesh);
    });
    this.enemies.clear();
  }
}
