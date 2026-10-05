import type { PartySnapshot, MovementBroadcast } from "@/game/shared/types";

export type GameLaunch = { readonly mode: "story"; readonly level: number } | { readonly mode: "level-select" } | { readonly mode: "multiplayer" };
let launch: GameLaunch = { mode: "story", level: 1 };
export function setGameLaunch(next: GameLaunch): void { launch = next; }
export function getGameLaunch(): GameLaunch { return launch; }

let snapshot: PartySnapshot | null = null;
let sender: ((event: string, data?: Record<string, unknown>) => void) | null = null;
let requester: ((event: string, data?: Record<string, unknown>) => Promise<void>) | null = null;
let connected = false;
const snapshotListeners = new Set<(value: PartySnapshot) => void>();
const movementListeners = new Set<(value: MovementBroadcast) => void>();

export const adventureNetwork = {
  setSender(next: typeof sender) { sender = next; },
  setConnected(next: boolean) { connected = next; },
  isConnected() { return connected; },
  setRequester(next: typeof requester) { requester = next; },
  request(event: string, data: Record<string, unknown> = {}) { return requester ? requester(event, data) : Promise.reject(new Error("Party connection unavailable.")); },
  send(event: string, data: Record<string, unknown> = {}) { sender?.(event, data); },
  setSnapshot(next: PartySnapshot) { snapshot = next; snapshotListeners.forEach((listener) => listener(next)); },
  getSnapshot() { return snapshot; },
  receiveMovement(packet: MovementBroadcast) { movementListeners.forEach((listener) => listener(packet)); },
  onSnapshot(listener: (value: PartySnapshot) => void) { snapshotListeners.add(listener); if (snapshot) listener(snapshot); return () => snapshotListeners.delete(listener); },
  onMovement(listener: (value: MovementBroadcast) => void) { movementListeners.add(listener); return () => movementListeners.delete(listener); },
};
