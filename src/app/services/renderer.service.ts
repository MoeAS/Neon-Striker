import { Injectable, ElementRef } from '@angular/core';
import * as THREE from 'three';

export interface RenderObject {
  id: string;
  mesh: THREE.Mesh;
  physicsBodyId?: number;
}

@Injectable({
  providedIn: 'root'
})
export class RendererService {
  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private objects: Map<string, RenderObject> = new Map();
  private initialized = false;
  
  // Player camera offset (eye height)
  private readonly EYE_HEIGHT = 1.6;
  
  initialize(canvas: HTMLCanvasElement): void {
    // Scene setup
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1a1a2e);
    this.scene.fog = new THREE.Fog(0x1a1a2e, 10, 100);
    
    // Camera setup - first person perspective
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, this.EYE_HEIGHT, 0);
    
    // Add camera to scene so child objects (like weapons) are rendered
    this.scene.add(this.camera);
    
    // Renderer setup
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    
    // Lighting
    this.setupLighting();
    
    // Handle resize
    window.addEventListener('resize', () => this.onResize());
    
    this.initialized = true;
  }
  
  private setupLighting(): void {
    // Ambient light
    const ambient = new THREE.AmbientLight(0x404080, 0.4);
    this.scene.add(ambient);
    
    // Main directional light (sun)
    const directional = new THREE.DirectionalLight(0xffffff, 1.2);
    directional.position.set(50, 100, 50);
    directional.castShadow = true;
    directional.shadow.mapSize.width = 2048;
    directional.shadow.mapSize.height = 2048;
    directional.shadow.camera.near = 0.5;
    directional.shadow.camera.far = 200;
    directional.shadow.camera.left = -50;
    directional.shadow.camera.right = 50;
    directional.shadow.camera.top = 50;
    directional.shadow.camera.bottom = -50;
    this.scene.add(directional);
    
    // Hemisphere light for nice ambient
    const hemisphere = new THREE.HemisphereLight(0x87ceeb, 0x362d59, 0.6);
    this.scene.add(hemisphere);
    
    // Point lights for atmosphere
    const pointLight1 = new THREE.PointLight(0xff6b6b, 0.8, 30);
    pointLight1.position.set(-15, 5, -15);
    this.scene.add(pointLight1);
    
    const pointLight2 = new THREE.PointLight(0x4ecdc4, 0.8, 30);
    pointLight2.position.set(15, 5, 15);
    this.scene.add(pointLight2);
  }
  
  private onResize(): void {
    if (!this.initialized) return;
    
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }
  
  render(): void {
    if (!this.initialized) return;
    this.renderer.render(this.scene, this.camera);
  }
  
  getCamera(): THREE.PerspectiveCamera {
    return this.camera;
  }
  
  getScene(): THREE.Scene {
    return this.scene;
  }
  
  setCameraPosition(x: number, y: number, z: number): void {
    this.camera.position.set(x, y + this.EYE_HEIGHT, z);
  }
  
  setCameraRotation(yaw: number, pitch: number): void {
    // Create euler from yaw and pitch
    const euler = new THREE.Euler(pitch, yaw, 0, 'YXZ');
    this.camera.quaternion.setFromEuler(euler);
  }
  
  getCameraDirection(): THREE.Vector3 {
    const direction = new THREE.Vector3();
    this.camera.getWorldDirection(direction);
    return direction;
  }
  
  createBox(
    id: string,
    size: { x: number; y: number; z: number },
    position: { x: number; y: number; z: number },
    color: number = 0x666666,
    physicsBodyId?: number
  ): void {
    const geometry = new THREE.BoxGeometry(size.x * 2, size.y * 2, size.z * 2);
    const material = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.7,
      metalness: 0.1
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(position.x, position.y, position.z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    
    this.scene.add(mesh);
    this.objects.set(id, { id, mesh, physicsBodyId });
  }
  
  createSphere(
    id: string,
    radius: number,
    position: { x: number; y: number; z: number },
    color: number = 0xff0000,
    physicsBodyId?: number
  ): void {
    const geometry = new THREE.SphereGeometry(radius, 32, 32);
    const material = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.3,
      metalness: 0.6,
      emissive: new THREE.Color(color).multiplyScalar(0.2)
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(position.x, position.y, position.z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    
    this.scene.add(mesh);
    this.objects.set(id, { id, mesh, physicsBodyId });
  }
  
  createFloor(size: number = 100): void {
    // Main floor
    const geometry = new THREE.PlaneGeometry(size, size, 50, 50);
    
    // Create grid pattern texture
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;
    
    // Background
    ctx.fillStyle = '#16213e';
    ctx.fillRect(0, 0, 512, 512);
    
    // Grid lines
    ctx.strokeStyle = '#0f3460';
    ctx.lineWidth = 2;
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
    
    // Accent lines
    ctx.strokeStyle = '#e94560';
    ctx.lineWidth = 1;
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
    
    this.scene.add(floor);
  }
  
  createEnemy(
    id: string,
    position: { x: number; y: number; z: number },
    physicsBodyId?: number
  ): void {
    // Create a robot-like enemy
    const group = new THREE.Group();
    
    // Body
    const bodyGeom = new THREE.BoxGeometry(0.8, 1.2, 0.5);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0xff2222,
      roughness: 0.3,
      metalness: 0.7,
      emissive: 0x330000
    });
    const body = new THREE.Mesh(bodyGeom, bodyMat);
    body.position.y = 0.6;
    body.castShadow = true;
    group.add(body);
    
    // Head
    const headGeom = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    const headMat = new THREE.MeshStandardMaterial({
      color: 0xcc0000,
      roughness: 0.2,
      metalness: 0.8,
      emissive: 0x220000
    });
    const head = new THREE.Mesh(headGeom, headMat);
    head.position.y = 1.45;
    head.castShadow = true;
    group.add(head);
    
    // Eyes (glowing)
    const eyeGeom = new THREE.SphereGeometry(0.08, 16, 16);
    const eyeMat = new THREE.MeshStandardMaterial({
      color: 0xffff00,
      emissive: 0xffff00,
      emissiveIntensity: 2
    });
    
    const leftEye = new THREE.Mesh(eyeGeom, eyeMat);
    leftEye.position.set(-0.12, 1.45, 0.25);
    group.add(leftEye);
    
    const rightEye = new THREE.Mesh(eyeGeom, eyeMat);
    rightEye.position.set(0.12, 1.45, 0.25);
    group.add(rightEye);
    
    // Arms
    const armGeom = new THREE.BoxGeometry(0.2, 0.8, 0.2);
    const armMat = new THREE.MeshStandardMaterial({
      color: 0x880000,
      roughness: 0.4,
      metalness: 0.6
    });
    
    const leftArm = new THREE.Mesh(armGeom, armMat);
    leftArm.position.set(-0.6, 0.6, 0);
    leftArm.castShadow = true;
    group.add(leftArm);
    
    const rightArm = new THREE.Mesh(armGeom, armMat);
    rightArm.position.set(0.6, 0.6, 0);
    rightArm.castShadow = true;
    group.add(rightArm);
    
    group.position.set(position.x, position.y, position.z);
    
    // Create a dummy mesh to store in objects map
    const mesh = new THREE.Mesh();
    mesh.add(group);
    mesh.position.copy(group.position);
    
    this.scene.add(group);
    this.objects.set(id, { id, mesh: group as any, physicsBodyId });
  }
  
  updateObjectPosition(id: string, position: { x: number; y: number; z: number }): void {
    const obj = this.objects.get(id);
    if (obj) {
      obj.mesh.position.set(position.x, position.y, position.z);
    }
  }
  
  updateObjectRotation(id: string, rotation: { x: number; y: number; z: number; w: number }): void {
    const obj = this.objects.get(id);
    if (obj) {
      obj.mesh.quaternion.set(rotation.x, rotation.y, rotation.z, rotation.w);
    }
  }
  
  removeObject(id: string): void {
    const obj = this.objects.get(id);
    if (obj) {
      this.scene.remove(obj.mesh);
      this.objects.delete(id);
    }
  }
  
  createMuzzleFlash(position: THREE.Vector3, direction: THREE.Vector3): void {
    // Muzzle flash light
    const flash = new THREE.PointLight(0xffaa00, 3, 10);
    flash.position.copy(position);
    this.scene.add(flash);
    
    // Remove after short time
    setTimeout(() => {
      this.scene.remove(flash);
    }, 50);
    
    // Bullet tracer
    const tracerGeom = new THREE.BufferGeometry().setFromPoints([
      position.clone(),
      position.clone().add(direction.clone().multiplyScalar(50))
    ]);
    const tracerMat = new THREE.LineBasicMaterial({
      color: 0xffff00,
      transparent: true,
      opacity: 0.8
    });
    const tracer = new THREE.Line(tracerGeom, tracerMat);
    this.scene.add(tracer);
    
    // Fade out tracer
    setTimeout(() => {
      this.scene.remove(tracer);
    }, 100);
  }
  
  // Shared resources for hit effects
  private hitGeom = new THREE.BoxGeometry(0.1, 0.1, 0.1);
  private hitMat = new THREE.MeshBasicMaterial({
    color: 0xff6600,
    transparent: true,
    opacity: 1
  });

  createHitEffect(position: { x: number; y: number; z: number }): void {
    // Optimized particle burst
    const particleCount = 5; // Reduced from 10
    const particles: THREE.Mesh[] = [];
    
    for (let i = 0; i < particleCount; i++) {
      const particle = new THREE.Mesh(this.hitGeom, this.hitMat.clone()); // Clone mat for opacity fade
      particle.position.set(position.x, position.y, position.z);
      
      // Random velocity
      const vel = new THREE.Vector3(
        (Math.random() - 0.5) * 0.5,
        Math.random() * 0.5,
        (Math.random() - 0.5) * 0.5
      );
      (particle as any).velocity = vel;
      
      this.scene.add(particle);
      particles.push(particle);
    }
    
    // Animate particles
    let frame = 0;
    const animate = () => {
      frame++;
      particles.forEach(p => {
        const vel = (p as any).velocity as THREE.Vector3;
        p.position.add(vel);
        vel.y -= 0.02; // gravity
        p.rotation.x += 0.2;
        p.rotation.y += 0.2;
        (p.material as THREE.MeshBasicMaterial).opacity -= 0.1;
      });
      
      if (frame < 10) { // Shorter life
        requestAnimationFrame(animate);
      } else {
        particles.forEach(p => {
          this.scene.remove(p);
          (p.material as THREE.Material).dispose(); // Dispose cloned material
        });
      }
    };
    animate();
  }
  
  destroy(): void {
    this.objects.forEach(obj => {
      this.scene.remove(obj.mesh);
    });
    this.objects.clear();
    this.renderer.dispose();
  }
}
