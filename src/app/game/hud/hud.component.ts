import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WeaponType } from '../../services/weapon.service';

@Component({
  selector: 'app-hud',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="hud">
      <!-- Crosshair -->
      <div class="crosshair">
        <div class="crosshair-line horizontal"></div>
        <div class="crosshair-line vertical"></div>
        <div class="crosshair-dot"></div>
      </div>
      
      <!-- Health Bar -->
      <div class="health-container">
        <div class="health-icon">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
          </svg>
        </div>
        <div class="health-bar-container">
          @if (shield > 0) {
            <div class="shield-bar">
              <div class="shield-fill" [style.width.%]="shieldPercent"></div>
            </div>
          }
          <div class="health-bar">
            <div class="health-fill" [style.width.%]="healthPercent" [class.low]="healthPercent < 30"></div>
            <div class="health-text">{{ health | number:'1.0-0' }} / {{ maxHealth }}</div>
          </div>
        </div>
      </div>
      
      <!-- Weapon Display -->
      <div class="weapon-container">
        <div class="weapon-model" [class]="currentWeapon">
          <div class="weapon-icon"></div>
        </div>
        <div class="weapon-info">
          <div class="weapon-name">{{ getWeaponName() }}</div>
          <div class="ammo-display">
            <span class="current-ammo" [class.empty]="ammo === 0">{{ ammo }}</span>
            <span class="ammo-separator">/</span>
            <span class="max-ammo">{{ maxAmmo }}</span>
          </div>
          @if (isReloading) {
            <div class="reload-bar">
              <div class="reload-progress" [style.width.%]="reloadProgress * 100"></div>
              <span class="reload-text">RELOADING</span>
            </div>
          }
        </div>
      </div>
      
      <!-- Score & Level -->
      <div class="score-container">
        <div class="level-display">
          <span class="level-label">LEVEL</span>
          <span class="level-value">{{ level }}</span>
        </div>
        <div class="score-display">
          <span class="score-label">SCORE</span>
          <span class="score-value">{{ score | number }}</span>
        </div>
      </div>
      
      <!-- Kills Counter -->
      <div class="kills-container">
        <div class="kills-icon">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
        </div>
        <div class="kills-value">{{ kills }}</div>
      </div>
      
      <!-- Active Power-ups -->
      @if (speedBoostActive || shieldActive) {
        <div class="powerups-container">
          @if (speedBoostActive) {
            <div class="powerup-indicator speed">
              <span class="powerup-icon">⚡</span>
              <span class="powerup-label">SPEED</span>
            </div>
          }
          @if (shieldActive) {
            <div class="powerup-indicator shield">
              <span class="powerup-icon">🛡</span>
              <span class="powerup-label">SHIELD</span>
            </div>
          }
        </div>
      }
      
      <!-- Weapon Switch Hint -->
      <div class="weapon-hint">
        <span>Scroll or 1-4 to switch weapons</span>
      </div>
      
      <!-- Damage overlay -->
      <div class="damage-overlay" [class.active]="health < 30"></div>
    </div>
  `,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&display=swap');
    
    .hud {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      font-family: 'Orbitron', sans-serif;
      z-index: 100;
    }
    
    /* Crosshair */
    .crosshair {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
    }
    
    .crosshair-line {
      position: absolute;
      background: rgba(255, 255, 255, 0.9);
      box-shadow: 0 0 5px rgba(233, 69, 96, 0.8);
    }
    
    .crosshair-line.horizontal {
      width: 20px;
      height: 2px;
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%);
    }
    
    .crosshair-line.vertical {
      width: 2px;
      height: 20px;
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%);
    }
    
    .crosshair-dot {
      position: absolute;
      width: 4px;
      height: 4px;
      background: #e94560;
      border-radius: 50%;
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%);
      box-shadow: 0 0 10px #e94560;
    }
    
    /* Health */
    .health-container {
      position: absolute;
      bottom: 40px;
      left: 40px;
      display: flex;
      align-items: center;
      gap: 15px;
    }
    
    .health-icon {
      width: 40px;
      height: 40px;
      color: #e94560;
      filter: drop-shadow(0 0 10px rgba(233, 69, 96, 0.5));
    }
    
    .health-bar-container {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    
    .health-bar, .shield-bar {
      width: 250px;
      height: 20px;
      background: rgba(0, 0, 0, 0.6);
      border: 2px solid rgba(233, 69, 96, 0.5);
      border-radius: 4px;
      position: relative;
      overflow: hidden;
    }
    
    .shield-bar {
      height: 12px;
      border-color: rgba(155, 89, 182, 0.5);
    }
    
    .health-fill {
      height: 100%;
      background: linear-gradient(90deg, #e94560, #ff6b8a);
      transition: width 0.3s ease;
      box-shadow: inset 0 0 20px rgba(255, 255, 255, 0.2);
    }
    
    .shield-fill {
      height: 100%;
      background: linear-gradient(90deg, #9b59b6, #c39bd3);
      transition: width 0.3s ease;
    }
    
    .health-fill.low {
      background: linear-gradient(90deg, #ff0000, #ff4444);
      animation: flash 0.5s ease-in-out infinite;
    }
    
    @keyframes flash {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
    
    .health-text {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-size: 11px;
      font-weight: 700;
      color: white;
      text-shadow: 0 0 5px rgba(0, 0, 0, 0.8);
    }
    
    /* Weapon Display */
    .weapon-container {
      position: absolute;
      bottom: 40px;
      right: 40px;
      display: flex;
      align-items: flex-end;
      gap: 20px;
    }
    
    .weapon-model {
      width: 100px;
      height: 60px;
      background: rgba(0, 0, 0, 0.4);
      border: 2px solid rgba(255, 255, 255, 0.2);
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      overflow: hidden;
    }
    
    .weapon-model::before {
      content: '';
      position: absolute;
      width: 80%;
      height: 40%;
      background: currentColor;
      border-radius: 4px;
    }
    
    .weapon-model.pistol { color: #4ecdc4; }
    .weapon-model.rifle { color: #e94560; }
    .weapon-model.shotgun { color: #ffcc00; }
    .weapon-model.sniper { color: #9b59b6; }
    
    .weapon-info {
      text-align: right;
    }
    
    .weapon-name {
      font-size: 14px;
      color: rgba(255, 255, 255, 0.7);
      letter-spacing: 2px;
      margin-bottom: 5px;
    }
    
    .ammo-display {
      font-size: 42px;
      font-weight: 900;
    }
    
    .current-ammo {
      color: white;
    }
    
    .current-ammo.empty {
      color: #ff4444;
      animation: blink 0.3s ease-in-out infinite;
    }
    
    .ammo-separator {
      color: rgba(255, 255, 255, 0.3);
      margin: 0 5px;
      font-size: 24px;
    }
    
    .max-ammo {
      color: rgba(255, 255, 255, 0.4);
      font-size: 24px;
    }
    
    .reload-bar {
      width: 150px;
      height: 8px;
      background: rgba(0, 0, 0, 0.6);
      border-radius: 4px;
      margin-top: 8px;
      position: relative;
      overflow: hidden;
    }
    
    .reload-progress {
      height: 100%;
      background: linear-gradient(90deg, #ffcc00, #ff8800);
      transition: width 0.1s linear;
    }
    
    .reload-text {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-size: 8px;
      color: white;
      animation: blink 0.5s ease-in-out infinite;
    }
    
    @keyframes blink {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.3; }
    }
    
    /* Score & Level */
    .score-container {
      position: absolute;
      top: 40px;
      right: 40px;
      text-align: right;
    }
    
    .level-display {
      margin-bottom: 15px;
    }
    
    .level-label, .score-label {
      font-size: 12px;
      color: rgba(255, 255, 255, 0.5);
      letter-spacing: 3px;
      display: block;
    }
    
    .level-value {
      font-size: 28px;
      font-weight: 700;
      color: #4ecdc4;
      text-shadow: 0 0 15px rgba(78, 205, 196, 0.5);
    }
    
    .score-value {
      font-size: 36px;
      font-weight: 700;
      color: #ffcc00;
      text-shadow: 0 0 20px rgba(255, 204, 0, 0.5);
    }
    
    /* Kills */
    .kills-container {
      position: absolute;
      top: 40px;
      left: 40px;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    
    .kills-icon {
      width: 30px;
      height: 30px;
      color: #4ecdc4;
      filter: drop-shadow(0 0 10px rgba(78, 205, 196, 0.5));
    }
    
    .kills-value {
      font-size: 28px;
      font-weight: 700;
      color: white;
      text-shadow: 0 0 10px rgba(78, 205, 196, 0.5);
    }
    
    /* Power-ups */
    .powerups-container {
      position: absolute;
      top: 100px;
      left: 40px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    
    .powerup-indicator {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 15px;
      background: rgba(0, 0, 0, 0.5);
      border-radius: 4px;
      border-left: 3px solid;
    }
    
    .powerup-indicator.speed {
      border-color: #00ccff;
    }
    
    .powerup-indicator.shield {
      border-color: #9b59b6;
    }
    
    .powerup-icon {
      font-size: 18px;
    }
    
    .powerup-label {
      font-size: 12px;
      color: white;
      letter-spacing: 2px;
    }
    
    /* Weapon hint */
    .weapon-hint {
      position: absolute;
      bottom: 120px;
      right: 40px;
      font-size: 10px;
      color: rgba(255, 255, 255, 0.3);
      letter-spacing: 1px;
    }
    
    /* Damage overlay */
    .damage-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      background: radial-gradient(ellipse at center, transparent 40%, rgba(255, 0, 0, 0.3) 100%);
      opacity: 0;
      transition: opacity 0.3s ease;
    }
    
    .damage-overlay.active {
      opacity: 1;
      animation: damage-pulse 1s ease-in-out infinite;
    }
    
    @keyframes damage-pulse {
      0%, 100% { opacity: 0.3; }
      50% { opacity: 0.6; }
    }
  `]
})
export class HudComponent {
  @Input() health = 100;
  @Input() maxHealth = 100;
  @Input() shield = 0;
  @Input() ammo = 30;
  @Input() maxAmmo = 30;
  @Input() score = 0;
  @Input() kills = 0;
  @Input() level = 1;
  @Input() currentWeapon: WeaponType = 'pistol';
  @Input() isReloading = false;
  @Input() reloadProgress = 0;
  @Input() speedBoostActive = false;
  @Input() shieldActive = false;
  
  get healthPercent(): number {
    return (this.health / this.maxHealth) * 100;
  }
  
  get shieldPercent(): number {
    return (this.shield / 50) * 100; // 50 is max shield
  }
  
  getWeaponName(): string {
    const names: Record<WeaponType, string> = {
      pistol: 'PLASMA PISTOL',
      rifle: 'ASSAULT RIFLE',
      shotgun: 'SCATTER GUN',
      sniper: 'RAIL GUN'
    };
    return names[this.currentWeapon];
  }
}
