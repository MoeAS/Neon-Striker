import { Injectable } from '@angular/core';

export type SoundType = 
  | 'pistol_fire' | 'rifle_fire' | 'shotgun_fire' | 'sniper_fire'
  | 'reload' | 'empty_click'
  | 'enemy_hit' | 'enemy_death'
  | 'player_damage' | 'player_death'
  | 'pickup_health' | 'pickup_ammo' | 'pickup_powerup' | 'pickup_weapon'
  | 'menu_click' | 'game_start' | 'game_over';

@Injectable({
  providedIn: 'root'
})
export class SoundService {
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private sounds: Map<SoundType, AudioBuffer> = new Map();
  private activeSources: AudioBufferSourceNode[] = [];
  private musicSource: AudioBufferSourceNode | null = null;
  private initialized = false;
  
  async initialize(): Promise<void> {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.masterGain = this.audioContext.createGain();
      this.masterGain.connect(this.audioContext.destination);
      this.masterGain.gain.value = 0.5;
      
      // Generate procedural sounds
      await this.generateSounds();
      
      this.initialized = true;
    } catch (e) {
      console.warn('Audio initialization failed:', e);
    }
  }
  
  private async generateSounds(): Promise<void> {
    if (!this.audioContext) return;
    
    // Generate weapon sounds
    this.sounds.set('pistol_fire', this.createGunSound(0.1, 800, 0.8));
    this.sounds.set('rifle_fire', this.createGunSound(0.08, 600, 0.6));
    this.sounds.set('shotgun_fire', this.createGunSound(0.2, 400, 1.0));
    this.sounds.set('sniper_fire', this.createGunSound(0.15, 200, 0.9));
    
    // Reload sound
    this.sounds.set('reload', this.createReloadSound());
    
    // Empty click
    this.sounds.set('empty_click', this.createClickSound());
    
    // Enemy sounds
    this.sounds.set('enemy_hit', this.createImpactSound(0.1, 1200));
    this.sounds.set('enemy_death', this.createExplosionSound(0.3));
    
    // Player sounds
    this.sounds.set('player_damage', this.createImpactSound(0.15, 300));
    this.sounds.set('player_death', this.createExplosionSound(0.5));
    
    // Pickup sounds
    this.sounds.set('pickup_health', this.createPickupSound(523.25)); // C5
    this.sounds.set('pickup_ammo', this.createPickupSound(659.25)); // E5
    this.sounds.set('pickup_powerup', this.createPowerupSound());
    this.sounds.set('pickup_weapon', this.createWeaponPickupSound());
    
    // UI sounds
    this.sounds.set('menu_click', this.createUISound(440, 0.05));
    this.sounds.set('game_start', this.createGameStartSound());
    this.sounds.set('game_over', this.createGameOverSound());
  }
  
  private createGunSound(duration: number, frequency: number, intensity: number): AudioBuffer {
    const sampleRate = this.audioContext!.sampleRate;
    const length = Math.floor(sampleRate * duration);
    const buffer = this.audioContext!.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      const envelope = Math.exp(-t * 30) * intensity;
      
      // Mix of noise and tone for gun sound
      const noise = (Math.random() * 2 - 1) * 0.7;
      const tone = Math.sin(2 * Math.PI * frequency * t * Math.exp(-t * 10)) * 0.3;
      
      data[i] = (noise + tone) * envelope;
    }
    
    return buffer;
  }
  
  private createReloadSound(): AudioBuffer {
    const sampleRate = this.audioContext!.sampleRate;
    const length = Math.floor(sampleRate * 0.8);
    const buffer = this.audioContext!.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      
      // Magazine out click
      let sample = 0;
      if (t < 0.1) {
        sample = (Math.random() * 2 - 1) * Math.exp(-t * 50) * 0.5;
      }
      // Slide
      else if (t < 0.5) {
        const slideT = t - 0.1;
        sample = Math.sin(2 * Math.PI * (200 + slideT * 300) * slideT) * Math.exp(-slideT * 5) * 0.3;
      }
      // Magazine in click
      else if (t < 0.7) {
        const clickT = t - 0.5;
        sample = (Math.random() * 2 - 1) * Math.exp(-clickT * 40) * 0.6;
        sample += Math.sin(2 * Math.PI * 800 * clickT) * Math.exp(-clickT * 30) * 0.3;
      }
      // Cock sound
      else {
        const cockT = t - 0.7;
        sample = (Math.random() * 2 - 1) * Math.exp(-cockT * 50) * 0.4;
        sample += Math.sin(2 * Math.PI * 600 * cockT) * Math.exp(-cockT * 40) * 0.2;
      }
      
      data[i] = sample;
    }
    
    return buffer;
  }
  
  private createClickSound(): AudioBuffer {
    const sampleRate = this.audioContext!.sampleRate;
    const length = Math.floor(sampleRate * 0.05);
    const buffer = this.audioContext!.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      const envelope = Math.exp(-t * 100);
      data[i] = (Math.random() * 2 - 1) * envelope * 0.3;
    }
    
    return buffer;
  }
  
  private createImpactSound(duration: number, frequency: number): AudioBuffer {
    const sampleRate = this.audioContext!.sampleRate;
    const length = Math.floor(sampleRate * duration);
    const buffer = this.audioContext!.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      const envelope = Math.exp(-t * 20);
      const freq = frequency * (1 - t * 5);
      data[i] = Math.sin(2 * Math.PI * freq * t) * envelope * 0.5;
    }
    
    return buffer;
  }
  
  private createExplosionSound(duration: number): AudioBuffer {
    const sampleRate = this.audioContext!.sampleRate;
    const length = Math.floor(sampleRate * duration);
    const buffer = this.audioContext!.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      const envelope = Math.exp(-t * 8);
      
      // Low rumble + noise
      const rumble = Math.sin(2 * Math.PI * 60 * t) * 0.5;
      const noise = (Math.random() * 2 - 1) * 0.5;
      
      data[i] = (rumble + noise) * envelope;
    }
    
    return buffer;
  }
  
  private createPickupSound(frequency: number): AudioBuffer {
    const sampleRate = this.audioContext!.sampleRate;
    const length = Math.floor(sampleRate * 0.2);
    const buffer = this.audioContext!.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      const envelope = Math.sin(t * Math.PI / 0.2) * 0.5;
      
      // Rising pitch
      const freq = frequency * (1 + t * 2);
      data[i] = Math.sin(2 * Math.PI * freq * t) * envelope;
    }
    
    return buffer;
  }
  
  private createPowerupSound(): AudioBuffer {
    const sampleRate = this.audioContext!.sampleRate;
    const length = Math.floor(sampleRate * 0.5);
    const buffer = this.audioContext!.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      const envelope = Math.sin(t * Math.PI / 0.5) * 0.4;
      
      // Chord arpeggio
      const freq1 = 523.25 * Math.pow(2, Math.floor(t * 8) / 12);
      const freq2 = freq1 * 1.5;
      
      data[i] = (Math.sin(2 * Math.PI * freq1 * t) * 0.5 + 
                 Math.sin(2 * Math.PI * freq2 * t) * 0.3) * envelope;
    }
    
    return buffer;
  }
  
  private createWeaponPickupSound(): AudioBuffer {
    const sampleRate = this.audioContext!.sampleRate;
    const length = Math.floor(sampleRate * 0.3);
    const buffer = this.audioContext!.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      const envelope = Math.exp(-t * 5) * 0.5;
      
      // Metallic ring
      const freq = 1200 * (1 - t * 0.5);
      const ring = Math.sin(2 * Math.PI * freq * t);
      const overtone = Math.sin(2 * Math.PI * freq * 2.5 * t) * 0.3;
      
      data[i] = (ring + overtone) * envelope;
    }
    
    return buffer;
  }
  
  private createUISound(frequency: number, duration: number): AudioBuffer {
    const sampleRate = this.audioContext!.sampleRate;
    const length = Math.floor(sampleRate * duration);
    const buffer = this.audioContext!.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      const envelope = Math.sin(t * Math.PI / duration) * 0.3;
      data[i] = Math.sin(2 * Math.PI * frequency * t) * envelope;
    }
    
    return buffer;
  }
  
  private createGameStartSound(): AudioBuffer {
    const sampleRate = this.audioContext!.sampleRate;
    const length = Math.floor(sampleRate * 0.8);
    const buffer = this.audioContext!.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);
    
    const notes = [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5
    
    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      const noteIndex = Math.min(Math.floor(t * 5), notes.length - 1);
      const noteT = (t * 5) % 1;
      const envelope = Math.sin(noteT * Math.PI) * 0.4;
      
      data[i] = Math.sin(2 * Math.PI * notes[noteIndex] * t) * envelope;
    }
    
    return buffer;
  }
  
  private createGameOverSound(): AudioBuffer {
    const sampleRate = this.audioContext!.sampleRate;
    const length = Math.floor(sampleRate * 1.5);
    const buffer = this.audioContext!.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      const envelope = Math.exp(-t * 1.5) * 0.5;
      
      // Descending tone
      const freq = 400 * Math.exp(-t * 0.5);
      data[i] = Math.sin(2 * Math.PI * freq * t) * envelope;
    }
    
    return buffer;
  }
  
  play(type: SoundType, volume: number = 1, pitchVariation: number = 0): void {
    if (!this.initialized || !this.audioContext || !this.masterGain) return;
    
    const buffer = this.sounds.get(type);
    if (!buffer) return;
    
    // Resume context if suspended
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
    
    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;
    
    // Pitch variation
    if (pitchVariation > 0) {
      source.playbackRate.value = 1 + (Math.random() - 0.5) * pitchVariation;
    }
    
    // Volume control
    const gainNode = this.audioContext.createGain();
    gainNode.gain.value = volume;
    
    source.connect(gainNode);
    gainNode.connect(this.masterGain);
    
    source.start();
    
    // Track active sources
    this.activeSources.push(source);
    source.onended = () => {
      const index = this.activeSources.indexOf(source);
      if (index > -1) {
        this.activeSources.splice(index, 1);
      }
    };
  }
  
  playWeaponFire(weaponType: 'pistol' | 'rifle' | 'shotgun' | 'sniper'): void {
    this.play(`${weaponType}_fire` as SoundType, 0.6, 0.1);
  }
  
  setMasterVolume(volume: number): void {
    if (this.masterGain) {
      this.masterGain.gain.value = Math.max(0, Math.min(1, volume));
    }
  }
  
  stopAll(): void {
    this.activeSources.forEach(source => {
      try {
        source.stop();
      } catch (e) {
        // Ignore if already stopped
      }
    });
    this.activeSources = [];
  }
  
  destroy(): void {
    this.stopAll();
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}
