import { readFileSync } from "node:fs";
import WebSocket from "ws";
import { createMockSession } from "ludicord/testing";
import { sealLudicordSession } from "../node_modules/ludicord/dist/sessions/crypto.js";

// A stationary test peer for reviewing the race locally. Never authenticates to Discord.
const env = Object.fromEntries(readFileSync(new URL("../.env.local", import.meta.url), "utf8").split(/\r?\n/).filter((line) => line.includes("=")).map((line) => {
  const index = line.indexOf("="); return [line.slice(0, index), line.slice(index + 1)];
}));
if (process.env.NODE_ENV === "production" || env.LUDICORD_DEV_FAKE_AUTH !== "true") throw new Error("The test peer requires localhost development authentication.");
const session = createMockSession({
  kind: "development", applicationId: env.LUDICORD_DISCORD_CLIENT_ID,
  instanceId: env.LUDICORD_DEV_INSTANCE_ID || "local-development-instance",
  user: { id: "local-test-friend", username: "dev_friend", displayName: "DEV Friend · Test Peer", avatar: null },
});
const cookie = sealLudicordSession(session, env.LUDICORD_SESSION_SECRET);
const socket = new WebSocket("ws://127.0.0.1:3200/ws/adventure", { headers: { Cookie: `ludicord_session=${cookie}`, Origin: "http://127.0.0.1:3200" } });
const send = (event, data) => socket.send(JSON.stringify({ v: 1, type: "event", event, data }));
let lastStatus = "";
let loaded = false;
socket.on("message", (raw) => {
  const message = JSON.parse(raw.toString());
  if (message.event !== "party:state") return;
  const state = message.data;
  const me = state.players.find((player) => player.id === session.user.id);
  if (state.status !== lastStatus) { console.log(`Test peer: ${state.status}`); lastStatus = state.status; }
  if (state.status === "lobby" && me) {
    loaded = false;
    if (!me.hero) send("player:hero", { hero: "player-2", revision: state.revision });
    else if (!me.ready) send("player:ready", { revision: state.revision });
  }
  if (state.status === "countdown" && me?.status === "LOADING" && !loaded) { loaded = true; send("match:loaded"); }
});
socket.on("error", (error) => console.error(`Test peer connection: ${error.message}`));
socket.on("close", () => process.exit(0));
process.on("SIGINT", () => socket.close());
console.log("Local stationary test peer joining. Stop this command to remove it from the party.");
