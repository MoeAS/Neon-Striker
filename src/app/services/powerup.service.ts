import { Injectable } from '@angular/core';
import * as THREE from 'three';
import { Subject } from 'rxjs';

export type PowerUpType = 'health' | 'ammo' | 'speed' | 'shield' | 'weapon_rifle' | 'weapon_shotgun' | 'weapon_sniper';

export interface PowerUp {
  id: string;
  type: PowerUpType;
  mesh: THREE.Group;
  position: { x: number; y: number; z: number };
  createdAt: number;
  bobPhase: number;
}

interface PowerUpConfig {
  color: number;
  emissive: number;
  duration?: number; // for timed effects like speed
  value?: number; // for health/ammo amounts
  icon: string;
}

const POWERUP_CONFIGS: Record<PowerUpType, PowerUpConfig> = {
  health: {
    color: 0x00ff00,
    emissive: 0x00ff00,
    value: 50,
    icon: '+'
  },
  ammo: {
    color: 0xffcc00,
    emissive: 0xffcc00,
    value: 30,
    icon: '■'
  },
  speed: {
    color: 0x00ccff,
    emissive: 0x00ccff,
    duration: 10,
    icon: '»'
  },
  shield: {
    color: 0x9b59b6,
    emissive: 0x9b59b6,
    duration: 8,
    value: 50,
    icon: '●'
  },
  weapon_rifle: {
    color: 0xe94560,
    emissive: 0xe94560,
    icon: 'R'
  },
  weapon_shotgun: {
    color: 0xff8800,
    emissive: 0xff8800,
    icon: 'S'
  },
  weapon_sniper: {
    color: 0x8e44ad,
    emissive: 0x8e44ad,
    icon: 'Z'
  }
};

@Injectable({
  providedIn: 'root'
})
export class PowerUpService {
  private scene!: THREE.Scene;
  private powerUps: Map<string, PowerUp> = new Map();
  private nextPowerId = 0;
  
  readonly onPowerUpCollected = new Subject<{ type: PowerUpType; config: PowerUpConfig }>();
  readonly onPowerUpSpawned = new Subject<PowerUp>();
  
  // Active effects
  private activeEffects: Map<PowerUpType, { endTime: number }> = new Map();
  
  initialize(scene: THREE.Scene): void {
    this.scene = scene;
  }
  
  spawnPowerUp(type: PowerUpType, position: { x: number; y: number; z: number }): PowerUp {
    const id = `powerup_${this.nextPowerId++}`;
    const config = POWERUP_CONFIGS[type];
    
    const mesh = this.createPowerUpMesh(type, config);
    mesh.position.set(position.x, position.y + 0.5, position.z);
    this.scene.add(mesh);
    
    const powerUp: PowerUp = {
      id,
      type,
      mesh,
      position,
      createdAt: performance.now(),
      bobPhase: Math.random() * Math.PI * 2
    };
    
    this.powerUps.set(id, powerUp);
    this.onPowerUpSpawned.next(powerUp);
    
    return powerUp;
  }
  
  private createPowerUpMesh(type: PowerUpType, config: PowerUpConfig): THREE.Group {
    const group = new THREE.Group();
    
    // Outer glow ring
    const ringGeom = new THREE.TorusGeometry(0.4, 0.03, 8, 24);
    const ringMat = new THREE.MeshStandardMaterial({
      color: config.color,
      emissive: config.emissive,
      emissiveIntensity: 0.5,
      transparent: true,
      opacity: 0.7
    });
    const ring = new THREE.Mesh(ringGeom, ringMat);
    ring.rotation.x = Math.PI / 2;
    ring.name = 'ring';
    group.add(ring);
    
    // Central item based on type
    if (type === 'health') {
      // Cross shape
      const crossMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        emissive: config.emissive,
        emissiveIntensity: 1
      });
      
      const vertGeom = new THREE.BoxGeometry(0.1, 0.4, 0.1);
      const vert = new THREE.Mesh(vertGeom, crossMat);
      group.add(vert);
      
      const horizGeom = new THREE.BoxGeometry(0.4, 0.1, 0.1);
      const horiz = new THREE.Mesh(horizGeom, crossMat);
      group.add(horiz);
      
    } else if (type === 'ammo') {
      // Bullet shape
      const bulletGeom = new THREE.CylinderGeometry(0.08, 0.08, 0.3, 8);
      const bulletMat = new THREE.MeshStandardMaterial({
        color: 0xd4af37,
        roughness: 0.3,
        metalness: 0.9,
        emissive: config.emissive,
        emissiveIntensity: 0.3
      });
      const bullet = new THREE.Mesh(bulletGeom, bulletMat);
      group.add(bullet);
      
      // Tip
      const tipGeom = new THREE.ConeGeometry(0.08, 0.1, 8);
      const tip = new THREE.Mesh(tipGeom, bulletMat);
      tip.position.y = 0.2;
      group.add(tip);
      
    } else if (type === 'speed') {
      // Lightning bolt
      const boltMat = new THREE.MeshStandardMaterial({
        color: config.color,
        emissive: config.emissive,
        emissiveIntensity: 1
      });
      
      const points = [
        new THREE.Vector3(0.1, 0.25, 0),
        new THREE.Vector3(-0.05, 0.05, 0),
        new THREE.Vector3(0.08, 0, 0),
        new THREE.Vector3(-0.1, -0.25, 0)
      ];
      
      for (let i = 0; i < points.length - 1; i++) {
        const segGeom = new THREE.CylinderGeometry(0.03, 0.03, 
          points[i].distanceTo(points[i + 1]), 4);
        const seg = new THREE.Mesh(segGeom, boltMat);
        seg.position.copy(points[i].clone().add(points[i + 1]).multiplyScalar(0.5));
        seg.lookAt(points[i + 1]);
        seg.rotateX(Math.PI / 2);
        group.add(seg);
      }
      
    } else if (type === 'shield') {
      // Shield shape
      const shieldGeom = new THREE.SphereGeometry(0.2, 16, 16, 0, Math.PI);
      const shieldMat = new THREE.MeshStandardMaterial({
        color: config.color,
        emissive: config.emissive,
        emissiveIntensity: 0.5,
        transparent: true,
        opacity: 0.8,
        side: THREE.DoubleSide
      });
      const shield = new THREE.Mesh(shieldGeom, shieldMat);
      shield.rotation.x = Math.PI / 2;
      group.add(shield);
      
    } else {
      // Weapon pickups - show weapon silhouette
      const weaponMat = new THREE.MeshStandardMaterial({
        color: config.color,
        emissive: config.emissive,
        emissiveIntensity: 0.8
      });
      
      const bodyGeom = new THREE.BoxGeometry(0.3, 0.1, 0.08);
      const body = new THREE.Mesh(bodyGeom, weaponMat);
      body.rotation.z = -0.2;
      group.add(body);
      
      const barrelGeom = new THREE.CylinderGeometry(0.02, 0.02, 0.2, 8);
      const barrel = new THREE.Mesh(barrelGeom, weaponMat);
      barrel.rotation.z = Math.PI / 2;
      barrel.position.set(0.2, 0.02, 0);
      group.add(barrel);
    }
    
    // Point light for glow
    const light = new THREE.PointLight(config.color, 1, 5);
    light.position.set(0, 0.5, 0);
    group.add(light);
    
    return group;
  }
  
  update(deltaTime: number): void {
    const now = performance.now();
    
    this.powerUps.forEach((powerUp, id) => {
      // Bob up and down
      powerUp.bobPhase += deltaTime * 3;
      powerUp.mesh.position.y = powerUp.position.y + 0.5 + Math.sin(powerUp.bobPhase) * 0.15;
      
      // Spin
      powerUp.mesh.rotation.y += deltaTime * 2;
      
      // Ring pulse
      const ring = powerUp.mesh.getObjectByName('ring');
      if (ring) {
        const scale = 1 + Math.sin(powerUp.bobPhase * 2) * 0.1;
        ring.scale.set(scale, scale, 1);
      }
      
      // Despawn after 30 seconds
      if (now - powerUp.createdAt > 30000) {
        this.removePowerUp(id);
      }
    });
    
    // Check expired effects
    this.activeEffects.forEach((effect, type) => {
      if (now > effect.endTime) {
        this.activeEffects.delete(type);
      }
    });
  }
  
  checkCollection(playerPos: { x: number; y: number; z: number }, collectionRadius: number = 1.5): PowerUp | null {
    for (const [id, powerUp] of this.powerUps) {
      const dx = playerPos.x - powerUp.position.x;
      const dy = playerPos.y - powerUp.position.y;
      const dz = playerPos.z - powerUp.position.z;
      const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
      
      if (distance < collectionRadius) {
        const config = POWERUP_CONFIGS[powerUp.type];
        this.onPowerUpCollected.next({ type: powerUp.type, config });
        this.removePowerUp(id);
        
        // Apply timed effects
        if (config.duration) {
          this.activeEffects.set(powerUp.type, {
            endTime: performance.now() + config.duration * 1000
          });
        }
        
        return powerUp;
      }
    }
    
    return null;
  }
  
  removePowerUp(id: string): void {
    const powerUp = this.powerUps.get(id);
    if (powerUp) {
      // Fade out animation
      const fadeOut = () => {
        let opacity = 1;
        const fade = () => {
          opacity -= 0.1;
          powerUp.mesh.traverse(child => {
            if (child instanceof THREE.Mesh && child.material) {
              (child.material as THREE.MeshStandardMaterial).opacity = opacity;
            }
          });
          
          if (opacity > 0) {
            requestAnimationFrame(fade);
          } else {
            this.scene.remove(powerUp.mesh);
          }
        };
        fade();
      };
      
      fadeOut();
      this.powerUps.delete(id);
    }
  }
  
  isEffectActive(type: PowerUpType): boolean {
    const effect = this.activeEffects.get(type);
    if (!effect) return false;
    return performance.now() < effect.endTime;
  }
  
  getEffectTimeRemaining(type: PowerUpType): number {
    const effect = this.activeEffects.get(type);
    if (!effect) return 0;
    return Math.max(0, (effect.endTime - performance.now()) / 1000);
  }
  
  getRandomPowerUpType(): PowerUpType {
    const types: PowerUpType[] = ['health', 'ammo', 'speed', 'shield', 'weapon_rifle', 'weapon_shotgun', 'weapon_sniper'];
    const weights = [0.25, 0.25, 0.15, 0.1, 0.1, 0.1, 0.05];
    
    const rand = Math.random();
    let cumulative = 0;
    
    for (let i = 0; i < types.length; i++) {
      cumulative += weights[i];
      if (rand < cumulative) {
        return types[i];
      }
    }
    
    return 'health';
  }
  
  getConfig(type: PowerUpType): PowerUpConfig {
    return POWERUP_CONFIGS[type];
  }
  
  destroy(): void {
    this.powerUps.forEach((powerUp) => {
      this.scene.remove(powerUp.mesh);
    });
    this.powerUps.clear();
    this.activeEffects.clear();
  }
}
