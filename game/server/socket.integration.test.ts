import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { once } from "node:events";
import { createServer } from "node:http";
import test from "node:test";
import WebSocket from "ws";
import { attachWebSocketRuntime } from "ludicord/ws/server";
import { createMockSession } from "ludicord/testing";
// Framework session helpers are used only by this test fixture, never by the app.
import { sealLudicordSession } from "../../node_modules/ludicord/dist/sessions/crypto.js";
import route from "../../app/ws/adventure/socket";
import type { PartySnapshot } from "../shared/types";

interface Envelope { type: string; event?: string; id?: string; data?: unknown; error?: unknown; }

class Peer {
  readonly socket: WebSocket;
  readonly messages: Envelope[] = [];
  state: PartySnapshot | null = null;
  private listeners = new Set<() => void>();
  constructor(url: string, cookie?: string) {
    this.socket = new WebSocket(url, { headers: { Origin: "http://127.0.0.1", ...(cookie ? { Cookie: cookie } : {}) } });
    this.socket.on("message", (raw) => {
      const message = JSON.parse(raw.toString()) as Envelope;
      this.messages.push(message);
      if (message.event === "party:state") this.state = message.data as PartySnapshot;
      for (const listener of this.listeners) listener();
    });
  }
  async wait(predicate: () => boolean): Promise<void> {
    if (predicate()) return;
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => { this.listeners.delete(check); reject(new Error("Timed out waiting for socket state")); }, 8_000);
      const check = () => { if (predicate()) { clearTimeout(timeout); this.listeners.delete(check); resolve(); } };
      this.listeners.add(check);
    });
  }
  async act(event: string, data: Record<string, unknown> = {}) {
    const id = randomBytes(8).toString("hex");
    this.socket.send(JSON.stringify({ v: 1, type: "event", event, id, data: { revision: this.state?.revision, ...data } }));
    await this.wait(() => this.messages.some((message) => (message.data as { id?: string } | undefined)?.id === id));
    const ack = this.messages.find((message) => (message.data as { id?: string } | undefined)?.id === id)!;
    assert.equal(ack.event, "$ludicord:ack", JSON.stringify(ack));
    assert.equal(ack.error, undefined, JSON.stringify(ack));
  }
}

test("authenticated WebSockets isolate parties and synchronize heroes, readiness, countdown, movement, reconnection and rematch", { timeout: 20_000 }, async () => {
  const secret = randomBytes(32).toString("hex");
  const http = createServer();
  const runtime = attachWebSocketRuntime(http, {
    projectRoot: process.cwd(),
    getRoutes: () => [{ kind: "ws", route: "/ws/adventure", file: "app/ws/adventure/socket.ts", parameters: [] }],
    loadModule: async () => ({ default: route }),
    sessionSecret: secret,
    allowDevelopmentSessions: true,
    allowedHosts: ["127.0.0.1"],
    allowedOrigins: ["http://127.0.0.1"],
    maxMessagesPerSecond: 45,
    onError: (error) => { throw error; },
  });
  await runtime.ready;
  http.listen(0, "127.0.0.1");
  await once(http, "listening");
  const address = http.address();
  assert.ok(address && typeof address !== "string");
  const url = `ws://127.0.0.1:${address.port}/ws/adventure`;
  const cookie = (id: string, instanceId = "test-party") => {
    const session = createMockSession({ kind: "development", instanceId, user: { id, username: id, displayName: id, avatar: null } });
    return `ludicord_session=${sealLudicordSession(session, secret)}`;
  };
  const peers: Peer[] = [];
  try {
    const unauthenticated = new WebSocket(url, { headers: { Origin: "http://127.0.0.1" } });
    const rejected = await new Promise<number>((resolve) => {
      unauthenticated.on("unexpected-response", (_request, response) => { response.resume(); unauthenticated.terminate(); resolve(response.statusCode ?? 0); });
      unauthenticated.on("error", () => {});
    });
    assert.equal(rejected, 401);
    const one = new Peer(url, cookie("one")); peers.push(one);
    await one.wait(() => one.state?.players.length === 1);
    const two = new Peer(url, cookie("two")); peers.push(two);
    await two.wait(() => two.state?.players.length === 2);
    await one.wait(() => one.state?.players.length === 2);
    const isolated = new Peer(url, cookie("separate", "separate-party")); peers.push(isolated);
    await isolated.wait(() => isolated.state?.players.length === 1);
    assert.equal(isolated.state?.players[0]?.id, "separate");
    await one.act("player:hero", { hero: "player-1" });
    await two.wait(() => two.state?.players[0]?.hero === "player-1");
    await two.act("player:hero", { hero: "player-2" });
    await one.wait(() => one.state?.players[1]?.hero === "player-2");
    await one.act("player:ready");
    await two.wait(() => two.state?.players[0]?.ready === true);
    await two.act("player:ready");
    await one.wait(() => one.state?.players.every((player) => player.ready) === true);
    await one.act("match:start");
    await two.wait(() => two.state?.status === "countdown");
    assert.equal(two.state?.startAt, null);
    await one.act("match:loaded");
    await two.act("match:loaded");
    await one.wait(() => one.state?.startAt !== null);
    await two.wait(() => two.state?.startAt === one.state?.startAt);
    await one.wait(() => one.state?.status === "playing");
    await two.wait(() => two.state?.status === "playing");
    one.socket.send(JSON.stringify({ v: 1, type: "event", event: "player:move", data: { x: 300, y: 1_240, velocityX: 100, velocityY: 0, sequence: 1, facing: "right", animation: "run" } }));
    await two.wait(() => two.messages.some((message) => message.event === "match:state"));
    assert.equal((two.messages.find((message) => message.event === "match:state")?.data as { playerId: string }).playerId, "one");
    one.socket.close();
    await two.wait(() => two.state?.leaderId === "two");
    const resumed = new Peer(url, cookie("one")); peers.push(resumed);
    await resumed.wait(() => resumed.state?.players.find((player) => player.id === "one")?.connected === true);
    assert.equal(resumed.state?.players.length, 2);
    assert.equal(resumed.state?.players.find((player) => player.id === "one")?.position.x, 300);
    assert.equal(resumed.state?.players.find((player) => player.id === "one")?.hero, "player-1");
    assert.equal(resumed.state?.status, "playing");
    assert.equal(isolated.state?.players.length, 1);
    await resumed.act("match:withdraw");
    await two.wait(() => two.state?.players.find((player) => player.id === "one")?.participating === false);
    await two.act("match:withdraw");
    await resumed.wait(() => resumed.state?.status === "finished");
    await two.act("match:rematch");
    await resumed.wait(() => resumed.state?.status === "lobby");
    assert.equal(resumed.state?.players.length, 2);
    assert.ok(resumed.state?.players.every((player) => !player.ready && player.participating && player.position.sequence === 0));
  } finally {
    for (const peer of peers) peer.socket.terminate();
    await runtime.close({ gracePeriodMs: 0 });
    await new Promise<void>((resolve) => http.close(() => resolve()));
  }
});

test("production WebSocket authentication rejects a valid encrypted development session", { timeout: 10_000 }, async () => {
  const secret = randomBytes(32).toString("hex");
  const http = createServer();
  const runtime = attachWebSocketRuntime(http, {
    projectRoot: process.cwd(),
    getRoutes: () => [{ kind: "ws", route: "/ws/adventure", file: "app/ws/adventure/socket.ts", parameters: [] }],
    loadModule: async () => ({ default: route }),
    sessionSecret: secret,
    allowDevelopmentSessions: false,
    allowedHosts: ["127.0.0.1"],
    allowedOrigins: ["http://127.0.0.1"],
  });
  await runtime.ready;
  http.listen(0, "127.0.0.1");
  await once(http, "listening");
  const address = http.address();
  assert.ok(address && typeof address !== "string");
  const mock = createMockSession({ kind: "development", instanceId: "production-rejection" });
  const socket = new WebSocket(`ws://127.0.0.1:${address.port}/ws/adventure`, {
    headers: { Origin: "http://127.0.0.1", Cookie: `ludicord_session=${sealLudicordSession(mock, secret)}` },
  });
  try {
    const status = await new Promise<number>((resolve, reject) => {
      socket.on("open", () => reject(new Error("Production accepted a development session")));
      socket.on("unexpected-response", (_request, response) => { response.resume(); socket.terminate(); resolve(response.statusCode ?? 0); });
      socket.on("error", () => {});
    });
    assert.equal(status, 401);
  } finally {
    socket.terminate();
    await runtime.close({ gracePeriodMs: 0 });
    await new Promise<void>((resolve) => http.close(() => resolve()));
  }
});
