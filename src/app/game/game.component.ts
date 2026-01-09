import { Component, ElementRef, OnInit, OnDestroy, ViewChild, ChangeDetectorRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { GameService, GameState } from '../services/game.service';
import { WeaponService, WeaponType } from '../services/weapon.service';
import { PowerUpService } from '../services/powerup.service';
import { SoundService } from '../services/sound.service';
import { InputService } from '../services/input.service';
import { HudComponent } from './hud/hud.component';
import { PauseMenuComponent } from './pause-menu/pause-menu.component';
import { GameOverComponent } from './game-over/game-over.component';

@Component({
  selector: 'app-game',
  standalone: true,
  imports: [CommonModule, HudComponent, PauseMenuComponent, GameOverComponent],
  template: `
    <div class="game-container">
      <canvas #gameCanvas></canvas>
      
      @if (state === 'playing') {
        <app-hud
          [health]="health"
          [maxHealth]="100"
          [shield]="shield"
          [ammo]="ammo"
          [maxAmmo]="maxAmmo"
          [score]="score"
          [kills]="kills"
          [level]="level"
          [currentWeapon]="currentWeapon"
          [isReloading]="isReloading"
          [reloadProgress]="reloadProgress"
          [speedBoostActive]="speedBoostActive"
          [shieldActive]="shield > 0"
        />
      }
      
      @if (state === 'paused') {
        <app-pause-menu
          [volume]="volume"
          (resume)="onResume()"
          (restart)="onRestart()"
          (quit)="onQuit()"
          (volumeChange)="onVolumeChange($event)"
        />
      }
      
      @if (state === 'gameover') {
        <app-game-over
          [score]="score"
          [kills]="kills"
          (restart)="onRestart()"
          (quit)="onQuit()"
        />
      }
      
      <!-- Click to Play Overlay -->
      @if (state === 'playing' && !isPointerLocked && !isMobile) {
        <div class="click-to-play">
          <div class="pulse-ring"></div>
          <span>Click to Play</span>
        </div>
      }
      
      @if (levelUpMessage) {
        <div class="level-up-notification">
          <span class="level-up-text">LEVEL {{ level }}</span>
          <span class="level-up-subtitle">ENEMIES ARE STRONGER</span>
        </div>
      }
    </div>
  `,
  styles: [`
    .game-container {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      overflow: hidden;
      background: #0a0a0f;
    }
    
    canvas {
      display: block;
      width: 100%;
      height: 100%;
    }
    
    .click-to-play {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 20px;
      pointer-events: none;
    }
    
    .click-to-play span {
      font-family: 'Orbitron', sans-serif;
      font-size: 24px;
      color: #e94560;
      text-shadow: 0 0 20px rgba(233, 69, 96, 0.5);
      animation: pulse 1.5s ease-in-out infinite;
    }
    
    .pulse-ring {
      width: 80px;
      height: 80px;
      border: 3px solid #e94560;
      border-radius: 50%;
      animation: ring-pulse 1.5s ease-out infinite;
    }
    
    @keyframes pulse {
      0%, 100% { opacity: 0.7; }
      50% { opacity: 1; }
    }
    
    @keyframes ring-pulse {
      0% {
        transform: scale(0.8);
        opacity: 1;
      }
      100% {
        transform: scale(1.5);
        opacity: 0;
      }
    }
    
    .level-up-notification {
      position: absolute;
      top: 30%;
      left: 50%;
      transform: translate(-50%, -50%);
      text-align: center;
      pointer-events: none;
      animation: level-up-anim 2s ease-out forwards;
    }
    
    .level-up-text {
      display: block;
      font-family: 'Orbitron', sans-serif;
      font-size: 64px;
      font-weight: 900;
      color: #4ecdc4;
      text-shadow: 
        0 0 20px rgba(78, 205, 196, 0.8),
        0 0 40px rgba(78, 205, 196, 0.5);
    }
    
    .level-up-subtitle {
      display: block;
      font-family: 'Orbitron', sans-serif;
      font-size: 18px;
      color: rgba(255, 255, 255, 0.7);
      letter-spacing: 5px;
      margin-top: 10px;
    }
    
    @keyframes level-up-anim {
      0% {
        opacity: 0;
        transform: translate(-50%, -50%) scale(0.5);
      }
      20% {
        opacity: 1;
        transform: translate(-50%, -50%) scale(1.1);
      }
      30% {
        transform: translate(-50%, -50%) scale(1);
      }
      80% {
        opacity: 1;
      }
      100% {
        opacity: 0;
        transform: translate(-50%, -60%) scale(1);
      }
    }
  `]
})
export class GameComponent implements OnInit, OnDestroy {
  @ViewChild('gameCanvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;
  
  state: GameState = 'playing';
  health = 100;
  shield = 0;
  ammo = 30;
  maxAmmo = 30;
  score = 0;
  kills = 0;
  level = 1;
  currentWeapon: WeaponType = 'pistol';
  isReloading = false;
  reloadProgress = 0;
  speedBoostActive = false;
  isPointerLocked = false;
  levelUpMessage = false;
  volume = 50;
  isMobile = false;
  
  private subscriptions: Subscription[] = [];
  private pointerLockCheckInterval: any;
  
  constructor(
    private game: GameService,
    private weapons: WeaponService,
    private powerUps: PowerUpService,
    private sound: SoundService,
    private input: InputService,
    private cdr: ChangeDetectorRef
  ) {}
  
  async ngOnInit(): Promise<void> {
    await this.game.initialize(this.canvasRef.nativeElement);
    
    // Check if mobile
    this.isMobile = this.input.isMobileDevice();
    
    // Subscribe to game state
    this.subscriptions.push(
      this.game.state$.subscribe(state => {
        this.state = state;
        
        // Hide/Show mobile controls based on state
        if (this.isMobile) {
          this.input.showMobileControls(state === 'playing');
        }
        
        this.cdr.detectChanges();
      }),
      this.game.health$.subscribe(health => {
        this.health = health;
        this.cdr.detectChanges();
      }),
      this.game.shield$.subscribe(shield => {
        this.shield = shield;
        this.cdr.detectChanges();
      }),
      this.game.score$.subscribe(score => {
        this.score = score;
        this.cdr.detectChanges();
      }),
      this.game.kills$.subscribe(kills => {
        this.kills = kills;
        this.cdr.detectChanges();
      }),
      this.game.level$.subscribe(level => {
        this.level = level;
        this.cdr.detectChanges();
      }),
      this.game.onLevelUp.subscribe(level => {
        this.showLevelUpMessage();
      }),
      this.weapons.ammo$.subscribe(ammo => {
        this.ammo = ammo;
        this.cdr.detectChanges();
      }),
      this.weapons.maxAmmo$.subscribe(maxAmmo => {
        this.maxAmmo = maxAmmo;
        this.cdr.detectChanges();
      }),
      this.weapons.currentWeapon$.subscribe(weapon => {
        this.currentWeapon = weapon;
        this.cdr.detectChanges();
      }),
      this.weapons.isReloading$.subscribe(reloading => {
        this.isReloading = reloading;
        this.cdr.detectChanges();
      }),
      this.weapons.reloadProgress$.subscribe(progress => {
        this.reloadProgress = progress;
        this.cdr.detectChanges();
      })
    );
    
    // Check pointer lock and power-up states
    this.pointerLockCheckInterval = setInterval(() => {
      const locked = document.pointerLockElement === this.canvasRef.nativeElement;
      const speedActive = this.powerUps.isEffectActive('speed');
      
      if (this.isPointerLocked !== locked || this.speedBoostActive !== speedActive) {
        this.isPointerLocked = locked;
        this.speedBoostActive = speedActive;
        this.cdr.detectChanges();
      }
    }, 100);
    
    // Start the game
    this.game.start();
  }
  
  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    clearInterval(this.pointerLockCheckInterval);
    this.game.destroy();
  }
  
  @HostListener('window:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    // Weapon switching with number keys
    if (this.state === 'playing') {
      switch (event.code) {
        case 'Digit1':
          this.weapons.equipWeapon('pistol');
          break;
        case 'Digit2':
          this.weapons.equipWeapon('rifle');
          break;
        case 'Digit3':
          this.weapons.equipWeapon('shotgun');
          break;
        case 'Digit4':
          this.weapons.equipWeapon('sniper');
          break;
        case 'KeyR':
          this.weapons.startReload();
          break;
      }
    }
  }
  
  @HostListener('window:wheel', ['$event'])
  onWheel(event: WheelEvent): void {
    if (this.state === 'playing') {
      if (event.deltaY > 0) {
        this.game.switchWeapon('next');
      } else {
        this.game.switchWeapon('prev');
      }
    }
  }
  
  private showLevelUpMessage(): void {
    this.levelUpMessage = true;
    this.cdr.detectChanges();
    
    setTimeout(() => {
      this.levelUpMessage = false;
      this.cdr.detectChanges();
    }, 2000);
  }
  
  onResume(): void {
    this.game.resume();
  }
  
  onRestart(): void {
    this.game.restart();
  }
  
  onQuit(): void {
    this.game.returnToMenu();
    window.location.href = '/';
  }
  
  onVolumeChange(volume: number): void {
    this.volume = volume;
    this.sound.setMasterVolume(volume / 100);
  }
}
