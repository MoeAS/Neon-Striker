import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-game-over',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="gameover-overlay">
      <div class="gameover-container">
        <h1 class="gameover-title">GAME OVER</h1>
        
        <div class="stats-container">
          <div class="stat">
            <div class="stat-label">FINAL SCORE</div>
            <div class="stat-value score">{{ score | number }}</div>
          </div>
          
          <div class="stat">
            <div class="stat-label">ENEMIES ELIMINATED</div>
            <div class="stat-value kills">{{ kills }}</div>
          </div>
        </div>
        
        <div class="button-group">
          <button class="menu-button restart" (click)="restart.emit()">
            <span class="button-icon">↻</span>
            <span class="button-text">PLAY AGAIN</span>
          </button>
          
          <button class="menu-button quit" (click)="quit.emit()">
            <span class="button-icon">⌂</span>
            <span class="button-text">MAIN MENU</span>
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&display=swap');
    
    .gameover-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.9);
      backdrop-filter: blur(10px);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 200;
      animation: fadeIn 0.5s ease;
    }
    
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    
    .gameover-container {
      text-align: center;
    }
    
    .gameover-title {
      font-family: 'Orbitron', sans-serif;
      font-size: 80px;
      font-weight: 900;
      color: #e94560;
      margin-bottom: 50px;
      text-shadow: 
        0 0 20px rgba(233, 69, 96, 0.5),
        0 0 40px rgba(233, 69, 96, 0.3),
        0 0 60px rgba(233, 69, 96, 0.2);
      letter-spacing: 8px;
      animation: glitch 2s ease-in-out infinite;
    }
    
    @keyframes glitch {
      0%, 100% { transform: translateX(0); }
      92% { transform: translateX(0); }
      93% { transform: translateX(-5px); }
      94% { transform: translateX(5px); }
      95% { transform: translateX(-5px); }
      96% { transform: translateX(5px); }
      97% { transform: translateX(0); }
    }
    
    .stats-container {
      display: flex;
      justify-content: center;
      gap: 80px;
      margin-bottom: 60px;
    }
    
    .stat {
      text-align: center;
    }
    
    .stat-label {
      font-family: 'Orbitron', sans-serif;
      font-size: 14px;
      color: rgba(255, 255, 255, 0.6);
      letter-spacing: 2px;
      margin-bottom: 10px;
    }
    
    .stat-value {
      font-family: 'Orbitron', sans-serif;
      font-size: 48px;
      font-weight: 900;
    }
    
    .stat-value.score {
      color: #ffcc00;
      text-shadow: 0 0 20px rgba(255, 204, 0, 0.5);
    }
    
    .stat-value.kills {
      color: #4ecdc4;
      text-shadow: 0 0 20px rgba(78, 205, 196, 0.5);
    }
    
    .button-group {
      display: flex;
      flex-direction: column;
      gap: 20px;
      align-items: center;
    }
    
    .menu-button {
      font-family: 'Orbitron', sans-serif;
      font-size: 18px;
      font-weight: 700;
      padding: 20px 60px;
      border: 2px solid;
      background: transparent;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 15px;
      transition: all 0.3s ease;
      min-width: 300px;
      justify-content: center;
    }
    
    .menu-button.restart {
      border-color: #e94560;
      color: #e94560;
    }
    
    .menu-button.restart:hover {
      background: rgba(233, 69, 96, 0.2);
      box-shadow: 0 0 30px rgba(233, 69, 96, 0.4);
      transform: scale(1.05);
    }
    
    .menu-button.quit {
      border-color: #666;
      color: #666;
    }
    
    .menu-button.quit:hover {
      border-color: #4ecdc4;
      color: #4ecdc4;
      background: rgba(78, 205, 196, 0.1);
    }
    
    .button-icon {
      font-size: 24px;
    }
  `]
})
export class GameOverComponent {
  @Input() score = 0;
  @Input() kills = 0;
  
  @Output() restart = new EventEmitter<void>();
  @Output() quit = new EventEmitter<void>();
}
