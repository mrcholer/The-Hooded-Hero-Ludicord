// @ts-nocheck
import * as Phaser from "phaser/dist/phaser.esm.js";
import initAnims from "../../../animations";
import OnlinePlayer from "../../../entities/OnlinePlayer";
import EventEmitter from "../../../events/Emitter";
import Enemies from "../../../groups/Enemies";
import { adventureNetwork } from "@/lib/adventure-network";
import BaseScene from "../BaseScene";

export default class OnlinePlayScene extends BaseScene {
  constructor(config) { super("OnlinePlayScene", config); this.config = config; this.stageKey = "level_online"; this.opponents = {}; this.labels = {}; this.lastCheckpointIndex = 0; this.finished = false; }
  create() {
    super.create();
    const snapshot = adventureNetwork.getSnapshot();
    const viewer = snapshot?.players.find((player) => player.id === snapshot.viewerId);
    if (!snapshot || !viewer?.hero || !viewer.participating) { this.add.text(640, 360, "Game in progress", { fontFamily: "customFont", fontSize: "52px", color: "#fff" }).setOrigin(0.5); return; }
    this.viewerId = snapshot.viewerId;
    this.input.keyboard.enabled = snapshot.status === "playing";
    const map = this.createMap(); initAnims(this.anims);
    const layers = this.createLayers(map); const zones = this.getPlayerZones(layers.playerZones);
    this.player = new OnlinePlayer(this, viewer.position.x || zones.start.x, viewer.position.y || zones.start.y, viewer.hero, viewer.displayName, true);
    this.player.sequence = viewer.position.sequence;
    if (snapshot.status !== "playing") this.physics.pause();
    this.lastCheckpoint = zones.start;
    this.createPlayerLabel(this.viewerId, this.player, viewer.displayName, true);
    const enemies = this.createEnemies(layers.enemySpawns, layers.platformsColliders);
    enemies.addCollider(layers.platformsColliders).addCollider(this.player, (enemy, player) => player.takesHit(enemy));
    this.player.addCollider(layers.platformsColliders).addCollider(enemies.getProjectiles(), (entity, source) => entity.takesHit(source)).addOverlap(enemies, (entity, source) => entity.takesHit(source));
    this.playBgMusic(); this.createBG(); this.createEndOfLevel(zones.end); this.handleCheckpoints(zones.checkpoints); this.setupFollowupCameraOn(this.player);
    this.raceText = this.add.text(this.config.width / 2, this.config.height / 2 - 620, "RACE TO THE FINISH", { fontFamily: "customFont", fontSize: "48px", color: "#fff", stroke: "#111", strokeThickness: 8 }).setOrigin(0.5).setScrollFactor(0).setDepth(50);
    this.syncPlayers(snapshot);
    this.offSnapshot = adventureNetwork.onSnapshot((next) => {
      const me = next.players.find((player) => player.id === this.viewerId);
      this.finished = me?.status === "FINISHED";
      this.input.keyboard.enabled = next.status === "playing" && !this.finished;
      if (next.status === "playing") this.physics.resume(); else this.physics.pause();
      if (this.finished) { this.player.setVelocity(0, 0); this.raceText.setText("FINISHED · WAITING FOR THE PARTY"); }
      if (me && this.player.wasDisconnected) {
        this.player.setPosition(me.position.x, me.position.y).setVelocity(0, 0);
        this.player.sequence = me.position.sequence;
        this.player.wasDisconnected = false;
      }
      this.syncPlayers(next);
    });
    this.offMovement = adventureNetwork.onMovement((packet) => this.opponents[packet.playerId]?.updateOtherPlayer(packet));
    this.respawnHandler = () => this.respawn(); EventEmitter.on("RESPAWN", this.respawnHandler);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.cleanup());
  }
  syncPlayers(snapshot) {
    const visible = new Set();
    snapshot.players.filter((player) => player.participating && player.id !== this.viewerId).forEach((player) => {
      visible.add(player.id);
      if (!this.opponents[player.id] && player.hero) {
        const opponent = new OnlinePlayer(this, player.position.x, player.position.y, player.hero, player.displayName, false);
        opponent.body.setAllowGravity(false); this.opponents[player.id] = opponent; this.createPlayerLabel(player.id, opponent, player.displayName, false);
      }
      this.opponents[player.id]?.updateOtherPlayer(player.position);
      this.opponents[player.id]?.setAlpha(player.connected ? 1 : 0.42);
      this.labels[player.id]?.setAlpha(player.connected ? 1 : 0.42);
    });
    Object.keys(this.opponents).forEach((id) => { if (!visible.has(id)) { this.opponents[id].destroy(); this.labels[id]?.destroy(); delete this.opponents[id]; delete this.labels[id]; } });
  }
  createPlayerLabel(id, player, name, me) { this.labels[id] = this.add.text(player.x, player.y - 105, `${name}${me ? " · YOU" : ""}`, { fontFamily: "customFont", fontSize: "25px", color: me ? "#ffd36b" : "#fff", stroke: "#111", strokeThickness: 6 }).setOrigin(0.5).setDepth(20); }
  createMap() { const map = this.make.tilemap({ key: this.stageKey }); map.addTilesetImage("tileset_1", "forest-tiles"); map.addTilesetImage("tileset_2", "cave-tiles"); map.addTilesetImage("environment", "environment-tiles"); map.addTilesetImage("house_inside_4", "house-tiles"); return map; }
  createLayers(map) {
    const t1 = map.getTileset("tileset_1"), t2 = map.getTileset("tileset_2"), t3 = map.getTileset("environment"), t4 = map.getTileset("house_inside_4");
    const platformsColliders = map.createLayer("platforms_colliders", [t1,t2,t3]).setCollisionByProperty({ collides: true }).setAlpha(0);
    map.createLayer("environment", [t3,t4]).setDepth(-4); map.createLayer("platforms", [t1,t2,t3,t4]);
    return { platformsColliders, playerZones: map.getObjectLayer("player_zones"), enemySpawns: map.getObjectLayer("enemy_spawns") };
  }
  createEnemies(spawnLayer, platforms) { const enemies = new Enemies(this); const types = enemies.getTypes(); spawnLayer.objects.forEach((point) => { const Type = types[point.type]; if (Type) { const enemy = new Type(this, point.x, point.y); enemy.setPlatformColliders(platforms); enemies.add(enemy); } }); return enemies; }
  getPlayerZones(layer) { const zones = layer.objects; return { start: zones.find((z) => z.name === "startZone"), end: zones.find((z) => z.name === "endZone"), checkpoints: zones.filter((z) => z.name.startsWith("checkpoint")) }; }
  createEndOfLevel(end) { const finish = this.physics.add.sprite(end.x, end.y, "end").setAlpha(0).setSize(20, 260).setOrigin(0.5, 1); this.physics.add.overlap(this.player, finish, () => {
    if (this.finished || this.finishing) return;
    this.finishing = true;
    this.player.sendMovement(true);
    adventureNetwork.request("match:finish").catch(() => {
      this.time.delayedCall(500, () => { this.finishing = false; });
    });
  }); }
  handleCheckpoints(checkpoints) { checkpoints.forEach((point, index) => { const mark = this.physics.add.sprite(point.x, point.y, "checkpoint").setAlpha(0).setSize(20, 240).setOrigin(0.5, 1); this.physics.add.overlap(this.player, mark, () => { this.lastCheckpoint = point; this.lastCheckpointIndex = index + 1; }); }); }
  respawn() {
    const snapshot = adventureNetwork.getSnapshot();
    const viewer = snapshot?.players.find((player) => player.id === this.viewerId);
    if (!this.player || !this.lastCheckpoint || this.respawning || snapshot?.status !== "playing" || !viewer?.participating || viewer.status === "FINISHED" || !adventureNetwork.isConnected()) return;
    this.respawning = true;
    adventureNetwork.request("player:respawn", { checkpoint: this.lastCheckpointIndex }).then(() => {
      const me = adventureNetwork.getSnapshot()?.players.find((player) => player.id === this.viewerId);
      if (!this.player.body) return;
      this.player.setPosition(me?.position.x ?? this.lastCheckpoint.x, me?.position.y ?? this.lastCheckpoint.y).setVelocity(0, 0);
      this.player.sequence = me?.position.sequence ?? this.player.sequence;
    }).catch(() => { this.lastCheckpointIndex = 0; }).finally(() => { this.respawning = false; });
  }
  setupFollowupCameraOn(player) { const { height, width, mapOffset } = this.config; this.physics.world.setBounds(0, 0, width + mapOffset, height * 3); this.cameras.main.setBounds(0, 0, width + mapOffset, height + 1000).setZoom(0.5).startFollow(player); }
  createBG() { const layers = [["bg-forest-1",300,-10,1.3],["bg-forest-2",300,-11,1.3],["bg-forest-3",300,-12,1],["mountain-bg",200,-13,1],["sky-bg",0,-14,1]]; this.bgSprites = layers.map(([key,y,depth,scale]) => this.add.tileSprite(0, y, this.config.width + 3000, this.config.height + 1000, key).setOrigin(0.5,0).setDepth(depth).setScale(scale).setScrollFactor(0,1)); }
  playBgMusic() { this.sound.stopAll(); this.onlineBGM.play(); }
  update() { if (!this.player) return; Object.entries(this.labels).forEach(([id,label]) => { const target = id === this.viewerId ? this.player : this.opponents[id]; if (target) label.setPosition(target.x, target.y - 105); }); if (this.bgSprites) this.bgSprites.forEach((sprite, index) => { sprite.tilePositionX = this.cameras.main.scrollX * (0.3 - Math.min(index,4) * 0.04); }); }
  cleanup() { this.offSnapshot?.(); this.offMovement?.(); if (this.respawnHandler) EventEmitter.off("RESPAWN", this.respawnHandler); }
}
