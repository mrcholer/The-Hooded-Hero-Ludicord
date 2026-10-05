import type { FinishResult, HeroId, MovementPacket, PartyPlayer, PartySnapshot, PartyStatus, PlayerIdentity, PlayerStatus } from "../shared/types";

export const MAX_PLAYERS = 4;
export const MIN_PLAYERS = 2;
const configuredReconnectWindow = Number(process.env.LUDICORD_RECONNECT_WINDOW_MS);
export const RECONNECT_WINDOW_MS = Number.isFinite(configuredReconnectWindow) && configuredReconnectWindow > 0
  ? Math.max(5_000, Math.min(120_000, configuredReconnectWindow)) : 25_000;
export const COUNTDOWN_MS = 3_200;
export const FINISH_X = 15_700;
export const SPAWN = { x: 241, y: 1_241 } as const;
export const CHECKPOINTS = [SPAWN, { x: 7_987, y: 504 }] as const;
const HEROES: readonly HeroId[] = ["player-1", "player-2", "player-3", "player-4"];

type Mutable<T> = { -readonly [K in keyof T]: T[K] };
export type PlayerRecord = Mutable<PartyPlayer> & {
  resumeStatus: PlayerStatus;
  lastPacketAt: number;
  loaded: boolean;
  checkpoint: number;
};

export interface AdventureRoom {
  revision: number;
  status: PartyStatus;
  leaderId: string | null;
  players: Map<string, PlayerRecord>;
  startAt: number | null;
  matchStartedAt: number | null;
  finishOrder: FinishResult[];
}

export function createRoom(): AdventureRoom {
  return { revision: 0, status: "lobby", leaderId: null, players: new Map(), startAt: null, matchStartedAt: null, finishOrder: [] };
}

function initialPosition(now: number) {
  return { x: SPAWN.x, y: SPAWN.y, velocityX: 0, velocityY: 0, facing: "right" as const, animation: "idle" as const, sequence: 0, updatedAt: now };
}

function touch(room: AdventureRoom): void { room.revision += 1; }
function requireRevision(room: AdventureRoom, revision: number): void {
  if (!Number.isSafeInteger(revision) || revision !== room.revision) throw new Error("Party state changed. Please try again.");
}
function requirePlayer(room: AdventureRoom, id: string): PlayerRecord {
  const player = room.players.get(id);
  if (!player?.connected) throw new Error("Player is not connected to this party.");
  return player;
}
function requireParticipant(room: AdventureRoom, id: string): PlayerRecord {
  const player = requirePlayer(room, id);
  if (!player.participating) throw new Error("The current match is already in progress.");
  return player;
}
function requireLeader(room: AdventureRoom, id: string): PlayerRecord {
  const player = requirePlayer(room, id);
  if (room.leaderId !== id) throw new Error("Only the party leader can do that.");
  return player;
}
function activePlayers(room: AdventureRoom): PlayerRecord[] {
  return [...room.players.values()].filter((player) => player.participating);
}
function ensureLeader(room: AdventureRoom): void {
  if (room.leaderId && room.players.get(room.leaderId)?.connected) return;
  room.leaderId = [...room.players.values()].find((player) => player.connected && player.participating)?.id
    ?? [...room.players.values()].find((player) => player.connected)?.id
    ?? null;
}

export function joinParty(room: AdventureRoom, identity: PlayerIdentity, now = Date.now()): PlayerRecord {
  const existing = room.players.get(identity.id);
  if (existing) {
    existing.username = identity.username;
    existing.displayName = identity.displayName;
    existing.avatar = identity.avatar;
    existing.connected = true;
    existing.status = room.status === "lobby" ? "SELECTING" : existing.resumeStatus;
    if (room.status === "lobby") { existing.participating = true; existing.ready = false; }
    existing.position = { ...existing.position, updatedAt: now };
    ensureLeader(room);
    touch(room);
    return existing;
  }
  if (room.players.size >= MAX_PLAYERS) throw new Error("This adventure party is full.");
  const participating = room.status === "lobby";
  const player: PlayerRecord = {
    ...identity,
    hero: null,
    ready: false,
    status: "SELECTING",
    resumeStatus: "SELECTING",
    connected: true,
    participating,
    position: initialPosition(now),
    finishTime: null,
    finishPlace: null,
    lastPacketAt: 0,
    loaded: false,
    checkpoint: 0,
  };
  room.players.set(identity.id, player);
  ensureLeader(room);
  touch(room);
  return player;
}

export function disconnectPlayer(room: AdventureRoom, id: string): void {
  const player = room.players.get(id);
  if (!player || !player.connected) return;
  player.connected = false;
  player.resumeStatus = player.status === "DISCONNECTED" ? player.resumeStatus : player.status;
  player.status = "DISCONNECTED";
  player.ready = false;
  if (room.status === "countdown") cancelCountdown(room);
  ensureLeader(room);
  touch(room);
}

export function removePlayer(room: AdventureRoom, id: string): void {
  room.players.delete(id);
  ensureLeader(room);
  if (room.status === "playing" && activePlayers(room).every((player) => player.status === "FINISHED" || !player.connected)) room.status = "finished";
  touch(room);
}

export function selectHero(room: AdventureRoom, id: string, hero: HeroId, revision: number): void {
  requireRevision(room, revision);
  const player = requireParticipant(room, id);
  if (room.status !== "lobby") throw new Error("Heroes can only be changed in the party lobby.");
  if (!HEROES.includes(hero)) throw new Error("Unknown hero selection.");
  player.hero = hero;
  player.ready = false;
  player.status = "SELECTING";
  player.resumeStatus = "SELECTING";
  touch(room);
}

export function setReady(room: AdventureRoom, id: string, ready: boolean, revision: number): void {
  requireRevision(room, revision);
  const player = requireParticipant(room, id);
  if (room.status !== "lobby") throw new Error("The party is no longer in the lobby.");
  if (ready && !player.hero) throw new Error("Choose a hero before getting ready.");
  player.ready = ready;
  player.status = ready ? "READY" : "SELECTING";
  player.resumeStatus = player.status;
  touch(room);
}

export function startCountdown(room: AdventureRoom, id: string, revision: number, now = Date.now()): void {
  requireRevision(room, revision);
  requireLeader(room, id);
  if (room.status !== "lobby") throw new Error("The adventure has already started.");
  const players = activePlayers(room).filter((player) => player.connected);
  if (players.length < MIN_PLAYERS) throw new Error("At least two players are required.");
  if (players.some((player) => !player.hero || !player.ready)) throw new Error("Every player must choose a hero and be ready.");
  room.status = "countdown";
  room.startAt = null;
  room.matchStartedAt = null;
  room.finishOrder = [];
  for (const player of room.players.values()) if (!player.connected) player.participating = false;
  for (const player of players) {
    player.status = "LOADING";
    player.resumeStatus = "LOADING";
    player.position = initialPosition(now);
    player.finishTime = null;
    player.finishPlace = null;
    player.loaded = false;
    player.checkpoint = 0;
  }
  touch(room);
}

export function beginMatch(room: AdventureRoom, now = Date.now()): void {
  if (room.status !== "countdown" || !room.startAt || now < room.startAt) return;
  room.status = "playing";
  room.matchStartedAt = room.startAt;
  for (const player of activePlayers(room)) {
    if (!player.connected) continue;
    player.status = "PLAYING";
    player.resumeStatus = "PLAYING";
  }
  touch(room);
}

export function markLoaded(room: AdventureRoom, id: string, now = Date.now()): void {
  const player = requireParticipant(room, id);
  if (room.status !== "countdown" && room.status !== "playing") return;
  if (player.status === "FINISHED") return;
  player.status = room.status === "playing" ? "PLAYING" : "LOADING";
  player.resumeStatus = player.status;
  player.loaded = true;
  const players = activePlayers(room).filter((candidate) => candidate.connected);
  if (room.status === "countdown" && !room.startAt && players.length >= MIN_PLAYERS && players.every((candidate) => candidate.loaded)) room.startAt = now + COUNTDOWN_MS;
  touch(room);
}

export function cancelCountdown(room: AdventureRoom): void {
  if (room.status !== "countdown") return;
  room.status = "lobby";
  room.startAt = null;
  room.matchStartedAt = null;
  for (const player of room.players.values()) {
    player.participating = true;
    player.ready = false;
    player.loaded = false;
    player.resumeStatus = "SELECTING";
    player.status = player.connected ? "SELECTING" : "DISCONNECTED";
  }
  touch(room);
}

export function withdrawFromMatch(room: AdventureRoom, id: string): void {
  const player = requirePlayer(room, id);
  if (room.status === "countdown") cancelCountdown(room);
  player.ready = false;
  if (room.status === "playing") {
    player.participating = false;
    player.status = "SELECTING";
    player.resumeStatus = "SELECTING";
    const remaining = activePlayers(room).filter((candidate) => candidate.connected);
    if (remaining.every((candidate) => candidate.status === "FINISHED")) room.status = "finished";
  } else if (room.status === "lobby") {
    player.status = "SELECTING";
    player.resumeStatus = "SELECTING";
  }
  touch(room);
}

export function updateMovement(room: AdventureRoom, id: string, packet: MovementPacket, now = Date.now()): boolean {
  const player = requireParticipant(room, id);
  if (room.status !== "playing" || player.status === "FINISHED") return false;
  if (now - player.lastPacketAt < 35 || !validMovement(packet) || packet.sequence <= player.position.sequence) return false;
  const elapsed = Math.max(35, Math.min(1_000, now - player.position.updatedAt));
  const distance = Math.hypot(packet.x - player.position.x, packet.y - player.position.y);
  if (distance > Math.max(420, elapsed * 1.4)) return false;
  player.position = { ...packet, updatedAt: now };
  player.lastPacketAt = now;
  if (Math.abs(packet.x - CHECKPOINTS[1].x) < 250 && Math.abs(packet.y - CHECKPOINTS[1].y) < 300) player.checkpoint = 1;
  return true;
}

function validMovement(packet: MovementPacket): boolean {
  return Number.isFinite(packet.x) && packet.x >= 0 && packet.x <= 16_100
    && Number.isFinite(packet.y) && packet.y >= -1_000 && packet.y <= 4_000
    && Number.isFinite(packet.velocityX) && Math.abs(packet.velocityX) <= 900
    && Number.isFinite(packet.velocityY) && Math.abs(packet.velocityY) <= 1_500
    && Number.isSafeInteger(packet.sequence) && packet.sequence >= 0
    && (packet.facing === "left" || packet.facing === "right")
    && ["idle", "run", "jump"].includes(packet.animation);
}

export function respawnPlayer(room: AdventureRoom, id: string, checkpoint: number, now = Date.now()): void {
  const player = requireParticipant(room, id);
  if (room.status !== "playing" || player.status === "FINISHED") throw new Error("Respawn is unavailable.");
  const point = CHECKPOINTS[checkpoint];
  if (!point || !Number.isInteger(checkpoint) || checkpoint > player.checkpoint) throw new Error("The checkpoint has not been reached.");
  player.position = { ...initialPosition(now), x: point.x, y: point.y, sequence: player.position.sequence + 1 };
  player.lastPacketAt = now;
}

export function finishPlayer(room: AdventureRoom, id: string, now = Date.now()): FinishResult {
  const player = requireParticipant(room, id);
  if (room.status !== "playing" || !room.matchStartedAt) throw new Error("There is no active race.");
  if (player.position.x < FINISH_X) throw new Error("The finish line has not been reached.");
  const existing = room.finishOrder.find((result) => result.playerId === id);
  if (existing) return existing;
  const result = { playerId: id, place: room.finishOrder.length + 1, finishTime: Math.max(0, now - room.matchStartedAt) };
  room.finishOrder.push(result);
  player.finishPlace = result.place;
  player.finishTime = result.finishTime;
  player.status = "FINISHED";
  player.resumeStatus = "FINISHED";
  const contenders = activePlayers(room).filter((candidate) => candidate.connected);
  if (contenders.length > 0 && contenders.every((candidate) => candidate.status === "FINISHED")) room.status = "finished";
  touch(room);
  return result;
}

export function resetForRematch(room: AdventureRoom, id: string, revision: number, now = Date.now()): void {
  requireRevision(room, revision);
  requireLeader(room, id);
  if (room.status !== "finished") throw new Error("The race has not finished.");
  room.status = "lobby";
  room.startAt = null;
  room.matchStartedAt = null;
  room.finishOrder = [];
  for (const player of room.players.values()) {
    player.participating = player.connected;
    player.ready = false;
    player.status = "SELECTING";
    player.resumeStatus = "SELECTING";
    player.position = initialPosition(now);
    player.finishPlace = null;
    player.finishTime = null;
    player.loaded = false;
    player.checkpoint = 0;
  }
  ensureLeader(room);
  touch(room);
}

export function snapshotFor(room: AdventureRoom, viewerId: string): PartySnapshot {
  return {
    serverNow: Date.now(),
    revision: room.revision,
    status: room.status,
    leaderId: room.leaderId,
    viewerId,
    players: [...room.players.values()].map(({ resumeStatus: _resume, lastPacketAt: _packet, loaded: _loaded, checkpoint: _checkpoint, ...player }) => ({ ...player })),
    startAt: room.startAt,
    matchStartedAt: room.matchStartedAt,
    finishOrder: room.finishOrder.map((result) => ({ ...result })),
    reconnectWindowMs: RECONNECT_WINDOW_MS,
  };
}
