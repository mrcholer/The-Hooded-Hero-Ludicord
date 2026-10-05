export type HeroId = "player-1" | "player-2" | "player-3" | "player-4";
export type PlayerStatus = "SELECTING" | "READY" | "LOADING" | "PLAYING" | "FINISHED" | "DISCONNECTED";
export type PartyStatus = "lobby" | "countdown" | "playing" | "finished";

export interface NetworkPosition {
  readonly x: number;
  readonly y: number;
  readonly velocityX: number;
  readonly velocityY: number;
  readonly facing: "left" | "right";
  readonly animation: "idle" | "run" | "jump";
  readonly sequence: number;
  readonly updatedAt: number;
}

export interface PartyPlayer {
  readonly id: string;
  readonly username: string;
  readonly displayName: string;
  readonly avatar: string | null;
  readonly hero: HeroId | null;
  readonly ready: boolean;
  readonly status: PlayerStatus;
  readonly connected: boolean;
  readonly participating: boolean;
  readonly position: NetworkPosition;
  readonly finishTime: number | null;
  readonly finishPlace: number | null;
}

export interface FinishResult {
  readonly playerId: string;
  readonly place: number;
  readonly finishTime: number;
}

export interface PartySnapshot {
  readonly serverNow: number;
  readonly revision: number;
  readonly status: PartyStatus;
  readonly leaderId: string | null;
  readonly viewerId: string;
  readonly players: readonly PartyPlayer[];
  readonly startAt: number | null;
  readonly matchStartedAt: number | null;
  readonly finishOrder: readonly FinishResult[];
  readonly reconnectWindowMs: number;
}

export interface PlayerIdentity {
  readonly id: string;
  readonly username: string;
  readonly displayName: string;
  readonly avatar: string | null;
}

export interface MovementPacket {
  readonly x: number;
  readonly y: number;
  readonly velocityX: number;
  readonly velocityY: number;
  readonly facing: "left" | "right";
  readonly animation: "idle" | "run" | "jump";
  readonly sequence: number;
}

export interface MovementBroadcast extends MovementPacket {
  readonly playerId: string;
  readonly serverAt: number;
}
