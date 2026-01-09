import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-pause-menu',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="pause-overlay">
      <div class="pause-container">
        <h1 class="pause-title">PAUSED</h1>
        
        <div class="menu-buttons">
          <button class="menu-btn primary" (click)="onResume()">
            <span class="btn-icon">▶</span>
            RESUME
          </button>
          
          <button class="menu-btn" (click)="onRestart()">
            <span class="btn-icon">↺</span>
            RESTART
          </button>
          
          <!-- Volume Controls -->
          <div class="volume-section">
            <span class="volume-label">VOLUME</span>
            <div class="volume-slider-container">
              <span class="volume-icon">🔈</span>
              <input 
                type="range" 
                min="0" 
                max="100" 
                [value]="volume"
                (input)="onVolumeChange($event)"
                class="volume-slider"
              />
              <span class="volume-icon">🔊</span>
              <span class="volume-value">{{ volume }}%</span>
            </div>
          </div>
          
          <button class="menu-btn danger" (click)="onExit()">
            <span class="btn-icon">✕</span>
            EXIT TO MENU
          </button>
        </div>
        
        <!-- Social Links -->
        <div class="social-section">
          <span class="social-label">FOLLOW US</span>
          <div class="social-buttons">
            <a class="social-btn instagram" href="https://www.instagram.com/moe_as7/" target="_blank" title="Instagram">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
            </a>
            <a class="social-btn tiktok" href="https://www.tiktok.com/@moe_as7" target="_blank" title="TikTok">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
              </svg>
            </a>
            <a class="social-btn github" href="https://github.com/MoeAS" target="_blank" title="Github">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
            </a>
            <a class="social-btn portfolio" href="https://mohamad-abou-salem.web.app/" target="_blank" title="Portfolio">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
              </svg>
            </a>
          </div>
        </div>
        
        <!-- Support Button -->
        <button class="support-btn" (click)="onSupport()">
          <span class="heart-icon">❤</span>
          SUPPORT
        </button>
      </div>
    </div>
  `,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&display=swap');
    
    .pause-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.85);
      backdrop-filter: blur(10px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      animation: fadeIn 0.2s ease;
    }
    
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    
    .pause-container {
      text-align: center;
      max-width: 400px;
      padding: 40px;
    }
    
    .pause-title {
      font-family: 'Orbitron', sans-serif;
      font-size: 48px;
      font-weight: 900;
      color: #e94560;
      text-shadow: 0 0 30px rgba(233, 69, 96, 0.6);
      margin-bottom: 40px;
      letter-spacing: 10px;
    }
    
    .menu-buttons {
      display: flex;
      flex-direction: column;
      gap: 15px;
      margin-bottom: 30px;
    }
    
    .menu-btn {
      font-family: 'Orbitron', sans-serif;
      font-size: 16px;
      font-weight: 700;
      letter-spacing: 3px;
      padding: 18px 40px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      background: rgba(255, 255, 255, 0.05);
      color: white;
      cursor: pointer;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
    }
    
    .menu-btn:hover {
      background: rgba(255, 255, 255, 0.15);
      border-color: rgba(255, 255, 255, 0.5);
      transform: scale(1.02);
    }
    
    .menu-btn.primary {
      background: linear-gradient(135deg, #e94560 0%, #c73e54 100%);
      border-color: #e94560;
      box-shadow: 0 0 20px rgba(233, 69, 96, 0.4);
    }
    
    .menu-btn.primary:hover {
      background: linear-gradient(135deg, #ff5a7a 0%, #e94560 100%);
      box-shadow: 0 0 30px rgba(233, 69, 96, 0.6);
    }
    
    .menu-btn.danger {
      border-color: rgba(255, 100, 100, 0.5);
      color: #ff6b6b;
    }
    
    .menu-btn.danger:hover {
      background: rgba(255, 100, 100, 0.2);
      border-color: #ff6b6b;
    }
    
    .btn-icon {
      font-size: 20px;
    }
    
    /* Volume Section */
    .volume-section {
      padding: 20px;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      margin: 10px 0;
    }
    
    .volume-label {
      display: block;
      font-family: 'Orbitron', sans-serif;
      font-size: 12px;
      color: rgba(255, 255, 255, 0.5);
      letter-spacing: 3px;
      margin-bottom: 15px;
    }
    
    .volume-slider-container {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    
    .volume-icon {
      font-size: 16px;
    }
    
    .volume-slider {
      flex: 1;
      height: 6px;
      -webkit-appearance: none;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 3px;
      outline: none;
    }
    
    .volume-slider::-webkit-slider-thumb {
      -webkit-appearance: none;
      width: 16px;
      height: 16px;
      background: #4ecdc4;
      border-radius: 50%;
      cursor: pointer;
      box-shadow: 0 0 10px rgba(78, 205, 196, 0.5);
    }
    
    .volume-value {
      font-family: 'Orbitron', sans-serif;
      font-size: 14px;
      color: #4ecdc4;
      min-width: 50px;
    }
    
    /* Social Section */
    .social-section {
      margin: 30px 0;
      padding-top: 20px;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
    }
    
    .social-label {
      display: block;
      font-family: 'Orbitron', sans-serif;
      font-size: 10px;
      color: rgba(255, 255, 255, 0.4);
      letter-spacing: 3px;
      margin-bottom: 15px;
    }
    
    .social-buttons {
      display: flex;
      justify-content: center;
      gap: 20px;
    }
    
    .social-btn {
      width: 50px;
      height: 50px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s ease;
      text-decoration: none;
    }
    
    .social-btn svg {
      width: 24px;
      height: 24px;
    }
    
    .social-btn.instagram {
      background: linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888);
      color: white;
    }
    
    .social-btn.tiktok {
      background: #000;
      color: white;
      border: 2px solid #fff;
    }
    
    .social-btn.github {
      background: #333;
      color: white;
      border: 2px solid #888;
    }
    
    .social-btn.portfolio {
      background: #4ecdc4;
      color: #1a1a2e;
    }
    
    .social-btn:hover {
      transform: scale(1.15);
      box-shadow: 0 0 20px rgba(255, 255, 255, 0.3);
    }
    
    /* Support Button */
    .support-btn {
      font-family: 'Orbitron', sans-serif;
      font-size: 14px;
      font-weight: 700;
      letter-spacing: 2px;
      padding: 15px 30px;
      background: linear-gradient(135deg, #ff6b6b, #ee5a5a);
      border: none;
      color: white;
      cursor: pointer;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      width: 100%;
      border-radius: 4px;
    }
    
    .support-btn:hover {
      background: linear-gradient(135deg, #ff8080, #ff6b6b);
      transform: scale(1.02);
      box-shadow: 0 0 20px rgba(255, 107, 107, 0.5);
    }
    
    .heart-icon {
      font-size: 18px;
      animation: heartbeat 1s ease-in-out infinite;
    }
    
    @keyframes heartbeat {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.2); }
    }
  `]
})
export class PauseMenuComponent {
  @Input() volume = 50;
  @Output() resume = new EventEmitter<void>();
  @Output() restart = new EventEmitter<void>();
  @Output() quit = new EventEmitter<void>();
  @Output() volumeChange = new EventEmitter<number>();
  @Output() support = new EventEmitter<void>();
  
  onResume(): void {
    this.resume.emit();
  }
  
  onRestart(): void {
    this.restart.emit();
  }
  
  onExit(): void {
    this.quit.emit();
  }
  
  onVolumeChange(event: Event): void {
    const value = parseInt((event.target as HTMLInputElement).value, 10);
    this.volume = value;
    this.volumeChange.emit(value);
  }
  
  onSupport(): void {
    window.open('https://buymeacoffee.com', '_blank');
    this.support.emit();
  }
}
