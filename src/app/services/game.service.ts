import { Injectable, NgZone } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { PhysicsService } from './physics.service';
import { RendererService } from './renderer.service';
import { InputService } from './input.service';
import { WeaponService, WeaponType } from './weapon.service';
import { EnemyService, EnemyType, Enemy } from './enemy.service';
import { PowerUpService, PowerUpType } from './powerup.service';
import { SoundService } from './sound.service';
import * as THREE from 'three';

export type GameState = 'menu' | 'playing' | 'paused' | 'gameover';
export type LevelTheme = 'neon' | 'industrial' | 'cyber';

export interface LevelConfig {
  theme: LevelTheme;
  arenaSize: number;
  obstacleCount: number;
  spawnInterval: number;
  maxEnemies: number;
  colors: {
    floor: number;
    walls: number;
    obstacles: number[];
    fog: number;
  };
}

const LEVEL_CONFIGS: LevelConfig[] = [
  // Level 1: Neon
  {
    theme: 'neon',
    arenaSize: 40,
    obstacleCount: 12,
    spawnInterval: 3,
    maxEnemies: 8,
    colors: {
      floor: 0x16213e,
      walls: 0x16213e,
      obstacles: [0x0f3460, 0x533483],
      fog: 0x1a1a2e
    }
  },
  // Level 2: Industrial
  {
    theme: 'industrial',
    arenaSize: 45,
    obstacleCount: 15,
    spawnInterval: 2.5,
    maxEnemies: 10,
    colors: {
      floor: 0x2c2c2c,
      walls: 0x1a1a1a,
      obstacles: [0x444444, 0x666666],
      fog: 0x0a0a0a
    }
  },
  // Level 3: Cyber
  {
    theme: 'cyber',
    arenaSize: 50,
    obstacleCount: 18,
    spawnInterval: 2,
    maxEnemies: 12,
    colors: {
      floor: 0x0a0a20,
      walls: 0x0a0a15,
      obstacles: [0x00ffff, 0xff00ff],
      fog: 0x050510
    }
  }
];

@Injectable({
  providedIn: 'root'
})
export class GameService {
  // Game state
  readonly state$ = new BehaviorSubject<GameState>('menu');
  readonly score$ = new BehaviorSubject<number>(0);
  readonly health$ = new BehaviorSubject<number>(100);
  readonly maxHealth$ = new BehaviorSubject<number>(100);
  readonly shield$ = new BehaviorSubject<number>(0);
  readonly kills$ = new BehaviorSubject<number>(0);
  readonly level$ = new BehaviorSubject<number>(1);
  readonly wave$ = new BehaviorSubject<number>(1);
  
  readonly onEnemyKilled = new Subject<{ position: { x: number; y: number; z: number } }>();
  readonly onPlayerHit = new Subject<void>();
  readonly onLevelUp = new Subject<number>();
  
  // Player
  private playerBodyId: number = -1;
  private playerYaw = 0;
  private playerPitch = 0;
  private movementSpeed = 0;
  
  // Enemies (tracked by physics body ID)
  private enemyBodyMap: Map<number, Enemy> = new Map();
  private spawnTimer = 0;
  private powerUpSpawnTimer = 0;
  private readonly POWERUP_SPAWN_INTERVAL = 15;
  
  // Level
  private currentLevel = 0;
  private killsThisLevel = 0;
  private readonly KILLS_PER_LEVEL = 15;
  
  // Game loop
  private animationFrameId: number = 0;
  private lastTime = 0;
  private initialized = false;
  
  // Settings
  private readonly MOUSE_SENSITIVITY = 0.002;
  private readonly BASE_MOVE_SPEED = 8;
  private readonly SPRINT_MULTIPLIER = 1.6;
  private readonly JUMP_IMPULSE = 8;
  
  constructor(
    private physics: PhysicsService,
    private renderer: RendererService,
    private input: InputService,
    private weapons: WeaponService,
    private enemies: EnemyService,
    private powerUps: PowerUpService,
    private sound: SoundService,
    private ngZone: NgZone
  ) {}
  
  async initialize(canvas: HTMLCanvasElement): Promise<void> {
    // Initialize services
    await this.physics.initialize();
    this.renderer.initialize(canvas);
    this.input.initialize(canvas);
    await this.sound.initialize();
    
    const scene = this.renderer.getScene();
    const camera = this.renderer.getCamera();
    
    this.weapons.initialize(scene, camera);
    this.enemies.initialize(scene, camera);
    this.powerUps.initialize(scene);
    
    // Setup world
    this.createLevel(0);
    this.createPlayer();
    
    // Input handlers
    this.setupInputHandlers();
    
    // Weapon fire handler
    this.weapons.onFire.subscribe(({ direction, stats }) => {
      this.handleWeaponFire(direction, stats.damage);
    });
    
    // Power-up collection
    this.powerUps.onPowerUpCollected.subscribe(({ type, config }) => {
      this.handlePowerUpCollected(type, config);
    });
    
    // Enemy death
    this.enemies.onEnemyKilled.subscribe(enemy => {
      this.handleEnemyKilled(enemy);
    });
    
    this.initialized = true;
  }
  
  private setupInputHandlers(): void {
    this.input.onShoot.subscribe(() => {
      if (this.state$.value !== 'playing') return;
      
      const direction = this.renderer.getCameraDirection();
      const weaponType = this.weapons.getCurrentWeapon();
      
      if (this.weapons.canFire()) {
        this.weapons.fire(direction);
        this.sound.playWeaponFire(weaponType);
      } else if ((this.weapons.ammo$.value || 0) <= 0) {
        this.sound.play('empty_click');
      }
    });
    
    this.input.onPause.subscribe(() => this.togglePause());
  }
  
  private createLevel(levelIndex: number): void {
    this.currentLevel = levelIndex;
    const config = LEVEL_CONFIGS[levelIndex % LEVEL_CONFIGS.length];
    const size = config.arenaSize;
    const wallHeight = 5;
    const wallThickness = 1;
    
    // Update scene fog
    const scene = this.renderer.getScene();
    scene.fog = new THREE.Fog(config.colors.fog, 10, 100);
    scene.background = new THREE.Color(config.colors.fog);
    
    // Floor
    this.createFloor(size, config);
    this.physics.createBox(
      { x: size, y: 0.5, z: size },
      { x: 0, y: -0.5, z: 0 },
      true
    );
    
    // Walls
    const wallColor = config.colors.walls;
    this.createWall({ x: 0, y: wallHeight / 2, z: -size }, { x: size, y: wallHeight / 2, z: wallThickness }, wallColor);
    this.createWall({ x: 0, y: wallHeight / 2, z: size }, { x: size, y: wallHeight / 2, z: wallThickness }, wallColor);
    this.createWall({ x: size, y: wallHeight / 2, z: 0 }, { x: wallThickness, y: wallHeight / 2, z: size }, wallColor);
    this.createWall({ x: -size, y: wallHeight / 2, z: 0 }, { x: wallThickness, y: wallHeight / 2, z: size }, wallColor);
    
    // Obstacles with varied positions per level
    this.createObstacles(config);
  }
  
  private createFloor(size: number, config: LevelConfig): void {
    const scene = this.renderer.getScene();
    const geometry = new THREE.PlaneGeometry(size * 2, size * 2, 50, 50);
    
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;
    
    // Background
    const floorColor = new THREE.Color(config.colors.floor);
    ctx.fillStyle = `#${floorColor.getHexString()}`;
    ctx.fillRect(0, 0, 512, 512);
    
    // Grid lines
    ctx.strokeStyle = `rgba(255, 255, 255, 0.1)`;
    ctx.lineWidth = 1;
    const gridSize = 32;
    for (let i = 0; i <= 512; i += gridSize) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, 512);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(512, i);
      ctx.stroke();
    }
    
    // Theme-specific accent lines
    const accentColor = config.theme === 'neon' ? '#e94560' : 
                        config.theme === 'industrial' ? '#ff8800' : '#00ffff';
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 2;
    for (let i = 0; i <= 512; i += 128) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, 512);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(512, i);
      ctx.stroke();
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(size / 10, size / 10);
    
    const material = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.8,
      metalness: 0.2
    });
    
    const floor = new THREE.Mesh(geometry, material);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    
    scene.add(floor);
  }
  
  private createWall(pos: { x: number; y: number; z: number }, size: { x: number; y: number; z: number }, color: number): void {
    const bodyId = this.physics.createBox(size, pos, true);
    this.renderer.createBox(`wall_${bodyId}`, size, pos, color, bodyId);
  }
  
  private createObstacles(config: LevelConfig): void {
    const size = config.arenaSize;
    const count = config.obstacleCount;
    
    for (let i = 0; i < count; i++) {
      // Generate position with some randomness but avoiding center
      let x, z;
      do {
        x = (Math.random() - 0.5) * (size - 5) * 1.5;
        z = (Math.random() - 0.5) * (size - 5) * 1.5;
      } while (Math.sqrt(x * x + z * z) < 5); // Keep center clear
      
      const height = 1 + Math.random() * 2;
      const width = 1 + Math.random() * 1.5;
      const colorIndex = i % config.colors.obstacles.length;
      const color = config.colors.obstacles[colorIndex];
      
      const bodyId = this.physics.createBox(
        { x: width, y: height, z: width },
        { x, y: height, z },
        true
      );
      
      this.renderer.createBox(
        `obstacle_${i}`,
        { x: width, y: height, z: width },
        { x, y: height, z },
        color,
        bodyId
      );
    }
  }
  
  private createPlayer(): void {
    this.playerBodyId = this.physics.createCapsule(
      0.5, 
      0.4, 
      { x: 0, y: 2, z: 0 },
      false
    );
  }
  
  start(): void {
    if (!this.initialized) return;
    
    // Reset game state
    this.score$.next(0);
    this.health$.next(100);
    this.shield$.next(0);
    this.kills$.next(0);
    this.level$.next(1);
    this.wave$.next(1);
    this.playerYaw = 0;
    this.playerPitch = 0;
    this.killsThisLevel = 0;
    
    // Clear enemies
    this.enemies.destroy();
    this.enemyBodyMap.clear();
    
    // Clear power-ups
    this.powerUps.destroy();
    
    // Reset player
    this.physics.setBodyPosition(this.playerBodyId, { x: 0, y: 2, z: 0 });
    this.physics.setLinearVelocity(this.playerBodyId, { x: 0, y: 0, z: 0 });
    
    // Equip starting weapon
    this.weapons.equipWeapon('pistol');
    
    this.state$.next('playing');
    this.spawnTimer = 0;
    this.powerUpSpawnTimer = 0;
    this.lastTime = performance.now();
    
    this.sound.play('game_start');
    
    this.ngZone.runOutsideAngular(() => {
      this.gameLoop();
    });
  }
  
  private gameLoop(): void {
    if (this.state$.value !== 'playing') {
      return;
    }
    
    const now = performance.now();
    const deltaTime = Math.min((now - this.lastTime) / 1000, 0.1);
    this.lastTime = now;
    
    this.update(deltaTime);
    this.renderer.render();
    
    this.animationFrameId = requestAnimationFrame(() => this.gameLoop());
  }
  
  private update(deltaTime: number): void {
    const input = this.input.getState();
    const config = LEVEL_CONFIGS[this.currentLevel % LEVEL_CONFIGS.length];
    
    // Update camera rotation
    this.playerYaw -= input.mouseDeltaX * this.MOUSE_SENSITIVITY;
    this.playerPitch -= input.mouseDeltaY * this.MOUSE_SENSITIVITY;
    this.playerPitch = Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, this.playerPitch));
    
    // Weapon sway from mouse movement
    this.weapons.addSway(input.mouseDeltaX, input.mouseDeltaY);
    
    // Calculate movement direction relative to camera facing
    let moveX = 0;
    let moveZ = 0;
    
    // Get forward/right vectors from yaw angle
    const forwardX = -Math.sin(this.playerYaw);
    const forwardZ = -Math.cos(this.playerYaw);
    const rightX = Math.cos(this.playerYaw);
    const rightZ = -Math.sin(this.playerYaw);
    
    if (input.forward) { moveX += forwardX; moveZ += forwardZ; }
    if (input.backward) { moveX -= forwardX; moveZ -= forwardZ; }
    if (input.left) { moveX -= rightX; moveZ -= rightZ; }
    if (input.right) { moveX += rightX; moveZ += rightZ; }
    
    const length = Math.sqrt(moveX * moveX + moveZ * moveZ);
    if (length > 0) {
      moveX /= length;
      moveZ /= length;
      
      // Speed boost from power-up
      let speedMultiplier = input.sprint ? this.SPRINT_MULTIPLIER : 1;
      if (this.powerUps.isEffectActive('speed')) {
        speedMultiplier *= 1.5;
      }
      
      const speed = this.BASE_MOVE_SPEED * speedMultiplier;
      this.movementSpeed = speed;
      
      const currentVel = this.physics.getLinearVelocity(this.playerBodyId);
      if (currentVel) {
        this.physics.setLinearVelocity(this.playerBodyId, {
          x: moveX * speed,
          y: currentVel.y,
          z: moveZ * speed
        });
      }
    } else {
      this.movementSpeed = 0;
      const currentVel = this.physics.getLinearVelocity(this.playerBodyId);
      if (currentVel) {
        this.physics.setLinearVelocity(this.playerBodyId, {
          x: currentVel.x * 0.9,
          y: currentVel.y,
          z: currentVel.z * 0.9
        });
      }
    }
    
    // Jump
    if (input.jump) {
      const pos = this.physics.getBodyPosition(this.playerBodyId);
      const vel = this.physics.getLinearVelocity(this.playerBodyId);
      if (pos && vel && pos.y < 1.5 && vel.y < 1) {
        this.physics.addImpulse(this.playerBodyId, { x: 0, y: this.JUMP_IMPULSE, z: 0 });
      }
    }
    
    // Weapon switching
    if (this.input.getState().pause) {
      // ESC already handled
    }
    
    // Update physics
    this.physics.update(deltaTime);
    
    // Update camera position
    const playerPos = this.physics.getBodyPosition(this.playerBodyId);
    if (playerPos) {
      this.renderer.setCameraPosition(playerPos.x, playerPos.y, playerPos.z);
      this.renderer.setCameraRotation(this.playerYaw, this.playerPitch);
    }
    
    // Update weapons
    this.weapons.update(deltaTime, this.movementSpeed);
    
    // Spawn enemies
    this.spawnTimer += deltaTime;
    const enemyCount = this.enemies.getAllEnemies().length;
    if (this.spawnTimer >= config.spawnInterval && enemyCount < config.maxEnemies) {
      this.spawnEnemy();
      this.spawnTimer = 0;
    }
    
    // Spawn power-ups
    this.powerUpSpawnTimer += deltaTime;
    if (this.powerUpSpawnTimer >= this.POWERUP_SPAWN_INTERVAL) {
      this.spawnPowerUp();
      this.powerUpSpawnTimer = 0;
    }
    
    // Update enemies
    this.updateEnemies(deltaTime, playerPos);
    
    // Update power-ups
    this.powerUps.update(deltaTime);
    
    // Check power-up collection
    if (playerPos) {
      this.powerUps.checkCollection(playerPos);
    }
    
    // Check game over
    if (this.health$.value <= 0) {
      this.gameOver();
    }
  }
  
  private spawnEnemy(): void {
    const config = LEVEL_CONFIGS[this.currentLevel % LEVEL_CONFIGS.length];
    const size = config.arenaSize;
    
    // Calculate difficulty based on level and kills
    const difficulty = this.level$.value + Math.floor(this.kills$.value / 20);
    const enemyType = this.enemies.getRandomEnemyType(difficulty);
    
    // Spawn at random edge
    const side = Math.floor(Math.random() * 4);
    const offset = (Math.random() - 0.5) * (size - 5) * 2;
    let position: { x: number; y: number; z: number };
    
    // Ground-based y position (drones will float themselves)
    const yPos = enemyType === 'drone' ? 0 : 1;
    
    switch (side) {
      case 0: position = { x: offset, y: yPos, z: -size + 3 }; break;
      case 1: position = { x: offset, y: yPos, z: size - 3 }; break;
      case 2: position = { x: -size + 3, y: yPos, z: offset }; break;
      default: position = { x: size - 3, y: yPos, z: offset }; break;
    }
    
    const physicsBodyId = this.physics.createBox(
      { x: 0.4, y: 0.9, z: 0.25 },
      position,
      false
    );
    
    const enemy = this.enemies.createEnemy(enemyType, position, physicsBodyId);
    this.enemyBodyMap.set(physicsBodyId, enemy);
  }
  
  private spawnPowerUp(): void {
    const config = LEVEL_CONFIGS[this.currentLevel % LEVEL_CONFIGS.length];
    const size = config.arenaSize;
    
    // Random position in arena
    let x, z;
    do {
      x = (Math.random() - 0.5) * (size - 5) * 1.5;
      z = (Math.random() - 0.5) * (size - 5) * 1.5;
    } while (Math.sqrt(x * x + z * z) < 5);
    
    const type = this.powerUps.getRandomPowerUpType();
    this.powerUps.spawnPowerUp(type, { x, y: 0, z });
  }
  
  private updateEnemies(deltaTime: number, playerPos: { x: number; y: number; z: number } | null): void {
    if (!playerPos) return;
    
    const enemiesToRemove: string[] = [];
    
    this.enemies.getAllEnemies().forEach(enemy => {
      const enemyPos = this.physics.getBodyPosition(enemy.physicsBodyId);
      if (!enemyPos) return;
      
      // Update enemy mesh and animation
      enemy.mesh.position.set(enemyPos.x, enemyPos.y, enemyPos.z);
      this.enemies.updateEnemy(enemy, deltaTime, playerPos);
      this.enemies.updateHealthBar(enemy);
      
      // Move toward player
      const dx = playerPos.x - enemyPos.x;
      const dz = playerPos.z - enemyPos.z;
      const distance = Math.sqrt(dx * dx + dz * dz);
      
      if (distance > 1) {
        const vel = this.physics.getLinearVelocity(enemy.physicsBodyId);
        this.physics.setLinearVelocity(enemy.physicsBodyId, {
          x: (dx / distance) * enemy.stats.speed,
          y: vel?.y ?? 0,
          z: (dz / distance) * enemy.stats.speed
        });
      }
      
      // Attack player if close
      if (distance < 1.5 && this.enemies.canAttack(enemy)) {
        const damage = this.enemies.attack(enemy);
        this.damagePlayer(damage);
      }
    });
  }
  
  private handleWeaponFire(direction: THREE.Vector3, damage: number): void {
    const camera = this.renderer.getCamera();
    const origin = camera.position.clone();
    
    // 1. Raycast against enemies (FAST JS Check)
    let closestEnemy: { enemy: any; dist: number; point: THREE.Vector3 } | null = null;
    let closestDist = 1000;
    
    this.enemies.getAllEnemies();
    for (const enemy of this.enemies.getAllEnemies()) {
      // Get enemy position (center)
      const enemyPos = enemy.mesh.position;
      
      // Vector from ray origin to enemy center
      const toEnemy = new THREE.Vector3().subVectors(enemyPos, origin);
      
      // Project onto ray direction to find closest point on ray to enemy center
      const projection = toEnemy.dot(direction);
      
      // Only consider enemies in front
      if (projection > 0 && projection < closestDist) {
        // Point on ray closest to enemy center
        const closestPoint = origin.clone().add(direction.clone().multiplyScalar(projection));
        
        // Distance from ray to enemy center
        const distToRay = closestPoint.distanceTo(enemyPos);
        
        // Hit if within radius (approximate radius based on scale)
        const radius = 1.0 * enemy.stats.scale; // Generous hit box
        
        if (distToRay < radius) {
          closestDist = projection;
          closestEnemy = {
            enemy: enemy,
            dist: projection,
            point: closestPoint
          };
        }
      }
    }
    
    // 2. Raycast against world (Jolt - Optional/Simplified)
    // For now, if we hit an enemy, we prioritize that. 
    // If we want wall impacts, we could call physics.raycast here, 
    // but ensuring it ONLY checks static geometry to avoid the previous freeze.
    
    if (closestEnemy) {
      // Hit enemy
      this.renderer.createHitEffect(closestEnemy.point);
      
      const killed = this.enemies.damageEnemy(closestEnemy.enemy, damage);
      if (killed) {
         this.sound.play('enemy_death');
      } else {
         this.sound.play('enemy_hit');
      }
      this.ngZone.run(() => {
        this.score$.next(this.score$.value + 10);
      });
    } else {
      // Didn't hit enemy, check world for impact effect
      const result = this.physics.raycast(
        { x: origin.x, y: origin.y, z: origin.z },
        { x: direction.x, y: direction.y, z: direction.z },
        100
      );
      
      if (result.hit && result.point) {
        this.renderer.createHitEffect(result.point);
      }
    }
  }
  
  private handleEnemyKilled(enemy: Enemy): void {
    // Remove from physics and maps
    this.physics.removeBody(enemy.physicsBodyId);
    this.enemyBodyMap.delete(enemy.physicsBodyId);
    
    this.ngZone.run(() => {
      this.score$.next(this.score$.value + enemy.stats.pointValue);
      this.kills$.next(this.kills$.value + 1);
      
      // Check for level up
      this.killsThisLevel++;
      if (this.killsThisLevel >= this.KILLS_PER_LEVEL) {
        this.levelUp();
      }
    });
    
    this.onEnemyKilled.next({ position: { 
      x: enemy.mesh.position.x, 
      y: enemy.mesh.position.y, 
      z: enemy.mesh.position.z 
    }});
    
    // Random chance to drop power-up
    if (Math.random() < 0.2) {
      const type = this.powerUps.getRandomPowerUpType();
      this.powerUps.spawnPowerUp(type, {
        x: enemy.mesh.position.x,
        y: 0,
        z: enemy.mesh.position.z
      });
    }
  }
  
  private handlePowerUpCollected(type: PowerUpType, config: any): void {
    switch (type) {
      case 'health':
        this.ngZone.run(() => {
          this.health$.next(Math.min(this.maxHealth$.value, this.health$.value + (config.value || 50)));
        });
        this.sound.play('pickup_health');
        break;
        
      case 'ammo':
        // Refill current weapon
        this.weapons.startReload();
        this.sound.play('pickup_ammo');
        break;
        
      case 'speed':
        this.sound.play('pickup_powerup');
        break;
        
      case 'shield':
        this.ngZone.run(() => {
          this.shield$.next(config.value || 50);
        });
        this.sound.play('pickup_powerup');
        break;
        
      case 'weapon_rifle':
        this.weapons.equipWeapon('rifle');
        this.sound.play('pickup_weapon');
        break;
        
      case 'weapon_shotgun':
        this.weapons.equipWeapon('shotgun');
        this.sound.play('pickup_weapon');
        break;
        
      case 'weapon_sniper':
        this.weapons.equipWeapon('sniper');
        this.sound.play('pickup_weapon');
        break;
    }
  }
  
  private damagePlayer(damage: number): void {
    // Shield absorbs damage first
    let remainingDamage = damage;
    const currentShield = this.shield$.value;
    
    if (currentShield > 0) {
      if (currentShield >= remainingDamage) {
        this.ngZone.run(() => {
          this.shield$.next(currentShield - remainingDamage);
        });
        remainingDamage = 0;
      } else {
        remainingDamage -= currentShield;
        this.ngZone.run(() => {
          this.shield$.next(0);
        });
      }
    }
    
    if (remainingDamage > 0) {
      this.ngZone.run(() => {
        this.health$.next(Math.max(0, this.health$.value - remainingDamage));
      });
      this.sound.play('player_damage');
      this.onPlayerHit.next();
    }
  }
  
  private levelUp(): void {
    this.killsThisLevel = 0;
    const newLevel = this.level$.value + 1;
    
    this.ngZone.run(() => {
      this.level$.next(newLevel);
    });
    
    this.onLevelUp.next(newLevel);
    
    // Could add level transition effects here
  }
  
  private togglePause(): void {
    if (this.state$.value === 'playing') {
      this.state$.next('paused');
      cancelAnimationFrame(this.animationFrameId);
      this.input.exitPointerLock();
    } else if (this.state$.value === 'paused') {
      this.state$.next('playing');
      this.lastTime = performance.now();
      this.ngZone.runOutsideAngular(() => {
        this.gameLoop();
      });
    }
  }
  
  resume(): void {
    if (this.state$.value === 'paused') {
      this.togglePause();
    }
  }
  
  private gameOver(): void {
    this.state$.next('gameover');
    cancelAnimationFrame(this.animationFrameId);
    this.input.exitPointerLock();
    this.sound.play('game_over');
  }
  
  restart(): void {
    this.start();
  }
  
  returnToMenu(): void {
    this.state$.next('menu');
    cancelAnimationFrame(this.animationFrameId);
    this.input.exitPointerLock();
  }
  
  switchWeapon(direction: 'next' | 'prev'): void {
    if (direction === 'next') {
      this.weapons.nextWeapon();
    } else {
      this.weapons.previousWeapon();
    }
  }
  
  destroy(): void {
    cancelAnimationFrame(this.animationFrameId);
    this.physics.destroy();
    this.renderer.destroy();
    this.input.destroy();
    this.weapons.destroy();
    this.enemies.destroy();
    this.powerUps.destroy();
    this.sound.destroy();
  }
}
