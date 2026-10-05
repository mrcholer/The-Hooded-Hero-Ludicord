import { defineConfig } from "ludicord/config";

export default defineConfig({
  discord: {
    clientId: process.env.LUDICORD_DISCORD_CLIENT_ID,
    scopes: ["identify", "guilds", "rpc.voice.read"],
    auth: {
      required: true,
      session: "encrypted-cookie",
      proxyVerification: false,
      activityInstanceVerification: "auto",
    },
  },
  activity: { defaultEmbed: "game", outsideDiscord: "allow" },
  react: { strictMode: true },
  build: { clientAssetWarningLimit: 2000000 },
  imports: { aliases: { "@/components": "./components", "@/game": "./game", "@/src": "./src", "@/lib": "./lib", "@": "." } },
  server: {
    port: 3200,
    host: "0.0.0.0",
    allowedHosts: process.env.LUDICORD_ALLOWED_HOSTS?.split(",").map((host) => host.trim()).filter(Boolean) ?? ["localhost", "127.0.0.1", "[::1]"],
    allowedOrigins: "discord-activity",
    limits: { body: "1mb" },
    requestTimeout: 30000,
    shutdownTimeout: 10000,
  },
  websocket: {
    enabled: true,
    heartbeatInterval: 20000,
    maxPayload: 32768,
    compression: false,
    maxMessagesPerSecond: 45,
    maxBytesPerSecond: 131072,
    backpressureLimit: 262144,
    backpressureStrategy: "queue-latest",
    maxQueuedMessages: 32,
    reconnect: { enabled: true, attempts: 12, initialDelay: 500, maxDelay: 8000 },
  },
});
