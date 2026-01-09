import { Injectable, NgZone } from '@angular/core';
import { Subject } from 'rxjs';

export interface InputState {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  jump: boolean;
  sprint: boolean;
  shoot: boolean;
  pause: boolean;
  mouseX: number;
  mouseY: number;
  mouseDeltaX: number;
  mouseDeltaY: number;
}

interface TouchJoystick {
  active: boolean;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  identifier: number;
}

@Injectable({
  providedIn: 'root'
})
export class InputService {
  private keys: Set<string> = new Set();
  private mouseButtons: Set<number> = new Set();
  private mouseDeltaX = 0;
  private mouseDeltaY = 0;
  private mouseX = 0;
  private mouseY = 0;
  private isPointerLocked = false;
  
  // Mobile touch state
  private isMobile = false;
  private moveJoystick: TouchJoystick = { active: false, startX: 0, startY: 0, currentX: 0, currentY: 0, identifier: -1 };
  private lookJoystick: TouchJoystick = { active: false, startX: 0, startY: 0, currentX: 0, currentY: 0, identifier: -1 };
  private touchShootActive = false;
  
  readonly onShoot = new Subject<void>();
  readonly onPause = new Subject<void>();
  
  private canvas: HTMLCanvasElement | null = null;
  private mobileUI: HTMLElement | null = null;
  
  constructor(private ngZone: NgZone) {}
  
  initialize(canvas: HTMLCanvasElement): void {
    this.canvas = canvas;
    
    // Detect mobile
    this.isMobile = this.detectMobile();
    
    // Run outside Angular zone for performance
    this.ngZone.runOutsideAngular(() => {
      // Keyboard events
      window.addEventListener('keydown', (e) => this.onKeyDown(e));
      window.addEventListener('keyup', (e) => this.onKeyUp(e));
      
      // Mouse events
      canvas.addEventListener('click', () => this.requestPointerLock());
      window.addEventListener('mousedown', (e) => this.onMouseDown(e));
      window.addEventListener('mouseup', (e) => this.onMouseUp(e));
      window.addEventListener('mousemove', (e) => this.onMouseMove(e));
      
      // Pointer lock change
      document.addEventListener('pointerlockchange', () => this.onPointerLockChange());
      document.addEventListener('pointerlockerror', () => this.onPointerLockError());
      
      // Touch events for mobile
      if (this.isMobile) {
        this.createMobileUI();
        canvas.addEventListener('touchstart', (e) => this.onTouchStart(e), { passive: false });
        canvas.addEventListener('touchmove', (e) => this.onTouchMove(e), { passive: false });
        canvas.addEventListener('touchend', (e) => this.onTouchEnd(e), { passive: false });
        canvas.addEventListener('touchcancel', (e) => this.onTouchEnd(e), { passive: false });
      }
    });
  }
  
  private detectMobile(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
           (window.innerWidth <= 1024 && 'ontouchstart' in window);
  }
  
  private createMobileUI(): void {
    // Create mobile control container
    this.mobileUI = document.createElement('div');
    this.mobileUI.id = 'mobile-controls';
    this.mobileUI.innerHTML = `
      <style>
        #mobile-controls {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 1000;
          font-family: 'Orbitron', sans-serif;
        }
        
        .joystick-area {
          position: absolute;
          bottom: 30px;
          width: 150px;
          height: 150px;
          pointer-events: auto;
          touch-action: none;
        }
        
        .joystick-area.left {
          left: 30px;
        }
        
        .joystick-area.right {
          right: 30px;
        }
        
        .joystick-base {
          position: absolute;
          width: 120px;
          height: 120px;
          border: 3px solid rgba(233, 69, 96, 0.5);
          border-radius: 50%;
          background: rgba(0, 0, 0, 0.3);
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
        }
        
        .joystick-thumb {
          position: absolute;
          width: 50px;
          height: 50px;
          background: radial-gradient(circle, rgba(233, 69, 96, 0.8), rgba(233, 69, 96, 0.4));
          border-radius: 50%;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
          transition: none;
        }
        
        .mobile-btn {
          position: absolute;
          width: 70px;
          height: 70px;
          border: 2px solid rgba(78, 205, 196, 0.6);
          border-radius: 50%;
          background: rgba(0, 0, 0, 0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          pointer-events: auto;
          touch-action: none;
          font-size: 12px;
          color: rgba(255, 255, 255, 0.8);
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        
        .mobile-btn:active {
          background: rgba(78, 205, 196, 0.3);
          border-color: rgba(78, 205, 196, 1);
        }
        
        .shoot-btn {
          right: 200px;
          bottom: 80px;
          width: 90px;
          height: 90px;
          border-color: rgba(233, 69, 96, 0.6);
        }
        
        .shoot-btn:active {
          background: rgba(233, 69, 96, 0.4);
          border-color: rgba(233, 69, 96, 1);
        }
        
        .jump-btn {
          right: 200px;
          bottom: 180px;
        }
        
        .pause-btn {
          top: 20px;
          left: 50%;
          transform: translateX(-50%);
          width: 50px;
          height: 50px;
          font-size: 20px;
        }
        
        .joystick-label {
          position: absolute;
          bottom: -25px;
          left: 50%;
          transform: translateX(-50%);
          font-size: 10px;
          color: rgba(255, 255, 255, 0.5);
          text-transform: uppercase;
          letter-spacing: 2px;
        }
      </style>
      
      <div class="joystick-area left" id="move-joystick">
        <div class="joystick-base">
          <div class="joystick-thumb" id="move-thumb"></div>
        </div>
        <span class="joystick-label">Move</span>
      </div>
      
      <div class="joystick-area right" id="look-joystick">
        <div class="joystick-base">
          <div class="joystick-thumb" id="look-thumb"></div>
        </div>
        <span class="joystick-label">Look</span>
      </div>
      
      <button class="mobile-btn shoot-btn" id="shoot-btn">FIRE</button>
      <button class="mobile-btn jump-btn" id="jump-btn">JUMP</button>
      <button class="mobile-btn pause-btn" id="pause-btn">II</button>
    `;
    
    document.body.appendChild(this.mobileUI);
    
    // Add event listeners for buttons
    const shootBtn = document.getElementById('shoot-btn');
    const jumpBtn = document.getElementById('jump-btn');
    const pauseBtn = document.getElementById('pause-btn');
    
    if (shootBtn) {
      shootBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        this.touchShootActive = true;
        this.onShoot.next();
      });
      shootBtn.addEventListener('touchend', () => {
        this.touchShootActive = false;
      });
    }
    
    if (jumpBtn) {
      jumpBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        this.keys.add('Space');
      });
      jumpBtn.addEventListener('touchend', () => {
        this.keys.delete('Space');
      });
    }
    
    if (pauseBtn) {
      pauseBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        this.onPause.next();
      });
    }
    
    // Joystick touch handling
    const moveJoystick = document.getElementById('move-joystick');
    const lookJoystick = document.getElementById('look-joystick');
    
    if (moveJoystick) {
      moveJoystick.addEventListener('touchstart', (e) => this.handleJoystickStart(e, 'move'), { passive: false });
      moveJoystick.addEventListener('touchmove', (e) => this.handleJoystickMove(e, 'move'), { passive: false });
      moveJoystick.addEventListener('touchend', (e) => this.handleJoystickEnd(e, 'move'), { passive: false });
    }
    
    if (lookJoystick) {
      lookJoystick.addEventListener('touchstart', (e) => this.handleJoystickStart(e, 'look'), { passive: false });
      lookJoystick.addEventListener('touchmove', (e) => this.handleJoystickMove(e, 'look'), { passive: false });
      lookJoystick.addEventListener('touchend', (e) => this.handleJoystickEnd(e, 'look'), { passive: false });
    }
  }
  
  private handleJoystickStart(e: TouchEvent, type: 'move' | 'look'): void {
    e.preventDefault();
    const touch = e.changedTouches[0];
    const joystick = type === 'move' ? this.moveJoystick : this.lookJoystick;
    
    joystick.active = true;
    joystick.identifier = touch.identifier;
    joystick.startX = touch.clientX;
    joystick.startY = touch.clientY;
    joystick.currentX = touch.clientX;
    joystick.currentY = touch.clientY;
  }
  
  private handleJoystickMove(e: TouchEvent, type: 'move' | 'look'): void {
    e.preventDefault();
    const joystick = type === 'move' ? this.moveJoystick : this.lookJoystick;
    
    if (!joystick.active) return;
    
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === joystick.identifier) {
        const prevX = joystick.currentX;
        const prevY = joystick.currentY;
        
        joystick.currentX = touch.clientX;
        joystick.currentY = touch.clientY;
        
        // Update thumb position visually
        const thumbId = type === 'move' ? 'move-thumb' : 'look-thumb';
        const thumb = document.getElementById(thumbId);
        if (thumb) {
          const dx = joystick.currentX - joystick.startX;
          const dy = joystick.currentY - joystick.startY;
          const maxDist = 35;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const clampedDist = Math.min(dist, maxDist);
          const angle = Math.atan2(dy, dx);
          
          const clampedX = Math.cos(angle) * clampedDist;
          const clampedY = Math.sin(angle) * clampedDist;
          
          thumb.style.transform = `translate(calc(-50% + ${clampedX}px), calc(-50% + ${clampedY}px))`;
        }
        
        // For look joystick, accumulate delta for camera rotation
        if (type === 'look') {
          this.mouseDeltaX += (joystick.currentX - prevX) * 2;
          this.mouseDeltaY += (joystick.currentY - prevY) * 2;
        }
        
        break;
      }
    }
  }
  
  private handleJoystickEnd(e: TouchEvent, type: 'move' | 'look'): void {
    e.preventDefault();
    const joystick = type === 'move' ? this.moveJoystick : this.lookJoystick;
    
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === joystick.identifier) {
        joystick.active = false;
        joystick.identifier = -1;
        
        // Reset thumb position
        const thumbId = type === 'move' ? 'move-thumb' : 'look-thumb';
        const thumb = document.getElementById(thumbId);
        if (thumb) {
          thumb.style.transform = 'translate(-50%, -50%)';
        }
        
        break;
      }
    }
  }
  
  private onKeyDown(event: KeyboardEvent): void {
    this.keys.add(event.code);
    
    if (event.code === 'Escape') {
      this.onPause.next();
    }
    
    if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'Space', 'ShiftLeft', 'ShiftRight'].includes(event.code)) {
      event.preventDefault();
    }
  }
  
  private onKeyUp(event: KeyboardEvent): void {
    this.keys.delete(event.code);
  }
  
  private onMouseDown(event: MouseEvent): void {
    this.mouseButtons.add(event.button);
    
    if (event.button === 0 && this.isPointerLocked) {
      this.onShoot.next();
    }
  }
  
  private onMouseUp(event: MouseEvent): void {
    this.mouseButtons.delete(event.button);
  }
  
  private onMouseMove(event: MouseEvent): void {
    if (this.isPointerLocked) {
      this.mouseDeltaX += event.movementX;
      this.mouseDeltaY += event.movementY;
    }
    this.mouseX = event.clientX;
    this.mouseY = event.clientY;
  }
  
  private onTouchStart(e: TouchEvent): void {
    // Handled by joystick areas
  }
  
  private onTouchMove(e: TouchEvent): void {
    e.preventDefault();
  }
  
  private onTouchEnd(e: TouchEvent): void {
    // Handled by joystick areas
  }
  
  private requestPointerLock(): void {
    if (this.canvas && !this.isPointerLocked && !this.isMobile) {
      this.canvas.requestPointerLock();
    }
  }
  
  private onPointerLockChange(): void {
    const wasLocked = this.isPointerLocked;
    this.isPointerLocked = document.pointerLockElement === this.canvas;
    
    // If we lost lock (and wasn't just acquiring it), pause the game
    if (wasLocked && !this.isPointerLocked && !this.isMobile) {
      this.onPause.next();
    }
  }
  
  private onPointerLockError(): void {
    console.error('Pointer lock error');
  }
  
  getState(): InputState {
    // Combine keyboard and mobile joystick input
    let forward = this.keys.has('KeyW') || this.keys.has('ArrowUp');
    let backward = this.keys.has('KeyS') || this.keys.has('ArrowDown');
    let left = this.keys.has('KeyA') || this.keys.has('ArrowLeft');
    let right = this.keys.has('KeyD') || this.keys.has('ArrowRight');
    
    // Mobile move joystick
    if (this.moveJoystick.active) {
      const dx = this.moveJoystick.currentX - this.moveJoystick.startX;
      const dy = this.moveJoystick.currentY - this.moveJoystick.startY;
      const deadzone = 10;
      
      if (dy < -deadzone) forward = true;
      if (dy > deadzone) backward = true;
      if (dx < -deadzone) left = true;
      if (dx > deadzone) right = true;
    }
    
    const state: InputState = {
      forward,
      backward,
      left,
      right,
      jump: this.keys.has('Space'),
      sprint: this.keys.has('ShiftLeft') || this.keys.has('ShiftRight'),
      shoot: this.mouseButtons.has(0) || this.touchShootActive,
      pause: this.keys.has('Escape'),
      mouseX: this.mouseX,
      mouseY: this.mouseY,
      mouseDeltaX: this.mouseDeltaX,
      mouseDeltaY: this.mouseDeltaY
    };
    
    // Reset mouse delta after reading
    this.mouseDeltaX = 0;
    this.mouseDeltaY = 0;
    
    return state;
  }
  
  isLocked(): boolean {
    return this.isPointerLocked || this.isMobile;
  }
  
  isMobileDevice(): boolean {
    return this.isMobile;
  }
  
  exitPointerLock(): void {
    if (this.isPointerLocked) {
      document.exitPointerLock();
    }
  }
  
  showMobileControls(show: boolean): void {
    if (this.mobileUI) {
      this.mobileUI.style.display = show ? 'block' : 'none';
    }
  }
  
  destroy(): void {
    this.exitPointerLock();
    this.keys.clear();
    this.mouseButtons.clear();
    
    if (this.mobileUI && this.mobileUI.parentNode) {
      this.mobileUI.parentNode.removeChild(this.mobileUI);
    }
  }
}
