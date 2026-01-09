import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="menu-container">
      <!-- Animated background -->
      <div class="bg-animation">
        <div class="grid"></div>
        <div class="glow glow-1"></div>
        <div class="glow glow-2"></div>
        <div class="glow glow-3"></div>
      </div>
      
      <!-- Content -->
      <div class="content">
        <div class="logo-container">
          <h1 class="game-title">
            <span class="title-line">NEON</span>
            <span class="title-line accent">STRIKER</span>
          </h1>
          <p class="tagline">SURVIVE THE ARENA</p>
        </div>
        
        <button class="play-button" (click)="startGame()">
          <span class="play-icon">▶</span>
          <span class="play-text">START GAME</span>
          <div class="button-glow"></div>
        </button>
        
        <div class="controls-section">
          <h2 class="controls-title">CONTROLS</h2>
          <div class="controls-grid">
            <div class="control-item">
              <div class="keys">
                <span class="key">W</span>
                <span class="key">A</span>
                <span class="key">S</span>
                <span class="key">D</span>
              </div>
              <span class="control-label">MOVE</span>
            </div>
            <div class="control-item">
              <div class="keys">
                <span class="key wide">MOUSE</span>
              </div>
              <span class="control-label">LOOK</span>
            </div>
            <div class="control-item">
              <div class="keys">
                <span class="key wide">CLICK</span>
              </div>
              <span class="control-label">SHOOT</span>
            </div>
            <div class="control-item">
              <div class="keys">
                <span class="key wide">SPACE</span>
              </div>
              <span class="control-label">JUMP</span>
            </div>
            <div class="control-item">
              <div class="keys">
                <span class="key">1-4</span> <span class="key-sep">or</span> <span class="key wide">SCROLL</span>
              </div>
              <span class="control-label">WEAPONS</span>
            </div>
            <div class="control-item">
              <div class="keys">
                <span class="key wide">HOLD SHIFT</span>
              </div>
              <span class="control-label">SPRINT</span>
            </div>
            <div class="control-item">
              <div class="keys">
                <span class="key wide">ESC</span>
              </div>
              <span class="control-label">PAUSE</span>
            </div>
          </div>
        </div>
        
        <!-- Social Links -->
        <div class="social-section">
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
        <!-- Support Button -->
        <button class="support-btn" (click)="openSupport()">
          <span class="heart-icon">❤</span>
          SUPPORT
        </button>
        
        <p class="credits">Built with Angular • Three.js • Jolt Physics</p>
      </div>
    </div>
  `,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&display=swap');
    
    .menu-container {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: #0a0a0f;
      overflow: hidden;
      font-family: 'Orbitron', sans-serif;
      user-select: none;
    }
    
    /* Background animation */
    .bg-animation {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      overflow: hidden;
    }
    
    .grid {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-image: 
        linear-gradient(rgba(233, 69, 96, 0.1) 1px, transparent 1px),
        linear-gradient(90deg, rgba(233, 69, 96, 0.1) 1px, transparent 1px);
      background-size: 50px 50px;
      animation: gridMove 20s linear infinite;
    }
    
    @keyframes gridMove {
      0% { transform: perspective(500px) rotateX(60deg) translateY(0); }
      100% { transform: perspective(500px) rotateX(60deg) translateY(50px); }
    }
    
    .glow {
      position: absolute;
      border-radius: 50%;
      filter: blur(100px);
      opacity: 0.5;
      animation: float 10s ease-in-out infinite;
    }
    
    .glow-1 {
      width: 400px;
      height: 400px;
      background: #e94560;
      top: 20%;
      left: 10%;
      animation-delay: 0s;
    }
    
    .glow-2 {
      width: 300px;
      height: 300px;
      background: #4ecdc4;
      top: 60%;
      right: 10%;
      animation-delay: -3s;
    }
    
    .glow-3 {
      width: 350px;
      height: 350px;
      background: #533483;
      bottom: 10%;
      left: 30%;
      animation-delay: -6s;
    }
    
    @keyframes float {
      0%, 100% { transform: translate(0, 0); }
      25% { transform: translate(30px, -30px); }
      50% { transform: translate(-20px, 20px); }
      75% { transform: translate(20px, 30px); }
    }
    
    /* Content */
    .content {
      position: relative;
      z-index: 10;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      padding: 40px;
    }
    
    .logo-container {
      text-align: center;
      margin-bottom: 40px;
    }
    
    .game-title {
      font-size: 80px;
      font-weight: 900;
      line-height: 1;
      margin: 0;
    }
    
    @media (max-width: 768px) {
      .game-title {
        font-size: 48px;
      }
    }
    
    .title-line {
      display: block;
      color: white;
      text-shadow: 0 0 30px rgba(255, 255, 255, 0.3);
    }
    
    .title-line.accent {
      color: #e94560;
      text-shadow: 
        0 0 20px rgba(233, 69, 96, 0.5),
        0 0 40px rgba(233, 69, 96, 0.3);
    }
    
    .tagline {
      font-size: 16px;
      color: rgba(255, 255, 255, 0.5);
      letter-spacing: 10px;
      margin-top: 20px;
    }
    
    /* Play button */
    .play-button {
      position: relative;
      font-family: 'Orbitron', sans-serif;
      font-size: 24px;
      font-weight: 700;
      color: white;
      background: linear-gradient(135deg, #e94560, #533483);
      border: none;
      padding: 25px 80px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 20px;
      transition: all 0.3s ease;
      overflow: hidden;
      clip-path: polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px);
    }
    
    .play-button:hover {
      transform: scale(1.05);
      box-shadow: 0 0 50px rgba(233, 69, 96, 0.5);
    }
    
    .play-button:hover .button-glow {
      opacity: 1;
    }
    
    .button-glow {
      position: absolute;
      top: 50%;
      left: 50%;
      width: 200%;
      height: 200%;
      background: radial-gradient(circle, rgba(255, 255, 255, 0.3) 0%, transparent 60%);
      transform: translate(-50%, -50%);
      opacity: 0;
      transition: opacity 0.3s ease;
    }
    
    .play-icon {
      font-size: 30px;
    }
    
    /* Controls */
    .controls-section {
      margin-top: 50px;
      text-align: center;
    }
    
    .controls-title {
      font-size: 14px;
      color: rgba(255, 255, 255, 0.4);
      letter-spacing: 5px;
      margin-bottom: 20px;
    }
    
    .controls-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 25px;
    }
    
    @media (max-width: 600px) {
      .controls-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }
    
    .control-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
    }
    
    .keys {
      display: flex;
      gap: 5px;
      align-items: center;
    }
    
    .key-sep {
      font-size: 10px;
      color: rgba(255,255,255,0.4);
    }
    
    .key {
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
      padding: 8px 12px;
      font-size: 12px;
      color: white;
      border-radius: 4px;
    }
    
    .key.wide {
      padding: 8px 20px;
    }
    
    .control-label {
      font-size: 11px;
      color: rgba(255, 255, 255, 0.4);
      letter-spacing: 2px;
    }
    
    /* Social Section */
    .social-section {
      margin-top: 40px;
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
      margin-top: 25px;
      font-family: 'Orbitron', sans-serif;
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 2px;
      padding: 12px 25px;
      background: transparent;
      border: 2px solid rgba(255, 107, 107, 0.5);
      color: #ff6b6b;
      cursor: pointer;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      border-radius: 4px;
    }
    
    .support-btn:hover {
      background: rgba(255, 107, 107, 0.2);
      border-color: #ff6b6b;
      box-shadow: 0 0 20px rgba(255, 107, 107, 0.3);
    }
    
    .heart-icon {
      font-size: 16px;
      animation: heartbeat 1s ease-in-out infinite;
    }
    
    @keyframes heartbeat {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.2); }
    }
    
    /* Credits */
    .credits {
      position: absolute;
      bottom: 30px;
      font-size: 11px;
      color: rgba(255, 255, 255, 0.3);
      letter-spacing: 2px;
    }
  `]
})
export class MenuComponent {
  constructor(private router: Router) {}
  
  startGame(): void {
    this.router.navigate(['/game']);
  }
  
  openSupport(): void {
    window.open('https://buymeacoffee.com', '_blank');
  }
}
