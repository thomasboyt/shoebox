export interface Position {
  x: number;
  y: number;
}

export interface User {
  name: string;
  avatar: string;
  peerId: string;
}

// mirrors sync message format, for now
export interface RoomState {
  room: {
    roomId: string;
    environment: string;
    hostId: string;
  };
  positions: { [userId: string]: Position };
  users: { [userId: string]: User };
}

export interface WorldState {
  didJoin: boolean;
  roomState: RoomState | null;
  userId: string | null;
  openCalls: Set<string>;
  log: string[];
  // most recent chat messages to display
  // chatBubbles: { [userId: string]: ChatBubble };
}
