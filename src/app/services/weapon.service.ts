import { Injectable } from '@angular/core';
import * as THREE from 'three';
import { BehaviorSubject, Subject } from 'rxjs';

export interface WeaponStats {
  name: string;
  damage: number;
  fireRate: number; // shots per second
  ammoCapacity: number;
  reloadTime: number; // seconds
  spread: number; // accuracy
  bulletsPerShot: number;
  automatic: boolean;
  color: number;
}

export type WeaponType = 'pistol' | 'rifle' | 'shotgun' | 'sniper';

const WEAPON_CONFIGS: Record<WeaponType, WeaponStats> = {
  pistol: {
    name: 'Plasma Pistol',
    damage: 15,
    fireRate: 4,
    ammoCapacity: 12,
    reloadTime: 1.2,
    spread: 0.02,
    bulletsPerShot: 1,
    automatic: false,
    color: 0x4ecdc4
  },
  rifle: {
    name: 'Assault Rifle',
    damage: 10,
    fireRate: 10,
    ammoCapacity: 30,
    reloadTime: 2.0,
    spread: 0.05,
    bulletsPerShot: 1,
    automatic: true,
    color: 0xe94560
  },
  shotgun: {
    name: 'Scatter Gun',
    damage: 8,
    fireRate: 1.2,
    ammoCapacity: 6,
    reloadTime: 2.5,
    spread: 0.15,
    bulletsPerShot: 8,
    automatic: false,
    color: 0xffcc00
  },
  sniper: {
    name: 'Rail Gun',
    damage: 100,
    fireRate: 0.5,
    ammoCapacity: 5,
    reloadTime: 3.0,
    spread: 0,
    bulletsPerShot: 1,
    automatic: false,
    color: 0x9b59b6
  }
};

@Injectable({
  providedIn: 'root'
})
export class WeaponService {
  private scene!: THREE.Scene;
  private camera!: THREE.Camera;
  private weaponGroup!: THREE.Group;
  private currentWeapon: WeaponType = 'pistol';
  private weapons: Map<WeaponType, THREE.Group> = new Map();
  
  // State
  private ammo: Map<WeaponType, number> = new Map();
  private lastFireTime = 0;
  private isReloading = false;
  private reloadProgress = 0;
  
  // Animation state
  private recoilOffset = 0;
  private bobOffset = 0;
  private swayOffset = { x: 0, y: 0 };
  
  // Observables
  readonly currentWeapon$ = new BehaviorSubject<WeaponType>('pistol');
  readonly ammo$ = new BehaviorSubject<number>(12);
  readonly maxAmmo$ = new BehaviorSubject<number>(12);
  readonly isReloading$ = new BehaviorSubject<boolean>(false);
  readonly reloadProgress$ = new BehaviorSubject<number>(0);
  readonly onFire = new Subject<{ direction: THREE.Vector3; stats: WeaponStats }>();
  readonly onReloadComplete = new Subject<void>();
  
  // Bullet tracers
  private tracers: { mesh: THREE.Line; createdAt: number }[] = [];
  private bulletCasings: { mesh: THREE.Mesh; velocity: THREE.Vector3; createdAt: number }[] = [];
  
  initialize(scene: THREE.Scene, camera: THREE.Camera): void {
    this.scene = scene;
    this.camera = camera;
    
    // Create weapon container attached to camera
    this.weaponGroup = new THREE.Group();
    this.camera.add(this.weaponGroup);
    
    // Create all weapon models
    this.createPistol();
    this.createRifle();
    this.createShotgun();
    this.createSniper();
    
    // Initialize ammo
    Object.keys(WEAPON_CONFIGS).forEach(type => {
      const weapon = type as WeaponType;
      this.ammo.set(weapon, WEAPON_CONFIGS[weapon].ammoCapacity);
    });
    
    // Equip starting weapon
    this.equipWeapon('pistol');
  }
  
  private createPistol(): void {
    const group = new THREE.Group();
    
    // Main body
    const bodyGeom = new THREE.BoxGeometry(0.08, 0.12, 0.25);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x2a2a2a,
      roughness: 0.3,
      metalness: 0.8
    });
    const body = new THREE.Mesh(bodyGeom, bodyMat);
    body.position.set(0, 0, 0);
    group.add(body);
    
    // Barrel
    const barrelGeom = new THREE.BoxGeometry(0.04, 0.04, 0.15);
    const barrel = new THREE.Mesh(barrelGeom, bodyMat);
    barrel.position.set(0, 0.02, -0.18);
    group.add(barrel);
    
    // Handle
    const handleGeom = new THREE.BoxGeometry(0.06, 0.15, 0.08);
    const handleMat = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      roughness: 0.6,
      metalness: 0.2
    });
    const handle = new THREE.Mesh(handleGeom, handleMat);
    handle.position.set(0, -0.12, 0.06);
    handle.rotation.x = 0.2;
    group.add(handle);
    
    // Glowing accent
    const accentGeom = new THREE.BoxGeometry(0.085, 0.02, 0.1);
    const accentMat = new THREE.MeshStandardMaterial({
      color: 0x4ecdc4,
      emissive: 0x4ecdc4,
      emissiveIntensity: 0.5
    });
    const accent = new THREE.Mesh(accentGeom, accentMat);
    accent.position.set(0, 0.07, -0.05);
    group.add(accent);
    
    // Magazine
    const magGeom = new THREE.BoxGeometry(0.04, 0.08, 0.06);
    const mag = new THREE.Mesh(magGeom, bodyMat);
    mag.position.set(0, -0.08, 0.02);
    mag.name = 'magazine';
    group.add(mag);
    
    group.position.set(0.25, -0.2, -0.4);
    group.rotation.y = -0.1;
    group.visible = false;
    
    this.weapons.set('pistol', group);
    this.weaponGroup.add(group);
  }
  
  private createRifle(): void {
    const group = new THREE.Group();
    
    // Main body
    const bodyGeom = new THREE.BoxGeometry(0.08, 0.1, 0.5);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x333333,
      roughness: 0.3,
      metalness: 0.7
    });
    const body = new THREE.Mesh(bodyGeom, bodyMat);
    group.add(body);
    
    // Barrel
    const barrelGeom = new THREE.CylinderGeometry(0.015, 0.02, 0.3, 8);
    const barrel = new THREE.Mesh(barrelGeom, bodyMat);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0, 0.02, -0.38);
    group.add(barrel);
    
    // Stock
    const stockGeom = new THREE.BoxGeometry(0.06, 0.08, 0.2);
    const stock = new THREE.Mesh(stockGeom, bodyMat);
    stock.position.set(0, -0.02, 0.32);
    group.add(stock);
    
    // Handle
    const handleGeom = new THREE.BoxGeometry(0.05, 0.12, 0.06);
    const handleMat = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      roughness: 0.7
    });
    const handle = new THREE.Mesh(handleGeom, handleMat);
    handle.position.set(0, -0.1, 0.1);
    handle.rotation.x = 0.3;
    group.add(handle);
    
    // Magazine
    const magGeom = new THREE.BoxGeometry(0.04, 0.15, 0.08);
    const mag = new THREE.Mesh(magGeom, bodyMat);
    mag.position.set(0, -0.12, -0.05);
    mag.name = 'magazine';
    group.add(mag);
    
    // Red accent
    const accentGeom = new THREE.BoxGeometry(0.085, 0.02, 0.15);
    const accentMat = new THREE.MeshStandardMaterial({
      color: 0xe94560,
      emissive: 0xe94560,
      emissiveIntensity: 0.5
    });
    const accent = new THREE.Mesh(accentGeom, accentMat);
    accent.position.set(0, 0.06, -0.1);
    group.add(accent);
    
    // Sight
    const sightGeom = new THREE.BoxGeometry(0.02, 0.04, 0.06);
    const sight = new THREE.Mesh(sightGeom, bodyMat);
    sight.position.set(0, 0.08, -0.15);
    group.add(sight);
    
    group.position.set(0.3, -0.22, -0.5);
    group.rotation.y = -0.05;
    group.visible = false;
    
    this.weapons.set('rifle', group);
    this.weaponGroup.add(group);
  }
  
  private createShotgun(): void {
    const group = new THREE.Group();
    
    // Body
    const bodyGeom = new THREE.BoxGeometry(0.1, 0.1, 0.6);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x4a3728,
      roughness: 0.6,
      metalness: 0.3
    });
    const body = new THREE.Mesh(bodyGeom, bodyMat);
    group.add(body);
    
    // Double barrel
    const barrelMat = new THREE.MeshStandardMaterial({
      color: 0x2a2a2a,
      roughness: 0.2,
      metalness: 0.9
    });
    
    const barrel1Geom = new THREE.CylinderGeometry(0.025, 0.025, 0.4, 8);
    const barrel1 = new THREE.Mesh(barrel1Geom, barrelMat);
    barrel1.rotation.x = Math.PI / 2;
    barrel1.position.set(-0.02, 0.02, -0.48);
    group.add(barrel1);
    
    const barrel2 = new THREE.Mesh(barrel1Geom, barrelMat);
    barrel2.rotation.x = Math.PI / 2;
    barrel2.position.set(0.02, 0.02, -0.48);
    group.add(barrel2);
    
    // Stock
    const stockGeom = new THREE.BoxGeometry(0.08, 0.12, 0.25);
    const stock = new THREE.Mesh(stockGeom, bodyMat);
    stock.position.set(0, -0.02, 0.38);
    group.add(stock);
    
    // Handle
    const handleGeom = new THREE.BoxGeometry(0.06, 0.15, 0.08);
    const handle = new THREE.Mesh(handleGeom, bodyMat);
    handle.position.set(0, -0.12, 0.15);
    handle.rotation.x = 0.25;
    group.add(handle);
    
    // Yellow accent
    const accentGeom = new THREE.BoxGeometry(0.11, 0.01, 0.1);
    const accentMat = new THREE.MeshStandardMaterial({
      color: 0xffcc00,
      emissive: 0xffcc00,
      emissiveIntensity: 0.4
    });
    const accent = new THREE.Mesh(accentGeom, accentMat);
    accent.position.set(0, 0.06, 0);
    group.add(accent);
    
    group.position.set(0.35, -0.25, -0.55);
    group.rotation.y = -0.08;
    group.visible = false;
    
    this.weapons.set('shotgun', group);
    this.weaponGroup.add(group);
  }
  
  private createSniper(): void {
    const group = new THREE.Group();
    
    // Body
    const bodyGeom = new THREE.BoxGeometry(0.06, 0.08, 0.8);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x1a1a2e,
      roughness: 0.2,
      metalness: 0.8
    });
    const body = new THREE.Mesh(bodyGeom, bodyMat);
    group.add(body);
    
    // Long barrel
    const barrelGeom = new THREE.CylinderGeometry(0.015, 0.02, 0.5, 8);
    const barrel = new THREE.Mesh(barrelGeom, bodyMat);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0, 0.01, -0.62);
    group.add(barrel);
    
    // Scope
    const scopeGeom = new THREE.CylinderGeometry(0.03, 0.03, 0.15, 16);
    const scopeMat = new THREE.MeshStandardMaterial({
      color: 0x111111,
      roughness: 0.1,
      metalness: 0.9
    });
    const scope = new THREE.Mesh(scopeGeom, scopeMat);
    scope.rotation.x = Math.PI / 2;
    scope.position.set(0, 0.08, -0.1);
    group.add(scope);
    
    // Scope lens
    const lensGeom = new THREE.CircleGeometry(0.025, 16);
    const lensMat = new THREE.MeshStandardMaterial({
      color: 0x9b59b6,
      emissive: 0x9b59b6,
      emissiveIntensity: 0.3
    });
    const lensFront = new THREE.Mesh(lensGeom, lensMat);
    lensFront.position.set(0, 0.08, -0.17);
    group.add(lensFront);
    
    // Stock
    const stockGeom = new THREE.BoxGeometry(0.05, 0.1, 0.2);
    const stock = new THREE.Mesh(stockGeom, bodyMat);
    stock.position.set(0, -0.02, 0.48);
    group.add(stock);
    
    // Handle
    const handleGeom = new THREE.BoxGeometry(0.04, 0.12, 0.06);
    const handleMat = new THREE.MeshStandardMaterial({
      color: 0x0a0a0a,
      roughness: 0.8
    });
    const handle = new THREE.Mesh(handleGeom, handleMat);
    handle.position.set(0, -0.1, 0.2);
    handle.rotation.x = 0.2;
    group.add(handle);
    
    // Magazine
    const magGeom = new THREE.BoxGeometry(0.035, 0.1, 0.05);
    const mag = new THREE.Mesh(magGeom, bodyMat);
    mag.position.set(0, -0.1, 0);
    mag.name = 'magazine';
    group.add(mag);
    
    // Purple accent
    const accentGeom = new THREE.BoxGeometry(0.065, 0.015, 0.3);
    const accentMat = new THREE.MeshStandardMaterial({
      color: 0x9b59b6,
      emissive: 0x9b59b6,
      emissiveIntensity: 0.5
    });
    const accent = new THREE.Mesh(accentGeom, accentMat);
    accent.position.set(0, 0.05, -0.2);
    group.add(accent);
    
    group.position.set(0.3, -0.2, -0.6);
    group.rotation.y = -0.05;
    group.visible = false;
    
    this.weapons.set('sniper', group);
    this.weaponGroup.add(group);
  }
  
  equipWeapon(type: WeaponType): void {
    // Hide all weapons
    this.weapons.forEach(weapon => weapon.visible = false);
    
    // Show selected weapon
    const weapon = this.weapons.get(type);
    if (weapon) {
      weapon.visible = true;
      this.currentWeapon = type;
      this.currentWeapon$.next(type);
      
      const stats = WEAPON_CONFIGS[type];
      this.ammo$.next(this.ammo.get(type) || stats.ammoCapacity);
      this.maxAmmo$.next(stats.ammoCapacity);
    }
  }
  
  nextWeapon(): void {
    const types: WeaponType[] = ['pistol', 'rifle', 'shotgun', 'sniper'];
    const currentIndex = types.indexOf(this.currentWeapon);
    const nextIndex = (currentIndex + 1) % types.length;
    this.equipWeapon(types[nextIndex]);
  }
  
  previousWeapon(): void {
    const types: WeaponType[] = ['pistol', 'rifle', 'shotgun', 'sniper'];
    const currentIndex = types.indexOf(this.currentWeapon);
    const prevIndex = (currentIndex - 1 + types.length) % types.length;
    this.equipWeapon(types[prevIndex]);
  }
  
  canFire(): boolean {
    if (this.isReloading) return false;
    
    const currentAmmo = this.ammo.get(this.currentWeapon) || 0;
    if (currentAmmo <= 0) return false;
    
    const stats = WEAPON_CONFIGS[this.currentWeapon];
    const now = performance.now();
    const timeSinceLastFire = (now - this.lastFireTime) / 1000;
    
    return timeSinceLastFire >= 1 / stats.fireRate;
  }
  
  fire(cameraDirection: THREE.Vector3): boolean {
    if (!this.canFire()) return false;
    
    const stats = WEAPON_CONFIGS[this.currentWeapon];
    
    // Decrease ammo
    const currentAmmo = (this.ammo.get(this.currentWeapon) || 0) - 1;
    this.ammo.set(this.currentWeapon, currentAmmo);
    this.ammo$.next(currentAmmo);
    
    this.lastFireTime = performance.now();
    
    // Apply recoil
    this.recoilOffset = 0.08;
    
    // Create muzzle flash
    this.createMuzzleFlash();
    
    // Create bullet tracers for each bullet
    for (let i = 0; i < stats.bulletsPerShot; i++) {
      const spreadDir = cameraDirection.clone();
      if (stats.spread > 0) {
        spreadDir.x += (Math.random() - 0.5) * stats.spread;
        spreadDir.y += (Math.random() - 0.5) * stats.spread;
        spreadDir.z += (Math.random() - 0.5) * stats.spread;
        spreadDir.normalize();
      }
      
      this.createBulletTracer(spreadDir);
      this.onFire.next({ direction: spreadDir, stats });
    }
    
    // Eject casing
    this.ejectCasing();
    
    // Auto reload if empty
    if (currentAmmo <= 0) {
      this.startReload();
    }
    
    return true;
  }
  
  private createMuzzleFlash(): void {
    const weapon = this.weapons.get(this.currentWeapon);
    if (!weapon) return;
    
    const stats = WEAPON_CONFIGS[this.currentWeapon];
    
    // Flash light
    const flash = new THREE.PointLight(stats.color, 3, 5);
    flash.position.set(0, 0, -0.6);
    weapon.add(flash);
    
    // Flash sprite
    const spriteMat = new THREE.SpriteMaterial({
      color: stats.color,
      transparent: true,
      opacity: 1
    });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.scale.set(0.15, 0.15, 0.15);
    sprite.position.set(0, 0.02, -0.6);
    weapon.add(sprite);
    
    // Remove after short time
    setTimeout(() => {
      weapon.remove(flash);
      weapon.remove(sprite);
    }, 50);
  }
  
  private createBulletTracer(direction: THREE.Vector3): void {
    const weapon = this.weapons.get(this.currentWeapon);
    if (!weapon) return;
    
    const stats = WEAPON_CONFIGS[this.currentWeapon];
    
    // Get world position of muzzle
    const muzzlePos = new THREE.Vector3(0, 0, -0.6);
    weapon.localToWorld(muzzlePos);
    
    const endPos = muzzlePos.clone().add(direction.clone().multiplyScalar(100));
    
    const geometry = new THREE.BufferGeometry().setFromPoints([muzzlePos, endPos]);
    const material = new THREE.LineBasicMaterial({
      color: stats.color,
      transparent: true,
      opacity: 0.8
    });
    
    const tracer = new THREE.Line(geometry, material);
    this.scene.add(tracer);
    this.tracers.push({ mesh: tracer, createdAt: performance.now() });
  }
  
  private ejectCasing(): void {
    const weapon = this.weapons.get(this.currentWeapon);
    if (!weapon) return;
    
    const casingGeom = new THREE.CylinderGeometry(0.008, 0.008, 0.025, 8);
    const casingMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      roughness: 0.3,
      metalness: 0.9
    });
    const casing = new THREE.Mesh(casingGeom, casingMat);
    
    // Get world position
    const ejectionPos = new THREE.Vector3(0.05, 0.02, -0.3);
    weapon.localToWorld(ejectionPos);
    casing.position.copy(ejectionPos);
    casing.rotation.x = Math.PI / 2;
    
    this.scene.add(casing);
    
    // Random ejection velocity
    const velocity = new THREE.Vector3(
      (Math.random() + 0.5) * 0.1,
      Math.random() * 0.1,
      (Math.random() - 0.5) * 0.05
    );
    
    this.bulletCasings.push({
      mesh: casing,
      velocity,
      createdAt: performance.now()
    });
  }
  
  startReload(): void {
    if (this.isReloading) return;
    
    const stats = WEAPON_CONFIGS[this.currentWeapon];
    const currentAmmo = this.ammo.get(this.currentWeapon) || 0;
    
    if (currentAmmo >= stats.ammoCapacity) return;
    
    this.isReloading = true;
    this.isReloading$.next(true);
    this.reloadProgress = 0;
    this.reloadProgress$.next(0);
  }
  
  update(deltaTime: number, movementSpeed: number): void {
    // Update recoil
    if (this.recoilOffset > 0) {
      this.recoilOffset *= 0.85;
      if (this.recoilOffset < 0.001) this.recoilOffset = 0;
    }
    
    // Weapon bob
    this.bobOffset += deltaTime * movementSpeed * 8;
    
    // Apply weapon position
    const weapon = this.weapons.get(this.currentWeapon);
    if (weapon) {
      const basePos = this.getWeaponBasePosition();
      
      // Add bob
      const bobX = Math.sin(this.bobOffset) * 0.01 * (movementSpeed > 0 ? 1 : 0);
      const bobY = Math.abs(Math.cos(this.bobOffset)) * 0.015 * (movementSpeed > 0 ? 1 : 0);
      
      // Add sway
      this.swayOffset.x *= 0.95;
      this.swayOffset.y *= 0.95;
      
      // Apply recoil
      const recoilZ = this.recoilOffset;
      const recoilY = this.recoilOffset * 0.3;
      
      // Handle reload animation
      if (this.isReloading) {
        const stats = WEAPON_CONFIGS[this.currentWeapon];
        this.reloadProgress += deltaTime / stats.reloadTime;
        this.reloadProgress$.next(Math.min(this.reloadProgress, 1));
        
        // Reload animation phases
        const magazine = weapon.getObjectByName('magazine');
        if (magazine) {
          if (this.reloadProgress < 0.3) {
            // Move mag down
            magazine.position.y = -0.08 - (this.reloadProgress / 0.3) * 0.15;
          } else if (this.reloadProgress < 0.5) {
            // Mag out
            magazine.visible = false;
          } else if (this.reloadProgress < 0.8) {
            // Mag coming back
            magazine.visible = true;
            const t = (this.reloadProgress - 0.5) / 0.3;
            magazine.position.y = -0.23 + t * 0.15;
          } else {
            // Reset mag position
            magazine.position.y = -0.08;
          }
        }
        
        // Weapon tilt during reload
        const tiltAngle = Math.sin(this.reloadProgress * Math.PI) * 0.3;
        weapon.rotation.z = tiltAngle;
        
        if (this.reloadProgress >= 1) {
          this.isReloading = false;
          this.isReloading$.next(false);
          this.reloadProgress = 0;
          this.reloadProgress$.next(0);
          
          // Refill ammo
          this.ammo.set(this.currentWeapon, stats.ammoCapacity);
          this.ammo$.next(stats.ammoCapacity);
          
          // Reset rotation
          weapon.rotation.z = 0;
          
          // Reset magazine
          const mag = weapon.getObjectByName('magazine');
          if (mag) {
            mag.visible = true;
            mag.position.y = -0.08;
          }
          
          this.onReloadComplete.next();
        }
      }
      
      weapon.position.set(
        basePos.x + bobX + this.swayOffset.x,
        basePos.y + bobY + this.swayOffset.y + recoilY,
        basePos.z + recoilZ
      );
    }
    
    // Update tracers
    this.updateTracers();
    
    // Update casings
    this.updateCasings(deltaTime);
  }
  
  private getWeaponBasePosition(): THREE.Vector3 {
    switch (this.currentWeapon) {
      case 'pistol': return new THREE.Vector3(0.25, -0.2, -0.4);
      case 'rifle': return new THREE.Vector3(0.3, -0.22, -0.5);
      case 'shotgun': return new THREE.Vector3(0.35, -0.25, -0.55);
      case 'sniper': return new THREE.Vector3(0.3, -0.2, -0.6);
      default: return new THREE.Vector3(0.25, -0.2, -0.4);
    }
  }
  
  private updateTracers(): void {
    const now = performance.now();
    this.tracers = this.tracers.filter(tracer => {
      const age = now - tracer.createdAt;
      if (age > 100) {
        this.scene.remove(tracer.mesh);
        return false;
      }
      (tracer.mesh.material as THREE.LineBasicMaterial).opacity = 1 - age / 100;
      return true;
    });
  }
  
  private updateCasings(deltaTime: number): void {
    const now = performance.now();
    this.bulletCasings = this.bulletCasings.filter(casing => {
      const age = now - casing.createdAt;
      if (age > 2000) {
        this.scene.remove(casing.mesh);
        return false;
      }
      
      // Apply gravity and velocity
      casing.velocity.y -= 9.8 * deltaTime * 0.01;
      casing.mesh.position.add(casing.velocity);
      casing.mesh.rotation.x += deltaTime * 10;
      casing.mesh.rotation.z += deltaTime * 8;
      
      // Ground collision
      if (casing.mesh.position.y < 0.01) {
        casing.mesh.position.y = 0.01;
        casing.velocity.y = -casing.velocity.y * 0.3;
        casing.velocity.x *= 0.8;
        casing.velocity.z *= 0.8;
      }
      
      return true;
    });
  }
  
  getWeaponStats(type?: WeaponType): WeaponStats {
    return WEAPON_CONFIGS[type || this.currentWeapon];
  }
  
  getCurrentWeapon(): WeaponType {
    return this.currentWeapon;
  }
  
  addSway(deltaX: number, deltaY: number): void {
    this.swayOffset.x += deltaX * 0.001;
    this.swayOffset.y += deltaY * 0.001;
  }
  
  destroy(): void {
    this.weapons.forEach(weapon => {
      this.weaponGroup.remove(weapon);
    });
    this.weapons.clear();
    this.tracers.forEach(t => this.scene.remove(t.mesh));
    this.tracers = [];
    this.bulletCasings.forEach(c => this.scene.remove(c.mesh));
    this.bulletCasings = [];
  }
}
