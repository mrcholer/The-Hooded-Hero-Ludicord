import assert from "node:assert/strict";
import test from "node:test";
import { beginMatch, createRoom, disconnectPlayer, finishPlayer, joinParty, markLoaded, resetForRematch, respawnPlayer, selectHero, setReady, snapshotFor, startCountdown, updateMovement, withdrawFromMatch } from "./party-engine";

const identities = [
  { id: "p1", username: "choler", displayName: "Choler", avatar: null },
  { id: "p2", username: "tandid", displayName: "Tandid", avatar: null },
];

function readyRoom() {
  const room = createRoom();
  identities.forEach((identity) => joinParty(room, identity, 1_000));
  selectHero(room, "p1", "player-1", room.revision);
  selectHero(room, "p2", "player-2", room.revision);
  setReady(room, "p1", true, room.revision);
  setReady(room, "p2", true, room.revision);
  return room;
}

test("party identity, readiness and countdown are server authoritative", () => {
  const room = readyRoom();
  assert.throws(() => startCountdown(room, "p2", room.revision, 2_000), /leader/);
  startCountdown(room, "p1", room.revision, 2_000);
  assert.equal(room.status, "countdown");
  assert.equal(room.startAt, null);
  markLoaded(room, "p1", 2_500);
  assert.equal(room.startAt, null);
  markLoaded(room, "p2", 2_600);
  assert.equal(room.startAt, 5_800);
  beginMatch(room, room.startAt!);
  assert.equal(room.status, "playing");
  assert.equal(snapshotFor(room, "p1").players.length, 2);
});

test("movement is throttled and a finish requires the server-observed finish line", () => {
  const room = readyRoom();
  startCountdown(room, "p1", room.revision, 2_000);
  markLoaded(room, "p1", 2_000); markLoaded(room, "p2", 2_000);
  beginMatch(room, room.startAt!);
  assert.throws(() => finishPlayer(room, "p1", 6_000), /finish line/);
  const player = room.players.get("p1")!;
  player.position = { ...player.position, x: 15_750 };
  const result = finishPlayer(room, "p1", 8_000);
  assert.equal(result.place, 1);
  const accepted = updateMovement(room, "p2", { x: 300, y: 1_200, velocityX: 300, velocityY: 0, facing: "right", animation: "run", sequence: 1 }, 6_000);
  const throttled = updateMovement(room, "p2", { x: 310, y: 1_200, velocityX: 300, velocityY: 0, facing: "right", animation: "run", sequence: 2 }, 6_010);
  assert.equal(accepted, true);
  assert.equal(throttled, false);
});

test("disconnects transfer leadership and reconnecting restores the same player", () => {
  const room = readyRoom();
  disconnectPlayer(room, "p1");
  assert.equal(room.leaderId, "p2");
  const before = room.players.size;
  joinParty(room, identities[0]!, 5_000);
  assert.equal(room.players.size, before);
  assert.equal(room.players.get("p1")?.connected, true);
});

test("rematch keeps the Discord party and resets race state", () => {
  const room = readyRoom();
  startCountdown(room, "p1", room.revision, 2_000);
  markLoaded(room, "p1", 2_000); markLoaded(room, "p2", 2_000);
  beginMatch(room, room.startAt!);
  for (const id of ["p1", "p2"]) {
    const player = room.players.get(id)!;
    player.position = { ...player.position, x: 15_750 };
    finishPlayer(room, id, 8_000 + room.finishOrder.length * 1_000);
  }
  assert.equal(room.status, "finished");
  resetForRematch(room, "p1", room.revision, 10_000);
  assert.equal(room.status, "lobby");
  assert.equal(room.players.size, 2);
  assert.equal(room.players.get("p1")?.ready, false);
});

test("a disconnected loading player cancels the countdown safely", () => {
  const room = readyRoom();
  startCountdown(room, "p1", room.revision, 2_000);
  markLoaded(room, "p1", 2_100);
  disconnectPlayer(room, "p2");
  assert.equal(room.status, "lobby");
  assert.equal(room.startAt, null);
  assert.equal(room.players.get("p1")?.ready, false);
});

test("late joins wait for rematch, party capacity stays bounded, and respawns cannot skip checkpoints", () => {
  const room = readyRoom();
  startCountdown(room, "p1", room.revision, 2_000);
  markLoaded(room, "p1", 2_000); markLoaded(room, "p2", 2_000);
  beginMatch(room, room.startAt!);
  const waiting = joinParty(room, { ...identities[0]!, id: "p3" });
  assert.equal(waiting.participating, false);
  joinParty(room, { ...identities[0]!, id: "p4" });
  assert.throws(() => joinParty(room, { ...identities[0]!, id: "p5" }), /full/);
  assert.throws(() => respawnPlayer(room, "p1", 1), /not been reached/);
  assert.equal(updateMovement(room, "p1", { x: 15_750, y: 500, velocityX: 0, velocityY: 0, facing: "right", animation: "idle", sequence: 1 }, 200_000), false);
  assert.throws(() => finishPlayer(room, "p1"), /finish line/);
});

test("leaving a race cannot strand results or overwrite a finished player on reconnect", () => {
  const room = readyRoom();
  startCountdown(room, "p1", room.revision, 2_000);
  markLoaded(room, "p1", 2_000); markLoaded(room, "p2", 2_000);
  beginMatch(room, room.startAt!);
  const player = room.players.get("p1")!;
  player.position = { ...player.position, x: 15_750 };
  finishPlayer(room, "p1", 8_000);
  markLoaded(room, "p1", 8_100);
  assert.equal(player.status, "FINISHED");
  withdrawFromMatch(room, "p2");
  assert.equal(room.status, "finished");
  assert.equal(room.finishOrder.length, 1);
  resetForRematch(room, "p1", room.revision, 9_000);
  assert.equal(room.players.get("p2")?.participating, true);
  assert.equal(player.position.sequence, 0);
});

test("a player disconnected before a new race waits for rematch when reconnecting", () => {
  const room = readyRoom();
  const absent = { ...identities[0]!, id: "absent" };
  joinParty(room, absent, 1_000);
  disconnectPlayer(room, absent.id);
  startCountdown(room, "p1", room.revision, 2_000);
  markLoaded(room, "p1", 2_000); markLoaded(room, "p2", 2_000);
  beginMatch(room, room.startAt!);
  const restored = joinParty(room, absent, 6_000);
  assert.equal(restored.participating, false);
  assert.throws(() => markLoaded(room, absent.id), /already in progress/);
});
