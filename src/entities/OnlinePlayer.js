import { addGameSound } from "@/lib/game-audio";
import { gameInput } from "@/lib/game-input";
import * as Phaser from "phaser/dist/phaser.esm.js";
import initAnimations from "../animations/entities/onlinePlayerAnims";
import EventEmitter from "../events/Emitter";
import anims from "../mixins/anims";
import collidable from "../mixins/collidable";
import { adventureNetwork } from "@/lib/adventure-network";

class OnlinePlayer extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, spriteKey, displayName, me) {
    super(scene, x, y, spriteKey);
    this.spriteKey = spriteKey;
    this.displayName = displayName;
    this.me = me;
    this.sequence = 0;
    this.lastNetworkAt = 0;
    this.targetState = null;
    scene.add.existing(this);
    scene.physics.add.existing(this);
    Object.assign(this, collidable);
    Object.assign(this, anims);
    this.init();
    this.scene.events.on(Phaser.Scenes.Events.UPDATE, this.update, this);
    this.once(Phaser.GameObjects.Events.DESTROY, () => scene.events.off(Phaser.Scenes.Events.UPDATE, this.update, this));
  }
  init() {
    this.gravity = 2500;
    this.playerSpeed = 500;
    this.jumpCount = 0;
    this.consecutiveJumps = 1;
    this.hasBeenHit = false;
    this.bounceVelocity = 400;
    this.lastDirection = Phaser.Physics.Arcade.FACING_RIGHT;
    this.body.setSize(120, 150).setGravityY(this.gravity).setMaxVelocityY(1000);
    this.setCollideWorldBounds(true);
    this.jumpFx = addGameSound(this.scene, "jump", { volume: 0.2 });
    this.takeDamageFx = addGameSound(this.scene, "damage", { volume: 0.2 });
    this.stepFx = addGameSound(this.scene, "step", { volume: 0.05 });
    initAnimations(this.scene.anims);
  }
  update(_time, delta) {
    if (!this.body) return;
    if (!this.me) { this.interpolateRemote(delta); return; }
    const controls = gameInput.gameplay();
    if (!adventureNetwork.isConnected() || !this.scene.input.keyboard.enabled) { this.setVelocityX(0); this.wasDisconnected ||= !adventureNetwork.isConnected(); return; }
    if (this.hasBeenHit) return;
    this.checkOutOfBounds();
    this.handleMovement(controls);
    this.sendMovement();
  }
  handleMovement(controls) {
    const jumpDown = controls.jump;
    const onFloor = this.body.onFloor();
    this.playerSpeed = controls.sprint && onFloor ? 650 : 500;
    if (controls.horizontal < 0) { this.lastDirection = Phaser.Physics.Arcade.FACING_LEFT; this.setVelocityX(controls.horizontal * this.playerSpeed); this.setFlipX(true); }
    else if (controls.horizontal > 0) { this.lastDirection = Phaser.Physics.Arcade.FACING_RIGHT; this.setVelocityX(controls.horizontal * this.playerSpeed); this.setFlipX(false); }
    else this.setVelocityX(0);
    if (jumpDown && (onFloor || this.jumpCount < this.consecutiveJumps)) { this.jumpFx.play(); this.setVelocityY(-1000); this.jumpCount += 1; }
    if (onFloor) this.jumpCount = 0;
    this.play(onFloor ? (this.body.velocity.x ? `run-${this.spriteKey}` : `idle-${this.spriteKey}`) : `jump-${this.spriteKey}`, true);
  }
  sendMovement(force = false) {
    const now = performance.now();
    if (!force && now - this.lastNetworkAt < 50) return;
    this.lastNetworkAt = now;
    this.sequence += 1;
    const onFloor = this.body.onFloor();
    adventureNetwork.send("player:move", {
      x: this.x, y: this.y, velocityX: this.body.velocity.x, velocityY: this.body.velocity.y,
      facing: this.flipX ? "left" : "right",
      animation: onFloor ? (Math.abs(this.body.velocity.x) > 1 ? "run" : "idle") : "jump",
      sequence: this.sequence,
    });
  }
  updateOtherPlayer(state) {
    if (!state || state.sequence <= (this.targetState?.sequence ?? -1)) return;
    this.targetState = state;
  }
  interpolateRemote(delta) {
    const state = this.targetState;
    if (!state) return;
    const factor = 1 - Math.pow(0.001, Math.min(delta, 100) / 1000);
    this.x = Phaser.Math.Linear(this.x, state.x, Math.max(0.12, factor));
    this.y = Phaser.Math.Linear(this.y, state.y, Math.max(0.12, factor));
    this.setFlipX(state.facing === "left");
    this.play(`${state.animation}-${this.spriteKey}`, true);
  }
  checkOutOfBounds() { if (this.getBounds().top > this.scene.config.height * 2.5) EventEmitter.emit("RESPAWN"); }
  playDamageTween() { return this.scene.tweens.add({ targets: this, alpha: 0.35, duration: 250, ease: "Power1", yoyo: true }); }
  bounceOff(source) { this.setVelocityX(source.body?.touching?.right || this.body.blocked.right ? -this.bounceVelocity : this.bounceVelocity); this.scene.time.delayedCall(0, () => this.setVelocityY(-this.bounceVelocity)); }
  takesHit(source) {
    if (this.hasBeenHit) return;
    this.takeDamageFx.play(); this.hasBeenHit = true; this.bounceOff(source);
    const tween = this.playDamageTween(); source.deliversHit?.(this);
    this.scene.time.delayedCall(500, () => { this.hasBeenHit = false; tween.stop(); this.clearTint(); });
  }
}
export default OnlinePlayer;
