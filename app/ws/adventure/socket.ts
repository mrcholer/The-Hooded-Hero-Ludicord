import { defineWS } from "ludicord/ws/server";
import type { LudicordWebSocketClient } from "ludicord/ws/server";
import {
  RECONNECT_WINDOW_MS,
  beginMatch,
  cancelCountdown,
  createRoom,
  disconnectPlayer,
  finishPlayer,
  joinParty,
  markLoaded,
  removePlayer,
  resetForRematch,
  respawnPlayer,
  selectHero,
  setReady,
  snapshotFor,
  startCountdown,
  updateMovement,
  withdrawFromMatch,
} from "@/game/server/party-engine";
import type { AdventureRoom } from "@/game/server/party-engine";
import type { HeroId, MovementPacket } from "@/game/shared/types";

interface ConnectionRecord { readonly client: LudicordWebSocketClient; readonly roomKey: string; readonly userId: string; }
const rooms = new Map<string, AdventureRoom>();
const connections = new Map<string, ConnectionRecord>();
const reconnectTimers = new Map<string, ReturnType<typeof setTimeout>>();
const matchTimers = new Map<string, ReturnType<typeof setTimeout>>();

function keyFor(client: LudicordWebSocketClient): string {
  if (!client.ludicord.instanceId) throw new Error("The Activity session is unavailable. Relaunch the Activity from Discord.");
  return [client.ludicord.applicationId, client.ludicord.instanceId].join(":");
}
function playerTimerKey(roomKey: string, userId: string): string { return `${roomKey}:${userId}`; }
function roomFor(key: string): AdventureRoom {
  const room = rooms.get(key) ?? createRoom();
  rooms.set(key, room);
  return room;
}
function recordFor(client: LudicordWebSocketClient): ConnectionRecord {
  const record = connections.get(client.id);
  if (!record) throw new Error("This connection is not part of an adventure party.");
  return record;
}
function publish(roomKey: string): void {
  const room = rooms.get(roomKey);
  if (!room) return;
  for (const record of connections.values()) if (record.roomKey === roomKey) record.client.emit("party:state", snapshotFor(room, record.userId));
}
function broadcastMovement(roomKey: string, playerId: string, packet: MovementPacket, serverAt: number): void {
  for (const record of connections.values()) {
    if (record.roomKey === roomKey && record.userId !== playerId) record.client.emit("match:state", { playerId, ...packet, serverAt });
  }
}
function revision(data: unknown): number {
  if (typeof data !== "object" || data === null || !Number.isSafeInteger((data as { revision?: unknown }).revision)) throw new Error("Invalid party revision.");
  return (data as { revision: number }).revision;
}
function hero(data: unknown): HeroId {
  const value = typeof data === "object" && data !== null ? (data as { hero?: unknown }).hero : null;
  if (!["player-1", "player-2", "player-3", "player-4"].includes(String(value))) throw new Error("Unknown hero selection.");
  return value as HeroId;
}
function movement(data: unknown): MovementPacket {
  if (typeof data !== "object" || data === null) throw new Error("Invalid movement packet.");
  const value = data as Record<string, unknown>;
  return {
    x: value.x as number, y: value.y as number, velocityX: value.velocityX as number, velocityY: value.velocityY as number,
    facing: value.facing as MovementPacket["facing"],
    animation: value.animation as MovementPacket["animation"],
    sequence: value.sequence as number,
  };
}
function mutate(client: LudicordWebSocketClient, operation: (room: AdventureRoom, userId: string, roomKey: string) => void): void {
  const record = recordFor(client);
  try { operation(roomFor(record.roomKey), record.userId, record.roomKey); }
  catch (error) { client.emit("party:error", { message: error instanceof Error ? error.message : "The party action could not be completed." }); throw error; }
  publish(record.roomKey);
}
function scheduleMatch(roomKey: string, startAt: number): void {
  const previous = matchTimers.get(roomKey);
  if (previous) clearTimeout(previous);
  matchTimers.set(roomKey, setTimeout(() => {
    const room = rooms.get(roomKey);
    if (!room || room.status !== "countdown") return;
    beginMatch(room, Date.now());
    publish(roomKey);
    matchTimers.delete(roomKey);
  }, Math.max(0, startAt - Date.now()) + 20).unref());
}

export default defineWS({
  connect(client) {
    const roomKey = keyFor(client);
    const user = client.ludicord.user;
    const timerKey = playerTimerKey(roomKey, user.id);
    const pendingRemoval = reconnectTimers.get(timerKey);
    if (pendingRemoval) clearTimeout(pendingRemoval);
    reconnectTimers.delete(timerKey);
    try { joinParty(roomFor(roomKey), { id: user.id, username: user.username, displayName: user.displayName || user.username, avatar: user.avatar }); }
    catch (error) {
      const message = error instanceof Error ? error.message : "Party unavailable";
      client.emit("party:error", { message });
      client.close(4009, message);
      return;
    }
    client.activity.join();
    connections.set(client.id, { client, roomKey, userId: user.id });
    publish(roomKey);
  },
  events: {
    "party:sync"(client) {
      const record = recordFor(client);
      client.emit("party:state", snapshotFor(roomFor(record.roomKey), record.userId));
    },
    "player:hero"(client, data) { mutate(client, (room, id) => selectHero(room, id, hero(data), revision(data))); },
    "player:ready"(client, data) { mutate(client, (room, id) => setReady(room, id, true, revision(data))); },
    "player:unready"(client, data) { mutate(client, (room, id) => setReady(room, id, false, revision(data))); },
    "match:start"(client, data) {
      mutate(client, (room, id, roomKey) => {
        startCountdown(room, id, revision(data));
        const oldTimer = matchTimers.get(roomKey);
        if (oldTimer) clearTimeout(oldTimer);
        matchTimers.set(roomKey, setTimeout(() => {
          cancelCountdown(room);
          matchTimers.delete(roomKey);
          publish(roomKey);
        }, 90_000).unref());
      });
    },
    "match:loaded"(client) { mutate(client, (room, id, roomKey) => {
      const waiting = room.startAt === null;
      markLoaded(room, id);
      if (waiting && room.startAt !== null) scheduleMatch(roomKey, room.startAt);
    }); },
    "player:move"(client, data) {
      const record = recordFor(client);
      const packet = movement(data);
      const now = Date.now();
      if (updateMovement(roomFor(record.roomKey), record.userId, packet, now)) broadcastMovement(record.roomKey, record.userId, packet, now);
    },
    "player:respawn"(client, data) {
      mutate(client, (room, id) => {
        const checkpoint = typeof data === "object" && data !== null && typeof (data as { checkpoint?: unknown }).checkpoint === "number" ? (data as { checkpoint: number }).checkpoint : -1;
        respawnPlayer(room, id, checkpoint);
      });
    },
    "match:finish"(client) { mutate(client, (room, id) => { finishPlayer(room, id); }); },
    "match:withdraw"(client) { mutate(client, (room, id) => { withdrawFromMatch(room, id); }); },
    "match:rematch"(client, data) { mutate(client, (room, id) => resetForRematch(room, id, revision(data))); },
  },
  disconnect(client) {
    const record = connections.get(client.id);
    if (!record) return;
    connections.delete(client.id);
    const stillConnected = [...connections.values()].some((candidate) => candidate.roomKey === record.roomKey && candidate.userId === record.userId);
    if (stillConnected) return;
    const room = rooms.get(record.roomKey);
    if (!room) return;
    disconnectPlayer(room, record.userId);
    publish(record.roomKey);
    const timerKey = playerTimerKey(record.roomKey, record.userId);
    reconnectTimers.set(timerKey, setTimeout(() => {
      const current = rooms.get(record.roomKey);
      if (!current || current.players.get(record.userId)?.connected) return;
      removePlayer(current, record.userId);
      reconnectTimers.delete(timerKey);
      publish(record.roomKey);
      if (current.players.size === 0) {
        const matchTimer = matchTimers.get(record.roomKey);
        if (matchTimer) clearTimeout(matchTimer);
        matchTimers.delete(record.roomKey);
        rooms.delete(record.roomKey);
      }
    }, RECONNECT_WINDOW_MS).unref());
  },
});
