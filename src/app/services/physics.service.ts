import { Injectable } from '@angular/core';
import Jolt from 'jolt-physics/wasm-compat';

export interface PhysicsBody {
  id: number;
  body: any;
  shape: any;
}

@Injectable({
  providedIn: 'root'
})
export class PhysicsService {
  private Jolt: any = null;
  private joltInterface: any = null;
  private physicsSystem: any = null;
  private bodyInterface: any = null;
  private bodies: Map<number, PhysicsBody> = new Map();
  private nextBodyId = 0;
  
  // Layer constants
  private readonly LAYER_NON_MOVING = 0;
  private readonly LAYER_MOVING = 1;
  
  async initialize(): Promise<void> {
    this.Jolt = await Jolt();
    
    // Setup collision filtering
    const objectFilter = new this.Jolt.ObjectLayerPairFilterTable(2);
    objectFilter.EnableCollision(this.LAYER_NON_MOVING, this.LAYER_MOVING);
    objectFilter.EnableCollision(this.LAYER_MOVING, this.LAYER_MOVING);
    
    const BP_LAYER_NON_MOVING = new this.Jolt.BroadPhaseLayer(0);
    const BP_LAYER_MOVING = new this.Jolt.BroadPhaseLayer(1);
    const NUM_BROAD_PHASE_LAYERS = 2;
    
    const bpInterface = new this.Jolt.BroadPhaseLayerInterfaceTable(2, NUM_BROAD_PHASE_LAYERS);
    bpInterface.MapObjectToBroadPhaseLayer(this.LAYER_NON_MOVING, BP_LAYER_NON_MOVING);
    bpInterface.MapObjectToBroadPhaseLayer(this.LAYER_MOVING, BP_LAYER_MOVING);
    
    const settings = new this.Jolt.JoltSettings();
    settings.mObjectLayerPairFilter = objectFilter;
    settings.mBroadPhaseLayerInterface = bpInterface;
    settings.mObjectVsBroadPhaseLayerFilter = new this.Jolt.ObjectVsBroadPhaseLayerFilterTable(
      settings.mBroadPhaseLayerInterface, 
      NUM_BROAD_PHASE_LAYERS, 
      settings.mObjectLayerPairFilter, 
      2
    );
    
    this.joltInterface = new this.Jolt.JoltInterface(settings);
    this.Jolt.destroy(settings);
    
    this.physicsSystem = this.joltInterface.GetPhysicsSystem();
    this.bodyInterface = this.physicsSystem.GetBodyInterface();
    
    // Set gravity
    this.physicsSystem.SetGravity(new this.Jolt.Vec3(0, -20, 0));
  }
  
  update(deltaTime: number): void {
    if (!this.Jolt || !this.joltInterface) return;
    
    const numSteps = deltaTime > 1/30 ? 2 : 1;
    // Correct API: use joltInterface.Step instead of physicsSystem.Update
    this.joltInterface.Step(deltaTime, numSteps);
  }
  
  createBox(
    halfExtents: { x: number; y: number; z: number },
    position: { x: number; y: number; z: number },
    isStatic: boolean = false
  ): number {
    const shape = new this.Jolt.BoxShape(
      new this.Jolt.Vec3(halfExtents.x, halfExtents.y, halfExtents.z),
      0.05
    );
    
    return this.createBody(shape, position, isStatic);
  }
  
  createSphere(
    radius: number,
    position: { x: number; y: number; z: number },
    isStatic: boolean = false
  ): number {
    const shape = new this.Jolt.SphereShape(radius);
    return this.createBody(shape, position, isStatic);
  }
  
  createCapsule(
    halfHeight: number,
    radius: number,
    position: { x: number; y: number; z: number },
    isStatic: boolean = false
  ): number {
    const shape = new this.Jolt.CapsuleShape(halfHeight, radius);
    return this.createBody(shape, position, isStatic);
  }
  
  private createBody(
    shape: any,
    position: { x: number; y: number; z: number },
    isStatic: boolean
  ): number {
    const motionType = isStatic ? this.Jolt.EMotionType_Static : this.Jolt.EMotionType_Dynamic;
    const layer = isStatic ? this.LAYER_NON_MOVING : this.LAYER_MOVING;
    
    const creationSettings = new this.Jolt.BodyCreationSettings(
      shape,
      new this.Jolt.RVec3(position.x, position.y, position.z),
      this.Jolt.Quat.prototype.sIdentity(),
      motionType,
      layer
    );
    
    if (!isStatic) {
      creationSettings.mAllowSleeping = false;
    }
    
    const body = this.bodyInterface.CreateBody(creationSettings);
    this.Jolt.destroy(creationSettings);
    
    this.bodyInterface.AddBody(body.GetID(), this.Jolt.EActivation_Activate);
    
    const id = this.nextBodyId++;
    this.bodies.set(id, { id, body, shape });
    
    return id;
  }
  
  getBodyPosition(id: number): { x: number; y: number; z: number } | null {
    const physicsBody = this.bodies.get(id);
    if (!physicsBody) return null;
    
    const pos = this.bodyInterface.GetPosition(physicsBody.body.GetID());
    return { x: pos.GetX(), y: pos.GetY(), z: pos.GetZ() };
  }
  
  getBodyRotation(id: number): { x: number; y: number; z: number; w: number } | null {
    const physicsBody = this.bodies.get(id);
    if (!physicsBody) return null;
    
    const rot = this.bodyInterface.GetRotation(physicsBody.body.GetID());
    return { x: rot.GetX(), y: rot.GetY(), z: rot.GetZ(), w: rot.GetW() };
  }
  
  setBodyPosition(id: number, position: { x: number; y: number; z: number }): void {
    const physicsBody = this.bodies.get(id);
    if (!physicsBody) return;
    
    this.bodyInterface.SetPosition(
      physicsBody.body.GetID(),
      new this.Jolt.RVec3(position.x, position.y, position.z),
      this.Jolt.EActivation_Activate
    );
  }
  
  setLinearVelocity(id: number, velocity: { x: number; y: number; z: number }): void {
    const physicsBody = this.bodies.get(id);
    if (!physicsBody) return;
    
    this.bodyInterface.SetLinearVelocity(
      physicsBody.body.GetID(),
      new this.Jolt.Vec3(velocity.x, velocity.y, velocity.z)
    );
  }
  
  getLinearVelocity(id: number): { x: number; y: number; z: number } | null {
    const physicsBody = this.bodies.get(id);
    if (!physicsBody) return null;
    
    const vel = this.bodyInterface.GetLinearVelocity(physicsBody.body.GetID());
    return { x: vel.GetX(), y: vel.GetY(), z: vel.GetZ() };
  }
  
  addImpulse(id: number, impulse: { x: number; y: number; z: number }): void {
    const physicsBody = this.bodies.get(id);
    if (!physicsBody) return;
    
    this.bodyInterface.AddImpulse(
      physicsBody.body.GetID(),
      new this.Jolt.Vec3(impulse.x, impulse.y, impulse.z)
    );
  }
  
  raycast(
    origin: { x: number; y: number; z: number },
    direction: { x: number; y: number; z: number },
    maxDistance: number = 1000
  ): { hit: boolean; point?: { x: number; y: number; z: number }; bodyId?: number; distance?: number } {
    if (!this.Jolt || !this.physicsSystem) return { hit: false };
    
    // Simple distance-based hit detection for enemies
    // This avoids complex Jolt raycast API that may cause issues
    let closestHit: { bodyId: number; distance: number; point: { x: number; y: number; z: number } } | null = null;
    
    for (const [id, physicsBody] of this.bodies) {
      const pos = this.bodyInterface.GetPosition(physicsBody.body.GetID());
      const bodyPos = { x: pos.GetX(), y: pos.GetY(), z: pos.GetZ() };
      
      // Calculate distance from ray to body center
      const toBody = {
        x: bodyPos.x - origin.x,
        y: bodyPos.y - origin.y,
        z: bodyPos.z - origin.z
      };
      
      // Project onto ray direction
      const dot = toBody.x * direction.x + toBody.y * direction.y + toBody.z * direction.z;
      
      if (dot > 0 && dot < maxDistance) {
        // Point on ray closest to body
        const closest = {
          x: origin.x + direction.x * dot,
          y: origin.y + direction.y * dot,
          z: origin.z + direction.z * dot
        };
        
        // Distance from closest point to body
        const dx = closest.x - bodyPos.x;
        const dy = closest.y - bodyPos.y;
        const dz = closest.z - bodyPos.z;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        
        // Hit if within reasonable radius
        if (dist < 1.5) {
          if (!closestHit || dot < closestHit.distance) {
            closestHit = {
              bodyId: id,
              distance: dot,
              point: closest
            };
          }
        }
      }
    }
    
    if (closestHit) {
      return {
        hit: true,
        point: closestHit.point,
        bodyId: closestHit.bodyId,
        distance: closestHit.distance
      };
    }
    
    return { hit: false };
  }
  
  removeBody(id: number): void {
    const physicsBody = this.bodies.get(id);
    if (!physicsBody) return;
    
    this.bodyInterface.RemoveBody(physicsBody.body.GetID());
    this.bodyInterface.DestroyBody(physicsBody.body.GetID());
    this.bodies.delete(id);
  }
  
  destroy(): void {
    for (const [id] of this.bodies) {
      this.removeBody(id);
    }
    this.bodies.clear();
  }
}
